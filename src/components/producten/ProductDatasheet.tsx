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

// ─── Shared sub-components ───

const PageHeader: React.FC<{
  partner: PartnerBranding;
  pc: string;
  sc: string;
  logoUrl: string | null;
  showTitleBar?: boolean;
  categorie?: string;
}> = ({ partner, pc, sc, logoUrl, showTitleBar = false, categorie }) => (
  <>
    <div style={{
      padding: "16px 40px", display: "flex", justifyContent: "space-between", alignItems: "center",
      borderBottom: `3px solid ${pc}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {logoUrl && <img src={logoUrl} alt={partner.naam} style={{ height: 28, objectFit: "contain" }} />}
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: sc, letterSpacing: -0.3 }}>{partner.naam}</div>
          {partner.bedrijfsslogan && (
            <div style={{ fontSize: 8.5, color: "#999", marginTop: 1 }}>{partner.bedrijfsslogan}</div>
          )}
        </div>
      </div>
      <div style={{ textAlign: "right", fontSize: 8, color: "#888", lineHeight: 1.7 }}>
        {partner.telefoonnummer && <div>{partner.telefoonnummer}</div>}
        {partner.email && <div>{partner.email}</div>}
        {partner.website && <div>{partner.website}</div>}
      </div>
    </div>
    {showTitleBar && (
      <div style={{
        backgroundColor: pc, padding: "8px 40px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ color: isLightColor(pc) ? sc : "#fff", fontSize: 9.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.5 }}>
          Technisch Specificatieblad
        </div>
        {categorie && (
          <div style={{ color: isLightColor(pc) ? sc : "#fff", fontSize: 8.5, opacity: 0.8 }}>
            {categorieLabels[categorie] || categorie}
          </div>
        )}
      </div>
    )}
  </>
);

const PageFooter: React.FC<{
  partner: PartnerBranding;
  sc: string;
  logoUrl: string | null;
  pageNum: number;
  totalPages: number;
}> = ({ partner, sc, logoUrl, pageNum, totalPages }) => (
  <div style={{
    backgroundColor: sc, padding: "12px 40px",
    display: "flex", justifyContent: "space-between", alignItems: "center",
    fontSize: 8, color: "rgba(255,255,255,0.7)", marginTop: "auto",
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {logoUrl && <img src={logoUrl} alt="" style={{ height: 14, objectFit: "contain", opacity: 0.7, filter: "brightness(10)" }} />}
      <span style={{ fontWeight: 700, color: "#fff" }}>{partner.naam}</span>
      {partner.adres && <span>{partner.adres}</span>}
      {(partner.postcode || partner.plaats) && <span>{partner.postcode} {partner.plaats}</span>}
    </div>
    <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
      {partner.kvk && <span>KvK {partner.kvk}</span>}
      {partner.btw && <span>BTW {partner.btw}</span>}
      <span style={{ fontWeight: 700, color: "#fff" }}>Pagina {pageNum} / {totalPages}</span>
    </div>
  </div>
);

const A4Page: React.FC<{
  children: React.ReactNode;
  partner: PartnerBranding;
  pc: string;
  sc: string;
  logoUrl: string | null;
  pageNum: number;
  totalPages: number;
  isFirstPage?: boolean;
  categorie?: string;
}> = ({ children, partner, pc, sc, logoUrl, pageNum, totalPages, isFirstPage, categorie }) => (
  <div style={{
    width: "210mm", height: "297mm", margin: "0 auto", padding: 0,
    backgroundColor: "#fff", fontFamily: "'Rubik', 'Inter', -apple-system, sans-serif",
    fontSize: 11, color: sc, display: "flex", flexDirection: "column",
    position: "relative", overflow: "hidden",
    pageBreakAfter: "always", boxSizing: "border-box",
  }}>
    <PageHeader partner={partner} pc={pc} sc={sc} logoUrl={logoUrl} showTitleBar={isFirstPage} categorie={categorie} />
    {!isFirstPage && (
      <div style={{ backgroundColor: pc, height: 3 }} />
    )}
    <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {children}
    </div>
    <PageFooter partner={partner} sc={sc} logoUrl={logoUrl} pageNum={pageNum} totalPages={totalPages} />
  </div>
);

// ─── Spec Table rendering ───

const SpecGroupTable: React.FC<{
  group: { title: string; entries: [string, string][] };
  pc: string;
  sc: string;
}> = ({ group, pc, sc }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <div style={{ width: 3, height: 13, backgroundColor: pc, borderRadius: 2 }} />
      <h2 style={{
        fontSize: 11, fontWeight: 700, color: sc, margin: 0,
        textTransform: "uppercase", letterSpacing: 0.6,
      }}>
        {group.title}
      </h2>
    </div>
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
      <tbody>
        {group.entries.map(([label, val], i) => (
          <tr key={label}>
            <td style={{
              padding: "4px 10px", width: "50%", color: "#666", fontWeight: 500,
              borderBottom: "1px solid #f0f0f0",
              backgroundColor: i % 2 === 0 ? "#fafafa" : "#fff",
            }}>
              {label}
            </td>
            <td style={{
              padding: "4px 10px", color: sc, fontWeight: 600,
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
);

// ─── Main component ───

const ProductDatasheet: React.FC<ProductDatasheetProps> = ({ product, partner }) => {
  const pc = partner.primaire_kleur || "#5B58E1";
  const sc = partner.secundaire_kleur || "#1a1a2e";

  const logoUrl = partner.logo_url
    ? (partner.logo_url.startsWith("http") ? partner.logo_url : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/partner-assets/${partner.logo_url}`)
    : null;

  const imgUrl = product.afbeelding_url
    ? (product.afbeelding_url.startsWith("http") ? product.afbeelding_url : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/${product.afbeelding_url}`)
    : null;

  const allSpecs = product.specs && typeof product.specs === "object" ? product.specs : {};

  // Group specs
  const grouped = getGroupedSpecs(product.categorie);
  const specGroups: { title: string; entries: [string, string][] }[] = [];

  for (const [groupName, defs] of Object.entries(grouped)) {
    const entries: [string, string][] = [];
    for (const def of defs) {
      const val = allSpecs[def.key];
      if (val && String(val).trim() !== "" && String(val).toLowerCase() !== "null") {
        entries.push([def.label + (def.unit ? ` (${def.unit})` : ""), String(val)]);
      }
    }
    if (entries.length > 0) specGroups.push({ title: groupName, entries });
  }

  // Custom specs
  const definedKeys = new Set(Object.values(grouped).flat().map(d => d.key));
  const customEntries: [string, string][] = Object.entries(allSpecs)
    .filter(([k, v]) => !definedKeys.has(k) && v && String(v).trim() !== "" && String(v).toLowerCase() !== "null")
    .map(([k, v]) => [k.replace(/_/g, " "), String(v)]);
  if (customEntries.length > 0) specGroups.push({ title: "Overige specificaties", entries: customEntries });

  // ─── Split content into pages ───
  // Page 1: Hero + first N spec groups
  // Page 2+: remaining spec groups + certifications + onderhoud
  // Estimate: hero takes ~14 rows, each spec row ~1 row, group header ~2 rows
  // A4 content area fits ~38 spec rows on page 1, ~48 on subsequent pages

  const MAX_ROWS_PAGE1 = 30; // Conservative for hero section
  const MAX_ROWS_CONTINUATION = 42;

  // Calculate rows per group
  const groupsWithRows = specGroups.map(g => ({
    ...g,
    rowCount: g.entries.length + 2, // entries + header spacing
  }));

  // Extra sections
  const extraSections: { type: "cert" | "onderhoud"; content: string; rows: number }[] = [];
  if (product.certificeringen) {
    extraSections.push({ type: "cert", content: product.certificeringen, rows: 5 });
  }
  if (product.onderhoud) {
    extraSections.push({ type: "onderhoud", content: product.onderhoud, rows: 4 });
  }

  // Distribute groups across pages
  type PageContent = {
    groups: typeof specGroups;
    extras: typeof extraSections;
  };
  const pages: PageContent[] = [];
  let currentPage: PageContent = { groups: [], extras: [] };
  let currentRows = 0;
  const maxForPage = (pageIdx: number) => pageIdx === 0 ? MAX_ROWS_PAGE1 : MAX_ROWS_CONTINUATION;

  for (const g of groupsWithRows) {
    if (currentRows + g.rowCount > maxForPage(pages.length) && currentPage.groups.length > 0) {
      pages.push(currentPage);
      currentPage = { groups: [], extras: [] };
      currentRows = 0;
    }
    currentPage.groups.push(g);
    currentRows += g.rowCount;
  }

  // Add extra sections
  for (const extra of extraSections) {
    if (currentRows + extra.rows > maxForPage(pages.length) && (currentPage.groups.length > 0 || currentPage.extras.length > 0)) {
      pages.push(currentPage);
      currentPage = { groups: [], extras: [] };
      currentRows = 0;
    }
    currentPage.extras.push(extra);
    currentRows += extra.rows;
  }

  if (currentPage.groups.length > 0 || currentPage.extras.length > 0) {
    pages.push(currentPage);
  }

  // Ensure at least 1 page
  if (pages.length === 0) pages.push({ groups: [], extras: [] });

  const totalPages = pages.length;

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

      {pages.map((page, pageIdx) => (
        <A4Page
          key={pageIdx}
          partner={partner}
          pc={pc}
          sc={sc}
          logoUrl={logoUrl}
          pageNum={pageIdx + 1}
          totalPages={totalPages}
          isFirstPage={pageIdx === 0}
          categorie={product.categorie}
        >
          {/* ─── PAGE 1 HERO ─── */}
          {pageIdx === 0 && (
            <>
              <div style={{
                display: "flex", padding: "24px 40px 20px", gap: 28, alignItems: "flex-start",
              }}>
                {imgUrl && (
                  <div style={{
                    width: 140, height: 140, borderRadius: 10, overflow: "hidden",
                    backgroundColor: "#f7f8fa", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: "1px solid #eee",
                  }}>
                    <img src={imgUrl} alt={product.naam} style={{ maxWidth: "85%", maxHeight: "85%", objectFit: "contain" }} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h1 style={{ fontSize: 22, fontWeight: 800, color: sc, margin: "0 0 4px", lineHeight: 1.1, letterSpacing: -0.5 }}>
                    {product.naam}
                  </h1>
                  {product.merk && (
                    <p style={{ fontSize: 12, color: pc, fontWeight: 600, margin: "0 0 10px" }}>
                      {product.merk}{product.model ? ` \u2014 ${product.model}` : ""}
                    </p>
                  )}
                  {product.omschrijving && (
                    <p style={{ fontSize: 10, color: "#555", lineHeight: 1.7, margin: 0, maxWidth: 420 }}>
                      {product.omschrijving}
                    </p>
                  )}
                  <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                    {product.garantie_jaren && (
                      <span style={{
                        fontSize: 8.5, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                        backgroundColor: hexToRgba(pc, 0.08), color: pc,
                        border: `1px solid ${hexToRgba(pc, 0.15)}`,
                      }}>
                        {product.garantie_jaren} jaar garantie
                      </span>
                    )}
                    {product.certificeringen && (
                      <span style={{
                        fontSize: 8.5, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                        backgroundColor: "#f0fdf4", color: "#166534",
                        border: "1px solid #bbf7d0",
                      }}>
                        Gecertificeerd
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ margin: "0 40px", height: 1, backgroundColor: "#e5e7eb" }} />
            </>
          )}

          {/* ─── CONTINUATION HEADER ─── */}
          {pageIdx > 0 && (
            <div style={{ padding: "12px 40px 4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 10, color: "#999", fontWeight: 500 }}>
                {product.naam} — Specificaties (vervolg)
              </span>
            </div>
          )}

          {/* ─── SPEC GROUPS ─── */}
          <div style={{ padding: pageIdx === 0 ? "16px 40px 8px" : "8px 40px 8px", flex: 1 }}>
            {page.groups.map((group) => (
              <SpecGroupTable key={group.title} group={group} pc={pc} sc={sc} />
            ))}

            {/* Extra sections */}
            {page.extras.map((extra) => (
              <div key={extra.type} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 3, height: 13, backgroundColor: pc, borderRadius: 2 }} />
                  <h2 style={{ fontSize: 11, fontWeight: 700, color: sc, margin: 0, textTransform: "uppercase", letterSpacing: 0.6 }}>
                    {extra.type === "cert" ? "Certificeringen & Normen" : "Onderhoud"}
                  </h2>
                </div>
                <div style={{
                  padding: "8px 12px", backgroundColor: "#fafafa", borderRadius: 6,
                  border: "1px solid #f0f0f0", fontSize: 10, color: "#555", lineHeight: 1.6,
                }}>
                  {extra.content}
                </div>
              </div>
            ))}

            {/* AI Disclaimer on last page */}
            {pageIdx === pages.length - 1 && (
              <div style={{
                marginTop: "auto", padding: "8px 12px", backgroundColor: "#fffbeb",
                borderRadius: 6, border: "1px solid #fde68a", fontSize: 8,
                color: "#92400e", lineHeight: 1.5, fontStyle: "italic",
              }}>
                ⚠ Dit specificatieblad kan automatisch gegenereerde informatie bevatten. Controleer alle waarden handmatig.
                Aan de inhoud van dit document kunnen geen rechten worden ontleend.
              </div>
            )}
          </div>
        </A4Page>
      ))}
    </>
  );
};

export default ProductDatasheet;
