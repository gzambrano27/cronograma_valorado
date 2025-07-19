'use server';
import type { Project, Task, SCurveData, AppConfig, TaskValidation, RawTask, RawTaskValidation, RawProject } from './types';
import fs from 'fs/promises';
import path from 'path';
import { eachDayOfInterval, format, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { query } from './db';

// Helper to convert DB numeric string types to numbers
const toFloat = (value: string | number | null): number => {
    if (value === null) return 0;
    if (typeof value === 'number') return value;
    return parseFloat(value) || 0;
};

// Helper function to process tasks
function processTask(rawTask: RawTask): Task {
  return {
    id: parseInt(rawTask.id, 10),
    projectId: parseInt(rawTask.projectid, 10),
    name: rawTask.name,
    quantity: toFloat(rawTask.quantity),
    consumedQuantity: toFloat(rawTask.consumedquantity),
    value: toFloat(rawTask.value),
    startDate: new Date(rawTask.startdate),
    endDate: new Date(rawTask.enddate),
    status: rawTask.status,
    dailyConsumption: (rawTask.dailyconsumption || []).map((dc: any) => ({
      ...dc,
      date: new Date(dc.date),
      plannedQuantity: toFloat(dc.plannedQuantity),
      consumedQuantity: toFloat(dc.consumedQuantity),
    })),
    validations: (rawTask.validations || []).map((v: RawTaskValidation) => ({
      id: parseInt(v.id, 10),
      taskId: parseInt(v.task_id, 10),
      date: new Date(v.date),
      imageUrl: v.image_url,
      location: v.location,
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
    // Helper function to extract translated names from Odoo's JSONB format
    const getTranslatedName = (nameField: any): string => {
        if (typeof nameField === 'string') {
            return nameField;
        }
        if (typeof nameField === 'object' && nameField !== null && !Array.isArray(nameField)) {
            return nameField.es_EC || nameField.en_US || 'N/A';
        }
        if (Array.isArray(nameField) && nameField.length > 1) {
            return getTranslatedName(nameField[1]);
        }
        return 'N/A';
    };

    const sqlQuery = `
      WITH ProjectTaskMetrics AS (
        SELECT
          projectid,
          SUM(quantity * value) AS total_value,
          SUM(consumedquantity * value) AS consumed_value,
          COUNT(id) AS task_count,
          COUNT(id) FILTER (WHERE status = 'completado') AS completed_tasks
        FROM
          externo_task
        GROUP BY
          projectid
      )
      SELECT
        pp.id,
        pp.name,
        rc.id as "companyId",
        rc.name as company,
        rp.name as client,
        COALESCE(ptm.total_value, 0) as "totalValue",
        COALESCE(ptm.consumed_value, 0) as "consumedValue",
        COALESCE(ptm.task_count, 0) as "taskCount",
        COALESCE(ptm.completed_tasks, 0) as "completedTasks",
        CASE
            WHEN COALESCE(ptm.task_count, 0) > 0
            THEN (COALESCE(ptm.completed_tasks, 0) * 100.0) / COALESCE(ptm.task_count, 1)
            ELSE 0
        END as progress
      FROM
        project_project pp
      LEFT JOIN
        ProjectTaskMetrics ptm ON pp.id = ptm.projectid
      LEFT JOIN
        res_company rc ON pp.company_id = rc.id
      LEFT JOIN
        res_partner rp ON pp.partner_id = rp.id
      WHERE (pp.name->>'en_US' != 'Interno' AND pp.name->>'es_EC' != 'Interno') OR pp.name->>'en_US' IS NULL
      ORDER BY
        pp.name;
    `;

    const rawProjects = await query<RawProject>(sqlQuery);

    return rawProjects.map(p => ({
        id: p.id,
        name: getTranslatedName(p.name),
        companyId: p.companyId,
        company: getTranslatedName(p.company),
        client: p.client ? getTranslatedName(p.client) : '',
        totalValue: toFloat(p.totalValue),
        consumedValue: toFloat(p.consumedValue),
        taskCount: parseInt(p.taskCount, 10),
        completedTasks: parseInt(p.completedTasks, 10),
        progress: toFloat(p.progress),
    }));
}

export async function getTasks(): Promise<Task[]> {
  const tasks_raw = await query<RawTask>(`SELECT * FROM "externo_task"`);
  return tasks_raw.map(processTask);
}

export async function getTasksByProjectId(id: number): Promise<Task[]> {
    const tasks_raw = await query<RawTask>(`
      SELECT t.*,
        (
          SELECT json_agg(v.*)
          FROM "externo_task_validation" v
          WHERE v.task_id = t.id
        ) as validations
      FROM "externo_task" t
      WHERE t.projectid = $1
      ORDER BY t.startdate, t.id
    `, [id]);
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
          const day = startOfDay(new Date(dc.date));
          const dayTimestamp = day.getTime();

          if (!valuesByDate.has(dayTimestamp)) {
            valuesByDate.set(dayTimestamp, { planned: 0, actual: 0 });
          }

          const currentValues = valuesByDate.get(dayTimestamp)!;
          currentValues.planned += dc.plannedQuantity * task.value;
          currentValues.actual += dc.consumedQuantity * task.value;

          if (!minDate || day < minDate) minDate = day;
          if (!maxDate || day > maxDate) maxDate = day;
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
