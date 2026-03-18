import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";
import { voorbladTemplates, HeroDark } from "@/components/offertes/templates/VoorbladTemplates";
import { productTemplates, ProductCards } from "@/components/offertes/templates/ProductTemplates";
import { prijstabelTemplates, PriceModern } from "@/components/offertes/templates/PrijstabelTemplates";
import { energieadviesTemplates, EnergyCards } from "@/components/offertes/templates/EnergieadviesTemplates";
import { voorwaardenTemplates, TermsSimple } from "@/components/offertes/templates/VoorwaardenTemplates";

type Offerte = Database["public"]["Tables"]["offertes"]["Row"];
type Product = Database["public"]["Tables"]["producten"]["Row"];

interface OfferteRegel {
  product_id?: string;
  omschrijving: string;
  offerte_tekst?: string;
  aantal: number;
  prijs_per_stuk: number;
  btw_percentage: number;
  korting_percentage: number;
}

interface PartnerBranding {
  naam: string;
  adres: string | null;
  postcode: string | null;
  plaats: string | null;
  email: string | null;
  telefoonnummer: string | null;
  kvk: string | null;
  btw: string | null;
  website: string | null;
  logo_url: string | null;
  primaire_kleur: string;
  secundaire_kleur: string;
  bedrijfsslogan: string | null;
}

interface SchouwData {
  schouw_nummer: string;
  categorie: string;
  geplande_datum: string;
  status: string;
  consument_naam: string | null;
  gegevens: Json | null;
  notities: string | null;
  aandachtspunten: string | null;
}

const CONFIG = {
  gemiddelde_stroomprijs_kwh: 0.40,
  teruglever_vergoeding_kwh: 0.07,
  dynamisch_contract_winst_factor: 0.15,
  batterij_prijs_per_kwh: 500,
  batterij_rendement: 0.90,
  zelfconsumptie_zonder_batterij: 0.30,
  zelfconsumptie_met_batterij: 0.70,
  levensduur_jaren: 15,
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });

/* ─── Hex to lighter tint ─── */
function hexToTint(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}

/* ─── Category label mapping ─── */
const categoryLabels: Record<string, string> = {
  zonnepanelen: "Zonnepanelen",
  thuisbatterij: "Thuisbatterij",
  warmtepomp: "Warmtepomp",
  laadpaal: "Laadpaal",
  omvormer: "Omvormer",
  accessoires: "Accessoires",
  installatiemateriaal: "Installatiemateriaal",
  isolatie_dak: "Dakisolatie",
  isolatie_muur: "Muurisolatie",
  isolatie_vloer: "Vloerisolatie",
  hr_glas: "HR++ Glas",
  ventilatie: "Ventilatie",
};

