
'use server';

import type { Project, Task, TaskValidation, AppConfig, DailyConsumption } from './types';
import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { getAppConfig } from './data';
import { eachDayOfInterval } from 'date-fns';
import { sql } from './db';
import { revalidatePath } from 'next/cache';

const configPath = path.join(process.cwd(), 'src', 'lib', 'config.json');

async function writeConfig(config: AppConfig): Promise<void> {
  await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
}

export async function updateSettings(formData: FormData) {
  const url = formData.get('url') as string;

  try {
    new URL(url);
  } catch (_) {
    throw new Error('La URL del endpoint no es válida.');
  }

  const config = await getAppConfig();
  config.endpointUrl = url;
  await writeConfig(config);

  return { success: true };
}

// NOTE: The external project sync logic is removed as projects are now read-only from the DB.

const TaskSchema = z.object({
    name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
    quantity: z.coerce.number().min(0, { message: 'La cantidad no puede ser negativa.' }),
    value: z.coerce.number().min(0, { message: 'El valor no puede ser negativa.' }),
    startDate: z.string().refine((val) => val && !isNaN(Date.parse(val)), { message: 'Fecha de inicio inválida.' }),
    endDate: z.string().refine((val) => val && !isNaN(Date.parse(val)), { message: 'Fecha de fin inválida.' }),
});

function createDailyConsumption(startDate: Date, endDate: Date, totalQuantity: number): DailyConsumption[] {
    if (totalQuantity === 0) return [];
    
    const startUTC = new Date(Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()));
    const endUTC = new Date(Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()));
    
    const dates = eachDayOfInterval({ start: startUTC, end: endUTC });
    const totalDays = dates.length;

    if (totalDays <= 0) return [];

    const dailyPlannedQuantity = totalQuantity / totalDays;
    
    let distributedQuantity = 0;

    const consumptionBreakdown = dates.map((date, index) => {
        let plannedQtyForDay: number;
        if (index === totalDays - 1) {
            plannedQtyForDay = totalQuantity - distributedQuantity;
        } else {
            plannedQtyForDay = parseFloat(dailyPlannedQuantity.toPrecision(15));
            distributedQuantity += plannedQtyForDay;
        }
        
        return {
            date: date,
            plannedQuantity: plannedQtyForDay,
            consumedQuantity: 0,
        };
    });

    return consumptionBreakdown;
}


export async function createTask(projectId: string, formData: FormData) {
  const validatedFields = TaskSchema.safeParse({
    name: formData.get('name'),
    quantity: formData.get('quantity'),
    value: formData.get('value'),
    startDate: formData.get('startDate'),
    endDate: formData.get('endDate'),
  });

  if (!validatedFields.success) {
    throw new Error('Datos de la tarea inválidos.');
  }

  const { name, quantity, value, startDate, endDate } = validatedFields.data;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start > end) {
      throw new Error('La fecha de inicio no puede ser posterior a la fecha de fin.');
  }
  
  const dailyConsumption = createDailyConsumption(start, end, quantity);
  const taskId = `task-${Date.now()}`;

  await sql`
    INSERT INTO tasks (id, "projectId", name, quantity, value, "startDate", "endDate", status, "consumedQuantity", "dailyConsumption")
    VALUES (${taskId}, ${projectId}, ${name}, ${quantity}, ${value}, ${start.toISOString()}, ${end.toISOString()}, 'pendiente', 0, ${JSON.stringify(dailyConsumption)}::jsonb)
  `;
  
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/dashboard`);
  return { success: true };
}

export async function deleteTask(taskId: string, projectId: string) {
    await sql`DELETE FROM tasks WHERE id = ${taskId}`;
    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/dashboard`);
    return { success: true };
}

