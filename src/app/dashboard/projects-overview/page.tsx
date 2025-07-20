
'use client';

import { useDashboard } from "@/hooks/use-dashboard-context";
import { ProjectView } from "@/components/projects/project-view";
import { useMemo } from "react";

/**
 * Página que muestra la vista principal de la aplicación de Cronograma Valorado.
 * Presenta una lista filtrable y paginada de proyectos.
 * Los datos de los proyectos se obtienen del contexto (`useDashboard`) que es alimentado
 * por el layout superior, asegurando que siempre estén actualizados.
 */
export default function ProjectsOverviewPage() {
    const { allProjects, selectedCompanies } = useDashboard(); 
    
    // Memoiza los proyectos filtrados basados en las compañías seleccionadas.
    const filteredProjects = useMemo(() => {
        if (!selectedCompanies || selectedCompanies.length === 0) {
            return [];
        }
        const selectedCompanyIds = new Set(selectedCompanies.map(c => c.id));
        return allProjects.filter(p => selectedCompanyIds.has(p.companyId));
    }, [allProjects, selectedCompanies]);

    // La función `onSuccess` ya no es necesaria aquí, ya que la revalidación
    // de datos la gestiona Next.js a través de `router.refresh()`.
    return (
        <div className="pt-6">
            <ProjectView projects={filteredProjects} />
        </div>
    );
}
