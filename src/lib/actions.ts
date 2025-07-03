'use server';

import type { Database, Project } from './types';
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

    const newProject: Project = {
        id: `proj-${Date.now()}`,
        name,
        description,
        totalValue: 0,
        taskCount: 0,
        completedTasks: 0,
        imageUrl: 'https://placehold.co/600x400.png',
        dataAiHint: 'project building'
    };

    db.projects.unshift(newProject);
    await writeDb(db);

    revalidatePath('/');
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
}
