import Link from "next/link";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { BookOpen, Code2, KeyRound, Server, ShieldCheck } from "lucide-react";

import { Prisma } from "../../generated/prisma/client";
import { AnimatedDashboardBackground } from "@/components/dashboard/animated-dashboard-background";
import {
  ApiKeysPanel,
  type ApiKeyListItem,
} from "@/features/api-users/components/api-keys-panel";
import { DEVICE_COOKIE, hashDeviceToken } from "@/features/auth/lib/device-token";
import { FaceEnrollmentPanel } from "@/features/auth/components/face-enrollment-panel";
import {
  TrustedDevicesPanel,
  type TrustedDeviceListItem,
} from "@/features/auth/components/trusted-devices-panel";
import { isDatabaseUnavailableError } from "@/lib/prisma-error";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, verifyToken } from "@/lib/session";

export const dynamic = "force-dynamic";

const endpoints = [
  {
    method: "GET",
    path: "/api/v1/inmuebles",
    description: "Lista inmuebles visibles con paginacion, busqueda y filtros basicos.",
    params: "page, perPage, q, estatus, destacado",
  },
  {
    method: "GET",
    path: "/api/v1/inmuebles/{slug}",
    description: "Obtiene el detalle completo de un inmueble visible por slug.",
    params: "slug en la URL",
  },
];

function formatDateTime(value: Date | null | undefined, emptyLabel = "Nunca") {
  if (!value) return emptyLabel;

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function getBaseUrl(requestHeaders: Headers) {
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");

  return `${protocol}://${host}`;
}

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  return token ? verifyToken(token) : null;
}

