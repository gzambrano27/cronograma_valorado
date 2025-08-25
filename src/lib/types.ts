// Este archivo define los tipos de datos principales utilizados en toda la aplicación.
// Usar TypeScript y definir tipos claros ayuda a prevenir errores y mejora la mantenibilidad.

export type Company = {
  id: number;
  name: string;
};

// Define la estructura de los datos del usuario que se guardan en la sesión.
export type SessionUser = {
  id: number;
  name: string;
  email: string;
  company: Company; // Compañía principal del usuario.
  allowedCompanies: Company[]; // Todas las compañías a las que tiene acceso.
  isManager: boolean; // Indica si el usuario tiene permisos de gerente.
};

// Estructura completa de la sesión.
export interface SessionData {
  isLoggedIn: boolean;
  user?: SessionUser;
}

// Tipo de respuesta para la acción de login.
export type LoginResult = {
  success: boolean;
  user?: SessionUser;
  error?: string;
}

// Representa el desglose de consumo diario para una tarea.
export type DailyConsumption = {
  id: number;
  taskId: number;
  date: Date;
  plannedQuantity: number;
  consumedQuantity: number;
  verifiedQuantity: number;
  details: string;
};

// Tipo crudo para las validaciones de tareas, tal como vienen de la BD.
export type RawTaskValidation = {
  id: string;
  taskid: string;
  date: string;
  imageurl: string;
  location: string;
  userid?: string;
  notes?: string;
}

// Tipo procesado para las validaciones de tareas.
export type TaskValidation = {
  id: number;
  taskId: number;
  date: Date;
  imageUrl: string;
  location: string;
  userId?: number;
  username?: string; // Se añade dinámicamente después de la consulta
  notes?: string;
};

// Tipo crudo para los proyectos, con métricas agregadas.
export type RawProject = {
  id: number;
  name: any; // El nombre puede ser un objeto JSON con traducciones.
  companyId: number;
  company: any;
  client?: any;
  totalValue: string;
  consumedValue: string;
  totalCost: string;
  taskCount: string;
  completedTasks: string;
  progress: string;
}

// Tipo procesado para los proyectos, con valores numéricos y nombres limpios.
export type Project = {
  id: number;
  name: string;
  companyId: number;
  company: string;
  client?: string;
  totalValue: number;
  consumedValue: number;
  totalCost: number;
  taskCount: number;
  completedTasks: number;
  progress: number;
};

export type RawDailyConsumption = {
  id: string;
  taskid: string;
  date: string;
  planned_quantity: string;
  consumed_quantity: string;
  verified_quantity: string;
  details: string;
};


// Tipo crudo para las tareas, tal como vienen de la BD.
export type RawTask = {
  id: string;
  projectid: string;
  name:string;
  quantity: string;
  consumedquantity: string;
  value: string; // Corresponde al campo 'value' en la BD, que es el PVP.
  cost: string;
  startdate: string;
  enddate: string;
  validations?: RawTaskValidation[];
  status: 'pendiente' | 'en-progreso' | 'completado';
  dailyConsumption?: RawDailyConsumption[];
  partner_id?: string;
  partner_name?: any;
};

// Tipo procesado para las tareas.
export type Task = {
  id: number;
  projectId: number;
  name:string;
  quantity: number;
  consumedQuantity: number;
  precio: number; // Precio de Venta al Público (PVP) o Precio Unitario.
  cost: number; // Costo unitario
  startDate: Date;
  endDate: Date;
  validations?: TaskValidation[];
  status: 'pendiente' | 'en-progreso' | 'completado';
  dailyConsumption?: DailyConsumption[];
  partnerId?: number;
  partnerName?: string;
};

// Estructura de datos para el gráfico de Curva "S".
export type SCurveData = {
  date: string;
  planned: number; // Porcentaje planificado acumulado.
  actual: number; // Porcentaje real acumulado.
  cumulativePlannedValue: number; // Valor planificado acumulado.
  cumulativeActualValue: number; // Valor real acumulado.
  deviation: number; // Desviación entre planificado y real.
  cumulativeProviders?: { [providerName: string]: number }; // Desglose acumulado del costo por proveedor
  providerDistribution?: { [providerName: string]: number }; // Distribución porcentual para el tooltip
  [key: string]: any; // Permite propiedades dinámicas para los proveedores
};

// Configuración de la aplicación.
export type AppConfig = {
  endpointUrl: string;
};

// Información de los grupos de usuario de Odoo.
export type UserGroupInfo = {
    usuario: string;
    categoria_id: number;
    nombre_categoria: any;
    grupo_id: number;
    nombre_grupo: any;
}

export type Partner = {
    id: number;
    name: string;
}
