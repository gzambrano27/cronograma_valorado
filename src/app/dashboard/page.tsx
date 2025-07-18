
'use client'
import { ProjectView } from "@/components/projects/project-view";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getProjects, getTasks } from "@/lib/data";
import { DollarSign, ListChecks, Briefcase, BarChart, PieChart } from "lucide-react";
import { ProjectValueChart } from "@/components/dashboard/project-value-chart";
import { TaskStatusChart } from "@/components/dashboard/task-status-chart";
import type { ChartConfig } from "@/components/ui/chart";
import { formatCurrency } from "@/lib/utils";
import React, { useState, useEffect, useCallback } from 'react';
import type { Company, Project, Task } from '@/lib/types';
import { useSession } from "@/hooks/use-session";

const taskStatusConfig = {
  completado: {
    label: "Completado",
    color: "hsl(var(--chart-1))",
  },
  "en-progreso": {
    label: "En Progreso",
    color: "hsl(var(--chart-2))",
  },
  pendiente: {
    label: "Pendiente",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;


export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const { session } = useSession();
  
  const [selectedCompanies, setSelectedCompanies] = useState<Company[]>(session?.user?.allowedCompanies || []);

  const reloadData = useCallback(async () => {
    const [fetchedProjects, fetchedTasks] = await Promise.all([getProjects(), getTasks()]);
    setProjects(fetchedProjects);
    setTasks(fetchedTasks);
  }, []);

  useEffect(() => {
    reloadData();
  }, [reloadData]);

  useEffect(() => {
    if (session?.user?.allowedCompanies) {
      // Initialize with all companies selected, or based on a saved preference
      setSelectedCompanies(session.user.allowedCompanies);
    }
  }, [session?.user?.allowedCompanies]);
  
  const filteredProjects = projects.filter(p => selectedCompanies.some(c => c.id === p.companyId));
  
  const totalProjects = filteredProjects.length;
  const totalValue = filteredProjects.reduce((sum, p) => sum + p.totalValue, 0);
  const totalTasks = tasks.length; // This could be filtered too if desired
  const completedTasks = tasks.filter(t => t.status === 'completado').length;

  const projectValueData = filteredProjects
    .map(p => ({
      name: p.name.length > 20 ? `${p.name.substring(0, 20)}...` : p.name,
      value: p.totalValue,
      consumed: p.consumedValue,
      progress: p.taskCount > 0 ? (p.completedTasks / p.taskCount) * 100 : 0
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 7); 

  const taskStatusCounts = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const taskStatusData = Object.entries(taskStatusCounts).map(([status, count]) => ({
    status,
    tasks: count,
  })).filter(item => item.tasks > 0);

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Panel Principal
        </h1>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              Valor de proyectos en compañías seleccionadas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proyectos Totales</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              Proyectos en compañías seleccionadas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tareas Totales (Global)</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              +{completedTasks} completadas en todos los proyectos
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Valor por Proyecto
            </CardTitle>
            <CardDescription>Visualización del valor de los proyectos principales.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ProjectValueChart data={projectValueData} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Distribución de Tareas (Global)
            </CardTitle>
            <CardDescription>Estado general de las tareas en todos los proyectos.</CardDescription>
          </CardHeader>
          <CardContent>
            {tasks.length > 0 ? (
                <TaskStatusChart data={taskStatusData} config={taskStatusConfig} totalTasks={totalTasks} />
            ) : (
                <div className="flex items-center justify-center h-full min-h-[250px] text-muted-foreground">
                    No hay datos de tareas para mostrar.
                </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ProjectView projects={projects} onSuccess={reloadData} />
    </div>
  );
}