export default function OffertePDFPreview() {
  const { id } = useParams<{ id: string }>();
  const [offerte, setOfferte] = useState<Offerte | null>(null);
  const [partner, setPartner] = useState<PartnerBranding | null>(null);
  const [schouw, setSchouw] = useState<SchouwData | null>(null);
  const [producten, setProducten] = useState<Product[]>([]);
  const [adviseur, setAdviseur] = useState<{ voornaam: string; achternaam: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const platformBranding: PartnerBranding = {
    naam: "mijnhuis.nu",
    adres: null, postcode: null, plaats: null,
    email: "info@mijnhuis.nu", telefoonnummer: null,
    kvk: null, btw: null, website: "www.mijnhuis.nu",
    logo_url: null, primaire_kleur: "#5B58E1", secundaire_kleur: "#1a1a2e",
    bedrijfsslogan: "Slim verduurzamen begint hier",
  };

  // Template config — reads from offerte.template_config (the per-offerte design choices)
  const [templateConfig, setTemplateConfig] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: o } = await supabase.from("offertes").select("*").eq("id", id).single();
      if (!o) { setLoading(false); return; }
      setOfferte(o);

      // Read template_config from the offerte itself
      if (o.template_config && typeof o.template_config === "object") {
        setTemplateConfig(o.template_config as Record<string, any>);
      }

      // Partner branding
      if (o.partner_id) {
        const { data: p } = await supabase.from("partners").select("naam, adres, postcode, plaats, email, telefoonnummer, kvk, btw, website, logo_url, primaire_kleur, secundaire_kleur, bedrijfsslogan, feature_flags_json").eq("id", o.partner_id).single();
        if (p) {
          setPartner(p as PartnerBranding);
          // Also read page-level toggles from feature_flags_json (voorblad on/off, etc.)
          if (p.feature_flags_json && typeof p.feature_flags_json === "object") {
            const flags = p.feature_flags_json as Record<string, any>;
            if (flags.offerte_template) {
              // Merge page-level toggles but don't override template_config design choices
              setTemplateConfig(prev => ({ ...flags.offerte_template, ...prev }));
            }
          }
        } else {
          setPartner(platformBranding);
        }
      } else {
        setPartner(platformBranding);
      }

      // Adviseur naam
      const { data: adv } = await supabase.from("users").select("voornaam, achternaam").eq("id", o.adviseur_id).single();
      if (adv) setAdviseur(adv);

      // Schouw
      if (o.include_schouw && o.schouw_id) {
        const { data: s } = await supabase.from("schouwen").select("schouw_nummer, categorie, geplande_datum, status, consument_naam, gegevens, notities, aandachtspunten").eq("id", o.schouw_id).single();
        if (s) setSchouw(s as SchouwData);
      }

      // Producten ophalen via product_ids in regels
      const regels = Array.isArray(o.regels) ? (o.regels as unknown as OfferteRegel[]) : [];
      const productIds = regels.map(r => r.product_id).filter(Boolean) as string[];
      if (productIds.length > 0) {
        const { data: prods } = await supabase.from("producten").select("*").in("id", productIds);
        if (prods) setProducten(prods);
      }

      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div style={{ padding: 32, textAlign: "center", fontFamily: "'Rubik', sans-serif" }}>Laden...</div>;
  if (!offerte || !partner) return <div style={{ padding: 32, textAlign: "center", fontFamily: "'Rubik', sans-serif" }}>Offerte niet gevonden</div>;

  const regels = Array.isArray(offerte.regels) ? (offerte.regels as unknown as OfferteRegel[]) : [];
  const pc = partner.primaire_kleur || "#5B58E1";
  const sc = partner.secundaire_kleur || "#1a1a2e";
  const pcTint = hexToTint(pc, 0.08);
  const pcTint2 = hexToTint(pc, 0.15);

  const logoUrl = partner.logo_url
    ? (partner.logo_url.startsWith("http") ? partner.logo_url : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/partner-assets/${partner.logo_url}`)
    : null;

  // Determine main product category from producten
  const mainCategory = producten.length > 0 ? producten[0].categorie : null;
  const categoryLabel = mainCategory ? (categoryLabels[mainCategory] || mainCategory) : null;

  // Energieadvies berekening — works with schouw data OR product-based fallback
  let energieadvies: { capaciteit: number; besparing: number; terugverdientijd: number; investering: number } | null = null;
  if (offerte.include_energieadvies) {
    // Try schouw-based calculation first
    if (schouw?.gegevens) {
      const g = schouw.gegevens as any;
      const wp = Number(g.zonnepanelen_wp) || 0;
      const verbruik = Number(g.jaarverbruik) || 0;
      if (wp > 0 && verbruik > 0) {
        const jaarOpwekking = wp * 0.85 / 1000;
        const dagelijksOverschot = (jaarOpwekking * (1 - CONFIG.zelfconsumptie_zonder_batterij)) / 365;
        const capaciteit = Math.min(Math.ceil(dagelijksOverschot), 20);
        const extraZelf = jaarOpwekking * (CONFIG.zelfconsumptie_met_batterij - CONFIG.zelfconsumptie_zonder_batterij) * CONFIG.batterij_rendement;
        const prijsverschil = CONFIG.gemiddelde_stroomprijs_kwh - CONFIG.teruglever_vergoeding_kwh;
        const besparing = Math.round(extraZelf * prijsverschil);
        const investering = capaciteit * CONFIG.batterij_prijs_per_kwh;
        const terugverdientijd = besparing > 0 ? Math.round((investering / besparing) * 10) / 10 : 0;
        if (capaciteit >= 1) energieadvies = { capaciteit, besparing, terugverdientijd, investering };
      }
    }
    // Fallback: product-based estimate when schouw data is missing
    if (!energieadvies && producten.length > 0) {
      const totalInvestering = regels.reduce((sum, r) => sum + (r.aantal * r.prijs_per_stuk * (1 - r.korting_percentage / 100)), 0);
      if (totalInvestering > 0) {
        // Estimate ~15% annual ROI for energy products
        const estBesparing = Math.round(totalInvestering * 0.12);
        const terugverdientijd = estBesparing > 0 ? Math.round((totalInvestering / estBesparing) * 10) / 10 : 0;
        energieadvies = {
          capaciteit: 0,
          besparing: estBesparing,
          terugverdientijd,
          investering: totalInvestering,
        };
      }
    }
  }

  const adviseurNaam = adviseur ? `${adviseur.voornaam} ${adviseur.achternaam}` : "Uw adviseur";
  const introTekst = (offerte as any).introductie_tekst as string | null;
  const garantieVw = (offerte as any).garantie_voorwaarden as string | null;
  const installTermijn = (offerte as any).installatie_termijn as string | null;

  // Template config with defaults
  const tc = {
    voorblad: templateConfig?.voorblad ?? true,
    productpagina: templateConfig?.productpagina ?? true,
    energieadvies: templateConfig?.energieadvies ?? true,
    schouwrapport: templateConfig?.schouwrapport ?? true,
    badge_1: templateConfig?.badge_1 ?? "Gecertificeerd installateur",
    badge_2: templateConfig?.badge_2 ?? "Persoonlijk advies",
    badge_3: templateConfig?.badge_3 ?? "Professionele installatie",
    akkoord_tekst: templateConfig?.akkoord_tekst ?? "",
  };

  /* ─── Shared components ─── */
  const PageHeader = () => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 0", borderBottom: `2px solid ${pc}`, marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {logoUrl && <img src={logoUrl} alt={partner.naam} style={{ height: 36, objectFit: "contain" }} />}
        <span style={{ fontWeight: 700, fontSize: 16, color: sc }}>{partner.naam}</span>
      </div>
      <div style={{ fontSize: 10, color: "#888", textAlign: "right" as const }}>
        {partner.email && <span>{partner.email}</span>}
        {partner.telefoonnummer && <span style={{ marginLeft: 12 }}>{partner.telefoonnummer}</span>}
        {partner.website && <span style={{ marginLeft: 12 }}>{partner.website}</span>}
      </div>
    </div>
  );

  const PageFooter = () => (
    <div style={{ borderTop: `2px solid ${pc}`, padding: "12px 0 0", marginTop: "auto", fontSize: 9, color: "#999", textAlign: "center" as const }}>
      <p style={{ margin: 0 }}>
        {partner.naam}
        {partner.adres ? ` • ${partner.adres}` : ""}
        {partner.postcode || partner.plaats ? ` • ${partner.postcode || ""} ${partner.plaats || ""}` : ""}
      </p>
      <p style={{ margin: "2px 0 0" }}>
        {partner.kvk ? `KvK: ${partner.kvk}` : ""}
        {partner.btw ? ` • BTW: ${partner.btw}` : ""}
        {partner.website ? ` • ${partner.website}` : ""}
      </p>
    </div>
  );

  const pageStyle: React.CSSProperties = {
    width: "210mm",
    minHeight: "297mm",
    margin: "0 auto",
    padding: "15mm",
    backgroundColor: "#fff",
    fontFamily: "'Rubik', sans-serif",
    fontSize: 13,
    color: "#1a1a2e",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    pageBreakAfter: "always",
    position: "relative",
  };

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; }
          .no-print { display: none !important; }
          .pdf-page { page-break-after: always; break-after: page; }
          .pdf-page:last-child { page-break-after: avoid; break-after: avoid; }
        }
        @media screen {
          .pdf-page { margin-bottom: 20px; box-shadow: 0 4px 24px rgba(0,0,0,0.12); }
        }
        * { box-sizing: border-box; }
      `}</style>

      {/* Print button */}
      <div className="no-print" style={{ position: "fixed", top: 16, right: 16, zIndex: 50, display: "flex", gap: 8 }}>
        <button onClick={() => window.print()} style={{ padding: "10px 24px", borderRadius: 40, color: "#fff", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", backgroundColor: pc, boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}>
          PDF downloaden / Afdrukken
        </button>
        <button onClick={() => window.history.back()} style={{ padding: "10px 24px", borderRadius: 40, backgroundColor: "#f0f0f0", color: "#555", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>
          Terug
        </button>
      </div>

      {/* ═══════════════ PAGE 1: COVER ═══════════════ */}
      {tc.voorblad && <div className="pdf-page" style={{ ...pageStyle, padding: 0, overflow: "hidden" }}>
        {/* Hero band */}
        <div style={{ backgroundColor: sc, color: "#fff", padding: "60px 50px 40px", position: "relative" }}>
          <div style={{ position: "absolute", top: 0, right: 0, width: 220, height: "100%", background: `linear-gradient(135deg, ${pc}, ${hexToTint(pc, 0.6)})`, clipPath: "polygon(30% 0, 100% 0, 100% 100%, 0% 100%)" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            {logoUrl && <img src={logoUrl} alt={partner.naam} style={{ height: 48, marginBottom: 24, objectFit: "contain" }} />}
            <h1 style={{ fontSize: 36, fontWeight: 800, margin: 0, lineHeight: 1.15 }}>
              Verduurzaam je huis
            </h1>
            <h1 style={{ fontSize: 36, fontWeight: 800, margin: "4px 0 0", lineHeight: 1.15, color: pc }}>
              {categoryLabel ? `met onze ${categoryLabel}` : "met onze oplossing"}
            </h1>
            {producten.length > 0 && (
              <p style={{ fontSize: 18, fontWeight: 500, marginTop: 12, opacity: 0.9 }}>
                {producten[0].merk && producten[0].model ? `${producten[0].merk} ${producten[0].model}` : producten[0].naam}
              </p>
            )}
          </div>
        </div>

        {/* Client info + intro */}
        <div style={{ padding: "40px 50px", flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", gap: 40, marginBottom: 32 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: pc, marginBottom: 8 }}>Opgesteld voor</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: sc, margin: 0 }}>{offerte.klant_naam}</p>
              {offerte.klant_adres && <p style={{ margin: "4px 0 0", color: "#555" }}>{offerte.klant_adres}</p>}
              {(offerte.klant_postcode || offerte.klant_plaats) && (
                <p style={{ margin: "2px 0 0", color: "#555" }}>{offerte.klant_postcode} {offerte.klant_plaats}</p>
              )}
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: pc, marginBottom: 8 }}>Uw adviseur</p>
              <p style={{ fontSize: 16, fontWeight: 600, color: sc, margin: 0 }}>{adviseurNaam}</p>
              <p style={{ margin: "4px 0 0", color: "#555", fontSize: 13 }}>Offertenr: {offerte.offertenummer}</p>
              <p style={{ margin: "2px 0 0", color: "#555", fontSize: 13 }}>{formatDate(offerte.created_at)}</p>
            </div>
          </div>

          {introTekst && (
            <div style={{ backgroundColor: pcTint, borderLeft: `4px solid ${pc}`, padding: "16px 20px", borderRadius: 8, marginBottom: 24 }}>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: "#333" }}>{introTekst}</p>
            </div>
          )}

          {partner.bedrijfsslogan && (
            <p style={{ fontSize: 15, fontStyle: "italic", color: pc, marginTop: "auto", marginBottom: 0 }}>
              "{partner.bedrijfsslogan}"
            </p>
          )}
        </div>

        {/* Bottom badges band */}
        <div style={{ backgroundColor: pcTint, padding: "16px 50px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${pcTint2}` }}>
          <div style={{ display: "flex", gap: 20, fontSize: 11, color: "#666" }}>
            <span>✓ {tc.badge_1}</span>
            <span>✓ {tc.badge_2}</span>
            <span>✓ {tc.badge_3}</span>
          </div>
          {partner.telefoonnummer && (
            <span style={{ fontSize: 12, fontWeight: 600, color: sc }}>
              Neem contact op: {partner.telefoonnummer}
            </span>
          )}
        </div>
      </div>}

      {/* ═══════════════ PAGE 2: PRODUCT INFO ═══════════════ */}
      {tc.productpagina && producten.length > 0 && (
        <div className="pdf-page" style={pageStyle}>
          <PageHeader />
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: sc, margin: "0 0 6px" }}>
              {producten.length === 1 ? "Uw product" : "Uw producten"}
            </h2>
            <div style={{ width: 48, height: 3, backgroundColor: pc, borderRadius: 2, marginBottom: 24 }} />

            {producten.map((prod, pi) => {
              const specs = prod.specs && typeof prod.specs === "object" ? (prod.specs as Record<string, any>) : null;
              const imgUrl = prod.afbeelding_url
                ? (prod.afbeelding_url.startsWith("http") ? prod.afbeelding_url : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/${prod.afbeelding_url}`)
                : null;

              return (
                <div key={prod.id} style={{ marginBottom: pi < producten.length - 1 ? 32 : 0 }}>
                  <div style={{ display: "flex", gap: 24, marginBottom: 16 }}>
                    {imgUrl && (
                      <div style={{ width: 160, height: 160, borderRadius: 12, overflow: "hidden", backgroundColor: "#f8f8fa", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <img src={imgUrl} alt={prod.naam} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: 18, fontWeight: 700, color: sc, margin: "0 0 4px" }}>{prod.naam}</h3>
                      {prod.merk && <p style={{ fontSize: 12, color: pc, fontWeight: 600, margin: "0 0 8px" }}>{prod.merk}{prod.model ? ` — ${prod.model}` : ""}</p>}
                      {prod.omschrijving && <p style={{ fontSize: 12, color: "#555", lineHeight: 1.6, margin: 0 }}>{prod.omschrijving}</p>}
                      <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
                        {prod.garantie_jaren && (
                          <div style={{ backgroundColor: pcTint, borderRadius: 8, padding: "8px 14px", fontSize: 11 }}>
                            <span style={{ fontWeight: 700, color: pc }}>{prod.garantie_jaren} jaar</span>
                            <span style={{ color: "#666", marginLeft: 4 }}>garantie</span>
                          </div>
                        )}
                        {prod.certificeringen && (
                          <div style={{ backgroundColor: pcTint, borderRadius: 8, padding: "8px 14px", fontSize: 11 }}>
                            <span style={{ color: "#666" }}>Certificering: </span>
                            <span style={{ fontWeight: 600, color: sc }}>{prod.certificeringen}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Specs table */}
                  {specs && Object.keys(specs).length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: sc, margin: "0 0 8px" }}>Technische specificaties</p>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                        <tbody>
                          {Object.entries(specs).map(([key, val], si) => (
                            <tr key={key} style={{ backgroundColor: si % 2 === 0 ? "#fff" : pcTint }}>
                              <td style={{ padding: "6px 10px", fontWeight: 500, color: "#555", width: "40%", borderBottom: "1px solid #f0f0f0" }}>
                                {key.replace(/_/g, " ")}
                              </td>
                              <td style={{ padding: "6px 10px", color: sc, fontWeight: 600, borderBottom: "1px solid #f0f0f0" }}>
                                {String(val)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Onderhoud */}
                  {prod.onderhoud && (
                    <div style={{ marginTop: 12, fontSize: 11, color: "#666" }}>
                      <span style={{ fontWeight: 600 }}>Onderhoud: </span>{prod.onderhoud}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Datasheet links */}
          {producten.some(p => (p as any).datasheet_url && (p as any).datasheet_type === "fabrikant") && (
            <div style={{ marginTop: 20, padding: "12px 16px", backgroundColor: pcTint, borderRadius: 8 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: sc, margin: "0 0 6px" }}>Productdatasheets</p>
              {producten.filter(p => (p as any).datasheet_url && (p as any).datasheet_type === "fabrikant").map(p => (
                <p key={p.id} style={{ fontSize: 11, color: "#555", margin: "2px 0" }}>
                  📄 {p.naam} — Fabrikant-datasheet beschikbaar (zie bijlage)
                </p>
              ))}
            </div>
          )}

          <PageFooter />
        </div>
      )}

      {/* ═══════════════ PAGE 3: ENERGIEADVIES / BESPARINGEN ═══════════════ */}
      {tc.energieadvies && energieadvies && (
        <div className="pdf-page" style={pageStyle}>
          <PageHeader />
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: sc, margin: "0 0 6px" }}>
              Uw besparing & rendement
            </h2>
            <div style={{ width: 48, height: 3, backgroundColor: pc, borderRadius: 2, marginBottom: 24 }} />

            <p style={{ fontSize: 13, color: "#555", lineHeight: 1.7, marginBottom: 28 }}>
              Op basis van de schouwgegevens en uw energieverbruik hebben wij berekend wat de geschatte besparing en terugverdientijd is van de voorgestelde oplossing.
            </p>

            {/* Highlight cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
              {[
                ...(energieadvies.capaciteit > 0 ? [{ label: "Aanbevolen capaciteit", value: `${energieadvies.capaciteit} kWh`, icon: "⚡" }] : []),
                { label: "Geschatte investering", value: formatCurrency(energieadvies.investering), icon: "💰" },
                { label: "Jaarlijkse besparing", value: formatCurrency(energieadvies.besparing), icon: "📉" },
                { label: "Terugverdientijd", value: `${energieadvies.terugverdientijd} jaar`, icon: "⏱" },
              ].map((c, i) => (
                <div key={i} style={{ backgroundColor: i === 3 ? pc : pcTint, borderRadius: 12, padding: "20px 24px", color: i === 3 ? "#fff" : sc }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{c.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 500, opacity: 0.8, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{c.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{c.value}</div>
                </div>
              ))}
            </div>

            {/* Comparison */}
            <div style={{ border: `1px solid ${pcTint2}`, borderRadius: 12, overflow: "hidden", marginBottom: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                <div style={{ padding: "16px 20px", backgroundColor: "#f8f8fa" }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#999", margin: "0 0 8px", textTransform: "uppercase" }}>Zonder oplossing</p>
                  <p style={{ fontSize: 12, color: "#666", margin: "4px 0" }}>Zelfconsumptie: {Math.round(CONFIG.zelfconsumptie_zonder_batterij * 100)}%</p>
                  <p style={{ fontSize: 12, color: "#666", margin: "4px 0" }}>Terugleververgoeding: {formatCurrency(CONFIG.teruglever_vergoeding_kwh)}/kWh</p>
                </div>
                <div style={{ padding: "16px 20px", backgroundColor: pcTint }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: pc, margin: "0 0 8px", textTransform: "uppercase" }}>Met oplossing</p>
                  <p style={{ fontSize: 12, color: "#333", margin: "4px 0" }}>Zelfconsumptie: {Math.round(CONFIG.zelfconsumptie_met_batterij * 100)}%</p>
                  <p style={{ fontSize: 12, color: "#333", fontWeight: 600, margin: "4px 0" }}>Besparing: {formatCurrency(energieadvies.besparing)} per jaar</p>
                </div>
              </div>
            </div>

            {/* ROI bar */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: sc, margin: "0 0 10px" }}>Verwacht rendement over {CONFIG.levensduur_jaren} jaar</p>
              <div style={{ height: 24, backgroundColor: "#f0f0f0", borderRadius: 12, overflow: "hidden", position: "relative" }}>
                <div style={{
                  height: "100%",
                  width: `${Math.min((energieadvies.besparing * CONFIG.levensduur_jaren / energieadvies.investering) * 100, 100)}%`,
                  background: `linear-gradient(90deg, ${pc}, ${hexToTint(pc, 0.6)})`,
                  borderRadius: 12,
                  display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 10,
                  fontSize: 10, fontWeight: 700, color: "#fff"
                }}>
                  {Math.round((energieadvies.besparing * CONFIG.levensduur_jaren / energieadvies.investering) * 100)}%
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#999", marginTop: 4 }}>
                <span>0 jaar</span>
                <span>{Math.round(CONFIG.levensduur_jaren / 2)} jaar</span>
                <span>{CONFIG.levensduur_jaren} jaar</span>
              </div>
            </div>

            <p style={{ fontSize: 10, color: "#aaa", fontStyle: "italic", marginTop: 16 }}>
              * Dit advies is indicatief en gebaseerd op de opgegeven schouwgegevens en actuele energieprijzen. Werkelijke resultaten kunnen afwijken door seizoensinvloeden, verbruikspatronen en energieprijsontwikkelingen.
            </p>
          </div>
          <PageFooter />
        </div>
      )}

      {/* ═══════════════ PAGE 4: FORMELE OFFERTE ═══════════════ */}
      <div className="pdf-page" style={pageStyle}>
        <PageHeader />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 28 }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: sc, margin: 0 }}>Opdrachtbevestiging</h2>
              <div style={{ width: 48, height: 3, backgroundColor: pc, borderRadius: 2, marginTop: 6 }} />
            </div>
            <div style={{ textAlign: "right" as const, fontSize: 12 }}>
              <p style={{ margin: "2px 0", color: "#888" }}>Offertenummer: <strong style={{ color: sc }}>{offerte.offertenummer}</strong></p>
              <p style={{ margin: "2px 0", color: "#888" }}>Datum: <strong style={{ color: sc }}>{formatDate(offerte.created_at)}</strong></p>
              <p style={{ margin: "2px 0", color: "#888" }}>Geldig tot: <strong style={{ color: sc }}>{formatDate(offerte.geldig_tot)}</strong></p>
            </div>
          </div>

          {/* Client block */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
            <div style={{ backgroundColor: pcTint, borderRadius: 10, padding: "16px 20px" }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: pc, margin: "0 0 8px" }}>Opgesteld voor</p>
              <p style={{ fontWeight: 600, margin: "0 0 4px", color: sc }}>{offerte.klant_naam}</p>
              {offerte.klant_adres && <p style={{ margin: "2px 0", fontSize: 12, color: "#555" }}>{offerte.klant_adres}</p>}
              {(offerte.klant_postcode || offerte.klant_plaats) && <p style={{ margin: "2px 0", fontSize: 12, color: "#555" }}>{offerte.klant_postcode} {offerte.klant_plaats}</p>}
              <p style={{ margin: "2px 0", fontSize: 12, color: "#555" }}>{offerte.klant_email}</p>
              {offerte.klant_telefoon && <p style={{ margin: "2px 0", fontSize: 12, color: "#555" }}>{offerte.klant_telefoon}</p>}
            </div>
            <div style={{ backgroundColor: pcTint, borderRadius: 10, padding: "16px 20px" }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: pc, margin: "0 0 8px" }}>Opgesteld door</p>
              <p style={{ fontWeight: 600, margin: "0 0 4px", color: sc }}>{partner.naam}</p>
              {partner.adres && <p style={{ margin: "2px 0", fontSize: 12, color: "#555" }}>{partner.adres}</p>}
              {(partner.postcode || partner.plaats) && <p style={{ margin: "2px 0", fontSize: 12, color: "#555" }}>{partner.postcode} {partner.plaats}</p>}
              {partner.email && <p style={{ margin: "2px 0", fontSize: 12, color: "#555" }}>{partner.email}</p>}
              {partner.telefoonnummer && <p style={{ margin: "2px 0", fontSize: 12, color: "#555" }}>{partner.telefoonnummer}</p>}
            </div>
          </div>

          {/* Price table */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 16 }}>
            <thead>
              <tr>
                <th style={{ backgroundColor: sc, color: "#fff", padding: "10px 12px", textAlign: "left", fontWeight: 600, fontSize: 11 }}>Aantal</th>
                <th style={{ backgroundColor: sc, color: "#fff", padding: "10px 12px", textAlign: "left", fontWeight: 600, fontSize: 11 }}>Omschrijving</th>
                <th style={{ backgroundColor: sc, color: "#fff", padding: "10px 12px", textAlign: "right", fontWeight: 600, fontSize: 11 }}>Prijs excl. BTW</th>
                <th style={{ backgroundColor: sc, color: "#fff", padding: "10px 12px", textAlign: "right", fontWeight: 600, fontSize: 11 }}>Korting</th>
                <th style={{ backgroundColor: sc, color: "#fff", padding: "10px 12px", textAlign: "right", fontWeight: 600, fontSize: 11 }}>Subtotaal</th>
              </tr>
            </thead>
            <tbody>
              {regels.map((r, i) => {
                const sub = r.aantal * r.prijs_per_stuk * (1 - r.korting_percentage / 100);
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${pcTint2}`, backgroundColor: i % 2 === 0 ? "#fff" : pcTint }}>
                    <td style={{ padding: "10px 12px", fontWeight: 500 }}>{r.aantal}</td>
                    <td style={{ padding: "10px 12px" }}>{r.omschrijving}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right" }}>{formatCurrency(r.prijs_per_stuk)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: r.korting_percentage > 0 ? pc : "#ccc" }}>{r.korting_percentage > 0 ? `${r.korting_percentage}%` : "—"}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600 }}>{formatCurrency(sub)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
            <div style={{ width: 260 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 12, color: "#666" }}>
                <span>Subtotaal excl. BTW</span><span>{formatCurrency(offerte.subtotaal)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 12, color: "#666" }}>
                <span>BTW</span><span>{formatCurrency(offerte.btw_bedrag)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", fontSize: 16, fontWeight: 800, color: sc, borderTop: `3px solid ${pc}`, marginTop: 4 }}>
                <span>Totaal incl. BTW</span><span>{formatCurrency(offerte.totaal_bedrag)}</span>
              </div>
            </div>
          </div>

          {/* Garantie */}
          {garantieVw && (
            <div style={{ backgroundColor: pcTint, borderRadius: 10, padding: "14px 18px", marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: sc, margin: "0 0 6px" }}>Garantievoorwaarden</p>
              <p style={{ fontSize: 11, color: "#555", margin: 0, lineHeight: 1.6 }}>{garantieVw}</p>
            </div>
          )}

          {/* Installatietermijn */}
          {installTermijn && (
            <p style={{ fontSize: 12, color: "#555", marginBottom: 16 }}>
              <strong style={{ color: sc }}>Installatietermijn:</strong> {installTermijn}
            </p>
          )}

          {/* Betalingsvoorwaarden */}
          {offerte.betalingsvoorwaarden && (
            <p style={{ fontSize: 11, color: "#666", marginBottom: 16 }}>
              <strong>Betalingsvoorwaarden:</strong> {offerte.betalingsvoorwaarden}
            </p>
          )}

          {/* Notities */}
          {offerte.notities && (
            <div style={{ marginBottom: 16, fontSize: 11, color: "#666" }}>
              <strong>Opmerkingen:</strong>
              <p style={{ margin: "4px 0 0", whiteSpace: "pre-wrap" }}>{offerte.notities}</p>
            </div>
          )}

          {/* Akkoord tekst */}
          {tc.akkoord_tekst && (
            <div style={{ backgroundColor: pcTint, borderRadius: 10, padding: "14px 18px", marginBottom: 16 }}>
              <p style={{ fontSize: 11, color: "#555", margin: 0, lineHeight: 1.6 }}>{tc.akkoord_tekst}</p>
            </div>
          )}

          {/* Signature section */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 20, borderTop: `1px solid ${pcTint2}`, paddingTop: 20 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: sc, margin: "0 0 8px" }}>Voor akkoord — {partner.naam}</p>
              <p style={{ fontSize: 12, color: "#555", margin: "4px 0" }}>{adviseurNaam}</p>
              <p style={{ fontSize: 12, color: "#888", margin: "4px 0" }}>Datum: {formatDate(offerte.created_at)}</p>
              <div style={{ borderBottom: "1px solid #ccc", height: 40, marginTop: 16 }} />
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: sc, margin: "0 0 8px" }}>Voor akkoord — Klant</p>
              <p style={{ fontSize: 12, color: "#555", margin: "4px 0" }}>{offerte.klant_naam}</p>
              <p style={{ fontSize: 12, color: "#888", margin: "4px 0" }}>Datum: ____________________</p>
              <div style={{ borderBottom: "1px solid #ccc", height: 40, marginTop: 16 }} />
            </div>
          </div>
        </div>
        <PageFooter />
      </div>

      {/* ═══════════════ PAGE 5: SCHOUWRAPPORT (optioneel) ═══════════════ */}
      {tc.schouwrapport && offerte.include_schouw && schouw && (
        <div className="pdf-page" style={pageStyle}>
          <PageHeader />
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: sc, margin: "0 0 6px" }}>Schouwrapport</h2>
            <div style={{ width: 48, height: 3, backgroundColor: pc, borderRadius: 2, marginBottom: 24 }} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
              {[
                { label: "Schouwnummer", value: schouw.schouw_nummer },
                { label: "Categorie", value: categoryLabels[schouw.categorie] || schouw.categorie },
                { label: "Datum", value: formatDate(schouw.geplande_datum) },
                { label: "Status", value: schouw.status },
                ...(schouw.consument_naam ? [{ label: "Consument", value: schouw.consument_naam }] : []),
              ].map((item, i) => (
                <div key={i} style={{ backgroundColor: pcTint, borderRadius: 8, padding: "12px 16px" }}>
                  <p style={{ fontSize: 10, fontWeight: 600, color: pc, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 0.5 }}>{item.label}</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: sc, margin: 0 }}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Technische gegevens */}
            {schouw.gegevens && typeof schouw.gegevens === "object" && Object.keys(schouw.gegevens as object).length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: sc, margin: "0 0 12px" }}>Technische gegevens</p>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <tbody>
                    {Object.entries(schouw.gegevens as Record<string, any>).map(([key, val], si) => (
                      <tr key={key} style={{ backgroundColor: si % 2 === 0 ? "#fff" : pcTint }}>
                        <td style={{ padding: "8px 12px", fontWeight: 500, color: "#555", width: "40%", borderBottom: "1px solid #f0f0f0" }}>
                          {key.replace(/_/g, " ")}
                        </td>
                        <td style={{ padding: "8px 12px", color: sc, fontWeight: 600, borderBottom: "1px solid #f0f0f0" }}>
                          {String(val)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Aandachtspunten */}
            {schouw.aandachtspunten && (
              <div style={{ backgroundColor: "#FFF8E1", borderLeft: `4px solid #FFA000`, borderRadius: 8, padding: "14px 18px", marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#E65100", margin: "0 0 6px" }}>⚠ Aandachtspunten</p>
                <p style={{ fontSize: 12, color: "#555", margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{schouw.aandachtspunten}</p>
              </div>
            )}

            {/* Notities */}
            {schouw.notities && (
              <div style={{ marginTop: 8 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: sc, margin: "0 0 6px" }}>Opmerkingen</p>
                <p style={{ fontSize: 12, color: "#555", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{schouw.notities}</p>
              </div>
            )}
          </div>
          <PageFooter />
        </div>
      )}
    </>
  );
}
