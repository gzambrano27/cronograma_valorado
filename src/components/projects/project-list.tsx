
'use client';

import * as React from "react";
import type { Project } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Building2, User } from "lucide-react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/use-session";


interface ProjectListProps {
  projects: Project[];
  view: "grid" | "list";
  onSuccess: () => void;
}

const getColumns = (isManager: boolean): ColumnDef<Project>[] => {
  const columns: ColumnDef<Project>[] = [
      {
          accessorKey: "name",
          header: "Proyecto",
          cell: ({ row }) => (
              <div>
                  <span className="font-medium hover:underline line-clamp-2">{row.original.name}</span>
                  <div className="flex items-center text-sm text-muted-foreground gap-1.5 mt-1">
                    <Building2 className="h-4 w-4 flex-shrink-0" />
                    <p className="line-clamp-1">{row.original.company}</p>
                  </div>
              </div>
          )
      },
      {
          accessorKey: "client",
          header: "Cliente",
          cell: ({ row }) => {
            const client = row.original.client;
            return (
              <div className="flex items-center text-sm text-muted-foreground gap-1.5">
                {client ? (
                  <>
                    <User className="h-4 w-4 flex-shrink-0" />
                    <p className="line-clamp-1">{client}</p>
                  </>
                ) : (
                  <span className="text-muted-foreground/60">-</span>
                )}
              </div>
            );
          },
      },
      {
          accessorKey: "progress",
          header: "Progreso",
          cell: ({ row }) => {
              const project = row.original;
              const progress = project.progress;
              return (
                  <div className="flex flex-col gap-1.5 w-32 sm:w-40">
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>{project.completedTasks} / {project.taskCount} tareas</span>
                          <span>{`${progress.toFixed(2)}%`}</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                  </div>
              )
          }
      },
  ];

  if (isManager) {
      columns.push(
          {
              accessorKey: "consumedValue",
              header: () => <div className="text-right hidden sm:table-cell">Valor Consumido</div>,
              cell: ({ row }) => (
                  <div className="text-right font-mono hidden sm:table-cell">
                      {formatCurrency(row.original.consumedValue)}
                  </div>
              )
          },
          {
              accessorKey: "totalValue",
              header: () => <div className="text-right hidden sm:table-cell">Valor Total</div>,
              cell: ({ row }) => (
                  <div className="text-right font-mono hidden sm:table-cell">
                      {formatCurrency(row.original.totalValue)}
                  </div>
              )
          }
      );
  }

  return columns;
};

export default function ProjectList({ projects, view, onSuccess }: ProjectListProps) {
    const router = useRouter();
    const { session } = useSession();
    const isManager = session.user?.isManager ?? false;
    
    const columns = React.useMemo(() => getColumns(isManager), [isManager]);

    const table = useReactTable({
        data: projects,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

  if (projects.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-64 text-center rounded-lg border-2 border-dashed">
            <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold">No se encontraron proyectos</h3>
            <p className="text-muted-foreground mt-1">Intenta seleccionar otras compañías o ajustar los filtros.</p>
        </div>
    )
  }

  if (view === "grid") {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => {
          const progressPercentage = project.progress;
          return (
            <Link href={`/dashboard/projects/${project.id}`} key={project.id} className="focus:outline-none focus:ring-2 focus:ring-ring rounded-lg">
              <Card className="flex flex-col transition-all duration-300 group hover:shadow-xl border h-full">
                <CardHeader className="p-4 pb-2 relative">
                    <CardTitle className="font-headline mb-1 group-hover:text-primary transition-colors text-lg line-clamp-2 h-14">{project.name}</CardTitle>
                    <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 flex-shrink-0" />
                        <p className="truncate">{project.company}</p>
                      </div>
                      {project.client && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 flex-shrink-0" />
                          <p className="truncate">{project.client}</p>
                        </div>
                      )}
                    </div>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col p-4 pt-4">
                  <div className="mt-auto space-y-3">
                     <div>
                        <div className="flex justify-between items-center mb-1 text-sm text-muted-foreground">
                            <span>Progreso</span>
                            <span>{`${progressPercentage.toFixed(2)}%`}</span>
                        </div>
                        <Progress value={progressPercentage} className="h-2" />
                        <div className="text-right text-xs text-muted-foreground mt-1">
                            {project.completedTasks} / {project.taskCount} tareas
                        </div>
                     </div>
                  </div>
                </CardContent>

                {isManager && (
                  <CardFooter className="flex flex-col gap-2 bg-muted/40 p-4 border-t">
                    <div className="flex justify-between items-baseline w-full">
                      <p className="text-xs text-muted-foreground">Valor Consumido</p>
                      <p className="font-bold text-base">{formatCurrency(project.consumedValue, 2)}</p>
                    </div>
                    <div className="flex justify-between items-baseline w-full">
                      <p className="text-xs text-muted-foreground">Valor Total</p>
                      <p className="font-bold text-base">{formatCurrency(project.totalValue, 2)}</p>
                    </div>
                  </CardFooter>
                )}
              </Card>
            </Link>
          )
        })}
      </div>
    );
  }

  // List View
  return (
    <div className="w-full">
        <Card>
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      onClick={() => router.push(`/dashboard/projects/${row.original.id}`)}
                      className="cursor-pointer"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No se encontraron proyectos.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
        </Card>
    </div>
  );
}
