export type DailyConsumption = {
  date: Date;
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
  imageUrl: string;
  dataAiHint: string;
};

export type Task = {
  id: string;
  projectId: string;
  name:string;
  quantity: number;
  consumedQuantity: number;
  value: number;
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
};

export type AppConfig = {
  endpointUrl: string;
};
