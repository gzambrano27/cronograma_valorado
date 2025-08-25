
'use server';

import type { Project, Task, TaskValidation, DailyConsumption, RawTask, LoginResult, Partner } from './types';
import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { eachDayOfInterval, format } from 'date-fns';
import { query } from './db';
import { revalidatePath } from 'next/cache';
import { getOdooClient } from './odoo-client';
import { getTranslatedName } from './utils';

// NOTA: Este archivo contiene "Server Actions" de Next.js.
// Estas funciones se ejecutan en el servidor y pueden ser llamadas directamente
// desde componentes de cliente, simplificando las mutaciones de datos.


// Esquema de validación para los datos de una tarea usando Zod.
const TaskSchema = z.object({
    name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
    quantity: z.coerce.number().min(0, { message: 'La cantidad no puede ser negativa.' }),
    cost: z.coerce.number().min(0, { message: 'El costo no puede ser negativo.' }),
    precio: z.coerce.number().min(0, { message: 'El precio no puede ser negativo.' }),
    startDate: z.string().refine((val) => val && !isNaN(Date.parse(val)), { message: 'Fecha de inicio inválida.' }),
    endDate: z.string().refine((val) => val && !isNaN(Date.parse(val)), { message: 'Fecha de fin inválida.' }),
    partnerId: z.coerce.number().optional(),
});

// Crea el desglose de consumo diario para una tarea.
function createDailyConsumption(startDate: Date, endDate: Date, totalQuantity: number): Omit<DailyConsumption, 'id' | 'taskId' | 'consumedQuantity' | 'verifiedQuantity' | 'details'>[] {
    if (totalQuantity === 0) return [];

    const startUTC = new Date(Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()));
    const endUTC = new Date(Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()));

    const dates = eachDayOfInterval({ start: startUTC, end: endUTC });
    const totalDays = dates.length;

    if (totalDays <= 0) return [];

    const dailyPlannedQuantity = totalQuantity / totalDays;
    let distributedQuantity = 0;

    return dates.map((date, index) => {
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
        };
    });
}


// Acción para crear una nueva tarea en la base de datos.
export async function createTask(projectId: number, formData: FormData): Promise<{ success: boolean, message: string | null }> {
  const validatedFields = TaskSchema.safeParse({
    name: formData.get('name'),
    quantity: formData.get('quantity'),
    cost: formData.get('cost'),
    precio: formData.get('precio'),
    startDate: formData.get('startDate'),
    endDate: formData.get('endDate'),
    partnerId: formData.get('partnerId') || null,
  });

  if (!validatedFields.success) {
    return { success: false, message: 'Datos de la tarea inválidos.' };
  }

  const { name, quantity, cost, precio, startDate, endDate, partnerId } = validatedFields.data;
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
      return { success: false, message: 'La fecha de inicio no puede ser posterior a la fecha de fin.'};
  }
  
  try {
    const result = await query<{id: string}>(`
      INSERT INTO "externo_tasks" ("projectid", "name", "quantity", "value", "cost", "startdate", "enddate", "status", "consumedquantity", "partner_id", "level")
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pendiente', 0, $8, 5)
      RETURNING id
    `, [projectId, name, quantity, precio, cost, start.toISOString(), end.toISOString(), partnerId]);
    
    const newTaskId = parseInt(result[0].id, 10);
    const dailyConsumptionPlan = createDailyConsumption(start, end, quantity);

    if (dailyConsumptionPlan.length > 0) {
        const values = dailyConsumptionPlan.map(dc => `(${newTaskId}, '${format(dc.date, 'yyyy-MM-dd')}', ${dc.plannedQuantity})`).join(', ');
        await query(`
            INSERT INTO "externo_task_daily_consumption" (taskid, date, planned_quantity)
            VALUES ${values}
        `);
    }
  
    revalidatePath(`/dashboard/projects-overview/${projectId}`);
    revalidatePath(`/dashboard`);
    return { success: true, message: 'Tarea creada con éxito.' };
  } catch(error) {
    console.error("Error en createTask:", error);
    return { success: false, message: 'Error de base de datos al crear la tarea.' };
  }
}

// Acción para eliminar una tarea.
export async function deleteTask(taskId: number, projectId: number) {
    await query(`DELETE FROM "externo_tasks" WHERE id = $1`, [taskId]);
    revalidatePath(`/dashboard/projects-overview/${projectId}`);
    revalidatePath(`/dashboard`);
    return { success: true };
}

