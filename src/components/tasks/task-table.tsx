
"use client"

import * as React from "react"
import {
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  Trash2,
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
  RowSelectionState,
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
import { useIsMobile } from "@/hooks/use-mobile"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Checkbox } from "../ui/checkbox"
import { DeleteMultipleTasksDialog } from "./delete-multiple-tasks-dialog"
import { cn, formatCurrency } from "@/lib/utils"

const statusTranslations: Record<Task['status'], string> = {
    'pendiente': 'Pendiente',
    'en-progreso': 'En Progreso',
    'completado': 'Completado',
}

const adjustDateForTimezone = (date: Date | string): Date => {
    const d = new Date(date);
    // When a date string like "2025-06-02T00:00:00.000Z" is parsed,
    // new Date() converts it to the browser's local timezone.
    // If the timezone is west of UTC (e.g., in the Americas), the local date becomes June 1st.
    // getTimezoneOffset() returns the difference in minutes between UTC and local time.
    // For UTC-5, it's 300. We add this offset back to correct the date.
    const userTimezoneOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() + userTimezoneOffset);
};


const getColumns = (onSuccess: () => void): ColumnDef<Task>[] => [
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
    id: 'expander',
    header: () => null,
    cell: ({ row }) => {
      return (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            row.getToggleExpandedHandler()();
          }}
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
      
      if (status === 'completado') {
        badgeVariant = 'default';
      } else if (status === 'en-progreso') {
        badgeVariant = 'secondary';
      }

      return <Badge variant={badgeVariant}>{translatedStatus}</Badge>
    },
    filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
    }
  },
  {
    accessorKey: "quantity",
    header: () => <div className="text-right">Cant. Planificada</div>,
    cell: ({ row }) => {
      const quantity = parseFloat(row.getValue("quantity"))
      return <div className="text-right font-mono">{quantity.toLocaleString('es-ES')}</div>
    },
  },
  {
    accessorKey: "consumedQuantity",
    header: () => <div className="text-right">Cant. Consumida</div>,
    cell: ({ row }) => {
        const consumed = row.getValue("consumedQuantity") as number;
        return <div className="text-right font-mono">{consumed.toLocaleString('es-ES')}</div>;
    }
  },
  {
    id: "difference",
    header: () => <div className="text-right">Diferencia de Consumo</div>,
    cell: ({ row }) => {
        const difference = row.original.quantity - row.original.consumedQuantity;
        return <div className="text-right font-mono">{difference.toLocaleString('es-ES')}</div>;
    }
  },
  {
    accessorKey: "value",
    header: () => <div className="text-right">PVP</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("value"))
      return <div className="text-right font-mono">{formatCurrency(amount)}</div>
    },
  },
  {
    id: "subtotalValued",
    header: () => <div className="text-right">Subtotal Valorado</div>,
    cell: ({ row }) => {
        const subtotal = row.original.quantity * row.original.value;
        return <div className="text-right font-mono">{formatCurrency(subtotal)}</div>;
    }
  },
  {
    id: "subtotalActual",
    header: () => <div className="text-right">Subtotal Avance Real</div>,
    cell: ({ row }) => {
        const subtotal = row.original.consumedQuantity * row.original.value;
        return <div className="text-right font-mono">{formatCurrency(subtotal)}</div>;
    }
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
    id: "actions",
    header: () => <div className="text-right">Acciones</div>,
    cell: ({ row }) => <TaskActions task={row.original} />,
  },
]

const columnTranslations: Record<string, string> = {
    name: "Tarea",
    status: "Estado",
    quantity: "Cant. Planificada",
    consumedQuantity: "Cant. Consumida",
    difference: "Diferencia de Consumo",
    value: "PVP",
    subtotalValued: "Subtotal Valorado",
    subtotalActual: "Subtotal Avance Real",
    startDate: "Fecha Inicio",
    endDate: "Fecha Fin",
    expander: "Expandir",
    actions: "Acciones",
    select: "Seleccionar"
};

export function TaskTable({ data, onSuccess }: { data: Task[], onSuccess: () => void }) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  
  const isMobile = useIsMobile();
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    value: false,
    subtotalValued: false,
    subtotalActual: false,
  });
  
  React.useEffect(() => {
    if (isMobile) {
      setColumnVisibility({
        quantity: false,
        consumedQuantity: false,
        difference: false,
        value: false,
        subtotalValued: false,
        subtotalActual: false,
        startDate: false,
        endDate: false,
      });
    } else {
      // For desktop, set the default visibility here if it's different from the initial state
      // This will run once when the component mounts on the client
      setColumnVisibility({
        value: false,
        subtotalValued: false,
        subtotalActual: false,
      });
    }
  }, [isMobile]);

  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [expanded, setExpanded] = React.useState({})

  const columns = React.useMemo(() => getColumns(onSuccess), [onSuccess]);

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
    enableRowSelection: true,
    getRowCanExpand: () => true,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      expanded,
    },
  })

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const selectedTasks = table.getFilteredSelectedRowModel().rows.map(row => row.original);

  return (
    <div className="w-full">
      {selectedTasks.length > 0 && (
          <>
              <DeleteMultipleTasksDialog
                  tasks={selectedTasks}
                  open={isDeleteDialogOpen}
                  onOpenChange={setIsDeleteDialogOpen}
                  onSuccess={() => {
                    setRowSelection({});
                    onSuccess();
                  }}
              />
              <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="text-sm text-muted-foreground">
                      {`${selectedTasks.length} de ${table.getCoreRowModel().rows.length} fila(s) seleccionadas.`}
                  </div>
                  <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar Seleccionadas ({selectedTasks.length})
                  </Button>
              </div>
          </>
      )}
      <div className={cn("flex flex-col sm:flex-row items-center gap-4", selectedTasks.length === 0 && "py-4")}>
        <Input
          placeholder="Filtrar por nombre..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="w-full sm:max-w-sm"
        />
        <Select
            value={(table.getColumn("status")?.getFilterValue() as string) ?? "all"}
            onValueChange={(value) =>
                table.getColumn("status")?.setFilterValue(value === "all" ? undefined : value)
            }
        >
            <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Todos los Estados</SelectItem>
                {Object.entries(statusTranslations).map(([status, translation]) => (
                    <SelectItem key={status} value={status}>{translation}</SelectItem>
                ))}
            </SelectContent>
        </Select>
        <div className="flex-1" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto">
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
                    onClick={() => row.toggleSelected(!row.getIsSelected())}
                    className="cursor-pointer"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} onClick={(e) => {
                          if (cell.column.id === 'expander') {
                            e.stopPropagation();
                            row.getToggleExpandedHandler()();
                          } else if (cell.column.id !== 'select') {
                              // Allow row selection by clicking on cells
                          } else {
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
                  {row.getIsExpanded() && (
                     <TableRow>
                        <TableCell colSpan={row.getVisibleCells().length}>
                           <DailyConsumptionTracker task={row.original} onSuccess={onSuccess} />
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
