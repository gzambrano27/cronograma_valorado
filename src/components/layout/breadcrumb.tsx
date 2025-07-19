
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ChevronRight } from 'lucide-react';
import type { Project } from '@/lib/types';
import { useDashboard } from '@/hooks/use-dashboard-context';

interface BreadcrumbProps {
  // projects prop is no longer needed
}

const translations: Record<string, string> = {
  dashboard: 'Panel Principal',
  projects: 'Proyectos',
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
        
        if (segment === 'dashboard' && segments.length === 1) {
             return {
                name: translations[segment] || segment,
                href: path,
                isLast: true,
            };
        }

        if (segment === 'projects' && segments[index + 1]) {
            const projectId = parseInt(segments[index + 1], 10);
            return {
                name: translations[segment] || segment,
                href: '/dashboard', // Projects level should link back to dashboard overview for now
                isLast: false,
            };
        }
        
        if (!isNaN(parseInt(segment)) && segments[index - 1] === 'projects') {
             return {
                name: getProjectName(parseInt(segment, 10)),
                href: path,
                isLast: isLast,
            };
        }
        
        return {
            name: translations[segment] || segment,
            href: path,
            isLast: isLast,
        };
    });

    // Remove the 'dashboard' segment if it's not the only one
    const finalCrumbs = crumbs.filter((crumb, index) => {
        if (crumb.name.toLowerCase() === 'dashboard' && crumbs.length > 1) {
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
