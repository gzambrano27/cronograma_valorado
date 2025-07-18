
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Cog, Briefcase, GanttChartSquare, PanelLeft, LogOut } from "lucide-react";
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
import { logout } from "@/lib/auth-actions";
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

export default function AppShell({ children, allProjects, selectedCompanies, onCompanyChange }: AppShellProps) {
  const pathname = usePathname();
  const { session } = useSession();
  
  const user = session?.user;

  const isDashboardPage = pathname.startsWith("/dashboard");
  const title = "ProjectValuator";

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
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  size="sm"
                  isActive={isDashboardPage}
                  tooltip={{ children: "Panel Principal" }}
                >
                  <Link href={`/dashboard`}>
                    <GanttChartSquare className="h-4 w-4 shrink-0" />
                    <span className="truncate">
                      Panel Principal
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {filteredProjectsForSidebar.map((project, index) => (
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
              {filteredProjectsForSidebar.length === 0 && (
                 <SidebarMenuItem>
                    <span className="flex items-center gap-2 p-2 text-sm text-sidebar-foreground/70">
                        No hay proyectos.
                    </span>
                 </SidebarMenuItem>
              )}
            </SidebarMenu>
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
          <div className="p-4 sm:p-6 md:p-8">
            {children}
          </div>
        </SidebarMain>
      </SidebarProvider>
    </TooltipProvider>
  );
}