// Acción para eliminar múltiples tareas.
export async function deleteMultipleTasks(taskIds: number[], projectId: number | undefined) {
    if (!taskIds || taskIds.length === 0) {
        return { success: false, message: 'No se proporcionaron IDs de tarea.'};
    }
    if (projectId === undefined) {
        return { success: false, message: 'Falta el ID del proyecto.' };
    }
    const placeholders = taskIds.map((_, i) => `$${i + 1}`).join(',');
    await query(`DELETE FROM "externo_tasks" WHERE id IN (${placeholders})`, taskIds);
    revalidatePath(`/dashboard/projects-overview/${projectId}`);
    revalidatePath(`/dashboard`);
    return { success: true };
}

export async function updateTaskConsumption(
    taskId: number,
    date: string,
    consumedQuantity: number,
    verifiedQuantity: number,
    details: string
) {
    try {
        await query(`
            INSERT INTO "externo_task_daily_consumption" (taskid, date, consumed_quantity, verified_quantity, details)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (taskid, date)
            DO UPDATE SET
                consumed_quantity = EXCLUDED.consumed_quantity,
                verified_quantity = EXCLUDED.verified_quantity,
                details = EXCLUDED.details;
        `, [taskId, date, consumedQuantity, verifiedQuantity, details]);

        // Recalcular el total consumido y actualizar el estado de la tarea principal
        const result = await query<{ total_consumed: string }>(`
            SELECT SUM(consumed_quantity) as total_consumed
            FROM "externo_task_daily_consumption"
            WHERE taskid = $1
        `, [taskId]);

        const totalConsumed = parseFloat(result[0].total_consumed) || 0;
        
        const taskData = await query<RawTask>(`SELECT * FROM "externo_tasks" WHERE id = $1`, [taskId]);

        if (taskData.length > 0) {
            const taskQuantity = parseFloat(taskData[0].quantity);
            const newStatus = totalConsumed >= taskQuantity ? 'completado' : (totalConsumed > 0 ? 'en-progreso' : 'pendiente');
            
            await query(`
                UPDATE "externo_tasks"
                SET consumedquantity = $1, status = $2
                WHERE id = $3
            `, [totalConsumed, newStatus, taskId]);

            revalidatePath(`/dashboard/projects-overview/${taskData[0].projectid}`);
            revalidatePath(`/dashboard`);
        }

        return { success: true };
    } catch (error) {
        console.error("Error al actualizar consumo:", error);
        return { success: false, message: 'No se pudo guardar el consumo.' };
    }
}


// Esquema de validación para la validación de tareas.
const ValidateTaskSchema = z.object({
  taskId: z.coerce.number(),
  projectId: z.coerce.number(),
  location: z.string(),
  userId: z.coerce.number().min(1, 'El ID de usuario es requerido.'),
  notes: z.string().optional(),
});

