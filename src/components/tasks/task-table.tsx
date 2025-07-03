"use client"

import * as React from "react"
import {
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { format } from "date-fns"
import { es } from "date-fns/locale"


import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { Task } from "@/lib/types"
import { DailyConsumptionTracker } from "./daily-consumption-tracker"
import { TaskActions } from "./task-actions"

const statusTranslations: Record<Task['status'], string> = {
    'pendiente': 'Pendiente',
    'en-progreso': 'En Progreso',
    'completado': 'Completado',
}

const adjustDateForTimezone = (date: Date | string): Date => {
    const d = new Date(date);
    const userTimezoneOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() + userTimezoneOffset);
};

const columns: ColumnDef<Task>[] = [
  {
    id: 'expander',
    header: () => null,
    cell: ({ row }) => {
      return (
        <Button
          variant="ghost"
          size="icon"
          onClick={row.getToggleExpandedHandler()}
          className="w-8 p-0 data-[state=open]:bg-muted"
        >
          {row.getIsExpanded() ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      )
    },
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Tarea
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="capitalize font-medium">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      const status = row.getValue("status") as Task['status'];
      const translatedStatus = statusTranslations[status] || status;

      let badgeVariant: "default" | "secondary" | "outline" = "outline";
      let className = "";

      if (status === 'completado') {
        badgeVariant = 'default';
        className = 'bg-green-500 hover:bg-green-600 text-white';
      } else if (status === 'en-progreso') {
        badgeVariant = 'secondary';
        className = 'bg-yellow-500 hover:bg-yellow-600 text-white';
      }

      return <Badge variant={badgeVariant} className={className}>{translatedStatus}</Badge>
    },
  },
  {
    accessorKey: "quantity",
    header: () => <div className="text-right">Cantidad Total</div>,
    cell: ({ row }) => {
      const quantity = parseFloat(row.getValue("quantity"))
      return <div className="text-right font-mono">{quantity.toLocaleString('es-ES')}</div>
    },
  },
  {
    accessorKey: "value",
    header: () => <div className="text-right">Valor</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("value"))
      const formatted = new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: "USD",
      }).format(amount)

      return <div className="text-right font-mono">{formatted}</div>
    },
  },
  {
    accessorKey: "startDate",
    header: "Fecha Inicio",
    cell: ({ row }) => {
      const date = adjustDateForTimezone(row.getValue("startDate"));
      return format(date, "dd/MM/yyyy", { locale: es });
    },
  },
    {
    accessorKey: "endDate",
    header: "Fecha Fin",
    cell: ({ row }) => {
      const date = adjustDateForTimezone(row.getValue("endDate"));
      return format(date, "dd/MM/yyyy", { locale: es });
    },
  },
  {
    accessorKey: "location",
    header: "Ubicación",
    cell: ({ row }) => {
      const location = row.getValue("location") as string | undefined;
      return location ? <div className="font-mono text-xs">{location}</div> : <div className="text-muted-foreground italic text-xs">Sin ubicación</div>;
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Acciones</div>,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <TaskActions task={row.original} />
      </div>
    ),
  },
]

const columnTranslations: Record<string, string> = {
    name: "Tarea",
    status: "Estado",
    quantity: "Cantidad Total",
    value: "Valor",
    startDate: "Fecha Inicio",
    endDate: "Fecha Fin",
    location: "Ubicación",
    expander: "Expandir",
    actions: "Acciones"
};

export function TaskTable({ data }: { data: Task[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [expanded, setExpanded] = React.useState({})

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getExpandedRowModel: getExpandedRowModel(),
    onExpandedChange: setExpanded,
    getRowCanExpand: () => true,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      expanded,
    },
  })

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filtrar tareas..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columnas <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {columnTranslations[column.id] || column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} style={{ width: header.getSize() !== 150 ? undefined : header.getSize() }}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.id}>
                  <TableRow
                    data-state={row.getIsSelected() && "selected"}
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
                  {row.getIsExpanded() && (
                     <TableRow>
                        <TableCell colSpan={row.getVisibleCells().length}>
                           <DailyConsumptionTracker task={row.original} />
                        </TableCell>
                     </TableRow>
                  )}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No hay resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Siguiente
        </Button>
      </div>
    </div>
  )
}