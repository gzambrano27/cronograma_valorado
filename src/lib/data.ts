import type { Project, Task, SCurveData, DailyConsumption } from './types';

export const projects: Project[] = [
  {
    id: 'proj-1',
    name: 'Construcción Edificio Central',
    description: 'Fases iniciales de la construcción del nuevo edificio de oficinas en el centro de la ciudad.',
    totalValue: 1250000,
    taskCount: 15,
    completedTasks: 4,
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'building construction',
  },
  {
    id: 'proj-2',
    name: 'Remodelación Vial Urbana',
    description: 'Proyecto de mejora y ampliación de la avenida principal, incluyendo nueva pavimentación y señalización.',
    totalValue: 780000,
    taskCount: 22,
    completedTasks: 18,
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'road work',
  },
  {
    id: 'proj-3',
    name: 'Instalación Parque Solar',
    description: 'Despliegue de paneles solares en la nueva planta de energía renovable.',
    totalValue: 2500000,
    taskCount: 30,
    completedTasks: 10,
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'solar panels',
  },
];

export const tasks: Task[] = [
  // Project 1 Tasks
  { id: 'task-1-1', projectId: 'proj-1', name: 'Excavación de cimientos', quantity: 500, value: 150000, startDate: new Date('2024-08-01'), endDate: new Date('2024-08-10'), dailyValue: 15000, location: 'Sector A-1', status: 'completed',
    dailyConsumption: [
      { date: new Date('2024-08-01'), consumedQuantity: 50 },
      { date: new Date('2024-08-02'), consumedQuantity: 55 },
      { date: new Date('2024-08-03'), consumedQuantity: 48 },
    ]
  },
  { id: 'task-1-2', projectId: 'proj-1', name: 'Vaciado de hormigón', quantity: 300, value: 200000, startDate: new Date('2024-08-11'), endDate: new Date('2024-08-20'), dailyValue: 20000, location: 'Sector A-1', status: 'in-progress' },
  { id: 'task-1-3', projectId: 'proj-1', name: 'Montaje de estructura de acero', quantity: 1, value: 450000, startDate: new Date('2024-08-21'), endDate: new Date('2024-09-15'), dailyValue: 18000, location: 'General', status: 'pending' },
  
  // Project 2 Tasks
  { id: 'task-2-1', projectId: 'proj-2', name: 'Demolición de pavimento antiguo', quantity: 2000, value: 50000, startDate: new Date('2024-07-15'), endDate: new Date('2024-07-25'), dailyValue: 5000, location: 'Km 1-5', status: 'completed' },
  { id: 'task-2-2', projectId: 'proj-2', name: 'Nivelación de terreno', quantity: 2000, value: 80000, startDate: new Date('2024-07-26'), endDate: new Date('2024-08-05'), dailyValue: 8000, location: 'Km 1-5', status: 'completed' },
  { id: 'task-2-3', projectId: 'proj-2', name: 'Asfaltado de calzada', quantity: 1, value: 300000, startDate: new Date('2024-08-06'), endDate: new Date('2024-08-20'), dailyValue: 20000, location: 'Km 1-5', status: 'in-progress' },

  // Project 3 Tasks
  { id: 'task-3-1', projectId: 'proj-3', name: 'Preparación del terreno', quantity: 10000, value: 300000, startDate: new Date('2024-09-01'), endDate: new Date('2024-09-15'), dailyValue: 20000, location: 'Área Norte', status: 'pending' },
  { id: 'task-3-2', projectId: 'proj-3', name: 'Instalación de soportes', quantity: 5000, value: 700000, startDate: new Date('2024-09-16'), endDate: new Date('2024-10-15'), dailyValue: 23333, location: 'Área Norte', status: 'pending' },
];


function createCumulativeData(days: number): SCurveData[] {
  const data: SCurveData[] = [];
  let cumulativePlanned = 0;
  let cumulativeActual = 0;

  const plannedCurve = (day: number) => {
    // Sigmoid-like function for a typical S-curve
    return 1 / (1 + Math.exp(-0.2 * (day - days / 2)));
  };

  for (let i = 1; i <= days; i++) {
    const plannedIncrement = plannedCurve(i) * (100 / (days * 0.65)); // Scaled increment
    cumulativePlanned += Math.min(plannedIncrement, 100 - cumulativePlanned);

    let actualIncrement = 0;
    if (i < days * 0.75) { // Simulate actual progress lagging then catching up
      actualIncrement = plannedIncrement * (Math.random() * 0.4 + 0.5); // 50-90% of planned
    } else {
      actualIncrement = plannedIncrement * (Math.random() * 0.3 + 0.9); // 90-120% of planned
    }
    cumulativeActual += Math.min(actualIncrement, 100 - cumulativeActual);
    
    data.push({
      day: i,
      planned: Math.round(Math.min(100, cumulativePlanned)),
      actual: Math.round(Math.min(100, cumulativeActual)),
    });
  }

  // Ensure curves end at or near 100 and 90 respectively for this example
  data[data.length - 1].planned = 100;
  if(data[data.length-1].actual > 95) data[data.length-1].actual = 95;


  return data;
}

export const sCurveData: SCurveData[] = createCumulativeData(30);
