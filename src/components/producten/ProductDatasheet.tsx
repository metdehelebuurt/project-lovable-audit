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

function hexToTint(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}

const ProductDatasheet: React.FC<ProductDatasheetProps> = ({ product, partner }) => {
  const pc = partner.primaire_kleur || "#5B58E1";
  const sc = partner.secundaire_kleur || "#1a1a2e";
  const pcTint = hexToTint(pc, 0.08);
  const pcTint2 = hexToTint(pc, 0.15);

  const logoUrl = partner.logo_url
    ? (partner.logo_url.startsWith("http") ? partner.logo_url : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/partner-assets/${partner.logo_url}`)
    : null;

  const imgUrl = product.afbeelding_url
    ? (product.afbeelding_url.startsWith("http") ? product.afbeelding_url : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/${product.afbeelding_url}`)
    : null;

  const specs = product.specs && typeof product.specs === "object" ? product.specs : null;
  const specEntries = specs ? Object.entries(specs) : [];
  const midpoint = Math.ceil(specEntries.length / 2);
  const specsLeft = specEntries.slice(0, midpoint);
  const specsRight = specEntries.slice(midpoint);

  const pageStyle: React.CSSProperties = {
    width: "210mm",
    minHeight: "297mm",
    margin: "0 auto",
    padding: 0,
    backgroundColor: "#fff",
    fontFamily: "'Rubik', sans-serif",
    fontSize: 12,
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
        }
        * { box-sizing: border-box; }
      `}</style>

      <div style={pageStyle}>
        {/* ─── HEADER BAR ─── */}
        <div style={{ backgroundColor: sc, color: "#fff", padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {logoUrl && <img src={logoUrl} alt={partner.naam} style={{ height: 32, objectFit: "contain" }} />}
            <span style={{ fontWeight: 700, fontSize: 16 }}>{partner.naam}</span>
          </div>
          <div style={{ fontSize: 10, opacity: 0.8, display: "flex", gap: 16 }}>
            {partner.website && <span>{partner.website}</span>}
            {partner.email && <span>{partner.email}</span>}
            {partner.telefoonnummer && <span>{partner.telefoonnummer}</span>}
          </div>
        </div>

        {/* ─── HERO SECTION ─── */}
        <div style={{ display: "flex", padding: "32px 40px 24px", gap: 32, alignItems: "flex-start" }}>
          {/* Product Image */}
          {imgUrl && (
            <div style={{ width: 200, height: 200, borderRadius: 16, overflow: "hidden", backgroundColor: "#f8f8fa", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${pcTint2}` }}>
              <img src={imgUrl} alt={product.naam} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
            </div>
          )}

          {/* Product Title & Key Info */}
          <div style={{ flex: 1 }}>
            <div style={{ display: "inline-block", backgroundColor: pcTint, color: pc, fontSize: 10, fontWeight: 700, padding: "4px 12px", borderRadius: 20, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
              {categorieLabels[product.categorie] || product.categorie}
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: sc, margin: "0 0 4px", lineHeight: 1.2 }}>
              {product.naam}
            </h1>
            {product.merk && (
              <p style={{ fontSize: 14, color: pc, fontWeight: 600, margin: "0 0 12px" }}>
                {product.merk}{product.model ? ` — ${product.model}` : ""}
              </p>
            )}
            {product.omschrijving && (
              <p style={{ fontSize: 12, color: "#555", lineHeight: 1.7, margin: 0 }}>
                {product.omschrijving}
              </p>
            )}

            {/* Key badges */}
            <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
              {product.garantie_jaren && (
                <div style={{ backgroundColor: pcTint, borderRadius: 10, padding: "8px 16px", fontSize: 11 }}>
                  <span style={{ fontWeight: 700, color: pc }}>{product.garantie_jaren} jaar</span>
                  <span style={{ color: "#666", marginLeft: 4 }}>garantie</span>
                </div>
              )}
              {product.certificeringen && (
                <div style={{ backgroundColor: pcTint, borderRadius: 10, padding: "8px 16px", fontSize: 11 }}>
                  <span style={{ color: "#666" }}>Gecertificeerd</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── DIVIDER ─── */}
        <div style={{ margin: "0 40px", height: 3, background: `linear-gradient(90deg, ${pc}, ${hexToTint(pc, 0.2)})`, borderRadius: 2 }} />

        {/* ─── SPECIFICATIONS TABLE ─── */}
        {specEntries.length > 0 && (
          <div style={{ padding: "24px 40px 16px" }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: sc, margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ display: "inline-block", width: 4, height: 20, backgroundColor: pc, borderRadius: 2 }} />
              Technische Specificaties
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[specsLeft, specsRight].map((col, ci) => (
                <table key={ci} style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <tbody>
                    {col.map(([key, val], si) => (
                      <tr key={key} style={{ backgroundColor: si % 2 === 0 ? "#fff" : pcTint }}>
                        <td style={{ padding: "7px 10px", fontWeight: 500, color: "#666", width: "50%", borderBottom: `1px solid ${pcTint2}` }}>
                          {key.replace(/_/g, " ")}
                        </td>
                        <td style={{ padding: "7px 10px", color: sc, fontWeight: 600, borderBottom: `1px solid ${pcTint2}` }}>
                          {String(val)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ))}
            </div>
          </div>
        )}

        {/* ─── CERTIFICATIONS ─── */}
        {product.certificeringen && (
          <div style={{ padding: "0 40px 16px" }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: sc, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ display: "inline-block", width: 4, height: 16, backgroundColor: pc, borderRadius: 2 }} />
              Certificeringen & Normen
            </h2>
            <p style={{ fontSize: 11, color: "#555", lineHeight: 1.7, margin: 0 }}>{product.certificeringen}</p>
          </div>
        )}

        {/* ─── ONDERHOUD ─── */}
        {product.onderhoud && (
          <div style={{ padding: "0 40px 16px" }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: sc, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ display: "inline-block", width: 4, height: 16, backgroundColor: pc, borderRadius: 2 }} />
              Onderhoud
            </h2>
            <p style={{ fontSize: 11, color: "#555", lineHeight: 1.7, margin: 0 }}>{product.onderhoud}</p>
          </div>
        )}

        {/* ─── SPACER ─── */}
        <div style={{ flex: 1 }} />

        {/* ─── FOOTER ─── */}
        <div style={{ backgroundColor: sc, color: "#fff", padding: "16px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10 }}>
          <div>
            <span style={{ fontWeight: 700 }}>{partner.naam}</span>
            {partner.adres && <span style={{ opacity: 0.7, marginLeft: 12 }}>{partner.adres}</span>}
            {(partner.postcode || partner.plaats) && (
              <span style={{ opacity: 0.7, marginLeft: 4 }}>{partner.postcode} {partner.plaats}</span>
            )}
          </div>
          <div style={{ opacity: 0.7, display: "flex", gap: 16 }}>
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
