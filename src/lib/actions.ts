'use server';

import type { Database, Project, Task, TaskValidation } from './types';
import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const dbPath = path.join(process.cwd(), 'src', 'lib', 'db.json');

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

const ProjectSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  description: z.string().min(1, { message: 'La descripción es requerida.' }),
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
        description: formData.get('description'),
    });

    if (!validatedFields.success) {
        console.error(validatedFields.error.flatten().fieldErrors);
        // This could be enhanced to return errors to the UI
        throw new Error('Datos del proyecto inválidos.');
    }

    const { name, description } = validatedFields.data;
    
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

    const newProject: Omit<Project, 'totalValue' | 'taskCount' | 'completedTasks'> = {
        id: `proj-${Date.now()}`,
        name,
        description,
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
        description: formData.get('description'),
    });

    if (!validatedFields.success || !validatedFields.data.id) {
        console.error(validatedFields.error?.flatten().fieldErrors);
        throw new Error('Datos del proyecto inválidos para actualizar.');
    }
    
    const { id, name, description } = validatedFields.data;
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
        description,
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
    revalidatePath(`/projects`); // In case a project page was cached
    redirect('/');
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
    
    // date is 'yyyy-MM-dd'. We want to treat it as a UTC date to avoid timezone issues.
    const [year, month, day] = date.split('-').map(Number);
    const consumptionDate = new Date(Date.UTC(year, month - 1, day));

    const consumptionIndex = task.dailyConsumption.findIndex(
        c => new Date(c.date).getTime() === consumptionDate.getTime()
    );
    
    if (consumedQuantity > 0) {
        if (consumptionIndex > -1) {
            // Update existing consumption
            task.dailyConsumption[consumptionIndex].consumedQuantity = consumedQuantity;
        } else {
            // Add new consumption
            task.dailyConsumption.push({ date: consumptionDate, consumedQuantity });
        }
    } else {
        // If consumption is 0 or less, remove it from the array
        if (consumptionIndex > -1) {
            task.dailyConsumption.splice(consumptionIndex, 1);
        }
    }


    // Update task status based on consumption
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
