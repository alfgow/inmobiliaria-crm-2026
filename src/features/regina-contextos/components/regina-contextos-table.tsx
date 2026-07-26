"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  MessageCircle,
  Search,
} from "lucide-react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";

import { ChatHistorialModal } from "@/features/regina-contextos/components/chat-historial-modal";
import { DeleteReginaContextoButton } from "@/features/regina-contextos/components/delete-regina-contexto-button";

export type ReginaContextoRow = {
  wa_id: string;
  nombre: string | null;
  inmueble_id: number | null;
  status: string | null;
  rechazos_post: number | null;
  historial: unknown;
  updated_at: string | null;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Sin fecha";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusStyle(status: string | null) {
  const normalized = (status ?? "").trim().toLowerCase();

  if (!normalized) {
    return "border-border-soft bg-slate-100 text-slate-600";
  }
  if (normalized.includes("active") || normalized.includes("activo") || normalized.includes("open")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (normalized.includes("paused") || normalized.includes("pause") || normalized.includes("pend")) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (normalized.includes("error") || normalized.includes("fail")) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  return "border-border-soft bg-brand-surface text-brand-text/70";
}


type Props = {
  data: ReginaContextoRow[];
};

export function ReginaContextosTable({ data }: Props) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRow, setSelectedRow] = useState<ReginaContextoRow | null>(null);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "updated_at", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const statuses = useMemo(() => {
    const unique = new Set<string>();

    for (const row of data) {
      if (row.status?.trim()) {
        unique.add(row.status.trim());
      }
    }

    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [data]);

  const columns = useMemo<ColumnDef<ReginaContextoRow>[]>(
    () => [
      {
        accessorKey: "wa_id",
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="inline-flex items-center gap-2"
          >
            WA ID
            <ArrowUpDown className="size-3.5 text-brand-text/35" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="inline-flex max-w-full rounded-full border border-border-soft bg-surface-2 px-3 py-1 font-mono text-[11px] text-brand-text/70">
            {row.original.wa_id}
          </span>
        ),
      },
      {
        accessorKey: "nombre",
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="inline-flex items-center gap-2"
          >
            Nombre
            <ArrowUpDown className="size-3.5 text-brand-text/35" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-brand-text">
              {row.original.nombre ?? "Sin nombre"}
            </p>
            <p className="mt-1 text-xs text-brand-text/45">
              {row.original.inmueble_id ? `Inmueble #${row.original.inmueble_id}` : "Sin inmueble asociado"}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => (
          <span
            className={[
              "inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em]",
              statusStyle(row.original.status),
            ].join(" ")}
          >
            {row.original.status ?? "Sin estado"}
          </span>
        ),
      },
      {
        accessorKey: "rechazos_post",
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="inline-flex items-center gap-2"
          >
            Rechazos
            <ArrowUpDown className="size-3.5 text-brand-text/35" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-sm font-medium text-brand-text">
            {row.original.rechazos_post ?? 0}
          </span>
        ),
      },
      {
        accessorKey: "historial",
        header: "Historial",
        cell: ({ row }) => {
          const count = Array.isArray(row.original.historial)
            ? row.original.historial.length
            : 0;
          return (
            <span className="inline-flex items-center gap-1.5 text-sm text-brand-secondary/80">
              <MessageCircle className="size-3.5 shrink-0" />
              {count} msg{count !== 1 ? "s" : ""}
            </span>
          );
        },
      },
      {
        accessorKey: "updated_at",
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="inline-flex items-center gap-2"
          >
            Actualizado
            <ArrowUpDown className="size-3.5 text-brand-text/35" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-sm text-brand-text/60">
            {formatDate(row.original.updated_at)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Acciones",
        cell: ({ row }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <DeleteReginaContextoButton
              waId={row.original.wa_id}
              label="Eliminar"
            />
          </div>
        ),
      },
    ],
    [],
  );

  // TanStack Table returns methods that React Compiler cannot safely memoize.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
      sorting,
      columnFilters,
      pagination,
    },
    globalFilterFn: "includesString",
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const totalVisible = table.getFilteredRowModel().rows.length;
  const totalPages = table.getPageCount();

  return (
    <section className="rounded-[2rem] border border-border-soft/80 bg-white/90 p-4 shadow-[0_22px_55px_rgba(20,16,35,0.08)] backdrop-blur-sm sm:p-5 lg:p-6">
      <div className="flex flex-col gap-4 border-b border-border-soft pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-brand-text/45">
            Tabla de contextos
          </p>
          <h2 className="text-xl font-semibold tracking-tight text-brand-text">
            Contextos de Regina
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-brand-text/65">
            Busca por WA ID, nombre, estado o inmueble asociado. Ordena y elimina
            cada contexto de forma individual.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[1.4rem] border border-border-soft bg-surface-2 px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.28em] text-brand-text/40">
              Filtrados
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-brand-text">
              {totalVisible}
            </p>
          </div>
          <div className="rounded-[1.4rem] border border-border-soft bg-surface-2 px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.28em] text-brand-text/40">
              Página
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-brand-text">
              {pagination.pageIndex + 1}/{Math.max(totalPages, 1)}
            </p>
          </div>
          <div className="rounded-[1.4rem] border border-border-soft bg-surface-2 px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.28em] text-brand-text/40">
              Estados
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-brand-text">
              {statuses.length}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-brand-text/35" />
          <input
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            placeholder="Buscar por WA ID, nombre o estado"
            className="h-11 w-full rounded-full border border-border-soft bg-white pl-11 pr-4 text-sm text-brand-text outline-none transition placeholder:text-brand-text/35 focus:border-brand-secondary focus:ring-2 focus:ring-brand-secondary/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(event) => {
              const value = event.target.value;
              setStatusFilter(value);
              setColumnFilters((current) => {
                const next = current.filter((filter) => filter.id !== "status");
                if (value === "all") {
                  return next;
                }
                return [...next, { id: "status", value }];
              });
            }}
            className="h-11 rounded-full border border-border-soft bg-white px-4 text-sm text-brand-text outline-none transition focus:border-brand-secondary focus:ring-2 focus:ring-brand-secondary/20"
          >
            <option value="all">Todos los estados</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <select
            value={pagination.pageSize}
            onChange={(event) =>
              setPagination((current) => ({
                ...current,
                pageSize: Number(event.target.value),
                pageIndex: 0,
              }))
            }
            className="h-11 rounded-full border border-border-soft bg-white px-4 text-sm text-brand-text outline-none transition focus:border-brand-secondary focus:ring-2 focus:ring-brand-secondary/20"
          >
            {[10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size} por página
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-[1.6rem] border border-border-soft">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border-soft text-left">
            <thead className="bg-surface-2/70 text-[10px] uppercase tracking-[0.3em] text-brand-text/45">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-4 py-4 font-semibold">
                      {header.isPlaceholder ? null : (
                        <div
                          className={[
                            header.column.getCanSort()
                              ? "inline-flex cursor-pointer select-none items-center gap-2 text-brand-text/65 transition hover:text-brand-secondary"
                              : "text-brand-text/45",
                          ].join(" ")}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-border-soft bg-white">
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="cursor-pointer transition hover:bg-brand-secondary/5"
                    onClick={() => setSelectedRow(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-4 align-top">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-14 text-center">
                    <div className="mx-auto max-w-md space-y-2">
                      <p className="text-base font-medium text-brand-text/70">
                        No encontramos contextos con esos filtros.
                      </p>
                      <p className="text-sm leading-6 text-brand-text/45">
                        Prueba quitando el filtro de estado o busca por un WA ID más específico.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedRow && (
        <ChatHistorialModal
          row={selectedRow}
          onClose={() => setSelectedRow(null)}
        />
      )}

      <div className="mt-5 flex flex-col gap-4 border-t border-border-soft pt-4 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-sm text-brand-text/60">
          Mostrando {table.getRowModel().rows.length} de {data.length} contextos.
        </p>

        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="inline-flex size-10 items-center justify-center rounded-full border border-border-soft bg-white text-brand-text/70 transition hover:border-brand-secondary hover:text-brand-secondary disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronsLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="inline-flex size-10 items-center justify-center rounded-full border border-border-soft bg-white text-brand-text/70 transition hover:border-brand-secondary hover:text-brand-secondary disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronLeft className="size-4" />
          </button>

          <div className="flex min-w-12 items-center justify-center rounded-full bg-brand-secondary px-4 py-2 text-sm font-semibold text-white">
            {pagination.pageIndex + 1}
          </div>

          <button
            type="button"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="inline-flex size-10 items-center justify-center rounded-full border border-border-soft bg-white text-brand-text/70 transition hover:border-brand-secondary hover:text-brand-secondary disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronRight className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => table.setPageIndex(Math.max(totalPages - 1, 0))}
            disabled={!table.getCanNextPage()}
            className="inline-flex size-10 items-center justify-center rounded-full border border-border-soft bg-white text-brand-text/70 transition hover:border-brand-secondary hover:text-brand-secondary disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronsRight className="size-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
