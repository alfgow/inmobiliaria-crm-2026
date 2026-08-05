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
import { ArrowUpDown, Edit3, Search, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";

import { getUserRoleLabel, userRoleBadgeClass } from "@/features/users/types/user-role";

export type UserListItem = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  isSelf: boolean;
  createdAt: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" }).format(new Date(value));
}

function initials(name: string) {
  return (
    name
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "?"
  );
}

export function UserTable({ users }: { users: UserListItem[] }) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const filteredUsers = useMemo(
    () => (roleFilter ? users.filter((user) => user.role === roleFilter) : users),
    [users, roleFilter],
  );

  const columns = useMemo<ColumnDef<UserListItem>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="inline-flex items-center gap-2 text-left"
          >
            Usuario
            <ArrowUpDown className="size-3.5" />
          </button>
        ),
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="flex min-w-[220px] items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-secondary text-xs font-bold text-white">
                {initials(user.name)}
              </div>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-neutral-900">
                  {user.name}
                  {user.isSelf ? <span className="text-xs font-normal text-neutral-400">(tu)</span> : null}
                </p>
                <p className="truncate text-xs text-neutral-500">{user.email}</p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "role",
        header: "Rol",
        cell: ({ row }) => (
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${userRoleBadgeClass(row.original.role)}`}
          >
            {getUserRoleLabel(row.original.role)}
          </span>
        ),
      },
      {
        accessorKey: "isActive",
        header: "Estado",
        cell: ({ row }) => (
          <span
            className={[
              "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold",
              row.original.isActive
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700",
            ].join(" ")}
          >
            {row.original.isActive ? "Activo" : "Inactivo"}
          </span>
        ),
      },
      {
        accessorFn: (row) => row.createdAt ?? "",
        id: "created",
        header: "Creado",
        cell: ({ row }) => <span className="text-sm text-neutral-500">{formatDate(row.original.createdAt)}</span>,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Link
            href={`/usuarios/${row.original.id}/editar`}
            className="inline-flex items-center gap-2 rounded-xl border border-border-soft bg-white px-3 py-2 text-xs font-semibold text-neutral-900 transition hover:border-brand-secondary hover:text-brand-secondary"
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
    data: filteredUsers,
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
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
          <input
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            placeholder="Buscar por nombre o correo"
            className="w-full rounded-xl border border-border-soft bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-brand-secondary"
          />
        </div>

        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-neutral-400" />
          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="rounded-xl border border-border-soft bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand-secondary"
          >
            <option value="">Todos los roles</option>
            <option value="admin">Administrador</option>
            <option value="user">Usuario</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-separate border-spacing-0 text-left">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="border-b border-border-soft px-3 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400"
                  >
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
        <div className="py-12 text-center text-sm text-neutral-400">No hay usuarios para los filtros actuales.</div>
      )}

      <div className="mt-4 flex flex-col gap-3 border-t border-border-soft pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-neutral-400">
          {table.getFilteredRowModel().rows.length} resultado{table.getFilteredRowModel().rows.length === 1 ? "" : "s"}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded-xl border border-border-soft bg-white px-3 py-2 text-xs font-semibold text-neutral-900 disabled:opacity-40"
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded-xl border border-border-soft bg-white px-3 py-2 text-xs font-semibold text-neutral-900 disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      </div>
    </section>
  );
}
