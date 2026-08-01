"use client";

import Link from "next/link";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, Edit3, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { blogStatusBadgeClass, getBlogStatusLabel } from "@/features/blog/types/blog-status";

export type BlogListItem = {
  id: string;
  slug: string;
  titulo: string;
  excerpt: string | null;
  status: string;
  imagenes: { url: string; alt: string | null }[];
  fechas: {
    creado: string | null;
    actualizado: string | null;
    publicado: string | null;
  };
};

function formatDate(value: string | null) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" }).format(new Date(value));
}

export function BlogTable({ blogs }: { blogs: BlogListItem[] }) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filteredBlogs = useMemo(
    () => (statusFilter ? blogs.filter((blog) => blog.status === statusFilter) : blogs),
    [blogs, statusFilter],
  );

  const columns = useMemo<ColumnDef<BlogListItem>[]>(
    () => [
      {
        accessorKey: "titulo",
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="inline-flex items-center gap-2 text-left"
          >
            Titulo
            <ArrowUpDown className="size-3.5" />
          </button>
        ),
        cell: ({ row }) => {
          const blog = row.original;
          return (
            <div className="flex min-w-[260px] items-center gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border-soft bg-brand-surface">
                {blog.imagenes[0]?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={blog.imagenes[0].url} alt={blog.imagenes[0].alt ?? blog.titulo} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs font-semibold text-brand-text/35">SEO</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-brand-text">{blog.titulo}</p>
                <p className="truncate text-xs text-brand-text/45">{blog.excerpt ?? blog.slug}</p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => (
          <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${blogStatusBadgeClass(row.original.status)}`}>
            {getBlogStatusLabel(row.original.status)}
          </span>
        ),
      },
      {
        accessorFn: (row) => row.fechas.publicado ?? "",
        id: "published",
        header: "Publicado",
        cell: ({ row }) => <span className="text-sm text-brand-text/60">{formatDate(row.original.fechas.publicado)}</span>,
      },
      {
        accessorFn: (row) => row.fechas.actualizado ?? row.fechas.creado ?? "",
        id: "updated",
        header: "Actualizado",
        cell: ({ row }) => <span className="text-sm text-brand-text/60">{formatDate(row.original.fechas.actualizado ?? row.original.fechas.creado)}</span>,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Link
            href={`/blog/${row.original.slug}/editar`}
            className="inline-flex items-center gap-2 rounded-xl border border-border-soft bg-white px-3 py-2 text-xs font-semibold text-brand-text transition hover:border-brand-secondary hover:text-brand-secondary"
          >
            <Edit3 className="size-3.5" />
            Editar
          </Link>
        ),
      },
    ],
    [],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredBlogs,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <section className="rounded-[1.75rem] border border-border-soft/80 bg-white/90 p-4 shadow-[0_20px_55px_rgba(20,16,35,0.07)] backdrop-blur-sm sm:p-5">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-brand-text/35" />
          <input
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            placeholder="Buscar blogs"
            className="w-full rounded-xl border border-border-soft bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-brand-secondary"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-xl border border-border-soft bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand-secondary"
        >
          <option value="">Todos los estados</option>
          <option value="borrador">Borrador</option>
          <option value="publicado">Publicado</option>
          <option value="programado">Programado</option>
          <option value="archivado">Archivado</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="border-b border-border-soft px-3 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-brand-text/40">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="group">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="border-b border-border-soft/70 px-3 py-4 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {table.getRowModel().rows.length === 0 && (
        <div className="py-12 text-center text-sm text-brand-text/45">No hay blogs para los filtros actuales.</div>
      )}

      <div className="mt-4 flex flex-col gap-3 border-t border-border-soft pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-brand-text/45">
          {table.getFilteredRowModel().rows.length} resultado{table.getFilteredRowModel().rows.length === 1 ? "" : "s"}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded-xl border border-border-soft bg-white px-3 py-2 text-xs font-semibold text-brand-text disabled:opacity-40"
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded-xl border border-border-soft bg-white px-3 py-2 text-xs font-semibold text-brand-text disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      </div>
    </section>
  );
}
