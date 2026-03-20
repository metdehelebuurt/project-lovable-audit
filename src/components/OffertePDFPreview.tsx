import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";
import { voorbladTemplates, HeroDark } from "@/components/offertes/templates/VoorbladTemplates";
import { productTemplates, ProductCards } from "@/components/offertes/templates/ProductTemplates";
import ProductDatasheet from "@/components/producten/ProductDatasheet";
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
  korting_bedrag?: number;
  korting_type?: "percentage" | "bedrag";
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

  // Template config with defaults — design variant keys + section toggles + custom text
  const tc = {
    // Section toggles
    voorblad: templateConfig?.secties_voorblad ?? templateConfig?.voorblad ?? true,
    productpagina: templateConfig?.secties_producten ?? templateConfig?.productpagina ?? true,
    energieadvies: templateConfig?.secties_energieadvies ?? templateConfig?.energieadvies ?? true,
    schouwrapport: templateConfig?.secties_schouwrapport ?? templateConfig?.schouwrapport ?? true,
    // Custom text
    badge_1: templateConfig?.badge_1 ?? "Gecertificeerd installateur",
    badge_2: templateConfig?.badge_2 ?? "Persoonlijk advies",
    badge_3: templateConfig?.badge_3 ?? "Professionele installatie",
    akkoord_tekst: templateConfig?.akkoord_tekst ?? "",
    // Design variant keys
    voorblad_variant: (templateConfig?.voorblad as string) || "hero-dark",
    producten_variant: (templateConfig?.producten as string) || "product-cards",
    prijstabel_variant: (templateConfig?.prijstabel as string) || "price-modern",
    energieadvies_variant: (templateConfig?.energieadvies as string) || "energy-cards",
    voorwaarden_variant: (templateConfig?.voorwaarden as string) || "terms-simple",
  };

  // Resolve template components
  const VoorbladComp = voorbladTemplates[tc.voorblad_variant] || HeroDark;
  const ProductComp = productTemplates[tc.producten_variant] || ProductCards;
  const PrijsComp = prijstabelTemplates[tc.prijstabel_variant] || PriceModern;
  const EnergieComp = energieadviesTemplates[tc.energieadvies_variant] || EnergyCards;
  const VoorwaardenComp = voorwaardenTemplates[tc.voorwaarden_variant] || TermsSimple;

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

      {/* ═══════════════ PAGE 1: COVER (dynamic template) ═══════════════ */}
      {tc.voorblad && <div className="pdf-page" style={{ ...pageStyle, padding: 0, overflow: "hidden" }}>
        <VoorbladComp
          pc={pc}
          sc={sc}
          pcTint={pcTint}
          logoUrl={logoUrl}
          partnerNaam={partner.naam}
          klantNaam={offerte.klant_naam}
          offertenummer={offerte.offertenummer}
          adviseurNaam={adviseurNaam}
          datum={formatDate(offerte.created_at)}
          categoryLabel={categoryLabel || null}
          productNaam={producten.length > 0 ? (producten[0].merk && producten[0].model ? `${producten[0].merk} ${producten[0].model}` : producten[0].naam) : null}
          slogan={partner.bedrijfsslogan || null}
          introTekst={introTekst}
          badges={[tc.badge_1, tc.badge_2, tc.badge_3]}
          telefoon={partner.telefoonnummer || null}
          klantAdres={offerte.klant_adres || null}
          klantPostcode={offerte.klant_postcode || null}
          klantPlaats={offerte.klant_plaats || null}
        />
      </div>}

      {/* ═══════════════ PAGE 2: PRODUCT INFO (dynamic template) ═══════════════ */}
      {tc.productpagina && producten.length > 0 && (
        <div className="pdf-page" style={pageStyle}>
          <PageHeader />
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: sc, margin: "0 0 6px" }}>
              {producten.length === 1 ? "Uw product" : "Uw producten"}
            </h2>
            <div style={{ width: 48, height: 3, backgroundColor: pc, borderRadius: 2, marginBottom: 24 }} />
            <ProductComp
              pc={pc}
              sc={sc}
              pcTint={pcTint}
              producten={producten.map(p => ({
                naam: p.naam,
                merk: p.merk,
                model: p.model,
                omschrijving: p.omschrijving,
                afbeelding_url: p.afbeelding_url,
                garantie_jaren: p.garantie_jaren,
                certificeringen: p.certificeringen,
                specs: p.specs && typeof p.specs === "object" ? (p.specs as Record<string, any>) : null,
                onderhoud: p.onderhoud,
              }))}
            />
          </div>
          <PageFooter />
        </div>
      )}

      {/* ═══════════════ DATASHEET PAGES ═══════════════ */}
      {producten.filter(p => p.datasheet_url && p.datasheet_type).map(p => {
        const dsUrl = p.datasheet_url!.startsWith("http")
          ? p.datasheet_url!
          : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/${p.datasheet_url}`;

        if (p.datasheet_type === "fabrikant") {
          return (
            <div key={`ds-${p.id}`} className="pdf-page" style={{ ...pageStyle, padding: 0 }}>
              <iframe
                src={dsUrl}
                title={`Datasheet ${p.naam}`}
                style={{ width: "100%", height: "100%", border: "none", minHeight: "297mm" }}
              />
            </div>
          );
        }

        if (p.datasheet_type === "gegenereerd") {
          const specs = p.specs && typeof p.specs === "object" && !Array.isArray(p.specs)
            ? (p.specs as Record<string, string>) : null;
          return (
            <div key={`ds-${p.id}`} className="pdf-page" style={{ margin: "0 auto", pageBreakAfter: "always" }}>
              <ProductDatasheet
                product={{
                  naam: p.naam,
                  merk: p.merk,
                  model: p.model,
                  categorie: p.categorie,
                  omschrijving: p.omschrijving,
                  afbeelding_url: p.afbeelding_url,
                  specs,
                  certificeringen: p.certificeringen,
                  garantie_jaren: p.garantie_jaren,
                  prijs_excl_btw: p.prijs_excl_btw,
                  onderhoud: p.onderhoud,
                  installatie_instructies: p.installatie_instructies,
                }}
                partner={partner}
              />
            </div>
          );
        }

        return null;
      })}

      {/* ═══════════════ PAGE 3: ENERGIEADVIES (dynamic template) ═══════════════ */}
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
            <EnergieComp
              pc={pc}
              sc={sc}
              pcTint={pcTint}
              capaciteit={energieadvies.capaciteit}
              besparing={energieadvies.besparing}
              terugverdientijd={energieadvies.terugverdientijd}
              investering={energieadvies.investering}
              formatCurrency={formatCurrency}
            />
            <p style={{ fontSize: 10, color: "#aaa", fontStyle: "italic", marginTop: 24 }}>
              * Dit advies is indicatief en gebaseerd op de opgegeven schouwgegevens en actuele energieprijzen. Werkelijke resultaten kunnen afwijken.
            </p>
          </div>
          <PageFooter />
        </div>
      )}

      {/* ═══════════════ PAGE 4: PRIJSTABEL + VOORWAARDEN (dynamic templates) ═══════════════ */}
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

          {/* Dynamic price table */}
          <PrijsComp
            pc={pc} sc={sc} pcTint={pcTint} pcTint2={pcTint2}
            regels={regels}
            subtotaal={offerte.subtotaal}
            btwBedrag={offerte.btw_bedrag}
            totaalBedrag={offerte.totaal_bedrag}
            formatCurrency={formatCurrency}
            offerteKortingType={templateConfig?.offerte_korting_type || null}
            offerteKortingWaarde={templateConfig?.offerte_korting_waarde || 0}
          />

          {/* Dynamic terms & signature */}
          <div style={{ marginTop: 28 }}>
            <VoorwaardenComp
              pc={pc} sc={sc} pcTint={pcTint} pcTint2={pcTint2}
              partnerNaam={partner.naam}
              klantNaam={offerte.klant_naam}
              adviseurNaam={adviseurNaam}
              datum={formatDate(offerte.created_at)}
              garantieVw={garantieVw}
              installTermijn={installTermijn}
              betalingsvoorwaarden={offerte.betalingsvoorwaarden || null}
              notities={offerte.notities || null}
              akkoordTekst={tc.akkoord_tekst}
            />
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
