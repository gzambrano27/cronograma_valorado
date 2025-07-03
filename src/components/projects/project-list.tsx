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
        <Card key={project.id} className="hover:border-primary transition-all duration-300 h-full flex flex-col relative group">
          <div className="absolute top-2 right-2 z-10">
            <ProjectActions project={project} />
          </div>
          <Link href={`/projects/${project.id}`} className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg contents" aria-label={`Ver detalles de ${project.name}`}>
            <CardHeader>
              <div className="relative h-40 w-full mb-4">
                <Image
                  src={project.imageUrl}
                  alt={project.name}
                  fill
                  className="rounded-lg object-cover"
                  data-ai-hint={project.dataAiHint}
                />
              </div>
              <CardTitle className="font-headline">{project.name}</CardTitle>
              <CardDescription>{project.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Progreso</span>
                <span className="text-sm text-muted-foreground">
                  {project.completedTasks} / {project.taskCount} tareas
                </span>
              </div>
              <Progress value={project.taskCount > 0 ? (project.completedTasks / project.taskCount) * 100 : 0} className="w-full" />
            </CardContent>
            <CardFooter className="flex justify-between items-end">
              <div>
                <p className="text-xs text-muted-foreground">Valor del Proyecto</p>
                <p className="text-lg font-bold">${project.totalValue.toLocaleString()}</p>
              </div>
            </CardFooter>
          </Link>
        </Card>
      ))}
    </div>
  );
}
