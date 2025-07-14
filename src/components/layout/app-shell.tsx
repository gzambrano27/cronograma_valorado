

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Cog, Briefcase } from "lucide-react";
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

const SIDEBAR_COOKIE_NAME = "sidebar_state";

export default function AppShell({ 
  children,
  projects,
  title
}: { 
  children: React.ReactNode,
  projects: Project[],
  title: string
}) {
  const pathname = usePathname();
  const [isClient, setIsClient] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  React.useEffect(() => {
    setIsClient(true);
    const sidebarCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith(`${SIDEBAR_COOKIE_NAME}=`))
        ?.split('=')[1];
    setSidebarOpen(sidebarCookie ? sidebarCookie === 'true' : true);
  }, []);
  
  return (
    <SidebarProvider title={title} defaultOpen={sidebarOpen}>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center group-data-[state=expanded]/sidebar:justify-between group-data-[state=collapsed]/sidebar:justify-center p-2">
            <div className="flex items-center gap-2">
              <Building2 className="w-8 h-8 text-primary" />
              <h2 className="text-xl font-bold font-headline tracking-tight h-7 group-data-[state=collapsed]/sidebar:hidden">
                {title}
              </h2>
            </div>
             {isClient ? <SidebarTrigger className="group-data-[state=expanded]/sidebar:hidden group-data-[state=collapsed]/sidebar:hidden" /> : <div className="h-7 w-7"/>}
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {projects.map((project, index) => (
              <SidebarMenuItem key={project.id}>
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
                    <span className="truncate group-data-[state=collapsed]/sidebar:hidden">{project.name}</span>
                  </Link>
                </SidebarMenuButton>
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
          {isClient ? <SidebarTrigger /> : <div className="h-9 w-9" />}
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
  );
}
