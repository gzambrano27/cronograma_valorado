
'use client';

import { useDashboard } from "@/hooks/use-dashboard-context";
import { ProjectView } from "@/components/projects/project-view";
import { getTasks } from "@/lib/data";
import { useCallback, useState, useEffect, useMemo } from "react";
import type { Task } from "@/lib/types";

/**
 * Página que muestra la vista principal de la aplicación de Cronograma Valorado.
 * Presenta una lista filtrable y paginada de proyectos.
 */
export default function ProjectsOverviewPage() {
    const { allProjects, selectedCompanies } = useDashboard(); 
    const [allTasks, setAllTasks] = useState<Task[]>([]);
    
    // Función para recargar los datos necesarios en esta vista.
    const reloadPageData = useCallback(async () => {
        const fetchedTasks = await getTasks();
        setAllTasks(fetchedTasks);
    }, []);

    useEffect(() => {
        reloadPageData();
    }, [reloadPageData]);
    
    // Memoiza los proyectos filtrados basados en las compañías seleccionadas.
    const filteredProjects = useMemo(() => {
        if (!selectedCompanies || selectedCompanies.length === 0) {
            return [];
        }
        const selectedCompanyIds = new Set(selectedCompanies.map(c => c.id));
        return allProjects.filter(p => selectedCompanyIds.has(p.companyId));
    }, [allProjects, selectedCompanies]);

    return (
        <div className="pt-6">
            <ProjectView projects={filteredProjects} onSuccess={reloadPageData} />
        </div>
    );
}
