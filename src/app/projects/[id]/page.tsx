import { notFound } from "next/navigation";
import { getProjectById, getTasksByProjectId, generateSCurveData } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SCurveChart } from "@/components/tasks/s-curve-chart";
import { TaskTable } from "@/components/tasks/task-table";
import { XmlImport } from "@/components/tasks/xml-import";
import { DollarSign, CheckCircle, ListTodo } from "lucide-react";
import { AddTaskSheet } from "@/components/tasks/add-task-sheet";

export default async function ProjectPage({ params: { id } }: { params: { id: string } }) {
  const project = await getProjectById(id);
  
  if (!project) {
    notFound();
  }

  const projectTasks = await getTasksByProjectId(id);
  const sCurve = generateSCurveData(projectTasks, project.totalValue);

  const progressPercentage = project.taskCount > 0 ? (project.completedTasks / project.taskCount) * 100 : 0;

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          {project.name}
        </h1>
        <div className="flex items-center space-x-2">
          <XmlImport />
          <AddTaskSheet projectId={project.id} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${project.totalValue.toLocaleString('es-ES')}</div>
            <p className="text-xs text-muted-foreground">Valor estimado del proyecto</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tareas Totales</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.taskCount}</div>
            <p className="text-xs text-muted-foreground">Total de tareas planificadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progreso</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressPercentage.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">{project.completedTasks} de {project.taskCount} tareas completadas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-3">
              <CardHeader>
              <CardTitle className="font-headline">Curva "S" de Avance</CardTitle>
              <CardDescription>
                  Comparación del avance valorado planificado vs. el avance real.
              </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                  <SCurveChart data={sCurve} />
              </CardContent>
          </Card>
          <Card className="lg:col-span-2">
              <CardHeader>
                  <CardTitle className="font-headline">Resumen de Tareas</CardTitle>
                  <CardDescription>Vista rápida del estado de las tareas.</CardDescription>
              </CardHeader>
              <CardContent>
                  {/* Placeholder for task summary content */}
                  <ul className="space-y-4">
                      <li className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-3"/>
                          <span className="font-medium">{project.completedTasks} Tareas Completadas</span>
                      </li>
                      <li className="flex items-center">
                          <ListTodo className="h-5 w-5 text-yellow-500 mr-3"/>
                          <span className="font-medium">{projectTasks.filter(t => t.status === 'en-progreso').length} Tareas en Progreso</span>
                      </li>
                       <li className="flex items-center">
                          <ListTodo className="h-5 w-5 text-gray-500 mr-3"/>
                          <span className="font-medium">{projectTasks.filter(t => t.status === 'pendiente').length} Tareas Pendientes</span>
                      </li>
                  </ul>
              </CardContent>
          </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Cronograma Valorado</CardTitle>
          <CardDescription>
            Gestione las tareas, su valor y plazos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TaskTable data={projectTasks} />
        </CardContent>
      </Card>
    </div>
  );
}
