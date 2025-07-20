
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ChevronRight } from 'lucide-react';
import type { Project } from '@/lib/types';
import { useDashboard } from '@/hooks/use-dashboard-context';

interface BreadcrumbProps {
  // La prop projects ya no es necesaria
}

const translations: Record<string, string> = {
  dashboard: 'Panel Principal',
  projects: 'Proyectos',
  'projects-overview': 'Proyectos',
  settings: 'Configuración',
};

export function Breadcrumb({}: BreadcrumbProps) {
  const pathname = usePathname();
  const { allProjects: projects } = useDashboard();
  
  if (pathname === '/' || pathname === '/login') {
    return null;
  }

  const segments = pathname.split('/').filter(Boolean);

  const getProjectName = (id: number): string => {
    const project = projects.find((p) => p.id === id);
    return project?.name || String(id);
  };
  
  const buildBreadcrumbs = () => {
    let path = '';
    const crumbs = segments.map((segment, index) => {
        path += `/${segment}`;
        const isLast = index === segments.length - 1;
        
        let name = translations[segment] || segment;
        let href = path;

        // Caso especial para la vista general de proyectos
        if (segment === 'projects-overview') {
          return { name, href: path, isLast };
        }
        
        // Si estamos en un proyecto específico, el breadcrumb de "Proyectos" debe apuntar a la vista general.
        if (segment === 'projects' && segments[index + 1]) {
            const projectId = parseInt(segments[index + 1], 10);
            if (!isNaN(projectId)) {
              return {
                  name: name,
                  href: '/dashboard/projects-overview', // Enlace a la vista general
                  isLast: false,
              };
            }
        }
        
        // Si el segmento es un ID de proyecto
        if (!isNaN(parseInt(segment)) && segments[index - 1] === 'projects') {
             return {
                name: getProjectName(parseInt(segment, 10)),
                href: path,
                isLast: isLast,
            };
        }
        
        return { name, href, isLast };
    });

    // Eliminar el segmento 'dashboard' si no es la única miga de pan.
    const finalCrumbs = crumbs.filter((crumb) => {
        if (crumb.name.toLowerCase() === 'panel principal' && crumbs.length > 1) {
            return false;
        }
        return true;
    });

    return finalCrumbs;
  }

  const breadcrumbs = buildBreadcrumbs();

  return (
    <nav aria-label="Breadcrumb" className=''>
      <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <li>
          <Link href="/dashboard" className="transition-colors hover:text-foreground">
            <Home className="h-4 w-4" />
            <span className="sr-only">Panel Principal</span>
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