export async function deleteMultipleTasks(taskIds: string[], projectId: string) {
    if (!taskIds || taskIds.length === 0) {
        return { success: false, message: 'No task IDs provided.'};
    }
    await sql`DELETE FROM tasks WHERE id IN ${sql(taskIds)}`;
    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/dashboard`);
    return { success: true };
}

export async function updateTaskConsumption(taskId: string, date: string, consumedQuantity: number) {
    const task = (await sql`SELECT * FROM tasks WHERE id = ${taskId}`)[0] as unknown as Task;

    if (!task) {
        throw new Error('Tarea no encontrada.');
    }

    const dailyConsumption = (task.dailyConsumption || []) as DailyConsumption[];
    
    const consumptionIndex = dailyConsumption.findIndex(
        c => format(new Date(c.date), 'yyyy-MM-dd') === date
    );
    
    if (consumptionIndex > -1) {
        dailyConsumption[consumptionIndex].consumedQuantity = consumedQuantity;
    }
    
    const totalConsumed = dailyConsumption.reduce((sum, c) => sum + c.consumedQuantity, 0);
    const newStatus = totalConsumed >= task.quantity ? 'completado' : (totalConsumed > 0 ? 'en-progreso' : 'pendiente');

    await sql`
        UPDATE tasks
        SET 
            "dailyConsumption" = ${JSON.stringify(dailyConsumption)}::jsonb,
            "consumedQuantity" = ${totalConsumed},
            status = ${newStatus}
        WHERE id = ${taskId}
    `;

    revalidatePath(`/projects/${task.projectId}`);
    revalidatePath(`/dashboard`);
    return { success: true };
}

const ValidateTaskSchema = z.object({
  taskId: z.string(),
  projectId: z.string(),
  location: z.string(),
});

export async function validateTask(formData: FormData) {
    const validatedFields = ValidateTaskSchema.safeParse({
        taskId: formData.get('taskId'),
        projectId: formData.get('projectId'),
        location: formData.get('location'),
    });

    if (!validatedFields.success) {
        console.error(validatedFields.error.flatten().fieldErrors);
        throw new Error('Datos de validación inválidos.');
    }
    
    const { taskId, projectId, location } = validatedFields.data;
    const imageFile = formData.get('image') as File | null;

    if (!imageFile || imageFile.size === 0) {
        throw new Error('La imagen de evidencia es requerida.');
    }

    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const imageUrl = `data:${imageFile.type};base64,${buffer.toString('base64')}`;

    const newValidation: Omit<TaskValidation, 'id'> = {
      date: new Date(),
      imageUrl: imageUrl,
      location: location,
      taskId: taskId,
    };
    
    const validationId = `val-${Date.now()}`;

    await sql`
      INSERT INTO task_validations (id, "taskId", date, "imageUrl", location)
      VALUES (${validationId}, ${newValidation.taskId}, ${newValidation.date.toISOString()}, ${newValidation.imageUrl}, ${newValidation.location})
    `;
    
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}

export async function importTasksFromXML(projectId: string, formData: FormData) {
  const { XMLParser } = await import('fast-xml-parser');
  
  const file = formData.get('xmlFile') as File | null;
  if (!file) {
    throw new Error('No se ha seleccionado ningún archivo XML.');
  }

  const fileContent = await file.text();
  
  const parser = new XMLParser({
    ignoreAttributes: true,
    isArray: (tagName, jPath) => [
      'Project.Tasks.Task', 
      'Project.ExtendedAttributes.ExtendedAttribute', 
      'Project.Tasks.Task.ExtendedAttribute'
    ].includes(jPath),
    stopNodes: ["Project.Resources", "Project.Assignments"]
  });

  let parsedXml;
  try {
    parsedXml = parser.parse(fileContent);
  } catch(e) {
    throw new Error("El archivo XML está malformado o no es válido.");
  }

  const projectData = parsedXml.Project;
  if (!projectData || !projectData.Tasks?.Task) {
    throw new Error('El archivo XML no tiene el formato esperado o no contiene tareas.');
  }
  
  const extendedAttrDefs = projectData.ExtendedAttributes?.ExtendedAttribute || [];
  const cantidadAttrDef = extendedAttrDefs.find((attr: any) => attr.Alias?.toLowerCase() === 'cantidades');
  const cantidadFieldId = cantidadAttrDef?.FieldID;

  const newTasks: Omit<Task, 'id' | 'consumedQuantity'>[] = [];
  const tasks = projectData.Tasks.Task;

  for (const task of tasks) {
    try {
        if (task.OutlineLevel !== 5 || !task.Name) continue;

        const startDate = new Date(task.Start);
        const endDate = new Date(task.Finish);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) continue;
        
        const costRaw = task.FixedCost ?? task.Cost;
        if (costRaw === undefined || costRaw === null) continue;

        const parsedCost = parseFloat(costRaw);
        if (isNaN(parsedCost)) continue;
        
        const totalTaskValue = parsedCost / 100;

        let quantity = 0;
        if (cantidadFieldId && Array.isArray(task.ExtendedAttribute)) {
            const quantityAttr = task.ExtendedAttribute.find((attr: any) => attr.FieldID === cantidadFieldId);
            if (quantityAttr && quantityAttr.Value != null) {
                const parsedQuantity = parseFloat(quantityAttr.Value);
                if (!isNaN(parsedQuantity)) quantity = parsedQuantity;
            }
        }
        
        const value = quantity > 0 ? totalTaskValue / quantity : 0;
        const dailyConsumption = createDailyConsumption(startDate, endDate, quantity);
        
        newTasks.push({
            projectId,
            name: task.Name,
            quantity,
            value,
            startDate,
            endDate,
            status: 'pendiente',
            dailyConsumption
        });
    } catch (e) {
        console.error("Error procesando tarea del XML:", task?.Name, e);
    }
  }

  if (newTasks.length === 0) {
    throw new Error('No se encontraron tareas válidas para importar.');
  }

  // Batch insert
  await sql.begin(async sql => {
    for (const task of newTasks) {
      const taskId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      await sql`
        INSERT INTO tasks (id, "projectId", name, quantity, value, "startDate", "endDate", status, "consumedQuantity", "dailyConsumption")
        VALUES (${taskId}, ${task.projectId}, ${task.name}, ${task.quantity}, ${task.value}, ${task.startDate.toISOString()}, ${task.endDate.toISOString()}, 'pendiente', 0, ${JSON.stringify(task.dailyConsumption)}::jsonb)
      `;
    }
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/dashboard`);
  return { success: true, message: `${newTasks.length} tareas importadas.` };
}
