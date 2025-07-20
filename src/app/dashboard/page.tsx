
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GanttChartSquare } from "lucide-react";
import Link from "next/link";
import { ProjectView } from "@/components/projects/project-view";
import { useDashboard } from "@/hooks/use-dashboard-context";
import { useCallback, useMemo } from "react";
import { getTasks } from "@/lib/data";
import { useState, useEffect } from "react";
import type { Task } from "@/lib/types";


/**
 * Página principal del Dashboard que actúa como un "Centro de Aplicaciones".
 * Muestra las aplicaciones disponibles y, por ahora, directamente la vista de proyectos.
 */
export default function DashboardPage() {
    const { allProjects, selectedCompanies } = useDashboard(); 
    const [allTasks, setAllTasks] = useState<Task[]>([]);
    
    // Función para recargar las tareas, utilizada para actualizar datos tras una acción.
    const reloadDashboardData = useCallback(async () => {
        const fetchedTasks = await getTasks();
        setAllTasks(fetchedTasks);
    }, []);

    // Cargar las tareas al montar el componente.
    useEffect(() => {
        reloadDashboardData();
    }, [reloadDashboardData]);
    
    // Memoiza los proyectos filtrados basados en las compañías seleccionadas en el contexto.
    const filteredProjects = useMemo(() => {
        if (!selectedCompanies || selectedCompanies.length === 0) {
        return [];
        }
        const selectedCompanyIds = new Set(selectedCompanies.map(c => c.id));
        return allProjects.filter(p => selectedCompanyIds.has(p.companyId));
    }, [allProjects, selectedCompanies]);

  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 pt-6">
            <h1 className="text-3xl font-bold tracking-tight font-headline">
                Centro de Aplicaciones
            </h1>
        </div>

        {/* Sección que muestra las aplicaciones disponibles. Actualmente solo muestra una. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <Link href="/dashboard/projects-overview">
                 <Card className="hover:shadow-lg hover:border-primary transition-all duration-200 cursor-pointer h-full">
                    <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                        <div className="p-3 bg-primary/10 rounded-lg">
                            <GanttChartSquare className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="font-headline text-xl">Cronograma Valorado</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CardDescription>
                            Gestione y valore el cronograma de sus proyectos, importe tareas y registre el avance.
                        </CardDescription>
                    </CardContent>
                 </Card>
            </Link>
        </div>
    </div>
  );
}
