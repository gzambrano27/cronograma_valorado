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
  SidebarInset,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "../ui/button";
import { Breadcrumb } from "./breadcrumb";
import { Skeleton } from "../ui/skeleton";

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

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <SidebarProvider title={title}>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <Building2 className="w-8 h-8 text-primary" />
            <h2 className="text-xl font-bold font-headline tracking-tight h-7">
              {isClient ? title : <Skeleton className="h-full w-40" />}
            </h2>
          </div>
        </SidebarHeader>
        <SidebarSeparator />
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
                      <span>{project.name}</span>
                    </span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <SidebarTrigger className="md:hidden" />
          <Breadcrumb projects={projects} />
          <div className="flex-1" />
           <Link href="/settings" passHref>
              <Button variant="ghost" size="icon" aria-label="Configuración">
                  <Cog className="h-5 w-5" />
              </Button>
          </Link>
          <Link href="/" passHref>
             <Button variant="outline">Panel Principal</Button>
          </Link>
        </header>
        <main>{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
