export type DailyConsumption = {
  date: Date;
  plannedQuantity: number;
  consumedQuantity: number;
};

export type TaskValidation = {
  id: string;
  date: Date;
  imageUrl: string;
  location: string;
};

export type Project = {
  id: string;
  externalId?: number;
  name: string;
  company: string;
  externalCompanyId?: number;
  totalValue: number;
  consumedValue: number;
  taskCount: number;
  completedTasks: number;
};

export type Task = {
  id: string;
  projectId: string;
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

export interface Database {
  projects: Omit<Project, 'totalValue' | 'taskCount' | 'completedTasks' | 'consumedValue'>[];
  tasks: Task[];
}
