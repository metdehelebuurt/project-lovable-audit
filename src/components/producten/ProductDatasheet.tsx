import React from "react";
import { getGroupedSpecs, type SpecDefinition } from "./categorySpecDefinitions";

interface PartnerBranding {
  naam: string;
  adres?: string | null;
  postcode?: string | null;
  plaats?: string | null;
  email?: string | null;
  telefoonnummer?: string | null;
  kvk?: string | null;
  btw?: string | null;
  website?: string | null;
  logo_url?: string | null;
  primaire_kleur?: string | null;
  secundaire_kleur?: string | null;
  bedrijfsslogan?: string | null;
}

interface ProductData {
  naam: string;
  merk?: string | null;
  model?: string | null;
  categorie: string;
  omschrijving?: string | null;
  afbeelding_url?: string | null;
  specs?: Record<string, string> | null;
  certificeringen?: string | null;
  garantie_jaren?: number | null;
  prijs_excl_btw?: number;
  onderhoud?: string | null;
  installatie_instructies?: string | null;
  installatie_specs?: Record<string, string> | null;
}

interface ProductDatasheetProps {
  product: ProductData;
  partner: PartnerBranding;
}

const categorieLabels: Record<string, string> = {
  zonnepanelen: "Zonnepaneel",
  thuisbatterij: "Thuisbatterij",
  warmtepomp: "Warmtepomp",
  laadpaal: "Laadpaal",
  omvormer: "Omvormer",
  accessoires: "Accessoire",
  installatiemateriaal: "Installatiemateriaal",
};

function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

