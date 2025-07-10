import type { Project, Task, SCurveData, AppConfig } from './types';
import fs from 'fs/promises';
import path from 'path';
import { eachDayOfInterval, format, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { interpolate } from 'd3-interpolate';

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

function cubicSpline(x: number[], y: number[], t: number): number {
    const n = x.length - 1;
    let i = 0;
    while (i < n && x[i] < t) {
        i++;
    }
    if (t < x[0]) i = 0;
    if (t > x[n]) i = n;
    
    const i0 = Math.max(0, i - 1);
    const i1 = i;
    const i2 = Math.min(n, i + 1);
    const i3 = Math.min(n, i + 2);

    const t0 = x[i0], t1 = x[i1], t2 = x[i2], t3 = x[i3];
    const y0 = y[i0], y1 = y[i1], y2 = y[i2], y3 = y[i3];

    const h1 = t1 - t0, h2 = t2 - t1, h3 = t3 - t2;

    let m1 = 0, m2 = 0;
    if (h1 !== 0) m1 = (y1 - y0) / h1;
    if (h2 !== 0) m2 = (y2 - y1) / h2;

    const s1 = (m2 - m1) / (h2 + h1);

    if (i0 === 0) { // start of curve
        m1 = m2 - s1 * h2;
    }

    if (i2 === n) { // end of curve
        const m3 = h3 !== 0 ? (y3 - y2) / h3 : m2;
        const s2 = (m3 - m2) / (h3 + h2);
        m2 = m2 + s1 * h2;
    }

    const t_norm = (t - t1) / h2;
    const a = y1;
    const b = m1 * h2;
    const c = (y2 - y1) - b;

    return a + b * t_norm + c * t_norm * t_norm;
}

export function generateSCurveData(tasks: Task[], totalProjectValue: number): SCurveData[] {
  if (tasks.length === 0 || totalProjectValue <= 0) {
    return [];
  }

  const plannedValuesByDate = new Map<number, number>();
  const actualValuesByDate = new Map<number, number>();

  tasks.forEach(task => {
    // Planned Value: accumulated at the task's end date
    const plannedValue = task.quantity * task.value;
    if (plannedValue > 0) {
      const endDate = startOfDay(new Date(task.endDate)).getTime();
      plannedValuesByDate.set(endDate, (plannedValuesByDate.get(endDate) || 0) + plannedValue);
    }
    
    // Actual Value: accumulated on the date of each consumption entry
    (task.dailyConsumption || []).forEach(consumption => {
      const actualValue = consumption.consumedQuantity * task.value;
      if (actualValue > 0) {
        const consumptionDate = startOfDay(new Date(consumption.date)).getTime();
        actualValuesByDate.set(consumptionDate, (actualValuesByDate.get(consumptionDate) || 0) + actualValue);
      }
    });
  });

  const allTimestamps = [...new Set([...plannedValuesByDate.keys(), ...actualValuesByDate.keys()])].sort((a,b) => a - b);

  if (allTimestamps.length === 0) {
    return [];
  }
  
  let cumulativePlanned = 0;
  let cumulativeActual = 0;
  const dataPoints: {
      timestamp: number;
      planned: number;
      actual: number;
      cumulativePlannedValue: number,
      cumulativeActualValue: number
  }[] = [];

  for (const timestamp of allTimestamps) {
    cumulativePlanned += plannedValuesByDate.get(timestamp) || 0;
    cumulativeActual += actualValuesByDate.get(timestamp) || 0;
    
    dataPoints.push({
      timestamp,
      planned: (cumulativePlanned / totalProjectValue) * 100,
      actual: (cumulativeActual / totalProjectValue) * 100,
      cumulativePlannedValue: cumulativePlanned,
      cumulativeActualValue: cumulativeActual
    });
  }

  const firstDate = new Date(allTimestamps[0]);
  const lastDate = new Date(allTimestamps[allTimestamps.length - 1]);
  const projectInterval = eachDayOfInterval({ start: firstDate, end: lastDate });
  
  const finalCurve: SCurveData[] = [];
  
  if (dataPoints.length > 1) {
    const x = dataPoints.map(p => p.timestamp);
    const y_planned = dataPoints.map(p => p.planned);
    const y_actual = dataPoints.map(p => p.actual);

    const interpolatorPlanned = (t: number) => cubicSpline(x, y_planned, t);
    const interpolatorActual = (t: number) => cubicSpline(x, y_actual, t);
    
    let lastPoint = dataPoints[0];
    let pointIndex = 0;

    projectInterval.forEach(day => {
      const dayTimestamp = day.getTime();
       while (pointIndex < dataPoints.length && dataPoints[pointIndex].timestamp <= dayTimestamp) {
        lastPoint = dataPoints[pointIndex];
        pointIndex++;
      }
      
      const planned = Math.max(0, Math.min(100, interpolatorPlanned(dayTimestamp)));
      const actual = Math.max(0, Math.min(100, interpolatorActual(dayTimestamp)));

      finalCurve.push({
        date: format(day, "d MMM", { locale: es }),
        planned: Math.round(planned),
        actual: Math.round(actual),
        cumulativePlannedValue: lastPoint.cumulativePlannedValue,
        cumulativeActualValue: lastPoint.cumulativeActualValue,
        deviation: Math.round(actual - planned),
      });
    });

  } else if (dataPoints.length === 1) {
    // Handle single data point case
     finalCurve.push({
        date: format(new Date(dataPoints[0].timestamp), "d MMM", { locale: es }),
        planned: Math.round(dataPoints[0].planned),
        actual: Math.round(dataPoints[0].actual),
        cumulativePlannedValue: dataPoints[0].cumulativePlannedValue,
        cumulativeActualValue: dataPoints[0].cumulativeActualValue,
        deviation: Math.round(dataPoints[0].actual - dataPoints[0].planned),
      });
  }


  // Add a starting point at 0% to anchor the graph
  if (finalCurve.length > 0 && (finalCurve[0].planned > 0 || finalCurve[0].actual > 0)) {
     const dayBefore = new Date(firstDate.getTime() - 86400000);
     finalCurve.unshift({
        date: format(dayBefore, "d MMM", { locale: es }),
        planned: 0,
        actual: 0,
        cumulativePlannedValue: 0,
        cumulativeActualValue: 0,
        deviation: 0
      });
  }
  
  // Add original points for dot display
  const finalCurveWithDots = finalCurve.map(point => ({ ...point, dotPlanned: undefined, dotActual: undefined }));
  
  dataPoints.forEach(dp => {
    const dateStr = format(new Date(dp.timestamp), "d MMM", { locale: es });
    const pointInCurve = finalCurveWithDots.find(p => p.date === dateStr);
    if(pointInCurve) {
       pointInCurve.dotPlanned = Math.round(dp.planned);
       pointInCurve.dotActual = Math.round(dp.actual);
    }
  });


  return finalCurveWithDots;
}
