

'use client'
import { notFound, useParams } from "next/navigation";
import { getProjects, getTasksByProjectId, generateSCurveData, generateCostSCurveData } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskTable } from "@/components/tasks/task-table";
import { XmlImport } from "@/components/tasks/xml-import";
import { DollarSign, CheckCircle, ListTodo, GanttChartSquare, BarChart } from "lucide-react";
import { AddTaskSheet } from "@/components/tasks/add-task-sheet";
import { formatCurrency } from "@/lib/utils";
import React, { useState, useEffect, useCallback } from 'react';
import type { Project, Task, SCurveData } from '@/lib/types';
import { useSession } from "@/hooks/use-session";
import { SCurveProgressCard } from "@/components/tasks/s-curve-progress-card";
import { SCurveCostCard } from "@/components/tasks/s-curve-cost-card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";


export default function ProjectPage() {
  const params = useParams();
  const id = parseInt(params.id as string, 10);
  const [project, setProject] = useState<Project | null>(null);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [sCurve, setSCurve] = useState<SCurveData[]>([]);
  const [sCurveCost, setSCurveCost] = useState<SCurveData[]>([]);
  const { session } = useSession();
  const isManager = session.user?.isManager ?? false;
  const [showCostView, setShowCostView] = useState(false);

  // Carga inicial de datos del lado del cliente y función para recargar.
  const loadProjectData = useCallback(async () => {
    if (isNaN(id)) {
        notFound();
        return;
    }
    try {
        const allProjects = await getProjects();
        const fetchedProject = allProjects.find(p => p.id === id);

        if (!fetchedProject) {
            notFound();
            return;
        }
        setProject(fetchedProject);
        
        const fetchedTasks = await getTasksByProjectId(id);
        setProjectTasks(fetchedTasks);
        
        if (isManager) {
            const sCurveData = await generateSCurveData(fetchedTasks, fetchedProject.totalValue);
            setSCurve(sCurveData);
            const sCurveCostData = await generateCostSCurveData(fetchedTasks, fetchedProject.totalCost);
            setSCurveCost(sCurveCostData);
        }

    } catch(error) {
        console.error("Failed to load project data", error);
    }
  }, [id, isManager]);

  useEffect(() => {
    if (id) {
        loadProjectData();
    }
  }, [id, loadProjectData]);
  
  if (!project) {
    return (
       <div className="space-y-6">
          <div className="text-center text-muted-foreground py-10">
              Cargando datos del proyecto...
          </div>
       </div>
    );
  }

  const progressPercentage = project.progress;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 pt-6">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          {project.name}
        </h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <XmlImport projectId={id} onSuccess={loadProjectData} />
          <AddTaskSheet projectId={project.id} onSuccess={loadProjectData} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isManager && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{formatCurrency(project.totalValue)}</div>
                <p className="text-xs text-muted-foreground">Valor estimado del proyecto</p>
              </CardContent>
            </Card>
        )}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tareas Totales</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{project.taskCount}</div>
            <p className="text-xs text-muted-foreground">Total de tareas planificadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progreso</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{progressPercentage.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">{project.completedTasks} de {project.taskCount} tareas completadas</p>
          </CardContent>
        </Card>
      </div>
      
      {isManager && (
        <div className="grid grid-cols-1 gap-6">
            <div className="flex justify-end">
                 <div className="flex items-center space-x-2 p-2 rounded-lg border bg-card">
                    <GanttChartSquare className="h-5 w-5 text-muted-foreground"/>
                    <Label htmlFor="curve-switch" className="text-sm font-medium">Avance</Label>
                    <Switch
                        id="curve-switch"
                        checked={showCostView}
                        onCheckedChange={setShowCostView}
                        aria-label="Cambiar entre curva de avance y curva de costo"
                    />
                    <Label htmlFor="curve-switch" className="text-sm font-medium">Costo</Label>
                    <BarChart className="h-5 w-5 text-muted-foreground" />
                </div>
            </div>
            {showCostView 
                ? <SCurveCostCard data={sCurveCost} />
                : <SCurveProgressCard data={sCurve} />
            }
        </div>
      )}


      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Cronograma</CardTitle>
          <CardDescription>
            Gestione las tareas, su valor y plazos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TaskTable data={projectTasks} onSuccess={loadProjectData} />
        </CardContent>
      </Card>
    </div>
  );
}
