import type { Project, Task, SCurveData } from './types';
import fs from 'fs/promises';
import path from 'path';
import { differenceInCalendarDays, eachDayOfInterval, format } from 'date-fns';

// Define a type for the structure of our JSON database
interface Database {
  projects: Omit<Project, 'totalValue' | 'taskCount' | 'completedTasks' | 'consumedValue'>[];
  tasks: Task[];
}

// Function to read the database file
async function readDb(): Promise<Database> {
  const filePath = path.join(process.cwd(), 'src', 'lib', 'db.json');
  try {
    const jsonData = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(jsonData) as Database;
    
    // Convert date strings back to Date objects
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

// Functions to get data
export async function getProjects(): Promise<Project[]> {
  const db = await readDb();
  const { projects, tasks } = db;

  return projects.map(project => {
    const projectTasks = tasks.filter(task => task.projectId === project.id);
    const completedTasks = projectTasks.filter(task => task.status === 'completado').length;
    const taskCount = projectTasks.length;
    const totalValue = projectTasks.reduce((sum, task) => sum + task.value, 0);
    
    const consumedValue = projectTasks.reduce((projectSum, task) => {
      if (!task.dailyConsumption || !task.quantity) {
        return projectSum;
      }
      const valuePerUnit = task.value / task.quantity;
      const totalConsumedQuantity = task.dailyConsumption.reduce(
        (taskSum, consumption) => taskSum + consumption.consumedQuantity,
        0
      );
      return projectSum + totalConsumedQuantity * valuePerUnit;
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
  return db.tasks;
}

export async function getProjectById(id: string): Promise<Project | undefined> {
    const projects = await getProjects();
    return projects.find(p => p.id === id);
}

export async function getTasksByProjectId(id: string): Promise<Task[]> {
    const tasks = await getTasks();
    return tasks.filter(t => t.projectId === id);
}

export function generateSCurveData(tasks: Task[], totalProjectValue: number): SCurveData[] {
  if (tasks.length === 0 || totalProjectValue === 0) {
    return [{ day: 1, planned: 0, actual: 0 }];
  }

  const projectStartDate = new Date(Math.min(...tasks.map(t => new Date(t.startDate).getTime())));
  const projectEndDate = new Date(Math.max(...tasks.map(t => new Date(t.endDate).getTime())));

  if (projectStartDate > projectEndDate) {
    return [{ day: 1, planned: 0, actual: 0 }];
  }

  const projectInterval = eachDayOfInterval({ start: projectStartDate, end: projectEndDate });

  let cumulativePlannedValue = 0;
  let cumulativeActualValue = 0;

  const sCurve: SCurveData[] = projectInterval.map((day, index) => {
    let dailyPlannedValue = 0;
    let dailyActualValue = 0;

    tasks.forEach(task => {
      const taskStartDate = new Date(task.startDate);
      const taskEndDate = new Date(task.endDate);

      // Adjust date to avoid timezone issues
      const adjustedDay = new Date(day.getFullYear(), day.getMonth(), day.getDate());

      if (adjustedDay >= taskStartDate && adjustedDay <= taskEndDate) {
        const duration = differenceInCalendarDays(taskEndDate, taskStartDate) + 1;
        if (duration > 0) {
          dailyPlannedValue += task.value / duration;
        }
      }

      if (task.dailyConsumption) {
        const consumptionToday = task.dailyConsumption.find(
          c => format(new Date(c.date), 'yyyy-MM-dd') === format(adjustedDay, 'yyyy-MM-dd')
        );
        if (consumptionToday && task.quantity > 0) {
          const valuePerUnit = task.value / task.quantity;
          dailyActualValue += consumptionToday.consumedQuantity * valuePerUnit;
        }
      }
    });

    cumulativePlannedValue += dailyPlannedValue;
    cumulativeActualValue += dailyActualValue;

    return {
      day: index + 1,
      planned: Math.round((cumulativePlannedValue / totalProjectValue) * 100),
      actual: Math.round((cumulativeActualValue / totalProjectValue) * 100),
    };
  });

  // Clamp values between 0 and 100
  return sCurve.map(d => ({
      ...d,
      planned: Math.max(0, Math.min(100, d.planned)),
      actual: Math.max(0, Math.min(100, d.actual)),
  }));
}
