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
import { CreateProjectDialog } from "./create-project-dialog";

export function ProjectView({ projects, onSuccess }: { projects: Project[], onSuccess: () => void }) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = view === 'grid' ? 6 : 10;

  const companies = useMemo(() => {
    const allCompanies = [...new Set(projects.map((p) => p.company))].sort();
    return ["all", ...allCompanies];
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects
      .filter((project) =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(
        (project) =>
          selectedCompany === "all" || project.company === selectedCompany
      );
  }, [projects, searchTerm, selectedCompany]);
  
  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCompany, view]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredProjects.slice(startIndex, endIndex);
  }, [filteredProjects, currentPage, ITEMS_PER_PAGE]);

  const handleViewChange = (newView: "grid" | "list") => {
    setView(newView);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h2 className="text-2xl font-semibold tracking-tight font-headline">
          Mis Proyectos
        </h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 border rounded-lg">
            <Button
              variant={view === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="w-8 h-8"
              onClick={() => handleViewChange("grid")}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="sr-only">Grid View</span>
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="icon"
              className="w-8 h-8"
              onClick={() => handleViewChange("list")}
            >
              <List className="w-4 h-4" />
              <span className="sr-only">List View</span>
            </Button>
          </div>
          <CreateProjectDialog />
        </div>
      </div>

      <div className="flex flex-col gap-4 mb-6 sm:flex-row">
        <Input
          placeholder="Buscar por nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:max-w-xs"
        />
        <Select value={selectedCompany} onValueChange={setSelectedCompany}>
          <SelectTrigger className="w-full sm:w-[280px]">
            <SelectValue placeholder="Filtrar por compañía" />
          </SelectTrigger>
          <SelectContent>
            {companies.map((company) => (
              <SelectItem key={company} value={company}>
                {company === "all" ? "Todas las Compañías" : company}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ProjectList projects={paginatedProjects} view={view} onSuccess={onSuccess} />

      {totalPages > 1 && (
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
