
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, Building2, Cog } from "lucide-react";
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
import { Skeleton } from "../ui/skeleton";

export default function AppShell({ 
  children,
  projects,
  title,
  sidebarOpen
}: { 
  children: React.ReactNode,
  projects: Project[],
  title: string,
  sidebarOpen?: boolean
}) {
  const pathname = usePathname();
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);
  
  return (
    <SidebarProvider title={title} defaultOpen={sidebarOpen}>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <Building2 className="w-8 h-8 text-primary" />
            <h2 className="text-xl font-bold font-headline tracking-tight h-7 group-data-[state=collapsed]/sidebar:hidden">
              {title}
            </h2>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {projects.map((project) => (
              <SidebarMenuItem key={project.id}>
                <Link href={`/projects/${project.id}`} passHref>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === `/projects/${project.id}`}
                    tooltip={{ children: project.name }}
                  >
                    <span>
                      <Briefcase />
                      <span className="truncate group-data-[state=collapsed]/sidebar:hidden">{project.name}</span>
                    </span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
            {projects.length === 0 && (
                <SidebarMenuItem>
                    <span className="flex items-center gap-2 p-2 text-sm text-sidebar-foreground/70 group-data-[state=collapsed]/sidebar:hidden">
                        No hay proyectos.
                    </span>
                </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarMain>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          {isClient ? <SidebarTrigger /> : <div className="h-7 w-7 md:flex" />}
          {isClient ? <Breadcrumb projects={projects} /> : <div className="h-4" />}
          <div className="flex-1" />
           <ThemeToggle />
           <Link href="/settings" passHref>
              <Button variant="ghost" size="icon" aria-label="Configuración">
                  <Cog className="h-5 w-5" />
              </Button>
          </Link>
          <Link href="/" passHref>
             <Button variant="outline">Panel Principal</Button>
          </Link>
        </header>
        {children}
      </SidebarMain>
    </SidebarProvider>
  );
}
