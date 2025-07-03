import AppShell from "@/components/layout/app-shell";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import ProjectList from "@/components/projects/project-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { projects } from "@/lib/data";
import { DollarSign, ListChecks, Briefcase } from "lucide-react";

export default function Home() {
  const totalProjects = projects.length;
  const totalValue = projects.reduce((sum, p) => sum + p.totalValue, 0);
  const completedTasks = projects.reduce((sum, p) => sum + p.completedTasks, 0);

  return (
    <AppShell>
      <div className="flex-1 space-y-6 p-4 sm:p-6 md:p-8">
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Panel Principal
          </h1>
          <CreateProjectDialog />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Valor combinado de todos los proyectos
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Proyectos Activos</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProjects}</div>
              <p className="text-xs text-muted-foreground">
                Total de proyectos gestionados
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tareas Completadas</CardTitle>
              <ListChecks className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+{completedTasks}</div>
              <p className="text-xs text-muted-foreground">
                Tareas completadas en todos los proyectos
              </p>
            </CardContent>
          </Card>
        </div>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight font-headline mb-4">
            Mis Proyectos
          </h2>
          <ProjectList projects={projects} />
        </div>
      </div>
    </AppShell>
  );
}