// Acción para añadir una validación (imagen y ubicación) a una tarea.
export async function validateTask(formData: FormData) {
    const validatedFields = ValidateTaskSchema.safeParse({
        taskId: formData.get('taskId'),
        projectId: formData.get('projectId'),
        location: formData.get('location'),
        userId: formData.get('userId'),
        notes: formData.get('notes'),
    });

    if (!validatedFields.success) {
        console.error(validatedFields.error.flatten().fieldErrors);
        throw new Error('Datos de validación inválidos.');
    }

    const { taskId, projectId, location, userId, notes } = validatedFields.data;
    const imageFile = formData.get('image') as File | null;

    if (!imageFile || imageFile.size === 0) {
        throw new Error('La imagen de evidencia es requerida.');
    }

    // Convierte la imagen a un Data URI (base64) para almacenarla en la BD.
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const imageUrl = `data:${imageFile.type};base64,${buffer.toString('base64')}`;

    await query(`
      INSERT INTO "externo_task_validations" ("taskid", "date", "imageurl", "location", "userid", "notes")
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [taskId, new Date().toISOString(), imageUrl, location, userId, notes]);

    revalidatePath(`/dashboard/projects-overview/${projectId}`);
    return { success: true };
}

// Acción para eliminar una validación.
export async function deleteValidation(validationId: number, projectId: number) {
    await query(`DELETE FROM "externo_task_validations" WHERE id = $1`, [validationId]);
    revalidatePath(`/dashboard/projects-overview/${projectId}`);
    return { success: true };
}

// Acción para importar tareas desde un archivo XML de MS Project.
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
  const precioAttrDef = extendedAttrDefs.find((attr: any) => attr.Alias?.toLowerCase() === 'precio');
  const precioFieldId = precioAttrDef?.FieldID;
  
  const tasks = projectData.Tasks.Task;

  // Track parent IDs at each level
  const parentTrack: Record<number, number> = {};

  for (const taskXml of tasks) {
    try {
        const level = parseInt(taskXml.OutlineLevel, 10);
        if (level < 3 || level > 5 || !taskXml.Name) continue;

        const startDate = new Date(taskXml.Start);
        const endDate = new Date(taskXml.Finish);
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) continue;

        let parentId = null;
        if (level > 3) {
            parentId = parentTrack[level - 1];
        }
        
        let quantity = 0;
        let precio = 0;
        let cost = 0;

        // Level 5 tasks are the only ones with quantities and costs
        if (level === 5) {
            const costRaw = taskXml.FixedCost ?? taskXml.Cost;
            if (costRaw === undefined || costRaw === null) continue;
            const totalTaskCost = parseFloat(costRaw);
            
            if (cantidadFieldId && Array.isArray(taskXml.ExtendedAttribute)) {
                const quantityAttr = taskXml.ExtendedAttribute.find((attr: any) => attr.FieldID === cantidadFieldId);
                if (quantityAttr && quantityAttr.Value != null) {
                    const parsedQuantity = parseFloat(quantityAttr.Value);
                    if (!isNaN(parsedQuantity)) quantity = parsedQuantity;
                }
            }
            
            if (precioFieldId && Array.isArray(taskXml.ExtendedAttribute)) {
                 const priceAttr = taskXml.ExtendedAttribute.find((attr: any) => attr.FieldID === precioFieldId);
                if (priceAttr && priceAttr.Value != null) {
                    const parsedPrice = parseFloat(priceAttr.Value) / 100;
                    if (!isNaN(parsedPrice)) precio = parsedPrice;
                }
            }

            // If quantity is still 0, it's not a billable task, skip it.
            if (quantity === 0) continue;
            
            cost = (totalTaskCost / 100) / quantity;
        }


        const taskResult = await query<{id: string}>(`
          INSERT INTO "externo_tasks" ("projectid", "name", "quantity", "value", "cost", "startdate", "enddate", "status", "consumedquantity", "level", "parentid")
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'pendiente', 0, $8, $9)
          RETURNING id
        `, [projectId, taskXml.Name, quantity, precio, cost, startDate.toISOString(), endDate.toISOString(), level, parentId]);

        const newTaskId = parseInt(taskResult[0].id, 10);
        parentTrack[level] = newTaskId;
        
        if (level === 5) {
            const dailyConsumptionPlan = createDailyConsumption(startDate, endDate, quantity);
            
            if (dailyConsumptionPlan.length > 0) {
                const values = dailyConsumptionPlan.map(dc => `(${newTaskId}, '${format(dc.date, 'yyyy-MM-dd')}', ${dc.plannedQuantity})`).join(', ');
                await query(`
                    INSERT INTO "externo_task_daily_consumption" (taskid, date, planned_quantity)
                    VALUES ${values}
                `);
            }
        }

    } catch (e) {
        console.error("Error procesando tarea del XML:", taskXml?.Name, e);
    }
  }
  
  revalidatePath(`/dashboard/projects-overview/${projectId}`);
  revalidatePath(`/dashboard`);
  return { success: true, message: `${tasks.length} tareas procesadas.` };
}

export async function updateTaskPartner(taskId: number, partnerId: number | null): Promise<{ success: boolean; message?: string }> {
  try {
    await query(
      'UPDATE "externo_tasks" SET partner_id = $1 WHERE id = $2',
      [partnerId, taskId]
    );

    const result = await query<{ projectid: number }>(`SELECT projectid FROM "externo_tasks" WHERE id = $1`, [taskId]);
    if (result.length > 0) {
      const projectId = result[0].projectid;
      revalidatePath(`/dashboard/projects-overview/${projectId}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating task partner:', error);
    return { success: false, message: 'No se pudo actualizar el proveedor.' };
  }
}
