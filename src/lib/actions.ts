

'use server';

import type { Database, Project, Task, TaskValidation, AppConfig, DailyConsumption } from './types';
import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getAppConfig } from './data';
import { eachDayOfInterval } from 'date-fns';


const dbPath = path.join(process.cwd(), 'src', 'lib', 'db.json');
const configPath = path.join(process.cwd(), 'src', 'lib', 'config.json');

async function readDb(): Promise<Database> {
  try {
    const fileContent = await fs.readFile(dbPath, 'utf-8');
    const db = JSON.parse(fileContent) as Database;
    // Dates are stored as ISO strings, convert them back to Date objects
    db.tasks.forEach(task => {
        task.startDate = new Date(task.startDate);
        task.endDate = new Date(task.endDate);
        if (task.dailyConsumption) {
            task.dailyConsumption.forEach(dc => {
                dc.date = new Date(dc.date);
            });
        }
        if (task.validations) {
            task.validations.forEach(v => {
                v.date = new Date(v.date);
            });
        }
    });
    return db;
  } catch (error) {
    console.error('Error reading database:', error);
    // Return a default structure if the file doesn't exist or is empty
    return { projects: [], tasks: [] };
  }
}

async function writeDb(db: Database): Promise<void> {
  await fs.writeFile(dbPath, JSON.stringify(db, null, 2), 'utf-8');
}

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

  revalidatePath('/settings');
}

const ExternalProjectSchema = z.object({
    id: z.number(),
    name: z.string(),
    company_id: z.tuple([z.number(), z.string()]),
    partner_id: z.union([z.tuple([z.number(), z.string()]), z.literal(false)]),
});

const ApiResponseSchema = z.object({
    data: z.object({
        'project.project': z.array(ExternalProjectSchema),
    })
});

export async function fetchEndpointData() {
    const config = await getAppConfig();
    const url = config.endpointUrl;

    if (!url) {
        throw new Error('No se ha configurado un endpoint en la página de Configuración.');
    }

    let response;
    try {
        response = await fetch(url, { cache: 'no-store' });
    } catch (e) {
        console.error('Fetch error:', e);
        throw new Error('Sincronización cancelada: No se pudo contactar el endpoint.');
    }

    if (!response.ok) {
        throw new Error(`Sincronización cancelada: El endpoint devolvió un error (${response.statusText}).`);
    }

    let jsonData;
    try {
        jsonData = await response.json();
    } catch (e) {
        console.error('JSON parsing error:', e);
        throw new Error('Sincronización cancelada: La respuesta del endpoint no es un JSON válido.');
    }
    
    return jsonData;
}

export async function syncProjectsFromEndpoint(jsonData: any) {
  const parsedData = ApiResponseSchema.safeParse(jsonData);

  if (!parsedData.success) {
    console.error('Zod validation error:', parsedData.error.flatten());
    throw new Error('Sincronización cancelada: no cumple con el formato solicitado.');
  }
  
  const externalProjects = parsedData.data?.['project.project'];
  
  if (!Array.isArray(externalProjects)) {
      throw new Error('Error de Sincronización: La respuesta del endpoint no contiene una lista de proyectos válida.');
  }
  
  const db = await readDb();
  
  const externalProjectIds = new Set<string>();

  externalProjects.forEach(extProj => {
    const projectId = `ext-${extProj.id}`;
    externalProjectIds.add(projectId);

    const existingProjectIndex = db.projects.findIndex(p => p.id === projectId);
    
    const isPartnerValid = Array.isArray(extProj.partner_id);

    const projectData = {
        name: extProj.name,
        company: extProj.company_id[1],
        externalId: extProj.id,
        externalCompanyId: extProj.company_id[0],
        client: isPartnerValid ? extProj.partner_id[1] : undefined,
        clientId: isPartnerValid ? extProj.partner_id[0] : undefined,
    };

    if (existingProjectIndex > -1) {
        // Update existing project
        db.projects[existingProjectIndex] = {
            ...db.projects[existingProjectIndex],
            ...projectData
        };
    } else {
        // Add new project
        const newProject = {
            id: projectId,
            ...projectData
        };
        db.projects.push(newProject as Project);
    }
  });

  // Filter out old external projects that are no longer in the API response
  const localProjects = db.projects.filter(p => !p.id.startsWith('ext-'));
  const currentExternalProjects = db.projects.filter(p => p.id.startsWith('ext-') && externalProjectIds.has(p.id));

  db.projects = [...localProjects, ...currentExternalProjects];
  
  const allValidProjectIds = new Set(db.projects.map(p => p.id));
  db.tasks = db.tasks.filter(task => allValidProjectIds.has(task.projectId));
  
  await writeDb(db);

  revalidatePath('/dashboard');
  revalidatePath('/settings');
}


const ProjectSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  company: z.string().min(1, { message: 'El nombre de la compañía es requerido.' }),
});

const TaskSchema = z.object({
    name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
    quantity: z.coerce.number().min(0, { message: 'La cantidad no puede ser negativa.' }),
    value: z.coerce.number().min(0, { message: 'El valor no puede ser negativa.' }),
    startDate: z.string().refine((val) => val && !isNaN(Date.parse(val)), { message: 'Fecha de inicio inválida.' }),
    endDate: z.string().refine((val) => val && !isNaN(Date.parse(val)), { message: 'Fecha de fin inválida.' }),
});

function createDailyConsumption(startDate: Date, endDate: Date, totalQuantity: number): DailyConsumption[] {
    if (totalQuantity === 0) return [];
    
    // Correct for timezone issues by ensuring we use the UTC date parts
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
             // Assign remaining quantity to the last day to avoid rounding issues
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


export async function createProject(formData: FormData) {
    const validatedFields = ProjectSchema.safeParse({
        name: formData.get('name'),
        company: formData.get('company'),
    });

    if (!validatedFields.success) {
        console.error(validatedFields.error.flatten().fieldErrors);
        throw new Error('Datos del proyecto inválidos.');
    }

    const { name, company } = validatedFields.data;
    
    const db = await readDb();

    const newProject: Omit<Project, 'totalValue' | 'taskCount' | 'completedTasks' | 'consumedValue' | 'externalId' | 'externalCompanyId' | 'client' | 'clientId'> = {
        id: `proj-${Date.now()}`,
        name,
        company,
    };

    db.projects.unshift(newProject as Project);
    await writeDb(db);

    revalidatePath('/dashboard');
    redirect('/dashboard');
}

export async function updateProject(formData: FormData) {
    const validatedFields = ProjectSchema.safeParse({
        id: formData.get('id'),
        name: formData.get('name'),
        company: formData.get('company'),
    });

    if (!validatedFields.success || !validatedFields.data.id) {
        console.error(validatedFields.error?.flatten().fieldErrors);
        throw new Error('Datos del proyecto inválidos para actualizar.');
    }
    
    const { id, name, company } = validatedFields.data;
    const db = await readDb();
    const projectIndex = db.projects.findIndex(p => p.id === id);

    if (projectIndex === -1) {
        throw new Error('Proyecto no encontrado.');
    }

    db.projects[projectIndex] = {
        ...db.projects[projectIndex],
        name,
        company,
    };

    await writeDb(db);

    revalidatePath('/dashboard');
    revalidatePath(`/projects/${id}`);
}

export async function deleteProject(projectId: string) {
    const db = await readDb();

    db.projects = db.projects.filter(p => p.id !== projectId);
    db.tasks = db.tasks.filter(t => t.projectId !== projectId);

    await writeDb(db);

    revalidatePath('/dashboard');
    revalidatePath(`/projects`);
    redirect('/dashboard');
}

export async function deleteMultipleProjects(projectIds: string[]) {
    if (!projectIds || projectIds.length === 0) {
        return;
    }
    const db = await readDb();

    const projectIdsSet = new Set(projectIds);

    db.projects = db.projects.filter(p => !projectIdsSet.has(p.id));
    db.tasks = db.tasks.filter(t => !projectIdsSet.has(t.projectId));

    await writeDb(db);

    revalidatePath('/dashboard');
    revalidatePath(`/projects`);
}

export async function createTask(projectId: string, onSuccess: () => void, formData: FormData) {
  const validatedFields = TaskSchema.safeParse({
    name: formData.get('name'),
    quantity: formData.get('quantity'),
    value: formData.get('value'),
    startDate: formData.get('startDate'),
    endDate: formData.get('endDate'),
  });

  if (!validatedFields.success) {
    console.error(validatedFields.error.flatten().fieldErrors);
    throw new Error('Datos de la tarea inválidos.');
  }

  const { name, quantity, value, startDate, endDate } = validatedFields.data;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start > end) {
      throw new Error('La fecha de inicio no puede ser posterior a la fecha de fin.');
  }

  const db = await readDb();
  
  const dailyConsumption = createDailyConsumption(start, end, quantity);

  const newTask: Task = {
    id: `task-${Date.now()}`,
    projectId,
    name,
    quantity,
    value,
    startDate: start,
    endDate: end,
    status: 'pendiente',
    dailyConsumption: dailyConsumption,
    consumedQuantity: 0,
  };

  db.tasks.push(newTask);
  await writeDb(db);

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/dashboard`);
  onSuccess();
}

export async function deleteTask(taskId: string, projectId: string) {
    const db = await readDb();
    db.tasks = db.tasks.filter(t => t.id !== taskId);
    await writeDb(db);
    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/dashboard`);
}

