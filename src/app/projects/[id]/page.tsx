
'use client'
import { notFound, useParams } from "next/navigation";
import { getProjectById, getTasksByProjectId, generateSCurveData } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskTable } from "@/components/tasks/task-table";
import { XmlImport } from "@/components/tasks/xml-import";
import { DollarSign, CheckCircle, ListTodo } from "lucide-react";
import { AddTaskSheet } from "@/components/tasks/add-task-sheet";
import { Progress } from "@/components/ui/progress";
import { SCurveCard } from "@/components/tasks/s-curve-card";
import { formatCurrency } from "@/lib/utils";
import React, { useState, useEffect, useCallback } from 'react';
import type { Project, Task, SCurveData } from '@/lib/types';
import { Skeleton } from "@/components/ui/skeleton";


export default function ProjectPage() {
  const params = useParams();
  const id = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [sCurve, setSCurve] = useState<SCurveData[]>([]);
  const [loading, setLoading] = useState(true);

  const reloadData = useCallback(async () => {
    try {
        const fetchedProject = await getProjectById(id);
        if (!fetchedProject) {
            notFound();
            return;
        }
        setProject(fetchedProject);
        
        const fetchedTasks = await getTasksByProjectId(id);
        setProjectTasks(fetchedTasks);
        
        const sCurveData = await generateSCurveData(fetchedTasks, fetchedProject.totalValue);
        setSCurve(sCurveData);

    } catch(error) {
        console.error("Failed to load project data", error);
        // Optionally redirect to an error page or show a message
    } finally {
        setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
        setLoading(true);
        reloadData();
    }
  }, [id, reloadData]);

  if (loading) {
     return (
        <div className="flex-1 space-y-6 p-4 sm:p-6 md:p-8">
            <Skeleton className="h-9 w-1/3 mb-4" />
             <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
            </div>
             <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Skeleton className="lg:col-span-2 h-[450px]" />
                <Skeleton className="lg:col-span-1 h-[450px]" />
            </div>
            <Skeleton className="h-96 w-full" />
        </div>
     );
  }
  
  if (!project) {
    return notFound();
  }

  const progressPercentage = project.taskCount > 0 ? (project.completedTasks / project.taskCount) * 100 : 0;
  const tasksInProgress = projectTasks.filter(t => t.status === 'en-progreso').length;
  const tasksPending = projectTasks.filter(t => t.status === 'pendiente').length;

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          {project.name}
        </h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <XmlImport projectId={id} onSuccess={reloadData} />
          <AddTaskSheet projectId={project.id} onSuccess={reloadData} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatCurrency(project.totalValue, 0)}</div>
            <p className="text-xs text-muted-foreground">Valor estimado del proyecto</p>
          </CardContent>
        </Card>
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
            <div className="text-xl font-bold">{progressPercentage.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">{project.completedTasks} de {project.taskCount} tareas completadas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <SCurveCard data={sCurve} />
          <Card className="lg:col-span-1">
              <CardHeader>
                  <CardTitle className="font-headline">Resumen de Tareas</CardTitle>
                  <CardDescription>Vista rápida del estado de las tareas.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {project.taskCount > 0 ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-muted-foreground">Completadas</span>
                        <span className="font-semibold">{project.completedTasks} / {project.taskCount}</span>
                      </div>
                      <Progress value={progressPercentage} aria-label={`${progressPercentage.toFixed(0)}% completado`} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-muted-foreground">En Progreso</span>
                        <span className="font-semibold">{tasksInProgress}</span>
                      </div>
                      <Progress value={(tasksInProgress / project.taskCount) * 100} aria-label={`${tasksInProgress} tareas en progreso`} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-muted-foreground">Pendientes</span>
                        <span className="font-semibold">{tasksPending}</span>
                      </div>
                      <Progress value={(tasksPending / project.taskCount) * 100} className="[&>div]:bg-muted-foreground/60" aria-label={`${tasksPending} tareas pendientes`} />
                    </div>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground py-10">
                    Aún no hay tareas en este proyecto.
                  </div>
                )}
              </CardContent>
          </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Cronograma</CardTitle>
          <CardDescription>
            Gestione las tareas, su valor y plazos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TaskTable data={projectTasks} onSuccess={reloadData} />
        </CardContent>
      </Card>
    </div>
  );
}
