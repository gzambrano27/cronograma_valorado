import type { Project } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";
import Link from "next/link";
import { ViewDetailsButton } from "./view-details-button";

interface ProjectListProps {
  projects: Project[];
}

export default function ProjectList({ projects }: ProjectListProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <Link key={project.id} href={`/projects/${project.id}`} className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg">
          <Card className="hover:border-primary transition-all duration-300 h-full flex flex-col">
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
              <Progress value={(project.completedTasks / project.taskCount) * 100} className="w-full" />
            </CardContent>
            <CardFooter className="flex justify-between items-end">
              <div>
                <p className="text-xs text-muted-foreground">Valor del Proyecto</p>
                <p className="text-lg font-bold">${project.totalValue.toLocaleString()}</p>
              </div>
              <ViewDetailsButton />
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  );
}
