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
  status: 'pending' | 'in-progress' | 'completed';
};

export type SCurveData = {
  day: number;
  planned: number;
  actual: number;
};
