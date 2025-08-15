

'use server';
import type { Project, Task, SCurveData, AppConfig, TaskValidation, RawTask, RawTaskValidation, RawProject, Partner } from './types';
import fs from 'fs/promises';
import path from 'path';
import { eachDayOfInterval, format, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { query } from './db';
import { getTranslatedName } from './utils';

// NOTA: Este archivo contiene funciones para acceder y transformar los datos de la aplicación.
// Todas las funciones aquí se ejecutan en el servidor.

// Helper para convertir tipos NUMERIC de la BD (que vienen como string) a números.
const toFloat = (value: string | number | null): number => {
    if (value === null) return 0;
    if (typeof value === 'number') return value;
    return parseFloat(value) || 0;
};

// Helper para procesar una tarea cruda de la BD a un objeto Task tipado.
function processTask(rawTask: RawTask): Task {
  return {
    id: parseInt(rawTask.id, 10),
    projectId: parseInt(rawTask.projectid, 10),
    name: rawTask.name,
    quantity: toFloat(rawTask.quantity),
    consumedQuantity: toFloat(rawTask.consumedquantity),
    precio: toFloat(rawTask.value), // El campo de la BD es 'value'
    cost: toFloat(rawTask.cost),
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
      taskId: parseInt(v.taskid, 10),
      date: new Date(v.date),
      imageUrl: v.imageurl,
      location: v.location,
      userId: v.userid ? parseInt(v.userid, 10) : undefined,
    })),
    partnerId: rawTask.partner_id ? parseInt(rawTask.partner_id, 10) : undefined,
    partnerName: rawTask.partner_name ? getTranslatedName(rawTask.partner_name) : undefined,
  };
}

// Obtiene la configuración de la aplicación desde un archivo JSON.
export async function getAppConfig(): Promise<AppConfig> {
  const filePath = path.join(process.cwd(), 'src', 'lib', 'config.json');
  try {
    const jsonData = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(jsonData) as AppConfig;
  } catch (error) {
    console.error("No se pudo leer config.json", error);
    return { endpointUrl: "" };
  }
}

