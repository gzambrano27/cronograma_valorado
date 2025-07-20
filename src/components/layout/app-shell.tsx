
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Cog, Briefcase, GanttChartSquare, PanelLeft, LogOut, LayoutDashboard, FolderKanban } from "lucide-react";
import React from "react";

import type { Company, Project, SessionUser } from "@/lib/types";
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
import { Avatar, AvatarFallback } from "../ui/avatar";
import { CompanySwitcher } from "./company-switcher";
import { useSession } from "@/hooks/use-session";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from 'next/navigation';


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

interface AppShellProps {
    children: React.ReactNode;
    allProjects: Project[];
    selectedCompanies: Company[];
    onCompanyChange: (companies: Company[]) => void;
}

/**
 * Componente principal que define la estructura de la aplicación (Sidebar + Contenido).
 * Renderiza una barra lateral diferente dependiendo de si el usuario está en el 
 * "Centro de Aplicaciones" o dentro de una aplicación específica.
 */
export default function AppShell({ children, allProjects, selectedCompanies, onCompanyChange }: AppShellProps) {
  const pathname = usePathname();
  const { session, setSession } = useSession();
  const router = useRouter();
  
  const user = session?.user;

  // Determina si estamos dentro de la aplicación de "Cronograma Valorado"
  const isProjectsApp = pathname.startsWith("/dashboard/projects");
  const title = isProjectsApp ? "Cronograma Valorado" : "Menú Principal";

  const handleLogout = () => {
    setSession({ isLoggedIn: false });
    router.replace('/login');
  };

  const filteredProjectsForSidebar = React.useMemo(() => {
    if (!selectedCompanies || selectedCompanies.length === 0) {
      return [];
    }
    const selectedCompanyIds = new Set(selectedCompanies.map(c => c.id));
    return allProjects.filter(p => selectedCompanyIds.has(p.companyId));
  }, [allProjects, selectedCompanies]);

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
            {/* Renderizado condicional del menú de la barra lateral */}
            {isProjectsApp ? (
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      size="sm"
                      isActive={pathname === "/dashboard"}
                      tooltip={{ children: "Centro de Aplicaciones" }}
                    >
                      <Link href={`/dashboard`}>
                        <LayoutDashboard className="h-4 w-4 shrink-0" />
                        <span className="truncate">
                          Panel Principal
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                     <SidebarMenuButton
                      asChild
                      size="sm"
                      isActive={pathname === "/dashboard/projects-overview"}
                      tooltip={{ children: "Vista General de Proyectos" }}
                    >
                      <Link href={`/dashboard/projects-overview`}>
                        <FolderKanban className="h-4 w-4 shrink-0" />
                        <span className="truncate">
                          Proyectos
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {filteredProjectsForSidebar.map((project) => (
                    <SidebarMenuItem key={project.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton
                            asChild
                            size="sm"
                            isActive={pathname === `/dashboard/projects/${project.id}`}
                            tooltip={{ children: project.name }}
                          >
                            <Link href={`/dashboard/projects/${project.id}`}>
                              <Briefcase className="h-4 w-4 shrink-0" />
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
                  {filteredProjectsForSidebar.length === 0 && (
                     <SidebarMenuItem>
                        <span className="flex items-center gap-2 p-2 text-sm text-sidebar-foreground/70">
                            No hay proyectos.
                        </span>
                     </SidebarMenuItem>
                  )}
                </SidebarMenu>
            ) : (
                <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                          asChild
                          size="sm"
                          isActive={pathname === "/dashboard/projects-overview"}
                          tooltip={{ children: "Cronograma Valorado" }}
                        >
                          <Link href={`/dashboard/projects-overview`}>
                              <GanttChartSquare className="h-4 w-4 shrink-0" />
                              <span className="truncate">
                                Proyectos
                              </span>
                          </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            size="sm"
                            isActive={pathname === "/settings"}
                            tooltip={{ children: "Configuración" }}
                        >
                            <Link href={`/settings`}>
                                <Cog className="h-4 w-4 shrink-0" />
                                <span className="truncate">
                                    Configuración
                                </span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            )}
          </SidebarContent>
        </Sidebar>
        <SidebarMain>
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
            <MobileSidebarTrigger />
            <Breadcrumb />
            <div className="flex-1" />
            {user && <CompanySwitcher user={user} selectedCompanies={selectedCompanies} onCompanyChange={onCompanyChange} />}
            <ThemeToggle />
            <Link href="/settings" passHref>
              <Button variant="ghost" size="icon" aria-label="Configuración">
                <Cog className="h-5 w-5" />
              </Button>
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
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </header>
          <div className="p-4 sm:p-6 md:p-8">
            {children}
          </div>
        </SidebarMain>
      </SidebarProvider>
    </TooltipProvider>
  );
}
