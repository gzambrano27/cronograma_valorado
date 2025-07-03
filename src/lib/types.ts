export type DailyConsumption = {
  date: Date;
  consumedQuantity: number;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  totalValue: number;
  taskCount: number;
  completedTasks: number;
  imageUrl: string;
  dataAiHint: string;
};

export type Task = {
  id: string;
  projectId: string;
  name: string;
  quantity: number;
  value: number;
  startDate: Date;
  endDate: Date;
  dailyValue: number;
  location: string;
  imageUrl?: string;
  status: 'pendiente' | 'en-progreso' | 'completado';
  dailyConsumption?: DailyConsumption[];
};

export type SCurveData = {
  day: number;
  planned: number;
  actual: number;
};
