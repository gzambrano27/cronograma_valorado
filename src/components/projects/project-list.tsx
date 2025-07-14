'use client';

import * as React from "react";
import type { Project } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { ProjectActions } from "./project-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DeleteMultipleProjectsDialog } from "./delete-multiple-projects-dialog";
import { Building2, Trash2, User } from "lucide-react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  RowSelectionState
} from "@tanstack/react-table";
import { formatCurrency } from "@/lib/utils";

interface ProjectListProps {
  projects: Project[];
  view: "grid" | "list";
  onSuccess: () => void;
}

export default function ProjectList({ projects, view, onSuccess }: ProjectListProps) {
    const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

    const columns: ColumnDef<Project>[] = [
        {
            id: "select",
            header: ({ table }) => (
              <Checkbox
                checked={
                  table.getIsAllPageRowsSelected() ||
                  (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Seleccionar todo"
                className="translate-y-[2px]"
              />
            ),
            cell: ({ row }) => (
              <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                onClick={(e) => e.stopPropagation()}
                aria-label="Seleccionar fila"
                className="translate-y-[2px]"
              />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "name",
            header: "Proyecto",
            cell: ({ row }) => (
                <div>
                    <Link href={`/projects/${row.original.id}`} className="font-medium hover:underline line-clamp-2">{row.original.name}</Link>
                    <div className="flex items-center text-sm text-muted-foreground gap-1.5 mt-1">
                      <Building2 className="h-4 w-4 flex-shrink-0" />
                      <p className="line-clamp-1">{row.original.company}</p>
                    </div>
                     {row.original.client && (
                        <div className="flex items-center text-sm text-muted-foreground gap-1.5 mt-1">
                            <User className="h-4 w-4 flex-shrink-0" />
                            <p className="line-clamp-1">{row.original.client}</p>
                        </div>
                     )}
                </div>
            )
        },
        {
            header: "Progreso",
            cell: ({ row }) => {
                const project = row.original;
                const progress = project.taskCount > 0 ? (project.completedTasks / project.taskCount) * 100 : 0;
                return (
                    <div className="flex flex-col gap-1.5 w-32 sm:w-40">
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                            <span>{project.completedTasks} / {project.taskCount} tareas</span>
                            <span>{`${Math.round(progress)}%`}</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>
                )
            }
        },
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
                    {formatCurrency(row.original.totalValue, 0)}
                </div>
            )
        },
        {
            id: "actions",
            cell: ({ row }) => (
              <div className="flex justify-end">
                <ProjectActions project={row.original} />
              </div>
            ),
        }
    ];

    const table = useReactTable({
        data: projects,
        columns,
        state: {
            rowSelection,
        },
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
    });

    const selectedProjects = table.getFilteredSelectedRowModel().rows.map(row => row.original);
  
  if (view === "grid") {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Card key={project.id} className="flex flex-col overflow-hidden transition-all duration-300 group hover:shadow-xl border">
            <CardHeader className="p-4 relative">
                 <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ProjectActions project={project} />
                </div>
                <Link href={`/projects/${project.id}`} className="focus:outline-none focus:underline">
                    <CardTitle className="font-headline mb-1 group-hover:text-primary transition-colors text-lg line-clamp-2 h-14">{project.name}</CardTitle>
                </Link>
                <div className="flex items-center text-sm text-muted-foreground gap-2">
                    <Building2 className="h-4 w-4 flex-shrink-0" />
                    <p className="truncate">{project.company}</p>
                </div>
                {project.client && (
                    <div className="flex items-center text-sm text-muted-foreground gap-2">
                        <User className="h-4 w-4 flex-shrink-0" />
                        <p className="truncate">{project.client}</p>
                    </div>
                )}
            </CardHeader>

            <CardContent className="flex flex-1 flex-col p-4 pt-0">
              <div className="mt-auto space-y-3">
                 <div>
                    <div className="flex justify-between items-center mb-1 text-sm text-muted-foreground">
                        <span>Progreso</span>
                        <span>{`${Math.round(project.taskCount > 0 ? (project.completedTasks / project.taskCount) * 100 : 0)}%`}</span>
                    </div>
                    <Progress value={project.taskCount > 0 ? (project.completedTasks / project.taskCount) * 100 : 0} className="h-2" />
                    <div className="text-right text-xs text-muted-foreground mt-1">
                        {project.completedTasks} / {project.taskCount} tareas
                    </div>
                 </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-2 bg-muted/40 p-4 border-t">
              <div className="flex justify-between items-baseline w-full">
                <p className="text-xs text-muted-foreground">Valor Consumido</p>
                <p className="font-bold text-base">{formatCurrency(project.consumedValue)}</p>
              </div>
              <div className="flex justify-between items-baseline w-full">
                <p className="text-xs text-muted-foreground">Valor Total</p>
                <p className="font-bold text-base">{formatCurrency(project.totalValue, 0)}</p>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  // List View
  return (
    <div className="w-full">
        {selectedProjects.length > 0 && (
             <>
                <DeleteMultipleProjectsDialog
                    projects={selectedProjects}
                    open={isDeleteDialogOpen}
                    onOpenChange={setIsDeleteDialogOpen}
                    onSuccess={() => {
                        setRowSelection({});
                        onSuccess();
                    }}
                />
                <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="text-sm text-muted-foreground">
                        {`${selectedProjects.length} de ${table.getCoreRowModel().rows.length} fila(s) seleccionadas.`}
                    </div>
                    <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar Seleccionados ({selectedProjects.length})
                    </Button>
                </div>
            </>
        )}
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
                      data-state={row.getIsSelected() && "selected"}
                      onClick={() => row.toggleSelected(!row.getIsSelected())}
                      className="cursor-pointer"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} onClick={(e) => {
                            if (cell.column.id !== 'select') {
                                e.stopPropagation();
                            }
                        }}>
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
