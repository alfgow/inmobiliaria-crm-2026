import { prisma } from "@/lib/prisma";
import { Prisma } from "../../../../app/generated/prisma/client";
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

  return rows.map((r) => ({
    id: r.id.toString(),
    titulo: r.titulo,
    precio: Number(r.precio),
    direccion: r.direccion,
    colonia: r.colonia,
    municipio: r.municipio,
    tipo: r.tipo,
    operacion: r.operacion,
    estatus: r.estatus_nombre,
    available: r.estatus_nombre.toLowerCase().includes("disponible"),
    lat: Number(r.latitud),
    lng: Number(r.longitud),
  }));
}
