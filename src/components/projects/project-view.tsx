"use client";

import { useState } from "react";
import type { Project } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List } from "lucide-react";
import ProjectList from "./project-list";
import { CreateProjectDialog } from "./create-project-dialog";

export function ProjectView({ projects }: { projects: Project[] }) {
  const [view, setView] = useState<"grid" | "list">("grid");

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold tracking-tight font-headline">
          Mis Proyectos
        </h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 border rounded-lg">
            <Button
              variant={view === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="w-8 h-8"
              onClick={() => setView("grid")}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="sr-only">Grid View</span>
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="icon"
              className="w-8 h-8"
              onClick={() => setView("list")}
            >
              <List className="w-4 h-4" />
              <span className="sr-only">List View</span>
            </Button>
          </div>
          <CreateProjectDialog />
        </div>
      </div>
      <ProjectList projects={projects} view={view} />
    </div>
  );
}
