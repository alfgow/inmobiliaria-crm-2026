import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import React from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export type PropertyPdfData = {
  id: string;
  titulo: string;
  tipo: string;
  operacion: string;
  estatus: string;
  estatusColor: string;
  precio: string;
  descripcion: string | null;
  habitaciones: number | null;
  banos: number | null;
  estacionamientos: number | null;
  areaTotal: string | null;
  areaConstruida: string | null;
  areaTerreno: string | null;
  anio_construccion: number | null;
  direccion: string | null;
  colonia: string | null;
  municipio: string | null;
  estado: string | null;
  codigo_postal: string | null;
  destacado: boolean;
  amenidades: string[];
  requisitos: string[];
  restricciones: string[];
  asesor: { nombre: string; telefono: string | null; email: string | null } | null;
  images: string[];
};

// ── Palette ───────────────────────────────────────────────────────────────────

const C = {
  dark: "#0F172A",
  accent: "#D2FF1E",
  gray: "#64748B",
  lightGray: "#F8FAFC",
  border: "#E2E8F0",
  text: "#1E293B",
  white: "#FFFFFF",
  greenBg: "#D1FAE5",
  green: "#065F46",
  blueBg: "#E0F2FE",
  blue: "#0369A1",
  amberBg: "#FEF3C7",
  amber: "#92400E",
  violetBg: "#EDE9FE",
  violet: "#5B21B6",
  indigo: "#6366F1",
  neutral: "#F3F4F6",
};

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    backgroundColor: C.white,
  },
  header: {
    backgroundColor: C.dark,
    paddingHorizontal: 32,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerBrand: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.white,
    letterSpacing: 2,
  },
  headerRefLabel: {
    fontSize: 7,
    color: "#94A3B8",
    letterSpacing: 1,
    textAlign: "right",
  },
  headerRef: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: C.accent,
    letterSpacing: 1,
    textAlign: "right",
    marginTop: 2,
  },
  content: {
    paddingHorizontal: 32,
    paddingTop: 20,
    paddingBottom: 20,
    flex: 1,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  badge: {
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 3,
    marginRight: 5,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
  },
  propertyTitle: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: C.dark,
    marginBottom: 5,
    lineHeight: 1.25,
  },
  locationText: {
    fontSize: 8,
    color: C.gray,
    marginBottom: 2,
  },
  sep: {
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    marginVertical: 13,
  },
  sectionLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.gray,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.gray,
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  priceValue: {
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    color: C.dark,
  },
  priceSub: {
    fontSize: 8,
    color: C.gray,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  statBox: {
    backgroundColor: C.lightGray,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginRight: 6,
    marginBottom: 6,
    minWidth: 58,
  },
  statValue: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: C.dark,
  },
  statLabel: {
    fontSize: 6.5,
    color: C.gray,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  descText: {
    fontSize: 8.5,
    color: C.text,
    lineHeight: 1.7,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  chip: {
    backgroundColor: C.lightGray,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 3,
    marginRight: 5,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: C.border,
  },
  chipText: {
    fontSize: 7.5,
    color: C.text,
  },
  reqColumns: {
    flexDirection: "row",
  },
  reqCol: {
    flex: 1,
    marginRight: 10,
  },
  reqSubLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.gray,
    letterSpacing: 1,
    marginBottom: 5,
  },
  reqItem: {
    fontSize: 8,
    color: C.text,
    marginBottom: 3,
    lineHeight: 1.5,
  },
  asesorBox: {
    backgroundColor: C.lightGray,
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  asesorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.indigo,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  asesorInitial: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: C.white,
  },
  asesorName: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.dark,
    marginBottom: 2,
  },
  asesorDetail: {
    fontSize: 7.5,
    color: C.gray,
    marginBottom: 1,
  },
  footer: {
    backgroundColor: C.dark,
    paddingHorizontal: 32,
    paddingVertical: 11,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 7,
    color: "#94A3B8",
  },
  footerAccent: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.accent,
  },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function opBadgeColors(op: string): { bg: string; color: string } {
  switch (op.toLowerCase()) {
    case "venta": return { bg: C.greenBg, color: C.green };
    case "renta": return { bg: C.blueBg, color: C.blue };
    case "preventa": return { bg: C.amberBg, color: C.amber };
    case "traspaso": return { bg: C.violetBg, color: C.violet };
    default: return { bg: C.neutral, color: C.text };
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PropertyPdfDocument({ data }: { data: PropertyPdfData }) {
  const opColors = opBadgeColors(data.operacion);
  const photoCount = Math.min(data.images.length, 4);
  const photos = data.images.slice(0, 4);

  const locationParts = [data.colonia, data.municipio, data.estado].filter(Boolean);
  const locationStr = locationParts.join(", ");
  const cpStr = data.codigo_postal ? ` · CP ${data.codigo_postal}` : "";

  const stats: Array<{ value: string; label: string }> = [];
  if ((data.habitaciones ?? 0) > 0) stats.push({ value: String(data.habitaciones), label: "RECAMARAS" });
  if ((data.banos ?? 0) > 0) stats.push({ value: String(data.banos), label: "BANOS" });
  if ((data.estacionamientos ?? 0) > 0) stats.push({ value: String(data.estacionamientos), label: "ESTACIONA." });
  if (data.areaTotal) stats.push({ value: `${data.areaTotal} m²`, label: "TOTAL" });
  if (data.areaConstruida) stats.push({ value: `${data.areaConstruida} m²`, label: "CONSTRUIDA" });
  if (data.areaTerreno) stats.push({ value: `${data.areaTerreno} m²`, label: "TERRENO" });
  if (data.anio_construccion) stats.push({ value: String(data.anio_construccion), label: "ANO CONST." });

  const hasReq = data.requisitos.length > 0 || data.restricciones.length > 0;
  const today = new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* ── Header ── */}
        <View style={s.header}>
          <Text style={s.headerBrand}>FICHA TÉCNICA</Text>
          <View>
            <Text style={s.headerRefLabel}>REFERENCIA</Text>
            <Text style={s.headerRef}>#{data.id.padStart(5, "0")}</Text>
          </View>
        </View>

        {/* ── Content ── */}
        <View style={s.content}>

          {/* Badges */}
          <View style={s.badges}>
            <View style={[s.badge, { backgroundColor: opColors.bg }]}>
              <Text style={[s.badgeText, { color: opColors.color }]}>
                {data.operacion.toUpperCase()}
              </Text>
            </View>
            <View style={[s.badge, { backgroundColor: C.neutral }]}>
              <Text style={[s.badgeText, { color: C.text }]}>
                {data.tipo.toUpperCase()}
              </Text>
            </View>
            <View style={[s.badge, { borderWidth: 1, borderColor: data.estatusColor, backgroundColor: C.lightGray }]}>
              <Text style={[s.badgeText, { color: data.estatusColor }]}>
                {data.estatus.toUpperCase()}
              </Text>
            </View>
            {data.destacado && (
              <View style={[s.badge, { borderWidth: 1, borderColor: "#A3CC00", backgroundColor: "#F7FFD4" }]}>
                <Text style={[s.badgeText, { color: "#5C6B00" }]}>DESTACADO</Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text style={s.propertyTitle}>{data.titulo}</Text>

          {/* Location */}
          {locationStr ? (
            <Text style={s.locationText}>{locationStr}{cpStr}</Text>
          ) : null}
          {data.direccion ? (
            <Text style={[s.locationText, { color: "#94A3B8" }]}>{data.direccion}</Text>
          ) : null}

          {/* Photos grid */}
          {photoCount > 0 && (
            <View style={{ marginTop: 14, marginBottom: 6 }}>
              {/* Row 1 */}
              <View style={{ flexDirection: "row", marginBottom: photoCount > 2 ? 5 : 0 }}>
                {photos.slice(0, 2).map((src, i) => (
                  <Image
                    key={i}
                    src={src}
                    style={{
                      height: 138,
                      width: photoCount === 1 ? "100%" : "49%",
                      marginRight: i === 0 && photoCount > 1 ? "2%" : 0,
                      borderRadius: 6,
                    }}
                  />
                ))}
              </View>
              {/* Row 2 */}
              {photoCount > 2 && (
                <View style={{ flexDirection: "row" }}>
                  {photos.slice(2, 4).map((src, i) => (
                    <Image
                      key={i + 2}
                      src={src}
                      style={{
                        height: 138,
                        width: "49%",
                        marginRight: i === 0 ? "2%" : 0,
                        borderRadius: 6,
                      }}
                    />
                  ))}
                </View>
              )}
            </View>
          )}

          <View style={s.sep} />

          {/* Price */}
          <Text style={s.priceLabel}>PRECIO</Text>
          <Text style={s.priceValue}>{data.precio}</Text>
          <Text style={s.priceSub}>{data.operacion} · {data.tipo}</Text>

          {/* Characteristics */}
          {stats.length > 0 && (
            <>
              <View style={s.sep} />
              <Text style={s.sectionLabel}>CARACTERÍSTICAS</Text>
              <View style={s.statsRow}>
                {stats.map((stat) => (
                  <View key={stat.label} style={s.statBox}>
                    <Text style={s.statValue}>{stat.value}</Text>
                    <Text style={s.statLabel}>{stat.label}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Description */}
          {data.descripcion && (
            <>
              <View style={s.sep} />
              <Text style={s.sectionLabel}>DESCRIPCIÓN</Text>
              <Text style={s.descText}>
                {data.descripcion.length > 900
                  ? data.descripcion.slice(0, 900) + "…"
                  : data.descripcion}
              </Text>
            </>
          )}

          {/* Amenidades */}
          {data.amenidades.length > 0 && (
            <>
              <View style={s.sep} />
              <Text style={s.sectionLabel}>AMENIDADES</Text>
              <View style={s.chipRow}>
                {data.amenidades.map((a) => (
                  <View key={a} style={s.chip}>
                    <Text style={s.chipText}>{a}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Requisitos y restricciones */}
          {hasReq && (
            <>
              <View style={s.sep} />
              <Text style={s.sectionLabel}>REQUISITOS Y RESTRICCIONES</Text>
              <View style={s.reqColumns}>
                {data.requisitos.length > 0 && (
                  <View style={s.reqCol}>
                    <Text style={s.reqSubLabel}>REQUISITOS</Text>
                    {data.requisitos.map((r, i) => (
                      <Text key={i} style={s.reqItem}>• {r}</Text>
                    ))}
                  </View>
                )}
                {data.restricciones.length > 0 && (
                  <View style={s.reqCol}>
                    <Text style={s.reqSubLabel}>RESTRICCIONES</Text>
                    {data.restricciones.map((r, i) => (
                      <Text key={i} style={s.reqItem}>• {r}</Text>
                    ))}
                  </View>
                )}
              </View>
            </>
          )}

          {/* Asesor */}
          {data.asesor && (
            <>
              <View style={s.sep} />
              <Text style={s.sectionLabel}>ASESOR ASIGNADO</Text>
              <View style={s.asesorBox}>
                <View style={s.asesorAvatar}>
                  <Text style={s.asesorInitial}>
                    {data.asesor.nombre.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={s.asesorName}>{data.asesor.nombre}</Text>
                  {data.asesor.telefono && (
                    <Text style={s.asesorDetail}>{data.asesor.telefono}</Text>
                  )}
                  {data.asesor.email && (
                    <Text style={s.asesorDetail}>{data.asesor.email}</Text>
                  )}
                </View>
              </View>
            </>
          )}

        </View>

        {/* ── Footer ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Generado el {today}</Text>
          <Text style={s.footerAccent}>INMOBILIARIA CRM</Text>
        </View>

      </Page>
    </Document>
  );
}
