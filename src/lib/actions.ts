
'use server';

import type { Project, Task, TaskValidation, AppConfig, DailyConsumption, RawTask } from './types';
import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { getAppConfig } from './data';
import { eachDayOfInterval, format } from 'date-fns';
import { query } from './db';
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


export async function createTask(projectId: number, formData: FormData) {
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

  await query(`
    INSERT INTO "externo_tasks" ("projectid", "name", "quantity", "value", "startdate", "enddate", "status", "consumedquantity", "dailyconsumption")
    VALUES ($1, $2, $3, $4, $5, $6, 'pendiente', 0, $7)
  `, [projectId, name, quantity, value, start.toISOString(), end.toISOString(), JSON.stringify(dailyConsumption)]);
  
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/dashboard`);
  return { success: true };
}

export async function deleteTask(taskId: number, projectId: number) {
    await query(`DELETE FROM "externo_tasks" WHERE id = $1`, [taskId]);
    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/dashboard`);
    return { success: true };
}

export async function deleteMultipleTasks(taskIds: number[], projectId: number | undefined) {
    if (!taskIds || taskIds.length === 0) {
        return { success: false, message: 'No task IDs provided.'};
    }
    if (projectId === undefined) {
        return { success: false, message: 'Project ID is missing.' };
    }
    const placeholders = taskIds.map((_, i) => `$${i + 1}`).join(',');
    await query(`DELETE FROM "externo_tasks" WHERE id IN (${placeholders})`, taskIds);
    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/dashboard`);
    return { success: true };
}

export async function updateTaskConsumption(taskId: number, date: string, consumedQuantity: number) {
    const result = await query<RawTask>(`SELECT * FROM "externo_tasks" WHERE id = $1`, [taskId]);
    const taskData = result[0];


    if (!taskData) {
        throw new Error('Tarea no encontrada.');
    }
    
    const task = {
        ...taskData,
        quantity: parseFloat(taskData.quantity)
    }

    const dailyConsumption = (task.dailyconsumption || []).map(dc => ({
      ...dc,
      date: new Date(dc.date)
    })) as DailyConsumption[];
    
    const consumptionIndex = dailyConsumption.findIndex(c => {
        const d = new Date(c.date);
        const userTimezoneOffset = d.getTimezoneOffset() * 60000;
        const adjustedDate = new Date(d.getTime() + userTimezoneOffset);
        return format(adjustedDate, 'yyyy-MM-dd') === date;
    });
    
    if (consumptionIndex > -1) {
        dailyConsumption[consumptionIndex].consumedQuantity = consumedQuantity;
    }
    
    const totalConsumed = dailyConsumption.reduce((sum, c) => sum + c.consumedQuantity, 0);
    const newStatus = totalConsumed >= task.quantity ? 'completado' : (totalConsumed > 0 ? 'en-progreso' : 'pendiente');

    await query(`
        UPDATE "externo_tasks"
        SET 
            "dailyconsumption" = $1,
            "consumedquantity" = $2,
            "status" = $3
        WHERE id = $4
    `, [JSON.stringify(dailyConsumption), totalConsumed, newStatus, taskId]);

    revalidatePath(`/projects/${taskData.projectid}`);
    revalidatePath(`/dashboard`);
    return { success: true };
}

const ValidateTaskSchema = z.object({
  taskId: z.coerce.number(),
  projectId: z.coerce.number(),
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

    await query(`
      INSERT INTO "externo_task_validations" ("taskid", "date", "imageurl", "location")
      VALUES ($1, $2, $3, $4)
    `, [newValidation.taskId, newValidation.date.toISOString(), newValidation.imageUrl, newValidation.location]);
    
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}

export async function deleteValidation(validationId: number, projectId: number) {
    await query(`DELETE FROM "externo_task_validations" WHERE id = $1`, [validationId]);
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}


export async function importTasksFromXML(projectId: number, formData: FormData) {
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
        
        if (totalTaskValue === 0 || quantity === 0) {
            continue;
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
            dailyConsumption,
        });
    } catch (e) {
        console.error("Error procesando tarea del XML:", task?.Name, e);
    }
  }

  if (newTasks.length === 0) {
    throw new Error('No se encontraron tareas válidas para importar (verifique que tengan costo y cantidad).');
  }

  for (const task of newTasks) {
    await query(`
      INSERT INTO "externo_tasks" ("projectid", "name", "quantity", "value", "startdate", "enddate", "status", "consumedquantity", "dailyconsumption")
      VALUES ($1, $2, $3, $4, $5, $6, 'pendiente', 0, $7)
    `, [task.projectId, task.name, task.quantity, task.value, task.startDate.toISOString(), task.endDate.toISOString(), JSON.stringify(task.dailyConsumption)]);
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/dashboard`);
  return { success: true, message: `${newTasks.length} tareas importadas.` };
}
