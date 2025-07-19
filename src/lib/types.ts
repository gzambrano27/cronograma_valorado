
export type Company = {
  id: number;
  name: string;
};

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  company: Company;
  allowedCompanies: Company[];
  isManager: boolean;
};

export interface SessionData {
  isLoggedIn: boolean;
  user?: SessionUser;
  uid?: number; // Keep for odoo client compatibility
  password?: string; // Keep for odoo client compatibility
}

export type DailyConsumption = {
  date: Date;
  plannedQuantity: number;
  consumedQuantity: number;
};

export type RawTaskValidation = {
  id: string;
  task_id: string;
  date: string;
  image_url: string;
  location: string;
}

export type TaskValidation = {
  id: number;
  taskId: number;
  date: Date;
  imageUrl: string;
  location: string;
};

export type RawProject = {
  id: number;
  name: any;
  companyId: number;
  company: any;
  client?: any;
  totalValue: string;
  consumedValue: string;
  taskCount: string;
  completedTasks: string;
  progress: string;
}

export type Project = {
  id: number;
  name: string;
  companyId: number;
  company: string;
  client?: string;
  totalValue: number;
  consumedValue: number;
  taskCount: number;
  completedTasks: number;
  progress: number;
};

export type RawTask = {
  id: string;
  project_id: string;
  name:string;
  quantity: string;
  consumed_quantity: string;
  unit_price: string;
  date_start: string;
  date_end: string;
  validations?: RawTaskValidation[];
  status: 'pendiente' | 'en-progreso' | 'completado';
  daily_consumption?: DailyConsumption[];
};

export type Task = {
  id: number;
  projectId: number;
  name:string;
  quantity: number;
  consumedQuantity: number;
  value: number; // This is unit_price
  startDate: Date;
  endDate: Date;
  validations?: TaskValidation[];
  status: 'pendiente' | 'en-progreso' | 'completado';
  dailyConsumption?: DailyConsumption[];
};

export type SCurveData = {
  date: string;
  planned: number;
  actual: number;
  cumulativePlannedValue: number;
  cumulativeActualValue: number;
  deviation: number;
  dotPlanned?: number;
  dotActual?: number;
};

export type AppConfig = {
  endpointUrl: string;
};

export type UserGroupInfo = {
    usuario: string;
    categoria_id: number;
    nombre_categoria: any;
    grupo_id: number;
    nombre_grupo: any;
}
