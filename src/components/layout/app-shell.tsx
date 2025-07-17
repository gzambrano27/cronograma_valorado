
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Cog, Briefcase, GanttChartSquare, PanelLeft, LogOut } from "lucide-react";
import React from "react";

import type { Project, SessionUser } from "@/lib/types";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMain,
  useSidebar
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
import { logout } from "@/lib/auth-actions";
import { Avatar, AvatarFallback } from "../ui/avatar";


function MobileSidebarTrigger() {
    const { toggleSidebar } = useSidebar();
    return (
        <Button
            data-sidebar="trigger"
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => toggleSidebar()}
        >
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle Sidebar</span>
      </Button>
    )
}

export default function AppShell({
  children,
  projects,
  title,
  user,
}: {
  children: React.ReactNode;
  projects: Project[];
  title: string;
  user?: SessionUser;
}) {
  const pathname = usePathname();
  
  const isHomePage = pathname === "/";

  return (
    <TooltipProvider>
      <SidebarProvider title={title}>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center group-data-[state=expanded]/sidebar:justify-between group-data-[state=collapsed]/sidebar:justify-center p-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-8 h-8 text-primary" />
                <h2 className="text-lg font-bold font-headline tracking-tight h-7">
                  {title}
                </h2>
              </div>
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
                      <span className="truncate">
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
                              <span>
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
                      <span className="flex items-center gap-2 p-2 text-sm text-sidebar-foreground/70">
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
            <MobileSidebarTrigger />
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
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                       <AvatarFallback>{user.name?.[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <form action={logout}>
                    <DropdownMenuItem asChild>
                       <button type="submit" className="w-full">
                          <LogOut className="mr-2 h-4 w-4" />
                          Cerrar sesión
                       </button>
                    </DropdownMenuItem>
                  </form>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </header>
          {children}
        </SidebarMain>
      </SidebarProvider>
    </TooltipProvider>
  );
}

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
