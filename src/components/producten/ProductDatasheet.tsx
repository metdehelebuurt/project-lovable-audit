import React from "react";

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
  zonnepanelen: "Zonnepanelen",
  thuisbatterij: "Thuisbatterij",
  warmtepomp: "Warmtepomp",
  laadpaal: "Laadpaal",
  omvormer: "Omvormer",
  accessoires: "Accessoires",
  installatiemateriaal: "Installatiemateriaal",
};

const categorieIcons: Record<string, string> = {
  zonnepanelen: "☀️",
  thuisbatterij: "🔋",
  warmtepomp: "🌡️",
  laadpaal: "⚡",
  omvormer: "🔌",
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

const SpecTable: React.FC<{
  title: string;
  icon?: string;
  entries: [string, string][];
  pc: string;
  sc: string;
}> = ({ title, icon, entries, pc, sc }) => {
  if (entries.length === 0) return null;
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
        borderBottom: `2px solid ${pc}`, paddingBottom: 6,
      }}>
        {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
        <h3 style={{ fontSize: 12, fontWeight: 700, color: sc, margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>
          {title}
        </h3>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10.5 }}>
        <tbody>
          {entries.map(([key, val], i) => (
            <tr key={key} style={{ backgroundColor: i % 2 === 0 ? "#fff" : hexToRgba(pc, 0.04) }}>
              <td style={{
                padding: "5px 8px", color: "#555", width: "45%",
                borderBottom: `1px solid ${hexToRgba(pc, 0.1)}`,
                fontWeight: 500,
              }}>
                {key.replace(/_/g, " ")}
              </td>
              <td style={{
                padding: "5px 8px", color: sc, fontWeight: 600,
                borderBottom: `1px solid ${hexToRgba(pc, 0.1)}`,
              }}>
                {String(val)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ProductDatasheet: React.FC<ProductDatasheetProps> = ({ product, partner }) => {
  const pc = partner.primaire_kleur || "#5B58E1";
  const sc = partner.secundaire_kleur || "#1a1a2e";
  const pcOnText = isLightColor(pc) ? sc : "#fff";

  const logoUrl = partner.logo_url
    ? (partner.logo_url.startsWith("http") ? partner.logo_url : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/partner-assets/${partner.logo_url}`)
    : null;

  const imgUrl = product.afbeelding_url
    ? (product.afbeelding_url.startsWith("http") ? product.afbeelding_url : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/${product.afbeelding_url}`)
    : null;

  const techSpecs = product.specs && typeof product.specs === "object" ? Object.entries(product.specs) : [];
  const installSpecs = product.installatie_specs && typeof product.installatie_specs === "object" ? Object.entries(product.installatie_specs) : [];

  // Split tech specs into two columns if > 8
  const techMid = Math.ceil(techSpecs.length / 2);
  const techLeft = techSpecs.slice(0, techMid);
  const techRight = techSpecs.slice(techMid);

  const pageStyle: React.CSSProperties = {
    width: "210mm",
    minHeight: "297mm",
    margin: "0 auto",
    padding: 0,
    backgroundColor: "#fff",
    fontFamily: "'Rubik', 'Inter', sans-serif",
    fontSize: 11,
    color: "#1a1a2e",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    position: "relative",
    overflow: "hidden",
  };

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

      <div style={pageStyle}>
        {/* ─── TOP COLOR BAR ─── */}
        <div style={{ height: 4, background: `linear-gradient(90deg, ${pc}, ${hexToRgba(pc, 0.4)})` }} />

        {/* ─── HEADER ─── */}
        <div style={{
          padding: "16px 36px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          borderBottom: `1px solid ${hexToRgba(sc, 0.08)}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {logoUrl && <img src={logoUrl} alt={partner.naam} style={{ height: 28, objectFit: "contain" }} />}
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: sc }}>{partner.naam}</div>
              {partner.bedrijfsslogan && (
                <div style={{ fontSize: 9, color: "#888", fontStyle: "italic" }}>{partner.bedrijfsslogan}</div>
              )}
            </div>
          </div>
          <div style={{ fontSize: 9, color: "#888", textAlign: "right", lineHeight: 1.6 }}>
            {partner.website && <div>{partner.website}</div>}
            {partner.email && <div>{partner.email}</div>}
            {partner.telefoonnummer && <div>{partner.telefoonnummer}</div>}
          </div>
        </div>

        {/* ─── HERO SECTION ─── */}
        <div style={{
          display: "flex", padding: "24px 36px 20px", gap: 28, alignItems: "flex-start",
          background: `linear-gradient(135deg, ${hexToRgba(pc, 0.03)} 0%, transparent 60%)`,
        }}>
          {/* Product Image */}
          {imgUrl && (
            <div style={{
              width: 170, height: 170, borderRadius: 12, overflow: "hidden",
              backgroundColor: "#f8f9fa", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: `1px solid ${hexToRgba(pc, 0.12)}`,
              boxShadow: `0 4px 16px ${hexToRgba(sc, 0.06)}`,
            }}>
              <img src={imgUrl} alt={product.naam} style={{ maxWidth: "90%", maxHeight: "90%", objectFit: "contain" }} />
            </div>
          )}

          {/* Product Info */}
          <div style={{ flex: 1 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              backgroundColor: pc, color: pcOnText,
              fontSize: 9, fontWeight: 700, padding: "3px 10px", borderRadius: 4,
              marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.8,
            }}>
              {categorieIcons[product.categorie] && <span>{categorieIcons[product.categorie]}</span>}
              {categorieLabels[product.categorie] || product.categorie}
            </div>

            <h1 style={{ fontSize: 22, fontWeight: 800, color: sc, margin: "0 0 4px", lineHeight: 1.15 }}>
              {product.naam}
            </h1>
            {product.merk && (
              <p style={{ fontSize: 12, color: pc, fontWeight: 600, margin: "0 0 10px" }}>
                {product.merk}{product.model ? ` — ${product.model}` : ""}
              </p>
            )}
            {product.omschrijving && (
              <p style={{ fontSize: 10.5, color: "#555", lineHeight: 1.65, margin: 0, maxWidth: 420 }}>
                {product.omschrijving}
              </p>
            )}

            {/* Key badges row */}
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              {product.garantie_jaren && (
                <div style={{
                  backgroundColor: hexToRgba(pc, 0.08), borderRadius: 6,
                  padding: "4px 10px", fontSize: 9, fontWeight: 600,
                  border: `1px solid ${hexToRgba(pc, 0.15)}`,
                }}>
                  <span style={{ color: pc }}>{product.garantie_jaren} jaar</span>
                  <span style={{ color: "#888", marginLeft: 3 }}>garantie</span>
                </div>
              )}
              {product.certificeringen && (
                <div style={{
                  backgroundColor: hexToRgba(pc, 0.08), borderRadius: 6,
                  padding: "4px 10px", fontSize: 9, fontWeight: 600,
                  border: `1px solid ${hexToRgba(pc, 0.15)}`,
                  color: "#666",
                }}>
                  ✓ Gecertificeerd
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── ACCENT LINE ─── */}
        <div style={{ margin: "0 36px", height: 2, background: `linear-gradient(90deg, ${pc}, ${hexToRgba(pc, 0.15)})`, borderRadius: 1 }} />

        {/* ─── SPECIFICATIONS GRID ─── */}
        <div style={{ padding: "20px 36px 12px" }}>
          {techSpecs.length > 0 && (
            <>
              <div style={{
                display: "flex", alignItems: "center", gap: 8, marginBottom: 14,
              }}>
                <div style={{ width: 3, height: 18, backgroundColor: pc, borderRadius: 2 }} />
                <h2 style={{ fontSize: 14, fontWeight: 800, color: sc, margin: 0 }}>
                  Technische Specificaties
                </h2>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <SpecTable title="" entries={techLeft} pc={pc} sc={sc} />
                <SpecTable title="" entries={techRight} pc={pc} sc={sc} />
              </div>
            </>
          )}

          {/* Installation specs */}
          {installSpecs.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 8, marginBottom: 14,
              }}>
                <div style={{ width: 3, height: 18, backgroundColor: pc, borderRadius: 2 }} />
                <h2 style={{ fontSize: 14, fontWeight: 800, color: sc, margin: 0 }}>
                  Installatie & Fysieke Specificaties
                </h2>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <SpecTable title="" entries={installSpecs.slice(0, Math.ceil(installSpecs.length / 2))} pc={pc} sc={sc} />
                <SpecTable title="" entries={installSpecs.slice(Math.ceil(installSpecs.length / 2))} pc={pc} sc={sc} />
              </div>
            </div>
          )}
        </div>

        {/* ─── CERTIFICATIONS & REGULATIONS ─── */}
        {product.certificeringen && (
          <div style={{ padding: "0 36px 12px" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8, marginBottom: 8,
            }}>
              <div style={{ width: 3, height: 16, backgroundColor: pc, borderRadius: 2 }} />
              <h2 style={{ fontSize: 12, fontWeight: 700, color: sc, margin: 0 }}>
                Certificeringen & Normen
              </h2>
            </div>
            <div style={{
              padding: "8px 12px", backgroundColor: hexToRgba(pc, 0.04),
              borderRadius: 6, border: `1px solid ${hexToRgba(pc, 0.1)}`,
            }}>
              <p style={{ fontSize: 10, color: "#555", lineHeight: 1.6, margin: 0 }}>
                {product.certificeringen}
              </p>
            </div>
          </div>
        )}

        {/* ─── ONDERHOUD ─── */}
        {product.onderhoud && (
          <div style={{ padding: "0 36px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 3, height: 16, backgroundColor: pc, borderRadius: 2 }} />
              <h2 style={{ fontSize: 12, fontWeight: 700, color: sc, margin: 0 }}>Onderhoud</h2>
            </div>
            <p style={{ fontSize: 10, color: "#555", lineHeight: 1.6, margin: 0 }}>{product.onderhoud}</p>
          </div>
        )}

        {/* ─── SPACER ─── */}
        <div style={{ flex: 1 }} />

        {/* ─── FOOTER ─── */}
        <div style={{
          backgroundColor: sc, color: "#fff", padding: "14px 36px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          fontSize: 9,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {logoUrl && <img src={logoUrl} alt="" style={{ height: 18, objectFit: "contain", opacity: 0.8, filter: "brightness(10)" }} />}
            <div>
              <span style={{ fontWeight: 700 }}>{partner.naam}</span>
              {partner.adres && <span style={{ opacity: 0.6, marginLeft: 10 }}>{partner.adres}</span>}
              {(partner.postcode || partner.plaats) && (
                <span style={{ opacity: 0.6, marginLeft: 4 }}>{partner.postcode} {partner.plaats}</span>
              )}
            </div>
          </div>
          <div style={{ opacity: 0.6, display: "flex", gap: 14 }}>
            {partner.kvk && <span>KvK: {partner.kvk}</span>}
            {partner.btw && <span>BTW: {partner.btw}</span>}
            {partner.website && <span>{partner.website}</span>}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductDatasheet;
