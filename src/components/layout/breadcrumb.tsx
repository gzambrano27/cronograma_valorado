
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ChevronRight } from 'lucide-react';
import type { Project } from '@/lib/types';

interface BreadcrumbProps {
  projects: Project[];
}

const translations: Record<string, string> = {
  dashboard: 'Cronograma Valorado',
  settings: 'Configuración',
};

export function Breadcrumb({ projects }: BreadcrumbProps) {
  const pathname = usePathname();
  
  if (pathname === '/') {
    return null;
  }

  const segments = pathname.split('/').filter(Boolean);

  const getProjectName = (id: number): string => {
    const project = projects.find((p) => p.id === id);
    return project?.name || String(id);
  };
  
  const buildBreadcrumbs = () => {
    const crumbs = [];

    if (pathname.startsWith('/dashboard') || pathname.startsWith('/projects')) {
        crumbs.push({
            name: 'Cronograma Valorado',
            href: '/dashboard',
            isLast: pathname === '/dashboard',
        });
    }

    if (pathname.startsWith('/projects/')) {
        const projectId = parseInt(segments[1], 10);
        if (!isNaN(projectId)) {
            crumbs.push({
                name: getProjectName(projectId),
                href: `/projects/${projectId}`,
                isLast: true
            });
        }
    }
    
    if (pathname.startsWith('/settings')) {
        crumbs.push({
            name: translations['settings'],
            href: '/settings',
            isLast: true
        });
    }

    return crumbs;
  }

  const breadcrumbs = buildBreadcrumbs();


  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <li>
          <Link href="/" className="transition-colors hover:text-foreground">
            <Home className="h-4 w-4" />
            <span className="sr-only">Menú Principal</span>
          </Link>
        </li>
        {breadcrumbs.map((crumb, index) => (
          <li key={index} className="flex items-center gap-1.5">
            <ChevronRight className="h-4 w-4" />
            {crumb.isLast ? (
              <span className="font-medium text-foreground">{crumb.name}</span>
            ) : (
              <Link href={crumb.href} className="transition-colors hover:text-foreground">
                {crumb.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