const ProductDatasheet: React.FC<ProductDatasheetProps> = ({ product, partner }) => {
  const pc = partner.primaire_kleur || "#5B58E1";
  const sc = partner.secundaire_kleur || "#1a1a2e";
  const pcText = isLightColor(pc) ? sc : "#fff";

  const logoUrl = partner.logo_url
    ? (partner.logo_url.startsWith("http") ? partner.logo_url : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/partner-assets/${partner.logo_url}`)
    : null;

  const imgUrl = product.afbeelding_url
    ? (product.afbeelding_url.startsWith("http") ? product.afbeelding_url : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/${product.afbeelding_url}`)
    : null;

  const allSpecs = product.specs && typeof product.specs === "object" ? product.specs : {};

  // Group specs using category definitions
  const grouped = getGroupedSpecs(product.categorie);
  const specGroups: { title: string; entries: [string, string][] }[] = [];

  for (const [groupName, defs] of Object.entries(grouped)) {
    const entries: [string, string][] = [];
    for (const def of defs) {
      const val = allSpecs[def.key];
      if (val && String(val).trim() !== "") {
        entries.push([def.label + (def.unit ? ` (${def.unit})` : ""), String(val)]);
      }
    }
    if (entries.length > 0) {
      specGroups.push({ title: groupName, entries });
    }
  }

  // Custom specs
  const definedKeys = new Set(Object.values(grouped).flat().map(d => d.key));
  const customEntries: [string, string][] = Object.entries(allSpecs)
    .filter(([k, v]) => !definedKeys.has(k) && v && String(v).trim() !== "")
    .map(([k, v]) => [k.replace(/_/g, " "), String(v)]);
  if (customEntries.length > 0) {
    specGroups.push({ title: "Overige specificaties", entries: customEntries });
  }

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; }
          .no-print { display: none !important; }
        }
        * { box-sizing: border-box; }
      `}</style>

      <div style={{
        width: "210mm", minHeight: "297mm", margin: "0 auto", padding: 0,
        backgroundColor: "#fff", fontFamily: "'Rubik', 'Inter', -apple-system, sans-serif",
        fontSize: 11, color: sc, display: "flex", flexDirection: "column",
        position: "relative", overflow: "hidden",
      }}>
        {/* ─── HEADER ─── */}
        <div style={{
          padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center",
          borderBottom: `3px solid ${pc}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {logoUrl && <img src={logoUrl} alt={partner.naam} style={{ height: 32, objectFit: "contain" }} />}
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: sc, letterSpacing: -0.3 }}>{partner.naam}</div>
              {partner.bedrijfsslogan && (
                <div style={{ fontSize: 9, color: "#999", marginTop: 1 }}>{partner.bedrijfsslogan}</div>
              )}
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: 8.5, color: "#888", lineHeight: 1.7 }}>
            {partner.telefoonnummer && <div>{partner.telefoonnummer}</div>}
            {partner.email && <div>{partner.email}</div>}
            {partner.website && <div>{partner.website}</div>}
          </div>
        </div>

        {/* ─── TITLE BAR ─── */}
        <div style={{
          backgroundColor: pc, padding: "10px 40px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ color: pcText, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.5 }}>
            Technisch Specificatieblad
          </div>
          <div style={{ color: pcText, fontSize: 9, opacity: 0.8 }}>
            {categorieLabels[product.categorie] || product.categorie}
          </div>
        </div>

        {/* ─── HERO ─── */}
        <div style={{
          display: "flex", padding: "28px 40px 24px", gap: 32, alignItems: "flex-start",
        }}>
          {imgUrl && (
            <div style={{
              width: 160, height: 160, borderRadius: 10, overflow: "hidden",
              backgroundColor: "#f7f8fa", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "1px solid #eee",
            }}>
              <img src={imgUrl} alt={product.naam} style={{ maxWidth: "88%", maxHeight: "88%", objectFit: "contain" }} />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: sc, margin: "0 0 4px", lineHeight: 1.1, letterSpacing: -0.5 }}>
              {product.naam}
            </h1>
            {product.merk && (
              <p style={{ fontSize: 13, color: pc, fontWeight: 600, margin: "0 0 12px" }}>
                {product.merk}{product.model ? ` \u2014 ${product.model}` : ""}
              </p>
            )}
            {product.omschrijving && (
              <p style={{ fontSize: 10.5, color: "#555", lineHeight: 1.7, margin: 0, maxWidth: 440 }}>
                {product.omschrijving}
              </p>
            )}
            {/* Key highlights */}
            <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
              {product.garantie_jaren && (
                <span style={{
                  fontSize: 9, fontWeight: 600, padding: "4px 12px", borderRadius: 20,
                  backgroundColor: hexToRgba(pc, 0.08), color: pc,
                  border: `1px solid ${hexToRgba(pc, 0.15)}`,
                }}>
                  {product.garantie_jaren} jaar garantie
                </span>
              )}
              {product.certificeringen && (
                <span style={{
                  fontSize: 9, fontWeight: 600, padding: "4px 12px", borderRadius: 20,
                  backgroundColor: "#f0fdf4", color: "#166534",
                  border: "1px solid #bbf7d0",
                }}>
                  Gecertificeerd
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ─── DIVIDER ─── */}
        <div style={{ margin: "0 40px", height: 1, backgroundColor: "#e5e7eb" }} />

        {/* ─── SPECIFICATIONS ─── */}
        <div style={{ padding: "20px 40px 16px", flex: 1 }}>
          {specGroups.map((group, gi) => (
            <div key={group.title} style={{ marginBottom: 18 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 8, marginBottom: 8,
              }}>
                <div style={{ width: 3, height: 14, backgroundColor: pc, borderRadius: 2 }} />
                <h2 style={{
                  fontSize: 11.5, fontWeight: 700, color: sc, margin: 0,
                  textTransform: "uppercase", letterSpacing: 0.6,
                }}>
                  {group.title}
                </h2>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10.5 }}>
                <tbody>
                  {group.entries.map(([label, val], i) => (
                    <tr key={label}>
                      <td style={{
                        padding: "5px 10px", width: "50%", color: "#666", fontWeight: 500,
                        borderBottom: "1px solid #f0f0f0",
                        backgroundColor: i % 2 === 0 ? "#fafafa" : "#fff",
                      }}>
                        {label}
                      </td>
                      <td style={{
                        padding: "5px 10px", color: sc, fontWeight: 600,
                        borderBottom: "1px solid #f0f0f0",
                        backgroundColor: i % 2 === 0 ? "#fafafa" : "#fff",
                      }}>
                        {val}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {/* Certifications */}
          {product.certificeringen && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 3, height: 14, backgroundColor: pc, borderRadius: 2 }} />
                <h2 style={{ fontSize: 11.5, fontWeight: 700, color: sc, margin: 0, textTransform: "uppercase", letterSpacing: 0.6 }}>
                  Certificeringen &amp; Normen
                </h2>
              </div>
              <div style={{
                padding: "8px 12px", backgroundColor: "#fafafa", borderRadius: 6,
                border: "1px solid #f0f0f0", fontSize: 10, color: "#555", lineHeight: 1.6,
              }}>
                {product.certificeringen}
              </div>
            </div>
          )}

          {/* Onderhoud */}
          {product.onderhoud && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 3, height: 14, backgroundColor: pc, borderRadius: 2 }} />
                <h2 style={{ fontSize: 11.5, fontWeight: 700, color: sc, margin: 0, textTransform: "uppercase", letterSpacing: 0.6 }}>
                  Onderhoud
                </h2>
              </div>
              <p style={{ fontSize: 10, color: "#555", lineHeight: 1.6, margin: 0 }}>{product.onderhoud}</p>
            </div>
          )}
        </div>

        {/* ─── SPACER ─── */}
        <div style={{ flex: 1 }} />

        {/* ─── FOOTER ─── */}
        <div style={{
          backgroundColor: sc, padding: "14px 40px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          fontSize: 8.5, color: "rgba(255,255,255,0.7)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {logoUrl && <img src={logoUrl} alt="" style={{ height: 16, objectFit: "contain", opacity: 0.7, filter: "brightness(10)" }} />}
            <span style={{ fontWeight: 700, color: "#fff" }}>{partner.naam}</span>
            {partner.adres && <span>{partner.adres}</span>}
            {(partner.postcode || partner.plaats) && <span>{partner.postcode} {partner.plaats}</span>}
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            {partner.kvk && <span>KvK {partner.kvk}</span>}
            {partner.btw && <span>BTW {partner.btw}</span>}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductDatasheet;
