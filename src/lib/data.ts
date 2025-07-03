import type { Project, Task, SCurveData } from './types';
import fs from 'fs/promises';
import path from 'path';

// Define a type for the structure of our JSON database
interface Database {
  projects: Project[];
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
  return db.projects;
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


function createCumulativeData(days: number): SCurveData[] {
  const data: SCurveData[] = [];
  let cumulativePlanned = 0;
  let cumulativeActual = 0;

  const plannedCurve = (day: number) => {
    // Sigmoid-like function for a typical S-curve
    return 1 / (1 + Math.exp(-0.2 * (day - days / 2)));
  };

  for (let i = 1; i <= days; i++) {
    const plannedIncrement = plannedCurve(i) * (100 / (days * 0.65)); // Scaled increment
    cumulativePlanned += Math.min(plannedIncrement, 100 - cumulativePlanned);

    let actualIncrement = 0;
    if (i < days * 0.75) { // Simulate actual progress lagging then catching up
      actualIncrement = plannedIncrement * (Math.random() * 0.4 + 0.5); // 50-90% of planned
    } else {
      actualIncrement = plannedIncrement * (Math.random() * 0.3 + 0.9); // 90-120% of planned
    }
    cumulativeActual += Math.min(actualIncrement, 100 - cumulativeActual);
    
    data.push({
      day: i,
      planned: Math.round(Math.min(100, cumulativePlanned)),
      actual: Math.round(Math.min(100, cumulativeActual)),
    });
  }

  // Ensure curves end at or near 100 and 90 respectively for this example
  data[data.length - 1].planned = 100;
  if(data[data.length-1].actual > 95) data[data.length-1].actual = 95;


  return data;
}

export const sCurveData: SCurveData[] = createCumulativeData(30);
