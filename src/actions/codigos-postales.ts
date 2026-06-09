"use server";

import { prisma } from "@/lib/prisma";

export type ColoniaRow = {
  colonia: string;
  municipio: string;
  estado: string;
  cp: string;
};

export async function searchByColonia(query: string): Promise<ColoniaRow[]> {
  if (query.length < 3) return [];
  const rows = await prisma.codigos_postales.findMany({
    where: { d_asenta: { startsWith: query, mode: "insensitive" } },
    select: { d_asenta: true, d_mnpio: true, d_estado: true, d_codigo: true },
    take: 10,
    orderBy: { d_asenta: "asc" },
  });
  return rows.map((r) => ({
    colonia: r.d_asenta,
    municipio: r.d_mnpio ?? "",
    estado: r.d_estado ?? "",
    cp: r.d_codigo,
  }));
}

export async function searchByCp(cp: string): Promise<ColoniaRow[]> {
  if (cp.length !== 5) return [];
  const rows = await prisma.codigos_postales.findMany({
    where: { d_codigo: cp },
    select: { d_asenta: true, d_mnpio: true, d_estado: true, d_codigo: true },
    orderBy: { d_asenta: "asc" },
  });
  return rows.map((r) => ({
    colonia: r.d_asenta,
    municipio: r.d_mnpio ?? "",
    estado: r.d_estado ?? "",
    cp: r.d_codigo,
  }));
}
