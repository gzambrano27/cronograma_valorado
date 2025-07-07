import type { Project } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";
import Link from "next/link";
import { ProjectActions } from "./project-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Building2 } from "lucide-react";

interface ProjectListProps {
  projects: Project[];
  view: "grid" | "list";
}

export default function ProjectList({ projects, view }: ProjectListProps) {
  if (view === "grid") {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Card key={project.id} className="flex flex-col overflow-hidden transition-all duration-300 group hover:shadow-xl border">
            <CardHeader className="relative p-0">
              <Link href={`/projects/${project.id}`} aria-label={`Ver detalles de ${project.name}`} className="block aspect-video overflow-hidden">
                  <Image
                    src={project.imageUrl}
                    alt={project.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    data-ai-hint={project.dataAiHint}
                  />
              </Link>
              <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <ProjectActions project={project} />
              </div>
            </CardHeader>

            <CardContent className="flex flex-1 flex-col p-4">
              <Link href={`/projects/${project.id}`} className="focus:outline-none focus:underline">
                <CardTitle className="font-headline mb-1 group-hover:text-primary transition-colors">{project.name}</CardTitle>
              </Link>
              <div className="flex items-center text-sm text-muted-foreground mb-4 gap-2">
                <Building2 className="h-4 w-4 flex-shrink-0" />
                <p className="truncate">{project.company}</p>
              </div>
              
              <div className="mt-auto space-y-3">
                 <div>
                    <div className="flex justify-between items-center mb-1 text-sm text-muted-foreground">
                        <span>Progreso</span>
                        <span>{`${Math.round(project.taskCount > 0 ? (project.completedTasks / project.taskCount) * 100 : 0)}%`}</span>
                    </div>
                    <Progress value={project.taskCount > 0 ? (project.completedTasks / project.taskCount) * 100 : 0} className="h-2" />
                    <div className="text-right text-xs text-muted-foreground mt-1">
                        {project.completedTasks} / {project.taskCount} tareas
                    </div>
                 </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-2 bg-muted/40 p-4 border-t">
              <div className="flex justify-between items-baseline w-full">
                <p className="text-xs text-muted-foreground">Valor Consumido</p>
                <p className="text-lg font-bold text-primary">${project.consumedValue.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div className="flex justify-between items-baseline w-full">
                <p className="text-xs text-muted-foreground">Valor Total</p>
                <p className="text-lg font-bold">${project.totalValue.toLocaleString('es-ES')}</p>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  // List View
  return (
    <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Proyecto</TableHead>
              <TableHead>Progreso</TableHead>
              <TableHead className="text-right hidden sm:table-cell">Valor Consumido</TableHead>
              <TableHead className="text-right hidden sm:table-cell">Valor Total</TableHead>
              <TableHead className="w-[100px] text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.length > 0 ? (
                projects.map((project) => (
                    <TableRow key={project.id}>
                    <TableCell>
                        <Link href={`/projects/${project.id}`} className="font-medium hover:underline line-clamp-2">{project.name}</Link>
                        <div className="flex items-center text-sm text-muted-foreground gap-1.5 mt-1">
                          <Building2 className="h-4 w-4 flex-shrink-0" />
                          <p className="line-clamp-1">{project.company}</p>
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex flex-col gap-1.5 w-32 sm:w-40">
                            <div className="flex justify-between items-center text-xs text-muted-foreground">
                                <span>{project.completedTasks} / {project.taskCount} tareas</span>
                                <span>{`${Math.round(project.taskCount > 0 ? (project.completedTasks / project.taskCount) * 100 : 0)}%`}</span>
                            </div>
                            <Progress value={project.taskCount > 0 ? (project.completedTasks / project.taskCount) * 100 : 0} className="h-2" />
                        </div>
                    </TableCell>
                    <TableCell className="text-right font-mono hidden sm:table-cell">
                        ${project.consumedValue.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right font-mono hidden sm:table-cell">
                        ${project.totalValue.toLocaleString('es-ES')}
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="flex justify-end">
                            <ProjectActions project={project} />
                        </div>
                    </TableCell>
                    </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        No se encontraron proyectos.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
    </Card>
  );
}
