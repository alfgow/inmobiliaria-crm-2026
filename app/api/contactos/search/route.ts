import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { isDatabaseUnavailableError } from "@/lib/prisma-error";

export const dynamic = "force-dynamic";

type SearchResult = {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string;
  fuente: string | null;
  createdAt: string | null;
};

function normalizeContact(contact: {
  id: bigint;
  nombre: string;
  email: string | null;
  telefono: string;
  fuente: string | null;
  created_at: Date | null;
}): SearchResult {
  return {
    id: contact.id.toString(),
    nombre: contact.nombre,
    email: contact.email,
    telefono: contact.telefono,
    fuente: contact.fuente,
    createdAt: contact.created_at?.toISOString() ?? null,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get("q")?.trim() ?? "";

  if (!rawQuery) {
    return NextResponse.json(
      { message: "Se requiere un criterio de búsqueda." },
      { status: 400 },
    );
  }

  try {
    const contacts = await prisma.contactos.findMany({
      where: {
        OR: [
          {
            nombre: {
              contains: rawQuery,
              mode: "insensitive",
            },
          },
          {
            email: {
              contains: rawQuery,
              mode: "insensitive",
            },
          },
          {
            telefono: {
              contains: rawQuery,
              mode: "insensitive",
            },
          },
        ],
      },
      orderBy: {
        created_at: "desc",
      },
      take: 5,
    });

    return NextResponse.json({
      results: contacts.map(normalizeContact),
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json(
        {
          message:
            "La base de datos no está disponible. Verifica PostgreSQL y DATABASE_URL.",
          results: [],
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        message: "No fue posible completar la búsqueda de contactos.",
        results: [],
      },
      { status: 500 },
    );
  }
}