// Obtiene todos los proyectos de la base de datos con métricas agregadas.
export async function getProjects(): Promise<Project[]> {
    const sqlQuery = `
      -- CTE (Common Table Expression) para calcular métricas por proyecto.
      WITH ProjectTaskMetrics AS (
        SELECT
          projectid,
          SUM(quantity * value) AS total_value,
          SUM(consumedquantity * value) AS consumed_value,
          SUM(quantity * cost) AS total_cost,
          COUNT(id) AS task_count,
          COUNT(id) FILTER (WHERE status = 'completado') AS completed_tasks
        FROM
          externo_tasks
        GROUP BY
          projectid
      )
      -- Consulta principal que une los proyectos con sus métricas.
      SELECT
        pp.id,
        pp.name,
        rc.id as "companyId",
        rc.name as company,
        rp.name as client,
        COALESCE(ptm.total_value, 0) as "totalValue",
        COALESCE(ptm.consumed_value, 0) as "consumedValue",
        COALESCE(ptm.total_cost, 0) as "totalCost",
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
      -- Excluye proyectos internos.
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
        totalCost: toFloat(p.totalCost),
        taskCount: parseInt(p.taskCount, 10),
        completedTasks: parseInt(p.completedTasks, 10),
        progress: toFloat(p.progress),
    }));
}

// Obtiene todas las tareas de todos los proyectos.
export async function getTasks(): Promise<Task[]> {
  const tasks_raw = await query<RawTask>(`SELECT * FROM "externo_tasks"`);
  return tasks_raw.map(processTask);
}

// Obtiene las tareas de un proyecto específico por su ID.
export async function getTasksByProjectId(id: number): Promise<Task[]> {
    const rawTasks = await query<RawTask>(`
      SELECT 
        t.*,
        p.name as partner_name,
        -- Subconsulta para agregar las validaciones de cada tarea como un array JSON.
        (
          SELECT json_agg(v.*)
          FROM "externo_task_validations" v
          WHERE v.taskid = t.id
        ) as validations
      FROM "externo_tasks" t
      LEFT JOIN res_partner p ON t.partner_id = p.id
      WHERE t.projectid = $1
      ORDER BY t.startdate, t.id
    `, [id]);

    const tasks = rawTasks.map(processTask);
    
    // Obtener todos los userIds únicos de todas las validaciones de todas las tareas
    const userIds = new Set<number>();
    tasks.forEach(task => {
        task.validations?.forEach(v => {
            if (v.userId) {
                userIds.add(v.userId);
            }
        });
    });

    if (userIds.size === 0) {
        return tasks;
    }

    // Consultar los nombres de los usuarios
    const userIdsArray = Array.from(userIds);
    const userPlaceholders = userIdsArray.map((_, i) => `$${i + 1}`).join(',');
    const usersData = await query<{ id: number, name: any }>(
        `SELECT u.id, p.name 
         FROM res_users u
         JOIN res_partner p ON u.partner_id = p.id
         WHERE u.id IN (${userPlaceholders})`,
        userIdsArray
    );

    const userMap = new Map<number, string>();
    usersData.forEach(user => {
        userMap.set(user.id, getTranslatedName(user.name));
    });

    // Mapear los nombres de usuario de vuelta a las validaciones
    tasks.forEach(task => {
        if (task.validations) {
            task.validations.forEach(validation => {
                if (validation.userId) {
                    validation.username = userMap.get(validation.userId);
                }
            });
        }
    });
    
    return tasks;
}

// Genera los datos para el gráfico de Curva "S".
export async function generateSCurveData(tasks: Task[], totalProjectValue: number): Promise<SCurveData[]> {
    if (tasks.length === 0 || totalProjectValue <= 0) {
      return [];
    }

    const valuesByDate = new Map<number, { planned: number; actual: number }>();

    let minDate: Date | null = null;
    let maxDate: Date | null = null;

    // Agrupa los valores planificados y reales por fecha.
    tasks.forEach(task => {
      if (task.dailyConsumption) {
        task.dailyConsumption.forEach(dc => {
          const day = startOfDay(new Date(dc.date));
          const dayTimestamp = day.getTime();

          if (!valuesByDate.has(dayTimestamp)) {
            valuesByDate.set(dayTimestamp, { planned: 0, actual: 0 });
          }

          const currentValues = valuesByDate.get(dayTimestamp)!;
          currentValues.planned += dc.plannedQuantity * task.precio;
          currentValues.actual += dc.consumedQuantity * task.precio;

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

    // Calcula los valores acumulados para cada día en el rango.
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

    // Añade un punto de inicio en cero si es necesario.
    if (finalCurve.length > 0 && minDate) {
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

    // Redondea los valores para una mejor presentación.
    return finalCurve.map(point => ({
      ...point,
      planned: Math.round(point.planned * 100) / 100,
      actual: Math.round(point.actual * 100) / 100,
      deviation: Math.round(point.deviation * 100) / 100,
    }));
}

// Genera los datos para el gráfico de Curva "S" de costos.
export async function generateCostSCurveData(tasks: Task[], totalProjectCost: number): Promise<SCurveData[]> {
    if (tasks.length === 0 || totalProjectCost <= 0) {
        return [];
    }

    const valuesByDate = new Map<number, { planned: number; providers: { [providerName: string]: number } }>();
    const allProviders = new Set<string>();

    let minDate: Date | null = null;
    let maxDate: Date | null = null;

    tasks.forEach(task => {
        const providerName = task.partnerName || 'Sin Asignar';
        allProviders.add(providerName);
        if (task.dailyConsumption) {
            task.dailyConsumption.forEach(dc => {
                const day = startOfDay(new Date(dc.date));
                const dayTimestamp = day.getTime();

                if (!valuesByDate.has(dayTimestamp)) {
                    valuesByDate.set(dayTimestamp, { planned: 0, providers: {} });
                }

                const dailyData = valuesByDate.get(dayTimestamp)!;
                dailyData.planned += dc.plannedQuantity * task.cost;
                dailyData.providers[providerName] = (dailyData.providers[providerName] || 0) + (dc.consumedQuantity * task.cost);

                if (!minDate || day < minDate) minDate = day;
                if (!maxDate || day > maxDate) maxDate = day;
            });
        }
    });
    
    if (!minDate || !maxDate) return [];

    const dateRange = eachDayOfInterval({ start: minDate, end: maxDate });
    const finalCurve: SCurveData[] = [];
    
    let cumulativePlannedValue = 0;
    const cumulativeProviderValues: { [providerName: string]: number } = {};
    Array.from(allProviders).forEach(p => cumulativeProviderValues[p] = 0);
    
    const dayBefore = new Date(minDate.getTime() - 86400000);
    const startPoint: SCurveData = {
        date: format(dayBefore, "d MMM", { locale: es }),
        planned: 0,
        cumulativePlannedValue: 0,
        actual: 0,
        cumulativeActualValue: 0,
        deviation: 0,
    };
    for (const provider of allProviders) {
        startPoint[provider] = 0;
    }
    finalCurve.push(startPoint);


    for (const day of dateRange) {
        const dayTimestamp = day.getTime();
        const dailyData = valuesByDate.get(dayTimestamp) || { planned: 0, providers: {} };

        cumulativePlannedValue += dailyData.planned;
        
        let cumulativeActualCost = 0;
        for (const provider of allProviders) {
            cumulativeProviderValues[provider] += dailyData.providers[provider] || 0;
            cumulativeActualCost += cumulativeProviderValues[provider];
        }
        
        const dataPoint: SCurveData = {
            date: format(day, "d MMM", { locale: es }),
            planned: (cumulativePlannedValue / totalProjectCost) * 100,
            cumulativePlannedValue,
            actual: (cumulativeActualCost / totalProjectCost) * 100,
            cumulativeActualValue: cumulativeActualCost,
            deviation: 0,
        };
        

        for (const provider of allProviders) {
             const providerValue = cumulativeProviderValues[provider];
             dataPoint[provider] = providerValue > 0 ? (providerValue / totalProjectCost) * 100 : null;
             dataPoint[`${provider}_value`] = providerValue;
        }

        finalCurve.push(dataPoint);
    }
    
    return finalCurve;
}


export async function getPartners(): Promise<Partner[]> {
    const partners = await query<{id: number, name: any}>(`
        SELECT id, name
        FROM res_partner
        WHERE is_company = true OR type = 'contact'
        ORDER BY name
    `);
    return partners.map(p => ({
        id: p.id,
        name: getTranslatedName(p.name)
    }));
}



