
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ChevronRight } from 'lucide-react';
import type { Project } from '@/lib/types';

interface BreadcrumbProps {
  projects: Project[];
}

const translations: Record<string, string> = {
  projects: 'Proyectos',
};

export function Breadcrumb({ projects }: BreadcrumbProps) {
  const pathname = usePathname();
  
  if (pathname === '/' || pathname === '/dashboard') {
    return null;
  }

  const segments = pathname.split('/').filter(Boolean);

  const getProjectName = (id: string): string => {
    const project = projects.find((p) => p.id === id);
    return project?.name || id;
  };

  const breadcrumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const isLast = index === segments.length - 1;
    
    let name = segment;
    if (segments[0] === 'projects' && index === 0) {
      name = translations['projects'] || 'Proyectos';
    } else if (segments[0] === 'projects' && index === 1) {
      name = getProjectName(segment);
    } else {
      name = translations[segment] || (segment.charAt(0).toUpperCase() + segment.slice(1));
    }

    return { name, href, isLast };
  });

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <li>
          <Link href="/" className="transition-colors hover:text-foreground">
            <Home className="h-4 w-4" />
            <span className="sr-only">Menú Principal</span>
          </Link>
        </li>
        {breadcrumbs.map((crumb) => (
          <li key={crumb.href} className="flex items-center gap-1.5">
            <ChevronRight className="h-4 w-4" />
            {crumb.isLast || crumb.href === '/projects' ? (
              <span className={crumb.isLast ? "font-medium text-foreground" : ""}>{crumb.name}</span>
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
