
"use client";

import { useState, useMemo, useEffect } from "react";
import type { Project } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LayoutGrid, List } from "lucide-react";
import ProjectList from "./project-list";
import { TooltipProvider } from "../ui/tooltip";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";

/**
 * Componente principal para visualizar la lista de proyectos.
 * Incluye filtros, cambio de vista (cuadrícula/lista) y paginación.
 */
export function ProjectView({ projects, onSuccess }: { projects: Project[], onSuccess: () => void }) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAll, setShowAll] = useState(false);

  const ITEMS_PER_PAGE = view === 'grid' ? 6 : 10;
  
  // Extrae y ordena los clientes únicos de los proyectos para el filtro.
  const clients = useMemo(() => {
    const allClients = [...new Set(projects.map((p) => p.client).filter(Boolean) as string[])].sort();
    return ["all", ...allClients];
  }, [projects]);


  // Filtra los proyectos según el término de búsqueda y el cliente seleccionado.
  const filteredProjects = useMemo(() => {
    return projects
      .filter((project) =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(
        (project) =>
          selectedClient === "all" || project.client === selectedClient
      );
  }, [projects, searchTerm, selectedClient]);
  
  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);

  // Resetea la página actual cuando cambian los filtros o la vista.
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedClient, view, projects]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Pagina los proyectos filtrados.
  const paginatedProjects = useMemo(() => {
    if (showAll) {
      return filteredProjects;
    }
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredProjects.slice(startIndex, endIndex);
  }, [filteredProjects, currentPage, ITEMS_PER_PAGE, showAll]);

  const handleViewChange = (newView: "grid" | "list") => {
    setView(newView);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h2 className="text-2xl font-semibold tracking-tight font-headline">
          Proyectos de Cronograma Valorado
        </h2>
        <div className="flex items-center gap-2">
           {/* Controles para cambiar entre vista de cuadrícula y lista */}
          <div className="flex items-center gap-1 p-1 border rounded-lg">
            <Button
              variant={view === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="w-8 h-8"
              onClick={() => handleViewChange("grid")}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="sr-only">Vista de Cuadrícula</span>
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="icon"
              className="w-8 h-8"
              onClick={() => handleViewChange("list")}
            >
              <List className="w-4 h-4" />
              <span className="sr-only">Vista de Lista</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Controles de filtro y paginación */}
      <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center">
        <Input
          placeholder="Buscar por nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:max-w-xs"
        />
        <Select value={selectedClient} onValueChange={setSelectedClient}>
          <SelectTrigger className="w-full md:w-[240px]">
            <SelectValue placeholder="Filtrar por cliente" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client) => (
              <SelectItem key={client} value={client}>
                {client === "all" ? "Todos los Clientes" : client}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex-1" />
        {totalPages > 1 && (
          <div className="flex items-center space-x-2">
            <Switch
              id="show-all"
              checked={showAll}
              onCheckedChange={setShowAll}
            />
            <Label htmlFor="show-all" className="text-sm">Ver todo</Label>
          </div>
        )}
      </div>

      <TooltipProvider>
        <ProjectList projects={paginatedProjects} view={view} onSuccess={onSuccess} />
      </TooltipProvider>

      {/* Controles de paginación */}
      {totalPages > 1 && !showAll && (
        <div className="flex items-center justify-end py-4 space-x-4">
            <span className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </div>
        </div>
      )}
    </div>
  );
}
