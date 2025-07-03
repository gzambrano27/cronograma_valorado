'use server';

import type { Database, Project, Task } from './types';
import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const dbPath = path.join(process.cwd(), 'src', 'lib', 'db.json');

async function readDb(): Promise<Database> {
  try {
    const fileContent = await fs.readFile(dbPath, 'utf-8');
    return JSON.parse(fileContent);
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
    location: z.string().min(1, { message: 'La ubicación es requerida.' }),
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
    const db = await readDb();

    const newProject: Omit<Project, 'totalValue' | 'taskCount' | 'completedTasks'> = {
        id: `proj-${Date.now()}`,
        name,
        description,
        imageUrl: 'https://placehold.co/600x400.png',
        dataAiHint: 'project building'
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

    db.projects[projectIndex] = {
        ...db.projects[projectIndex],
        name,
        description,
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
    location: formData.get('location'),
  });

  if (!validatedFields.success) {
    console.error(validatedFields.error.flatten().fieldErrors);
    throw new Error('Datos de la tarea inválidos.');
  }

  const { name, quantity, value, startDate, endDate, location } = validatedFields.data;
  
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
    location,
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
