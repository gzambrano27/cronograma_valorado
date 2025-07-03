import type { Project } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";
import Link from "next/link";
import { ProjectActions } from "./project-actions";

interface ProjectListProps {
  projects: Project[];
}

export default function ProjectList({ projects }: ProjectListProps) {
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
            <div className="absolute top-3 right-3 z-10">
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
