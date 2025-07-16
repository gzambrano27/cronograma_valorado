
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Cog, Briefcase, GanttChartSquare } from "lucide-react";
import React from "react";

import type { Project } from "@/lib/types";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarMain,
} from "@/components/ui/sidebar";
import { Button } from "../ui/button";
import { Breadcrumb } from "./breadcrumb";
import { ThemeToggle } from "./theme-toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "../ui/tooltip";

const SIDEBAR_COOKIE_NAME = "sidebar_state";

export default function AppShell({
  children,
  projects,
  title,
}: {
  children: React.ReactNode;
  projects: Project[];
  title: string;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
    try {
      const sidebarCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith(`${SIDEBAR_COOKIE_NAME}=`))
        ?.split("=")[1];
      if (sidebarCookie) {
        setSidebarOpen(sidebarCookie === "true");
      }
    } catch (error) {
      console.error("Failed to parse sidebar cookie", error);
    }
  }, []);

  const isHomePage = pathname === "/";

  return (
    <TooltipProvider>
      <SidebarProvider title={title} defaultOpen={sidebarOpen} onOpenChange={setSidebarOpen}>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center group-data-[state=expanded]/sidebar:justify-between group-data-[state=collapsed]/sidebar:justify-center p-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-8 h-8 text-primary" />
                <h2 className="text-lg font-bold font-headline tracking-tight h-7 group-data-[state=collapsed]/sidebar:hidden">
                  {title}
                </h2>
              </div>
              <SidebarTrigger className="hidden md:flex" />
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {isHomePage ? (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    size="sm"
                    isActive={pathname === `/dashboard`}
                    tooltip={{ children: "Cronograma Valorado" }}
                  >
                    <Link href={`/dashboard`}>
                      <GanttChartSquare className="h-4 w-4 shrink-0" />
                      <span className="truncate group-data-[state=collapsed]/sidebar:hidden">
                        Cronograma Valorado
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : (
                <>
                  {projects.map((project, index) => (
                    <SidebarMenuItem key={project.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton
                            asChild
                            size="sm"
                            isActive={pathname === `/projects/${project.id}`}
                            tooltip={{ children: project.name }}
                          >
                            <Link href={`/projects/${project.id}`}>
                              <div className="relative">
                                <Briefcase className="h-4 w-4 shrink-0" />
                                <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                                  {index + 1}
                                </span>
                              </div>
                              <span className="group-data-[state=collapsed]/sidebar:hidden">
                                {project.name}
                              </span>
                            </Link>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        <TooltipContent
                          side="right"
                          align="start"
                          className="group-data-[state=expanded]/sidebar:block hidden"
                        >
                          {project.name}
                        </TooltipContent>
                      </Tooltip>
                    </SidebarMenuItem>
                  ))}
                  {projects.length === 0 && (
                    <SidebarMenuItem>
                      <span className="flex items-center gap-2 p-2 text-sm text-sidebar-foreground/70 group-data-[state=collapsed]/sidebar:hidden">
                        No hay proyectos.
                      </span>
                    </SidebarMenuItem>
                  )}
                </>
              )}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <SidebarMain>
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <div className="md:hidden">
              <SidebarTrigger />
            </div>
            <Breadcrumb projects={projects} />
            <div className="flex-1" />
            <ThemeToggle />
            <Link href="/settings" passHref>
              <Button variant="ghost" size="icon" aria-label="Configuración">
                <Cog className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/dashboard" passHref>
              <Button variant="outline">Panel Principal</Button>
            </Link>
          </header>
          {children}
        </SidebarMain>
      </SidebarProvider>
    </TooltipProvider>
  );
}
