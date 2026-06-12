import { Prisma } from "../../../../app/generated/prisma/client";

import { prisma } from "@/lib/prisma";

import type { MapProperty } from "../types/map";

type RawRow = {
  id: bigint;
  titulo: string;
  precio: string;
  direccion: string;
  colonia: string | null;
  municipio: string | null;
  tipo: string;
  operacion: string;
  latitud: string;
  longitud: string;
  estatus_nombre: string;
};

function parseCoordinate(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function getMapProperties(): Promise<MapProperty[]> {
  const rows = await prisma.$queryRaw<RawRow[]>(Prisma.sql`
    SELECT
      i.id,
      i.titulo,
      i.precio,
      i.direccion,
      i.colonia,
      i.municipio,
      i.tipo::text,
      i.operacion::text,
      i.latitud,
      i.longitud,
      e.nombre AS estatus_nombre
    FROM inmuebles i
    JOIN inmueble_estatus e ON e.id = i.estatus_id
    WHERE i.latitud IS NOT NULL
      AND i.longitud IS NOT NULL
    ORDER BY i.created_at DESC
  `);

  return rows.flatMap((row) => {
    const lat = parseCoordinate(row.latitud);
    const lng = parseCoordinate(row.longitud);

    if (lat === null || lng === null) {
      return [];
    }

    return [
      {
        id: row.id.toString(),
        titulo: row.titulo,
        precio: Number(row.precio),
        direccion: row.direccion,
        colonia: row.colonia,
        municipio: row.municipio,
        tipo: row.tipo,
        operacion: row.operacion,
        estatus: row.estatus_nombre,
        available: row.estatus_nombre.toLowerCase().includes("disponible"),
        lat,
        lng,
      },
    ];
  });
}
