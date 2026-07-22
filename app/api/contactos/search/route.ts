import { NextResponse } from "next/server";

import { isDatabaseUnavailableError } from "@/lib/prisma-error";
import type { ContactStatus } from "@/features/contacts/types/contact-status";
import { searchContactsWithCount } from "@/features/contacts/services/contact-api.service";

export const dynamic = "force-dynamic";

type SearchResult = {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string;
  estado: ContactStatus;
  fuente: string | null;
  createdAt: string | null;
};

function normalizeContact(contact: {
  id: bigint;
  nombre: string;
  email: string | null;
  telefono: string;
  estado: ContactStatus;
  fuente: string | null;
  created_at: Date | null;
}): SearchResult {
  return {
    id: contact.id.toString(),
    nombre: contact.nombre,
    email: contact.email,
    telefono: contact.telefono,
    estado: contact.estado,
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
    const { contacts } = await searchContactsWithCount({
      query: rawQuery,
      limit: 5,
      offset: 0,
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
