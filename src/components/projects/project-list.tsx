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

interface ProjectListProps {
  projects: Project[];
  view: "grid" | "list";
}

export default function ProjectList({ projects, view }: ProjectListProps) {
  if (view === "grid") {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
              <CardDescription className="line-clamp-2 h-10 mb-4">{project.description}</CardDescription>
              
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

            <CardFooter className="flex justify-between items-baseline bg-muted/40 p-4 border-t">
                <div>
                    <p className="text-xs text-muted-foreground">Valor Consumido</p>
                    <p className="text-xl font-bold text-primary">${project.consumedValue.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-muted-foreground">Valor Total</p>
                    <p className="text-xl font-bold">${project.totalValue.toLocaleString('es-ES')}</p>
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
              <TableHead className="text-right">Valor Consumido</TableHead>
              <TableHead className="text-right">Valor Total</TableHead>
              <TableHead className="w-[100px] text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.length > 0 ? (
                projects.map((project) => (
                    <TableRow key={project.id}>
                    <TableCell>
                        <Link href={`/projects/${project.id}`} className="font-medium hover:underline">{project.name}</Link>
                        <p className="text-sm text-muted-foreground line-clamp-1">{project.description}</p>
                    </TableCell>
                    <TableCell>
                        <div className="flex flex-col gap-1.5 w-40">
                            <div className="flex justify-between items-center text-xs text-muted-foreground">
                                <span>{project.completedTasks} / {project.taskCount} tareas</span>
                                <span>{`${Math.round(project.taskCount > 0 ? (project.completedTasks / project.taskCount) * 100 : 0)}%`}</span>
                            </div>
                            <Progress value={project.taskCount > 0 ? (project.completedTasks / project.taskCount) * 100 : 0} className="h-2" />
                        </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                        ${project.consumedValue.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                        ${project.totalValue.toLocaleString('es-ES')}
                    </TableCell>
                    <TableCell className="text-right">
                        <ProjectActions project={project} />
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
