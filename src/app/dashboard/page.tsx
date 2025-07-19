
'use client'
import { ProjectView } from "@/components/projects/project-view";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getTasks } from "@/lib/data";
import { DollarSign, ListChecks, Briefcase, BarChart, PieChart } from "lucide-react";
import { ProjectValueChart } from "@/components/dashboard/project-value-chart";
import { TaskStatusChart } from "@/components/dashboard/task-status-chart";
import type { ChartConfig } from "@/components/ui/chart";
import { formatCurrency } from "@/lib/utils";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Task, Company } from '@/lib/types';
import { useDashboard } from "@/hooks/use-dashboard-context";
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
  const { allProjects, selectedCompanies } = useDashboard(); 
  const { session } = useSession();
  const isManager = session.user?.isManager ?? false;
  
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  
  const reloadTasks = useCallback(async () => {
    const fetchedTasks = await getTasks();
    setAllTasks(fetchedTasks);
  }, []);

  useEffect(() => {
    reloadTasks();
  }, [reloadTasks]);
  
  const filteredProjects = useMemo(() => {
    if (!selectedCompanies || selectedCompanies.length === 0) {
      return [];
    }
    const selectedCompanyIds = new Set(selectedCompanies.map(c => c.id));
    return allProjects.filter(p => selectedCompanyIds.has(p.companyId));
  }, [allProjects, selectedCompanies]);

  const filteredTasks = useMemo(() => {
    const filteredProjectIds = new Set(filteredProjects.map(p => p.id));
    return allTasks.filter(t => filteredProjectIds.has(t.projectId));
  }, [allTasks, filteredProjects]);

  const totalProjects = filteredProjects.length;
  const totalValue = filteredProjects.reduce((sum, p) => sum + p.totalValue, 0);
  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter(t => t.status === 'completado').length;

  const projectValueData = filteredProjects
    .map(p => ({
      name: p.name.length > 20 ? `${p.name.substring(0, 20)}...` : p.name,
      value: p.totalValue,
      consumed: p.consumedValue,
      progress: p.taskCount > 0 ? (p.completedTasks / p.taskCount) * 100 : 0
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 7);

  const taskStatusCounts = filteredTasks.reduce((acc, task) => {
    const status = task.status as keyof typeof taskStatusConfig;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<keyof typeof taskStatusConfig, number>);

  const taskStatusData = Object.entries(taskStatusCounts).map(([status, count]) => ({
    status,
    tasks: count,
  })).filter(item => item.tasks > 0);
  
  const reloadDashboardData = useCallback(() => {
      reloadTasks();
  }, [reloadTasks]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isManager && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Total de Proyectos</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{formatCurrency(totalValue)}</div>
                <p className="text-xs text-muted-foreground">
                  Suma de los proyectos seleccionados
                </p>
              </CardContent>
            </Card>
        )}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Proyectos</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              Total de proyectos seleccionados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Tareas</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              +{completedTasks} completadas en los proyectos seleccionados
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {isManager && (
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
        )}
        <Card className={isManager ? "lg:col-span-2" : "lg:col-span-5"}>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Distribución de Tareas
            </CardTitle>
            <CardDescription>Estado de las tareas en los proyectos seleccionados.</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredTasks.length > 0 ? (
                <TaskStatusChart data={taskStatusData} config={taskStatusConfig} totalTasks={totalTasks} />
            ) : (
                <div className="flex items-center justify-center h-full min-h-[250px] text-muted-foreground">
                    No hay datos de tareas para mostrar.
                </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ProjectView projects={filteredProjects} onSuccess={reloadDashboardData} />
    </div>
  );
}
