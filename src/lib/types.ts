

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

export type Project = {
  id: number;
  name: string;
  company: string;
  client?: string;
  totalValue: number;
  consumedValue: number;
  taskCount: number;
  completedTasks: number;
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
  displayorder: number;
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
  displayorder: number;
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