export async function deleteMultipleTasks(taskIds: string[], projectId: string) {
    if (!taskIds || taskIds.length === 0) {
        return;
    }
    const db = await readDb();

    const taskIdsSet = new Set(taskIds);

    db.tasks = db.tasks.filter(t => !taskIdsSet.has(t.id));

    await writeDb(db);

    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/dashboard`);
}

export async function updateTaskConsumption(taskId: string, date: string, consumedQuantity: number) {
    const db = await readDb();
    const taskIndex = db.tasks.findIndex(t => t.id === taskId);

    if (taskIndex === -1) {
        throw new Error('Tarea no encontrada.');
    }

    const task = db.tasks[taskIndex];
    if (!task.dailyConsumption) {
        task.dailyConsumption = [];
    }
    
    const [year, month, day] = date.split('-').map(Number);
    const consumptionDateUTC = new Date(Date.UTC(year, month - 1, day));
    const consumptionTimestamp = consumptionDateUTC.getTime();


    const consumptionIndex = task.dailyConsumption.findIndex(
        c => new Date(c.date).getTime() === consumptionTimestamp
    );
    
    if (consumptionIndex > -1) {
        task.dailyConsumption[consumptionIndex].consumedQuantity = consumedQuantity;
    } else {
        // This case should not happen with pre-generation, but as a fallback:
        task.dailyConsumption.push({ date: consumptionDateUTC, consumedQuantity, plannedQuantity: 0 });
    }

    const totalConsumed = task.dailyConsumption.reduce((sum, c) => sum + c.consumedQuantity, 0);
    task.consumedQuantity = totalConsumed;

    if (totalConsumed >= task.quantity) {
        task.status = 'completado';
    } else if (totalConsumed > 0) {
        task.status = 'en-progreso';
    } else {
        task.status = 'pendiente';
    }
    
    db.tasks[taskIndex] = task;
    await writeDb(db);

    revalidatePath(`/projects/${task.projectId}`);
    revalidatePath(`/dashboard`);
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

    const db = await readDb();
    const taskIndex = db.tasks.findIndex(t => t.id === taskId);

    if (taskIndex === -1) {
        throw new Error('Tarea no encontrada.');
    }

    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const imageUrl = `data:${imageFile.type};base64,${buffer.toString('base64')}`;

    const newValidation: TaskValidation = {
      id: `val-${Date.now()}`,
      date: new Date(),
      imageUrl: imageUrl,
      location: location
    };

    if (!db.tasks[taskIndex].validations) {
      db.tasks[taskIndex].validations = [];
    }

    db.tasks[taskIndex].validations?.push(newValidation);

    await writeDb(db);

    revalidatePath(`/projects/${projectId}`);
}

export async function getSettings(): Promise<AppConfig> {
  const config = await getAppConfig();
  return config;
}

export async function importTasksFromXML(projectId: string, onSuccess: () => void, formData: FormData) {
  const { XMLParser } = await import('fast-xml-parser');
  
  const file = formData.get('xmlFile') as File | null;
  if (!file) {
    throw new Error('No se ha seleccionado ningún archivo XML.');
  }

  const fileContent = await file.text();
  
  const parser = new XMLParser({
    ignoreAttributes: true,
    isArray: (tagName, jPath, isLeafNode, isAttribute) => { 
        return [
          'Project.Tasks.Task', 
          'Project.ExtendedAttributes.ExtendedAttribute', 
          'Project.Tasks.Task.ExtendedAttribute'
        ].includes(jPath);
    },
    stopNodes: [
        "Project.Views",
        "Project.Filters",
        "Project.Groups",
        "Project.Tables",
        "Project.Calendars",
        "Project.Resources",
        "Project.Assignments"
    ]
  });

  let parsedXml;
  try {
    parsedXml = parser.parse(fileContent);
  } catch(e) {
    console.error("Error parsing XML file:", e);
    throw new Error("El archivo XML está malformado o no es válido.");
  }


  const projectData = parsedXml.Project;
  if (!projectData || !projectData.Tasks?.Task) {
    throw new Error('El archivo XML no tiene el formato esperado de MS Project o no contiene tareas.');
  }

  const extendedAttrDefs = projectData.ExtendedAttributes?.ExtendedAttribute || [];
  const cantidadAttrDef = extendedAttrDefs.find((attr: any) => attr.Alias === 'Cantidades');
  const cantidadFieldId = cantidadAttrDef?.FieldID;

  const newTasks: Task[] = [];
  const tasks = projectData.Tasks.Task;

  for (const task of tasks) {
    try {
        if (task.OutlineLevel !== 5) {
            continue;
        }

        const name = task.Name;
        const startDate = new Date(task.Start);
        const endDate = new Date(task.Finish);

        if (!name || typeof name !== 'string' || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            console.warn('Omitiendo tarea con datos básicos inválidos (nombre/fechas):', name);
            continue;
        }
        
        const costRaw = task.FixedCost ?? task.Cost;
        if (costRaw === undefined || costRaw === null) {
             console.warn('Omitiendo tarea sin campo de costo (<FixedCost> o <Cost>):', name);
            continue;
        }

        const parsedCost = parseFloat(costRaw);
        if (isNaN(parsedCost)) {
            console.warn('Omitiendo tarea con valor de costo no numérico:', name, 'Valor:', costRaw);
            continue;
        }
        const value = parsedCost / 100;

        let quantity = 0;
        if (cantidadFieldId && Array.isArray(task.ExtendedAttribute)) {
            const quantityAttr = task.ExtendedAttribute.find((attr: any) => attr.FieldID === cantidadFieldId);
            if (quantityAttr && quantityAttr.Value != null) {
                const parsedQuantity = parseFloat(quantityAttr.Value);
                if (!isNaN(parsedQuantity)) {
                    quantity = parsedQuantity;
                }
            }
        }

        const dailyConsumption = createDailyConsumption(startDate, endDate, quantity);
        
        const newTask: Task = {
            id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            projectId,
            name,
            quantity,
            value,
            startDate,
            endDate,
            status: 'pendiente',
            dailyConsumption: dailyConsumption,
            consumedQuantity: 0,
            validations: []
        };
        newTasks.push(newTask);

    } catch (e) {
        console.error("Error inesperado procesando una tarea del XML, omitiendo. Tarea:", task?.Name, "Error:", e);
    }
  }

  if (newTasks.length === 0) {
    throw new Error('No se encontraron tareas válidas (nivel 5) con los datos requeridos para importar en el archivo XML.');
  }

  const db = await readDb();
  db.tasks.push(...newTasks);
  await writeDb(db);

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/dashboard`);
  onSuccess();
}









