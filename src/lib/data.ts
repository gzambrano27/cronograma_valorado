
'use server';
import type { Project, Task, SCurveData, AppConfig, TaskValidation } from './types';
import fs from 'fs/promises';
import path from 'path';
import { eachDayOfInterval, format, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { sql } from './db';

// Helper to convert DB numeric string types to numbers
const toFloat = (value: string | number | null): number => {
    if (value === null) return 0;
    if (typeof value === 'number') return value;
    return parseFloat(value) || 0;
};

// Helper function to process tasks
function processTask(task: any): Task {
  return {
    ...task,
    projectId: parseInt(task.projectId, 10),
    quantity: toFloat(task.quantity),
    consumedQuantity: toFloat(task.consumedQuantity),
    value: toFloat(task.value),
    startDate: new Date(task.startDate),
    endDate: new Date(task.endDate),
    dailyConsumption: (task.dailyConsumption || []).map((dc: any) => ({
      ...dc,
      date: new Date(dc.date),
      plannedQuantity: toFloat(dc.plannedQuantity),
      consumedQuantity: toFloat(dc.consumedQuantity),
    })),
    validations: (task.validations || []).map((v: any) => ({
      ...v,
      date: new Date(v.date),
    })),
  };
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
    const projects_raw = await sql`
        SELECT 
            pp.id, 
            pp.name, 
            rc.name as company, 
            rp.name as client
        FROM project_project pp
        LEFT JOIN res_company rc ON pp.company_id = rc.id
        LEFT JOIN res_partner rp ON pp.partner_id = rp.id
        ORDER BY pp.name
    `;

    const tasks_raw = await sql`SELECT * FROM tasks`;
    
    const tasks = tasks_raw.map(processTask);
    const projects = projects_raw.map(p => ({
        id: p.id,
        name: p.name,
        company: p.company || 'N/A',
        client: p.client || ''
    }));

    return projects.map(project => {
        const projectTasks = tasks.filter(task => task.projectId === project.id);
        const completedTasks = projectTasks.filter(task => task.status === 'completado').length;
        const taskCount = projectTasks.length;
        
        const totalValue = projectTasks.reduce((sum, task) => sum + (task.quantity * task.value), 0);
        const consumedValue = projectTasks.reduce((sum, task) => sum + (task.consumedQuantity * task.value), 0);

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
  const tasks_raw = await sql`SELECT * FROM tasks`;
  return tasks_raw.map(processTask);
}

export async function getProjectById(id: number): Promise<Project | undefined> {
    const projects = await getProjects(); // This is inefficient but necessary for now
    return projects.find(p => p.id === id);
}

export async function getTasksByProjectId(id: number): Promise<Task[]> {
    const tasks_raw = await sql`
      SELECT t.*,
        (
          SELECT json_agg(v.*)
          FROM task_validations v
          WHERE v."taskId" = t.id
        ) as validations
      FROM tasks t
      WHERE t."projectId" = ${id}
      ORDER BY t."startDate"
    `;
    return tasks_raw.map(processTask);
}

export async function generateSCurveData(tasks: Task[], totalProjectValue: number): Promise<SCurveData[]> {
    if (tasks.length === 0 || totalProjectValue <= 0) {
      return [];
    }
  
    const valuesByDate = new Map<number, { planned: number; actual: number }>();
  
    let minDate: Date | null = null;
    let maxDate: Date | null = null;
  
    tasks.forEach(task => {
      if (task.dailyConsumption) {
        task.dailyConsumption.forEach(dc => {
          const day = startOfDay(new Date(dc.date)).getTime();
          if (!valuesByDate.has(day)) {
            valuesByDate.set(day, { planned: 0, actual: 0 });
          }
  
          const currentValues = valuesByDate.get(day)!;
          currentValues.planned += dc.plannedQuantity * task.value;
          currentValues.actual += dc.consumedQuantity * task.value;
  
          if (!minDate || day < minDate.getTime()) minDate = new Date(day);
          if (!maxDate || day > maxDate.getTime()) maxDate = new Date(day);
        });
      }
    });
  
    if (!minDate || !maxDate) {
      return [];
    }
  
    const dateRange = eachDayOfInterval({ start: minDate, end: maxDate });
  
    const finalCurve: SCurveData[] = [];
    let cumulativePlanned = 0;
    let cumulativeActual = 0;
  
    for (const day of dateRange) {
      const dayTimestamp = day.getTime();
      const dailyValues = valuesByDate.get(dayTimestamp) || { planned: 0, actual: 0 };
  
      cumulativePlanned += dailyValues.planned;
      cumulativeActual += dailyValues.actual;
  
      const plannedPercent = (cumulativePlanned / totalProjectValue) * 100;
      const actualPercent = (cumulativeActual / totalProjectValue) * 100;
  
      finalCurve.push({
        date: format(day, "d MMM", { locale: es }),
        planned: plannedPercent,
        actual: actualPercent,
        cumulativePlannedValue: cumulativePlanned,
        cumulativeActualValue: cumulativeActual,
        deviation: actualPercent - plannedPercent,
      });
    }
  
    if (minDate > new Date()) {
       const dayBefore = new Date(minDate.getTime() - 86400000);
        finalCurve.unshift({
          date: format(dayBefore, "d MMM", { locale: es }),
          planned: 0,
          actual: 0,
          cumulativePlannedValue: 0,
          cumulativeActualValue: 0,
          deviation: 0,
        });
    }
  
    return finalCurve.map(point => ({
      ...point,
      planned: Math.round(point.planned * 100) / 100,
      actual: Math.round(point.actual * 100) / 100,
      deviation: Math.round(point.deviation * 100) / 100,
    }));
}
