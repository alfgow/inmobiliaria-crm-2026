import { NextRequest, NextResponse } from "next/server";

import {
  getApiKeyFromHeaders,
  getRequestIp,
  hashApiKey,
} from "@/features/api-users/services/api-key.service";
import { prisma } from "@/lib/prisma";
import { isDatabaseUnavailableError } from "@/lib/prisma-error";

type ApiAuthSuccess = {
  ok: true;
  apiKey: {
    id: string;
    name: string;
    userId: string;
  };
};

type ApiAuthFailure = {
  ok: false;
  response: NextResponse;
};

export async function authenticateApiRequest(
  request: NextRequest,
): Promise<ApiAuthSuccess | ApiAuthFailure> {
  const rawApiKey = getApiKeyFromHeaders(request.headers);

  if (!rawApiKey) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "API key requerida." },
        { status: 401 },
      ),
    };
  }

  try {
    const keyHash = hashApiKey(rawApiKey);
    const apiKey = await prisma.api_keys.findUnique({
      where: { key_hash: keyHash },
      select: {
        id: true,
        user_id: true,
        name: true,
        allowed_ip: true,
      },
    });

    if (!apiKey) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "API key invalida." },
          { status: 401 },
        ),
      };
    }

    const requestIp = getRequestIp(request.headers);
    if (apiKey.allowed_ip && apiKey.allowed_ip !== requestIp) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "IP no autorizada para esta API key." },
          { status: 403 },
        ),
      };
    }

    await prisma.api_keys.update({
      where: { id: apiKey.id },
      data: {
        last_used_at: new Date(),
        updated_at: new Date(),
      },
    });

    return {
      ok: true,
      apiKey: {
        id: apiKey.id.toString(),
        name: apiKey.name,
        userId: apiKey.user_id.toString(),
      },
    };
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "La base de datos no esta disponible." },
          { status: 503 },
        ),
      };
    }

    console.error("API auth failed:", error);
    return {
      ok: false,
      response: NextResponse.json(
        { error: "No fue posible validar la API key." },
        { status: 500 },
      ),
    };
  }
}