export default async function ConfiguracionPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const requestHeaders = await headers();
  const baseUrl = getBaseUrl(requestHeaders);
  const userId = BigInt(user.id);
  let databaseUnavailable = false;
  let apiKeys: Array<{
    id: bigint;
    name: string;
    prefix: string;
    allowed_ip: string | null;
    created_at: Date | null;
    last_used_at: Date | null;
  }> = [];
  let activeFaceEnrollment: { enrolled_at: Date } | null = null;
  let trustedDevices: Array<{
    id: bigint;
    label: string | null;
    device_token_hash: string;
    created_at: Date;
    last_used_at: Date | null;
  }> = [];

  try {
    [apiKeys, activeFaceEnrollment, trustedDevices] = await Promise.all([
      prisma.api_keys.findMany({
        where: { user_id: new Prisma.Decimal(user.id) },
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          name: true,
          prefix: true,
          allowed_ip: true,
          created_at: true,
          last_used_at: true,
        },
      }),
      prisma.user_face_enrollments.findFirst({
        where: { user_id: userId, status: "active" },
        select: { enrolled_at: true },
      }),
      prisma.trusted_devices.findMany({
        where: { user_id: userId, status: "active" },
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          label: true,
          device_token_hash: true,
          created_at: true,
          last_used_at: true,
        },
      }),
    ]);
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      throw error;
    }

    databaseUnavailable = true;
  }

  const cookieStore = await cookies();
  const currentDeviceTokenHash = cookieStore.get(DEVICE_COOKIE)?.value
    ? hashDeviceToken(cookieStore.get(DEVICE_COOKIE)!.value)
    : null;

  const serializedTrustedDevices: TrustedDeviceListItem[] = trustedDevices.map((device) => ({
    id: device.id.toString(),
    label: device.label ?? "Dispositivo sin nombre",
    isCurrent: device.device_token_hash === currentDeviceTokenHash,
    createdAt: formatDateTime(device.created_at, "Sin fecha"),
    lastUsedAt: formatDateTime(device.last_used_at),
  }));

  const hasTrustedCurrentDevice = serializedTrustedDevices.some((device) => device.isCurrent);

  const lastUsedAt =
    apiKeys
      .map((apiKey) => apiKey.last_used_at)
      .filter((value): value is Date => Boolean(value))
      .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;

  const serializedApiKeys: ApiKeyListItem[] = apiKeys.map((apiKey) => ({
    id: apiKey.id.toString(),
    name: apiKey.name,
    prefix: apiKey.prefix,
    allowedIp: apiKey.allowed_ip,
    createdAt: formatDateTime(apiKey.created_at, "Sin fecha"),
    lastUsedAt: formatDateTime(apiKey.last_used_at),
  }));

  return (
    <main className="relative isolate min-h-[100dvh] overflow-x-hidden overflow-y-auto bg-brand-base px-4 py-4 text-brand-text sm:px-6 sm:py-6 lg:px-10">
      <AnimatedDashboardBackground>
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-5 pb-24 lg:pb-8">
          <section className="rounded-[2.25rem] border border-border-soft/80 bg-white/90 p-5 shadow-[0_28px_70px_rgba(20,16,35,0.08)] backdrop-blur-sm sm:p-7 lg:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/10 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-brand-secondary">
                  <KeyRound className="size-3.5" />
                  API de integraciones
                </div>
                <div className="space-y-3">
                  <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-brand-text sm:text-5xl lg:text-6xl">
                    Uso de API
                  </h1>
                  <p className="max-w-2xl text-sm leading-7 text-brand-text/70 sm:text-base">
                    Administra llaves de acceso para consumir datos del CRM desde
                    sitios web, automatizaciones o servicios externos.
                  </p>
                </div>
              </div>

              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center rounded-full border border-border-soft bg-white px-5 text-sm font-medium text-brand-text transition hover:border-brand-secondary hover:text-brand-secondary"
              >
                Volver al dashboard
              </Link>
            </div>
          </section>

          {databaseUnavailable ? (
            <section className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
              La base de datos no responde en este momento. Verifica PostgreSQL
              y `DATABASE_URL` para administrar las API keys.
            </section>
          ) : null}

          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.75rem] border border-border-soft bg-white/85 p-5 shadow-[0_20px_55px_rgba(44,44,44,0.06)] backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] uppercase tracking-[0.35em] text-brand-text/45">
                  Llaves activas
                </p>
                <ShieldCheck className="size-4 text-brand-secondary" />
              </div>
              <p className="mt-3 text-3xl font-semibold tracking-tight">
                {apiKeys.length}
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-border-soft bg-white/85 p-5 shadow-[0_20px_55px_rgba(44,44,44,0.06)] backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] uppercase tracking-[0.35em] text-brand-text/45">
                  Ultimo uso
                </p>
                <Server className="size-4 text-brand-secondary" />
              </div>
              <p className="mt-3 text-lg font-semibold tracking-tight">
                {formatDateTime(lastUsedAt)}
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-border-soft bg-white/85 p-5 shadow-[0_20px_55px_rgba(44,44,44,0.06)] backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] uppercase tracking-[0.35em] text-brand-text/45">
                  Endpoints v1
                </p>
                <Code2 className="size-4 text-brand-secondary" />
              </div>
              <p className="mt-3 text-3xl font-semibold tracking-tight">
                {endpoints.length}
              </p>
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-neutral-400">
              Seguridad de mi cuenta
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-brand-text">
              Login con reconocimiento facial
            </h2>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <FaceEnrollmentPanel
              hasActiveEnrollment={Boolean(activeFaceEnrollment)}
              enrolledAt={
                activeFaceEnrollment ? formatDateTime(activeFaceEnrollment.enrolled_at) : null
              }
            />
            <TrustedDevicesPanel
              devices={serializedTrustedDevices}
              hasActiveEnrollment={Boolean(activeFaceEnrollment)}
              hasTrustedCurrentDevice={hasTrustedCurrentDevice}
            />
          </div>

          <ApiKeysPanel apiKeys={serializedApiKeys} baseUrl={baseUrl} />

          <section className="rounded-[1.75rem] border border-border-soft/80 bg-white/90 p-5 shadow-[0_22px_55px_rgba(20,16,35,0.08)] backdrop-blur-sm sm:p-6">
            <div className="flex items-start gap-3">
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-surface text-brand-secondary">
                <BookOpen className="size-5" />
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-brand-text/45">
                  Documentacion rapida
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-brand-text">
                  Endpoints disponibles
                </h2>
                <p className="mt-2 text-sm leading-6 text-brand-text/60">
                  Todos los requests deben enviar `Authorization: Bearer TU_API_KEY`
                  o el header `x-api-key`.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 lg:grid-cols-2">
              {endpoints.map((endpoint) => (
                <article
                  key={endpoint.path}
                  className="rounded-2xl border border-border-soft bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-brand-secondary px-3 py-1 text-[11px] font-semibold text-white">
                      {endpoint.method}
                    </span>
                    <code className="text-sm font-semibold text-brand-text">
                      {endpoint.path}
                    </code>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-brand-text/65">
                    {endpoint.description}
                  </p>
                  <p className="mt-3 text-xs text-brand-text/45">
                    Parametros: {endpoint.params}
                  </p>
                  <code className="mt-4 block overflow-x-auto rounded-xl bg-brand-surface px-3 py-2 text-xs text-brand-text/65">
                    {baseUrl}
                    {endpoint.path}
                  </code>
                </article>
              ))}
            </div>
          </section>
        </div>
      </AnimatedDashboardBackground>
    </main>
  );
}

