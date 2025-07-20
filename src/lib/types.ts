

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
}

export type LoginResult = {
  success: boolean;
  user?: SessionUser;
  error?: string;
}

export type DailyConsumption = {
  date: Date;
  plannedQuantity: number;
  consumedQuantity: number;
};

export type RawTaskValidation = {
  id: string;
  taskid: string;
  date: string;
  imageurl: string;
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
  projectid: string;
  name:string;
  quantity: string;
  consumedquantity: string;
  value: string;
  startdate: string;
  enddate: string;
  validations?: RawTaskValidation[];
  status: 'pendiente' | 'en-progreso' | 'completado';
  dailyconsumption?: DailyConsumption[];
};

export type Task = {
  id: number;
  projectId: number;
  name:string;
  quantity: number;
  consumedQuantity: number;
  value: number; // This is PVP (Precio de Venta al Público) or Unit Price
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

    