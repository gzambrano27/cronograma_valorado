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

export function generateSCurveData(tasks: Task[], totalProjectValue: number): SCurveData[] {
  // 1. Verificar existencia de tareas
  if (tasks.length === 0 || totalProjectValue <= 0) {
    return [];
  }

  const plannedValuesByDate = new Map<string, number>();
  const actualValuesByDate = new Map<string, number>();
  const allDateStamps = new Set<number>();

  // 2. Calcular valores por fecha y recopilar todas las fechas relevantes
  tasks.forEach(task => {
    // Valor Programado: se acumula en la fecha de fin de la tarea
    if (task.value > 0) {
      const plannedTimestamp = startOfDay(new Date(task.endDate)).getTime();
      allDateStamps.add(plannedTimestamp);
      plannedValuesByDate.set(
        plannedTimestamp.toString(),
        (plannedValuesByDate.get(plannedTimestamp.toString()) || 0) + task.value
      );
    }

    // Valor Real: se acumula en la fecha de cada reporte de consumo
    if (task.dailyConsumption) {
      task.dailyConsumption.forEach(consumption => {
        const valuePerUnit = task.quantity > 0 ? task.value / task.quantity : 0;
        const consumptionValue = consumption.consumedQuantity * valuePerUnit;
        if (consumptionValue > 0) {
          const actualTimestamp = startOfDay(new Date(consumption.date)).getTime();
          allDateStamps.add(actualTimestamp);
          actualValuesByDate.set(
            actualTimestamp.toString(),
            (actualValuesByDate.get(actualTimestamp.toString()) || 0) + consumptionValue
          );
        }
      });
    }
  });

  // 4. Ordenar el horizonte temporal
  const sortedTimestamps = Array.from(allDateStamps).sort((a, b) => a - b);
  
  if (sortedTimestamps.length === 0) {
    return [];
  }

  let cumulativePlannedValue = 0;
  let cumulativeActualValue = 0;
  
  // 5. Calcular porcentajes acumulados
  const sCurvePoints = sortedTimestamps.map(timestamp => {
    const dailyPlanned = plannedValuesByDate.get(timestamp.toString()) || 0;
    const dailyActual = actualValuesByDate.get(timestamp.toString()) || 0;

    cumulativePlannedValue += dailyPlanned;
    cumulativeActualValue += dailyActual;

    const plannedPercentage = (cumulativePlannedValue / totalProjectValue) * 100;
    const actualPercentage = (cumulativeActualValue / totalProjectValue) * 100;
    
    return {
      timestamp,
      planned: Math.min(100, plannedPercentage),
      actual: Math.min(100, actualPercentage),
      cumulativePlannedValue: cumulativePlannedValue,
      cumulativeActualValue: cumulativeActualValue,
    };
  });

  // Crear una serie de datos diaria para una curva suave, interpolando valores
  const firstDate = new Date(sortedTimestamps[0]);
  const lastDate = new Date(sortedTimestamps[sortedTimestamps.length - 1]);
  const projectInterval = eachDayOfInterval({ start: firstDate, end: lastDate });

  const finalCurve: SCurveData[] = [];
  let lastPoint = {
    planned: 0,
    actual: 0,
    cumulativePlannedValue: 0,
    cumulativeActualValue: 0,
  };
  let pointIndex = 0;

  projectInterval.forEach(day => {
    const dayTimestamp = day.getTime();
    
    // Avanzar y actualizar el punto de datos si la fecha del gráfico alcanza o supera la fecha del siguiente evento
    while (pointIndex < sCurvePoints.length && sCurvePoints[pointIndex].timestamp <= dayTimestamp) {
      lastPoint = sCurvePoints[pointIndex];
      pointIndex++;
    }
    
    finalCurve.push({
      date: format(day, "d MMM", { locale: es }),
      planned: Math.round(lastPoint.planned),
      actual: Math.round(lastPoint.actual),
      cumulativePlannedValue: lastPoint.cumulativePlannedValue,
      cumulativeActualValue: lastPoint.cumulativeActualValue,
      deviation: Math.round(lastPoint.actual - lastPoint.planned),
    });
  });

  // Añadir un punto inicial en 0% para anclar la gráfica
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

  return finalCurve;
}
