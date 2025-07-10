
'use server';
import type { Project, Task, SCurveData, AppConfig } from './types';
import fs from 'fs/promises';
import path from 'path';
import { eachDayOfInterval, format, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

interface Database {
  projects: Omit<Project, 'totalValue' | 'taskCount' | 'completedTasks' | 'consumedValue'>[];
  tasks: Task[];
}

async function readDb(): Promise<Database> {
  const filePath = path.join(process.cwd(), 'src', 'lib', 'db.json');
  try {
    const jsonData = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(jsonData) as Database;
    
    data.tasks.forEach(task => {
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
    return data;
  } catch (error) {
    console.error("Could not read db.json", error);
    return { projects: [], tasks: [] };
  }
}

export async function getAppConfig(): Promise<AppConfig> {
  const filePath = path.join(process.cwd(), 'src', 'lib', 'config.json');
  try {
    const jsonData = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(jsonData) as AppConfig;
  } catch (error) {
    console.error("Could not read config.json", error);
    return { endpointUrl: "" };
  }
}

export async function getProjects(): Promise<Project[]> {
  const db = await readDb();
  const { projects, tasks } = db;

  return projects.map(project => {
    const projectTasks = tasks.filter(task => task.projectId === project.id);
    const completedTasks = projectTasks.filter(task => task.status === 'completado').length;
    const taskCount = projectTasks.length;
    
    const totalValue = projectTasks.reduce((sum, task) => sum + (task.quantity * task.value), 0);
    
    const consumedValue = projectTasks.reduce((projectSum, task) => {
      const totalConsumedQuantity = (task.dailyConsumption || []).reduce(
        (taskSum, consumption) => taskSum + consumption.consumedQuantity,
        0
      );
      return projectSum + (totalConsumedQuantity * task.value);
    }, 0);

    return {
      ...project,
      taskCount,
      completedTasks,
      totalValue,
      consumedValue,
    };
  });
}

export async function getTasks(): Promise<Task[]> {
  const db = await readDb();
  return db.tasks.map(task => ({
    ...task,
    consumedQuantity: (task.dailyConsumption || []).reduce(
      (sum, consumption) => sum + consumption.consumedQuantity,
      0
    ),
  }));
}

export async function getProjectById(id: string): Promise<Project | undefined> {
    const projects = await getProjects();
    return projects.find(p => p.id === id);
}

export async function getTasksByProjectId(id: string): Promise<Task[]> {
    const tasks = await getTasks();
    return tasks.filter(t => t.projectId === id);
}

export async function generateSCurveData(tasks: Task[], totalProjectValue: number): Promise<SCurveData[]> {
  if (tasks.length === 0 || totalProjectValue <= 0) {
    return [];
  }

  const plannedValuesByDate = new Map<number, number>();
  const actualValuesByDate = new Map<number, number>();

  let allDates = new Set<number>();

  tasks.forEach(task => {
    if (!task.startDate || !task.endDate) return;

    // Lógica para el Valor Planificado: Se acumula el valor total de la tarea en su fecha de finalización.
    const taskPlannedValue = task.quantity * task.value;
    if (taskPlannedValue > 0) {
        const endDate = startOfDay(new Date(task.endDate)).getTime();
        plannedValuesByDate.set(endDate, (plannedValuesByDate.get(endDate) || 0) + taskPlannedValue);
        allDates.add(endDate);
    }
    
    // Lógica para el Valor Real: Se acumula el valor de consumo diario en la fecha correspondiente.
    if (task.dailyConsumption) {
        task.dailyConsumption.forEach(consumption => {
            const actualValue = consumption.consumedQuantity * task.value;
            if (actualValue > 0) {
                const consumptionDate = startOfDay(new Date(consumption.date)).getTime();
                actualValuesByDate.set(consumptionDate, (actualValuesByDate.get(consumptionDate) || 0) + actualValue);
                allDates.add(consumptionDate);
            }
        });
    }
  });

  if (allDates.size === 0) {
      return [];
  }

  const sortedDates = Array.from(allDates).sort((a, b) => a - b);
  
  const finalCurve: SCurveData[] = [];
  let cumulativePlanned = 0;
  let cumulativeActual = 0;

  for(const dayTimestamp of sortedDates) {
      cumulativePlanned += plannedValuesByDate.get(dayTimestamp) || 0;
      cumulativeActual += actualValuesByDate.get(dayTimestamp) || 0;
      
      const plannedPercent = (cumulativePlanned / totalProjectValue) * 100;
      const actualPercent = (cumulativeActual / totalProjectValue) * 100;

      finalCurve.push({
        date: format(new Date(dayTimestamp), "d MMM", { locale: es }),
        planned: plannedPercent,
        actual: actualPercent,
        cumulativePlannedValue: cumulativePlanned,
        cumulativeActualValue: cumulativeActual,
        deviation: actualPercent - plannedPercent,
      });
  }

  // Agregar un punto de inicio en 0% para anclar el gráfico
  const firstDate = sortedDates[0];
  if (finalCurve.length > 0 && firstDate) {
     const dayBefore = new Date(firstDate - 86400000);
     finalCurve.unshift({
        date: format(dayBefore, "d MMM", { locale: es }),
        planned: 0,
        actual: 0,
        cumulativePlannedValue: 0,
        cumulativeActualValue: 0,
        deviation: 0,
      });
  }

  // Redondear porcentajes para una visualización más limpia
  return finalCurve.map(point => ({
      ...point,
      planned: Math.round(point.planned * 100) / 100, // redondear a 2 decimales
      actual: Math.round(point.actual * 100) / 100,
      deviation: Math.round(point.deviation * 100) / 100,
  }));
}
