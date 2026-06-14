import { prisma } from "@/lib/prisma";
import { NewPropertyForm, type AdvisorOption, type StatusOption } from "@/features/properties/components/new-property-form";

export const dynamic = "force-dynamic";

export default async function NuevoInmueblePage() {
  const [statusRows, advisorRows] = await Promise.all([
    prisma.inmueble_estatus.findMany({ orderBy: { orden: "asc" }, select: { id: true, nombre: true, color: true } }),
    prisma.asesores.findMany({ orderBy: { nombre: "asc" }, select: { id: true, nombre: true } }),
  ]);

  const statuses: StatusOption[] = statusRows.map((s) => ({
    id: s.id,
    nombre: s.nombre,
    color: s.color,
  }));

  const advisors: AdvisorOption[] = advisorRows.map((a) => ({
    id: a.id.toString(),
    nombre: a.nombre,
  }));

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <NewPropertyForm statuses={statuses} advisors={advisors} />
    </div>
  );
}
