'use server';

import type { Database, Project, Task, TaskValidation, AppConfig } from './types';
import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getAppConfig } from './data';

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
});

const ApiResponseSchema = z.object({
  data: z.object({
    'project.project': z.array(ExternalProjectSchema),
  }),
});

export async function syncProjectsFromEndpoint() {
  const config = await getAppConfig();
  const url = config.endpointUrl;

  if (!url) {
    throw new Error('No se ha configurado un endpoint en la página de Configuración.');
  }

  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Error al obtener los datos: ${response.statusText}`);
    }
    const jsonData = await response.json();
    
    const parsedData = ApiResponseSchema.safeParse(jsonData);

    if (!parsedData.success) {
      console.error(parsedData.error);
      throw new Error('La respuesta del endpoint no tiene el formato JSON esperado.');
    }

    const externalProjects = parsedData.data.data['project.project'];
    const db = await readDb();

    const newApiProjects = externalProjects.map(extProj => {
      const existingProject = db.projects.find(p => p.id === `ext-${extProj.id}`);
      return {
        id: `ext-${extProj.id}`,
        externalId: extProj.id,
        name: extProj.name,
        company: extProj.company_id[1],
        externalCompanyId: extProj.company_id[0],
        imageUrl: existingProject?.imageUrl || 'https://placehold.co/600x400.png',
        dataAiHint: existingProject?.dataAiHint || 'project building'
      };
    });
    
    // Filter existing projects to keep only local ones
    const localProjects = db.projects.filter(p => !p.id.startsWith('ext-'));

    // Combine local projects with the updated list from the API
    db.projects = [...localProjects, ...newApiProjects as Project[]];

    // Filter tasks, keeping only those that belong to the new *combined* set of projects
    const allValidProjectIds = new Set(db.projects.map(p => p.id));
    db.tasks = db.tasks.filter(task => allValidProjectIds.has(task.projectId));
    
    await writeDb(db);

    revalidatePath('/');
    revalidatePath('/settings');
    redirect('/');

  } catch (error) {
    console.error('Error sincronizando proyectos:', error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error('Ocurrió un error inesperado durante la sincronización.');
  }
}


const ProjectSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  company: z.string().min(1, { message: 'El nombre de la compañía es requerido.' }),
});

const TaskSchema = z.object({
    name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
    quantity: z.coerce.number().min(0, { message: 'La cantidad no puede ser negativa.' }),
    value: z.coerce.number().min(0, { message: 'El valor no puede ser negativo.' }),
    startDate: z.string().refine((val) => val && !isNaN(Date.parse(val)), { message: 'Fecha de inicio inválida.' }),
    endDate: z.string().refine((val) => val && !isNaN(Date.parse(val)), { message: 'Fecha de fin inválida.' }),
});


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
    
    const imageFile = formData.get('image') as File | null;
    let imageUrl = 'https://placehold.co/600x400.png';
    let dataAiHint = 'project building';

    if (imageFile && imageFile.size > 0) {
        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        imageUrl = `data:${imageFile.type};base64,${buffer.toString('base64')}`;
        dataAiHint = 'custom project image';
    }

    const db = await readDb();

    const newProject: Omit<Project, 'totalValue' | 'taskCount' | 'completedTasks' | 'consumedValue' | 'externalId' | 'externalCompanyId'> = {
        id: `proj-${Date.now()}`,
        name,
        company,
        imageUrl,
        dataAiHint
    };

    db.projects.unshift(newProject as Project);
    await writeDb(db);

    revalidatePath('/');
    redirect('/');
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

    const imageFile = formData.get('image') as File | null;
    let imageUrl = db.projects[projectIndex].imageUrl;
    let dataAiHint = db.projects[projectIndex].dataAiHint;

    if (imageFile && imageFile.size > 0) {
        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        imageUrl = `data:${imageFile.type};base64,${buffer.toString('base64')}`;
        dataAiHint = 'custom project image';
    }

    db.projects[projectIndex] = {
        ...db.projects[projectIndex],
        name,
        company,
        imageUrl,
        dataAiHint,
    };

    await writeDb(db);

    revalidatePath('/');
    revalidatePath(`/projects/${id}`);
}

export async function deleteProject(projectId: string) {
    const db = await readDb();

    db.projects = db.projects.filter(p => p.id !== projectId);
    db.tasks = db.tasks.filter(t => t.projectId !== projectId);

    await writeDb(db);

    revalidatePath('/');
    revalidatePath(`/projects`);
    redirect('/');
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

    revalidatePath('/');
    revalidatePath(`/projects`);
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
    console.error(validatedFields.error.flatten().fieldErrors);
    throw new Error('Datos de la tarea inválidos.');
  }

  const { name, quantity, value, startDate, endDate } = validatedFields.data;
  
  if (new Date(startDate) > new Date(endDate)) {
      throw new Error('La fecha de inicio no puede ser posterior a la fecha de fin.');
  }

  const db = await readDb();

  const newTask: Task = {
    id: `task-${Date.now()}`,
    projectId,
    name,
    quantity,
    value,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    status: 'pendiente',
    dailyConsumption: []
  };

  db.tasks.push(newTask);
  await writeDb(db);

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/`);
}

export async function deleteTask(taskId: string, projectId: string) {
    const db = await readDb();
    db.tasks = db.tasks.filter(t => t.id !== taskId);
    await writeDb(db);
    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/`);
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
    const consumptionDate = new Date(Date.UTC(year, month - 1, day));

    const consumptionIndex = task.dailyConsumption.findIndex(
        c => new Date(c.date).getTime() === consumptionDate.getTime()
    );
    
    if (consumedQuantity > 0) {
        if (consumptionIndex > -1) {
            task.dailyConsumption[consumptionIndex].consumedQuantity = consumedQuantity;
        } else {
            task.dailyConsumption.push({ date: consumptionDate, consumedQuantity });
        }
    } else {
        if (consumptionIndex > -1) {
            task.dailyConsumption.splice(consumptionIndex, 1);
        }
    }


    const totalConsumed = task.dailyConsumption.reduce((sum, c) => sum + c.consumedQuantity, 0);

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
    revalidatePath(`/`);
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
