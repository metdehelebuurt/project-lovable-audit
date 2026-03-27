import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, Check, Save, Eye, ZoomIn, ImageIcon, Download, Mail,
  ChevronDown, ChevronUp, GripVertical, Upload, X, Loader2,
} from "lucide-react";
import {
  templateSecties,
  defaultTemplateConfig,
  DEFAULT_SECTION_ORDER,
  type TemplateConfig,
} from "@/components/offertes/templates/templateRegistry";
import {
  voorbladTemplates, HeroDark, HeroSplit, HeroMinimal, HeroGradient, HeroPhoto,
} from "@/components/offertes/templates/VoorbladTemplates";
import {
  productTemplates, ProductCards, ProductList, ProductGrid, ProductSpotlight,
} from "@/components/offertes/templates/ProductTemplates";
import ProductDatasheet from "@/components/producten/ProductDatasheet";
import {
  prijstabelTemplates, PriceModern, PriceClassic, PriceCompact, PriceDetailed,
} from "@/components/offertes/templates/PrijstabelTemplates";
import {
  energieadviesTemplates, EnergyCards, EnergyInfographic, EnergyMinimal, EnergyDashboard, EnergyTimeline,
} from "@/components/offertes/templates/EnergieadviesTemplates";
import {
  voorwaardenTemplates, TermsSimple, TermsBoxed, TermsSidebar,
} from "@/components/offertes/templates/VoorwaardenTemplates";
import { categoryFields } from "@/components/schouwen/SchouwCategoryFields";
import { toast } from "sonner";

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
  logo_url_donker: string | null;
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
  fotos: Json | null;
}

const CONFIG = {
  gemiddelde_stroomprijs_kwh: 0.40,
  teruglever_vergoeding_kwh: 0.07,
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

function hexToTint(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}

const categoryLabels: Record<string, string> = {
  zonnepanelen: "Zonnepanelen", thuisbatterij: "Thuisbatterij", warmtepomp: "Warmtepomp",
  laadpaal: "Laadpaal", omvormer: "Omvormer", accessoires: "Accessoires",
  installatiemateriaal: "Installatiemateriaal", isolatie_dak: "Dakisolatie",
  isolatie_muur: "Muurisolatie", isolatie_vloer: "Vloerisolatie",
  hr_glas: "HR++ Glas", ventilatie: "Ventilatie",
};

const sectionLabels: Record<string, string> = {
  voorblad: "Voorblad",
  inhoudsopgave: "Inhoudsopgave",
  producten: "Producten",
  prijstabel: "Offerte & Voorwaarden",
  energieadvies: "Besparing & Rendement",
  schouwrapport: "Schouwrapport",
  datasheets: "Technische specificaties",
};

/* ─── Thumbnail maps for left panel ─── */
const sampleVoorblad = {
  pc: "#5B58E1", sc: "#1a1a2e", pcTint: "rgba(91,88,225,0.08)",
  logoUrl: null, partnerNaam: "Bedrijf", klantNaam: "Jan de Vries",
  offertenummer: "OF-250101-0001", adviseurNaam: "Piet Jansen",
  datum: "1 januari 2025", categoryLabel: "Zonnepanelen",
  productNaam: "SolarMax 400W", slogan: "Slim verduurzamen",
  introTekst: "Beste Jan, graag presenteren wij u onze offerte.",
  badges: ["Gecertificeerd", "Persoonlijk advies", "Professioneel"],
  telefoon: "020-1234567", klantAdres: "Keizersgracht 1",
  klantPostcode: "1015 AA", klantPlaats: "Amsterdam", isThumbnail: true,
};

const sampleProduct = {
  naam: "SolarMax 400W", merk: "SolarMax", model: "SM-400",
  omschrijving: "Hoogrendement zonnepaneel",
  afbeelding_url: null as string | null,
  garantie_jaren: 25 as number | null,
  certificeringen: "IEC 61215" as string | null,
  specs: { Vermogen: "400 Wp", Garantie: "25 jaar" } as Record<string, any> | null,
  onderhoud: null as string | null,
};

const sampleRegels = [
  { omschrijving: "Zonnepanelen 12x", aantal: 12, prijs_per_stuk: 350, btw_percentage: 21, korting_percentage: 5 },
  { omschrijving: "Omvormer", aantal: 1, prijs_per_stuk: 1200, btw_percentage: 21, korting_percentage: 0 },
];

const fmtCur = (n: number) => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);
const thumbSubtotaal = sampleRegels.reduce((s, r) => s + r.aantal * r.prijs_per_stuk * (1 - r.korting_percentage / 100), 0);
const thumbBtw = sampleRegels.reduce((s, r) => s + r.aantal * r.prijs_per_stuk * (1 - r.korting_percentage / 100) * (r.btw_percentage / 100), 0);
const thumbTotaal = thumbSubtotaal + thumbBtw;
const pcTint2Sample = "rgba(91,88,225,0.15)";

const thumbnailMap: Record<string, React.ReactNode> = {
  "hero-dark": <HeroDark {...sampleVoorblad} />,
  "hero-split": <HeroSplit {...sampleVoorblad} />,
  "hero-minimal": <HeroMinimal {...sampleVoorblad} />,
  "hero-gradient": <HeroGradient {...sampleVoorblad} />,
  "hero-photo": <HeroPhoto {...sampleVoorblad} />,
  "product-list": <ProductList pc={sampleVoorblad.pc} sc={sampleVoorblad.sc} pcTint={sampleVoorblad.pcTint} producten={[sampleProduct]} isThumbnail />,
  "product-cards": <ProductCards pc={sampleVoorblad.pc} sc={sampleVoorblad.sc} pcTint={sampleVoorblad.pcTint} producten={[sampleProduct]} isThumbnail />,
  "product-grid": <ProductGrid pc={sampleVoorblad.pc} sc={sampleVoorblad.sc} pcTint={sampleVoorblad.pcTint} producten={[sampleProduct]} isThumbnail />,
  "product-spotlight": <ProductSpotlight pc={sampleVoorblad.pc} sc={sampleVoorblad.sc} pcTint={sampleVoorblad.pcTint} producten={[sampleProduct]} isThumbnail />,
  "price-classic": <PriceClassic pc={sampleVoorblad.pc} sc={sampleVoorblad.sc} pcTint={sampleVoorblad.pcTint} pcTint2={pcTint2Sample} regels={sampleRegels} subtotaal={thumbSubtotaal} btwBedrag={thumbBtw} totaalBedrag={thumbTotaal} formatCurrency={fmtCur} isThumbnail />,
  "price-modern": <PriceModern pc={sampleVoorblad.pc} sc={sampleVoorblad.sc} pcTint={sampleVoorblad.pcTint} pcTint2={pcTint2Sample} regels={sampleRegels} subtotaal={thumbSubtotaal} btwBedrag={thumbBtw} totaalBedrag={thumbTotaal} formatCurrency={fmtCur} isThumbnail />,
  "price-compact": <PriceCompact pc={sampleVoorblad.pc} sc={sampleVoorblad.sc} pcTint={sampleVoorblad.pcTint} pcTint2={pcTint2Sample} regels={sampleRegels} subtotaal={thumbSubtotaal} btwBedrag={thumbBtw} totaalBedrag={thumbTotaal} formatCurrency={fmtCur} isThumbnail />,
  "price-detailed": <PriceDetailed pc={sampleVoorblad.pc} sc={sampleVoorblad.sc} pcTint={sampleVoorblad.pcTint} pcTint2={pcTint2Sample} regels={sampleRegels} subtotaal={thumbSubtotaal} btwBedrag={thumbBtw} totaalBedrag={thumbTotaal} formatCurrency={fmtCur} isThumbnail />,
  "energy-cards": <EnergyCards pc={sampleVoorblad.pc} sc={sampleVoorblad.sc} pcTint={sampleVoorblad.pcTint} capaciteit={5} besparing={850} terugverdientijd={6.5} investering={5500} formatCurrency={fmtCur} isThumbnail />,
  "energy-infographic": <EnergyInfographic pc={sampleVoorblad.pc} sc={sampleVoorblad.sc} pcTint={sampleVoorblad.pcTint} capaciteit={5} besparing={850} terugverdientijd={6.5} investering={5500} formatCurrency={fmtCur} isThumbnail />,
  "energy-minimal": <EnergyMinimal pc={sampleVoorblad.pc} sc={sampleVoorblad.sc} pcTint={sampleVoorblad.pcTint} capaciteit={5} besparing={850} terugverdientijd={6.5} investering={5500} formatCurrency={fmtCur} isThumbnail />,
  "energy-dashboard": <EnergyDashboard pc={sampleVoorblad.pc} sc={sampleVoorblad.sc} pcTint={sampleVoorblad.pcTint} capaciteit={5} besparing={850} terugverdientijd={6.5} investering={5500} formatCurrency={fmtCur} isThumbnail co2Reductie={340} maandBesparing={71} besparingLevensduur={12750} />,
  "energy-timeline": <EnergyTimeline pc={sampleVoorblad.pc} sc={sampleVoorblad.sc} pcTint={sampleVoorblad.pcTint} capaciteit={5} besparing={850} terugverdientijd={6.5} investering={5500} formatCurrency={fmtCur} isThumbnail />,
  "terms-simple": <TermsSimple pc={sampleVoorblad.pc} sc={sampleVoorblad.sc} pcTint={sampleVoorblad.pcTint} pcTint2={pcTint2Sample} partnerNaam="Bedrijf" klantNaam="Jan de Vries" adviseurNaam="Piet Jansen" datum="1 jan 2025" garantieVw="Conform fabrikant" installTermijn="4 weken" betalingsvoorwaarden="30 dagen" notities={null} akkoordTekst="" isThumbnail />,
  "terms-boxed": <TermsBoxed pc={sampleVoorblad.pc} sc={sampleVoorblad.sc} pcTint={sampleVoorblad.pcTint} pcTint2={pcTint2Sample} partnerNaam="Bedrijf" klantNaam="Jan de Vries" adviseurNaam="Piet Jansen" datum="1 jan 2025" garantieVw="Conform fabrikant" installTermijn="4 weken" betalingsvoorwaarden="30 dagen" notities={null} akkoordTekst="" isThumbnail />,
  "terms-sidebar": <TermsSidebar pc={sampleVoorblad.pc} sc={sampleVoorblad.sc} pcTint={sampleVoorblad.pcTint} pcTint2={pcTint2Sample} partnerNaam="Bedrijf" klantNaam="Jan de Vries" adviseurNaam="Piet Jansen" datum="1 jan 2025" garantieVw="Conform fabrikant" installTermijn="4 weken" betalingsvoorwaarden="30 dagen" notities={null} akkoordTekst="" isThumbnail />,
};

const sectionToggleKeys: Record<string, keyof TemplateConfig> = {
  voorblad: "secties_voorblad",
  producten: "secties_producten",
  energieadvies: "secties_energieadvies",
  schouwrapport: "secties_schouwrapport",
};

const platformBranding: PartnerBranding = {
  naam: "mijnhuis.nu", adres: null, postcode: null, plaats: null,
  email: "info@mijnhuis.nu", telefoonnummer: null, kvk: null, btw: null,
  website: "www.mijnhuis.nu", logo_url: null,
  primaire_kleur: "#5B58E1", secundaire_kleur: "#1a1a2e",
  bedrijfsslogan: "Slim verduurzamen begint hier",
};

export default function OffertePDF() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [offerte, setOfferte] = useState<Offerte | null>(null);
  const [partner, setPartner] = useState<PartnerBranding | null>(null);
  const [schouw, setSchouw] = useState<SchouwData | null>(null);
  const [producten, setProducten] = useState<Product[]>([]);
  const [adviseur, setAdviseur] = useState<{ voornaam: string; achternaam: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [config, setConfig] = useState<TemplateConfig>({ ...defaultTemplateConfig });
  const [expandedSectie, setExpandedSectie] = useState<string | null>("voorblad");
  const [showCustomization, setShowCustomization] = useState(false);
  const [zoom, setZoom] = useState(45);
  const [heroUploading, setHeroUploading] = useState(false);
  const [heroGallery, setHeroGallery] = useState<string[]>([]);
  const [showGallery, setShowGallery] = useState(false);
  const heroFileRef = useRef<HTMLInputElement>(null);

  // Drag & drop state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const sectionOrder = config.section_order || DEFAULT_SECTION_ORDER;

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: o } = await supabase.from("offertes").select("*").eq("id", id).single();
      if (!o) { setLoading(false); return; }
      setOfferte(o);

      if (o.template_config && typeof o.template_config === "object") {
        setConfig(prev => ({ ...prev, ...(o.template_config as Record<string, any>) }));
      }

      if (o.partner_id) {
        const { data: p } = await supabase.from("partners").select("naam, adres, postcode, plaats, email, telefoonnummer, kvk, btw, website, logo_url, logo_url_donker, primaire_kleur, secundaire_kleur, bedrijfsslogan, feature_flags_json").eq("id", o.partner_id).single();
        if (p) {
          setPartner(p as PartnerBranding);
          if (p.feature_flags_json && typeof p.feature_flags_json === "object") {
            const flags = p.feature_flags_json as Record<string, any>;
            if (flags.offerte_template) {
              setConfig(prev => ({ ...flags.offerte_template, ...prev }));
            }
          }
        } else setPartner(platformBranding);
      } else setPartner(platformBranding);

      const { data: adv } = await supabase.from("users").select("voornaam, achternaam").eq("id", o.adviseur_id).single();
      if (adv) setAdviseur(adv);

      if (o.include_schouw && o.schouw_id) {
        const { data: s } = await supabase.from("schouwen").select("schouw_nummer, categorie, geplande_datum, status, consument_naam, gegevens, notities, aandachtspunten, fotos").eq("id", o.schouw_id).single();
        if (s) setSchouw(s as SchouwData);
      }

      const regels = Array.isArray(o.regels) ? (o.regels as unknown as OfferteRegel[]) : [];
      const productIds = regels.map(r => r.product_id).filter(Boolean) as string[];
      if (productIds.length > 0) {
        const { data: prods } = await supabase.from("producten").select("*").in("id", productIds);
        if (prods) setProducten(prods);
      }
      setLoading(false);
    })();
  }, [id]);

  // Load hero gallery images
  useEffect(() => {
    if (!offerte?.partner_id) return;
    (async () => {
      const { data } = await supabase.storage.from("partner-assets").list(`${offerte.partner_id}/hero`, { limit: 50 });
      if (data && data.length > 0) {
        const urls = data
          .filter(f => f.name && !f.name.startsWith("."))
          .map(f => `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/partner-assets/${offerte.partner_id}/hero/${f.name}`);
        setHeroGallery(urls);
      }
    })();
  }, [offerte?.partner_id]);

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !offerte?.partner_id) return;
    setHeroUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${offerte.partner_id}/hero/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("partner-assets").upload(path, file, { upsert: true });
    if (error) { toast.error("Upload mislukt"); setHeroUploading(false); return; }
    const url = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/partner-assets/${path}`;
    setConfig(prev => ({ ...prev, hero_image_url: url }));
    setHeroGallery(prev => [url, ...prev]);
    setHeroUploading(false);
    toast.success("Afbeelding geüpload");
    if (heroFileRef.current) heroFileRef.current.value = "";
  };

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    const { error } = await supabase.from("offertes").update({ template_config: config as unknown as Json }).eq("id", id);
    setSaving(false);
    if (error) { toast.error("Opslaan mislukt"); return; }
    toast.success("Template opgeslagen");
  };

  const handlePrint = () => {
    window.open(`/offertes/${id}/pdf/print`, "_blank");
  };

  const handleSelect = (sectieId: string, variantId: string) => {
    setConfig(prev => ({ ...prev, [sectieId]: variantId }));
  };

  const handleToggle = (sectieId: string, enabled: boolean) => {
    const key = sectionToggleKeys[sectieId];
    if (key) setConfig(prev => ({ ...prev, [key]: enabled }));
  };

  // Drag & drop handlers
  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  }, []);

  const handleDrop = useCallback((index: number) => {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    const newOrder = [...sectionOrder];
    const [moved] = newOrder.splice(dragIndex, 1);
    newOrder.splice(index, 0, moved);
    setConfig(prev => ({ ...prev, section_order: newOrder }));
    setDragIndex(null);
    setDragOverIndex(null);
  }, [dragIndex, sectionOrder]);

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setDragOverIndex(null);
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Laden...</div>;
  if (!offerte || !partner) return <div className="flex items-center justify-center h-64 text-muted-foreground">Offerte niet gevonden</div>;

  const regels = Array.isArray(offerte.regels) ? (offerte.regels as unknown as OfferteRegel[]) : [];
  const pc = partner.primaire_kleur || "#5B58E1";
  const sc = partner.secundaire_kleur || "#1a1a2e";
  const pcTint = hexToTint(pc, 0.08);
  const pcTint2 = hexToTint(pc, 0.15);

  const logoUrl = partner.logo_url
    ? (partner.logo_url.startsWith("http") ? partner.logo_url : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/partner-assets/${partner.logo_url}`)
    : null;

  const logoUrlDonker = (partner as any).logo_url_donker
    ? ((partner as any).logo_url_donker.startsWith("http") ? (partner as any).logo_url_donker : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/partner-assets/${(partner as any).logo_url_donker}`)
    : null;

  const mainCategory = producten.length > 0 ? producten[0].categorie : null;
  const categoryLabel = mainCategory ? (categoryLabels[mainCategory] || mainCategory) : null;

  // Energieadvies berekening met uitgebreide data
  let energieadvies: {
    capaciteit: number; besparing: number; terugverdientijd: number; investering: number;
    co2Reductie: number; maandBesparing: number; besparingLevensduur: number; zelfvoorzieningsgraad: number;
  } | null = null;

  if (offerte.include_energieadvies) {
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
        const co2Reductie = Math.round(extraZelf * 0.4);
        const zelfvoorzieningsgraad = verbruik > 0 ? Math.round((jaarOpwekking * CONFIG.zelfconsumptie_met_batterij / verbruik) * 100) : 0;
        if (capaciteit >= 1) energieadvies = {
          capaciteit, besparing, terugverdientijd, investering,
          co2Reductie, maandBesparing: Math.round(besparing / 12),
          besparingLevensduur: besparing * CONFIG.levensduur_jaren,
          zelfvoorzieningsgraad,
        };
      }
    }
    if (!energieadvies && producten.length > 0) {
      const totalInvestering = regels.reduce((sum, r) => sum + (r.aantal * r.prijs_per_stuk * (1 - r.korting_percentage / 100)), 0);
      if (totalInvestering > 0) {
        const estBesparing = Math.round(totalInvestering * 0.12);
        const terugverdientijd = estBesparing > 0 ? Math.round((totalInvestering / estBesparing) * 10) / 10 : 0;
        energieadvies = {
          capaciteit: 0, besparing: estBesparing, terugverdientijd, investering: totalInvestering,
          co2Reductie: Math.round(estBesparing * 0.4 / CONFIG.gemiddelde_stroomprijs_kwh * 0.4),
          maandBesparing: Math.round(estBesparing / 12),
          besparingLevensduur: estBesparing * CONFIG.levensduur_jaren,
          zelfvoorzieningsgraad: 0,
        };
      }
    }
  }

  const adviseurNaam = adviseur ? `${adviseur.voornaam} ${adviseur.achternaam}` : "Uw adviseur";
  const introTekst = (offerte as any).introductie_tekst as string | null;
  const garantieVw = ((offerte as any).garantie_voorwaarden as string | null) || (() => {
    // Dynamic fallback based on product warranty
    const maxGarantie = producten.reduce((max, p) => Math.max(max, p.garantie_jaren || 0), 0);
    if (maxGarantie > 0) return `Productgarantie: ${maxGarantie} jaar conform fabrikant. Installatiegarantie: 2 jaar.`;
    return "Productgarantie conform fabrikant. Installatiegarantie: 2 jaar.";
  })();
  const installTermijn = (offerte as any).installatie_termijn as string | null;

  const VoorbladComp = voorbladTemplates[config.voorblad] || HeroDark;
  const ProductComp = productTemplates[config.producten] || ProductCards;
  const PrijsComp = prijstabelTemplates[config.prijstabel] || PriceModern;
  const EnergieComp = energieadviesTemplates[config.energieadvies] || EnergyCards;
  const VoorwaardenComp = voorwaardenTemplates[config.voorwaarden] || TermsSimple;

  const badges = [
    config.badge_1 || "Gecertificeerd installateur",
    config.badge_2 || "Persoonlijk advies",
    config.badge_3 || "Professionele installatie",
  ];

  /* ─── Shared page sub-components ─── */
  const PageHeader = () => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 0", borderBottom: `2px solid ${pc}`, marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {logoUrl && <img src={logoUrl} alt={partner.naam} style={{ height: 36, objectFit: "contain" }} />}
        <span style={{ fontWeight: 700, fontSize: 16, color: sc }}>{partner.naam}</span>
      </div>
      <div style={{ fontSize: 10, color: "#888", textAlign: "right" as const }}>
        {partner.email && <span>{partner.email}</span>}
        {partner.telefoonnummer && <span style={{ marginLeft: 12 }}>{partner.telefoonnummer}</span>}
      </div>
    </div>
  );

  const PageFooter = () => (
    <div style={{ borderTop: `2px solid ${pc}`, padding: "12px 0 0", marginTop: "auto", fontSize: 9, color: "#999", textAlign: "center" as const }}>
      <p style={{ margin: 0 }}>
        {partner.naam}
        {partner.adres ? ` • ${partner.adres}` : ""}
        {partner.postcode || partner.plaats ? ` • ${partner.postcode || ""} ${partner.plaats || ""}`.trim() : ""}
        {(partner as any).kvk ? ` • KVK ${(partner as any).kvk}` : ""}
        {(partner as any).btw ? ` • BTW ${(partner as any).btw}` : ""}
      </p>
    </div>
  );

  const pageStyle: React.CSSProperties = {
    width: "210mm",
    minHeight: "297mm",
    backgroundColor: "#fff",
    fontFamily: "'Rubik', sans-serif",
    fontSize: 13,
    color: "#1a1a2e",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    position: "relative",
    marginBottom: 20,
    boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
    borderRadius: 4,
    overflow: "hidden",
  };

  /* ─── Grouped schouw data helper ─── */
  const renderGroupedSchouw = () => {
    if (!schouw?.gegevens || typeof schouw.gegevens !== "object") return null;
    const gegevens = schouw.gegevens as Record<string, any>;
    const cat = schouw.categorie as any;
    const fields = categoryFields[cat] || [];

    // Group fields by section
    const groups: Record<string, { key: string; label: string; value: any }[]> = {};
    fields.forEach(f => {
      const val = gegevens[f.key];
      if (val === null || val === undefined || val === "") return;
      const section = f.section || "Algemeen";
      if (!groups[section]) groups[section] = [];
      let displayVal = String(val);
      if (f.type === "boolean" || val === true || val === false) displayVal = val ? "Ja" : "Nee";
      if (val === "ja") displayVal = "Ja";
      if (val === "nee") displayVal = "Nee";
      groups[section].push({ key: f.key, label: f.label, value: displayVal });
    });

    // Also include unknown keys not in field definitions
    const knownKeys = new Set(fields.map(f => f.key));
    Object.entries(gegevens).forEach(([key, val]) => {
      if (knownKeys.has(key) || val === null || val === undefined || val === "") return;
      if (!groups["Overig"]) groups["Overig"] = [];
      groups["Overig"].push({ key, label: key.replace(/_/g, " "), value: String(val) });
    });

    const sectionIcons: Record<string, string> = {
      "Woning": "🏠", "Dak": "🏗", "Schaduw": "☁", "Elektra": "⚡",
      "Huidig systeem": "🔧", "Afgiftesysteem": "🌡", "Buitenunit": "📦",
      "Muur": "🧱", "Vloer": "🪵", "Constructie": "🔩", "Leidingen": "🔌",
      "Staat": "📋", "Glas": "🪟", "Kozijnen": "🚪", "Bijzonderheden": "📝",
      "Zonnepanelen": "☀", "Batterij locatie": "🔋", "Installatie": "🛠",
      "Metingen": "📏", "Per gevel": "🏗", "Details": "🔍", "Overig": "📄",
    };

    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {Object.entries(groups).map(([section, items]) => (
          <div key={section} style={{ backgroundColor: pcTint, borderRadius: 10, padding: "14px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 16 }}>{sectionIcons[section] || "📄"}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: pc, textTransform: "uppercase", letterSpacing: 0.5 }}>{section}</span>
            </div>
            {items.map(item => (
              <div key={item.key} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid rgba(0,0,0,0.05)", fontSize: 11 }}>
                <span style={{ color: "#666" }}>{item.label}</span>
                <span style={{ fontWeight: 600, color: sc }}>{item.value}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  /* ─── Section renderers ─── */
  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case "voorblad":
        if (config.secties_voorblad === false) return null;
        return (
          <div key="voorblad" style={{ ...pageStyle, padding: 0, height: "297mm", minHeight: "297mm" }}>
            <VoorbladComp
              pc={pc} sc={sc} pcTint={pcTint} logoUrl={logoUrl} logoUrlDark={logoUrlDonker}
              partnerNaam={partner.naam} klantNaam={offerte.klant_naam}
              offertenummer={offerte.offertenummer} adviseurNaam={adviseurNaam}
              datum={formatDate(offerte.created_at)}
              categoryLabel={categoryLabel || null}
              productNaam={producten.length > 0 ? (producten[0].merk && producten[0].model ? `${producten[0].merk} ${producten[0].model}` : producten[0].naam) : null}
              slogan={partner.bedrijfsslogan || null} introTekst={introTekst}
              badges={badges}
              telefoon={partner.telefoonnummer || null}
              klantAdres={offerte.klant_adres || null}
              klantPostcode={offerte.klant_postcode || null}
              klantPlaats={offerte.klant_plaats || null}
              heroImageUrl={config.hero_image_url || null}
              heroTitle={config.hero_title || "Offerte"}
            />
          </div>
        );

      case "inhoudsopgave": {
        const tocItems = sectionOrder
          .filter(s => {
            if (s === "inhoudsopgave") return false;
            const toggleKey = sectionToggleKeys[s];
            if (toggleKey && config[toggleKey] === false) return false;
            if (s === "producten" && producten.length === 0) return false;
            if (s === "energieadvies" && !energieadvies) return false;
            if (s === "schouwrapport" && (!offerte.include_schouw || !schouw)) return false;
            if (s === "datasheets" && producten.filter(p => p.datasheet_type).length === 0) return false;
            return true;
          })
          .map(s => sectionLabels[s] || s);

        return (
          <div key="inhoudsopgave" style={{ ...pageStyle, padding: "15mm" }}>
            <PageHeader />
            <h2 style={{ fontSize: 28, fontWeight: 800, color: sc, margin: "0 0 6px" }}>Inhoudsopgave</h2>
            <div style={{ width: 64, height: 4, backgroundColor: pc, borderRadius: 2, marginBottom: 40 }} />
            <div style={{ maxWidth: 500 }}>
              {tocItems.map((label, i) => (
                <div key={i} style={{ display: "flex", alignItems: "baseline", padding: "14px 0", borderBottom: `1px solid ${pcTint2}` }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: pcTint, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: pc, flexShrink: 0, marginRight: 16 }}>{i + 1}</div>
                  <span style={{ fontSize: 15, fontWeight: 500, color: sc, flex: 1 }}>{label}</span>
                  <span style={{ fontSize: 12, color: "#aaa", marginLeft: 12 }}>p. {i + 2}</span>
                </div>
              ))}
            </div>
            <PageFooter />
          </div>
        );
      }

      case "producten":
        if (config.secties_producten === false || producten.length === 0) return null;
        return (
          <div key="producten" style={{ ...pageStyle, padding: "15mm" }}>
            <PageHeader />
            <h2 style={{ fontSize: 22, fontWeight: 800, color: sc, margin: "0 0 6px" }}>Producten</h2>
            <div style={{ width: 48, height: 3, backgroundColor: pc, borderRadius: 2, marginBottom: 24 }} />
            <ProductComp pc={pc} sc={sc} pcTint={pcTint} producten={producten.map(p => ({
              naam: p.naam, merk: p.merk, model: p.model, omschrijving: p.omschrijving,
              afbeelding_url: p.afbeelding_url, garantie_jaren: p.garantie_jaren,
              certificeringen: p.certificeringen,
              specs: p.specs && typeof p.specs === "object" ? (p.specs as Record<string, any>) : null,
              onderhoud: p.onderhoud,
            }))} />
            <PageFooter />
          </div>
        );

      case "prijstabel":
        return (
          <div key="prijstabel" style={{ ...pageStyle, padding: "15mm" }}>
            <PageHeader />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 28 }}>
                <div>
                  <h2 style={{ fontSize: 24, fontWeight: 800, color: sc, margin: 0 }}>Offerte</h2>
                  <div style={{ width: 48, height: 3, backgroundColor: pc, borderRadius: 2, marginTop: 6 }} />
                </div>
                <div style={{ textAlign: "right" as const, fontSize: 12 }}>
                  <p style={{ margin: "2px 0", color: "#888" }}>Offertenummer: <strong style={{ color: sc }}>{offerte.offertenummer}</strong></p>
                  <p style={{ margin: "2px 0", color: "#888" }}>Datum: <strong style={{ color: sc }}>{formatDate(offerte.created_at)}</strong></p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
                <div style={{ backgroundColor: pcTint, borderRadius: 10, padding: "16px 20px" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: pc, margin: "0 0 8px" }}>Opgesteld voor</p>
                  <p style={{ fontWeight: 600, margin: "0 0 4px", color: sc }}>{offerte.klant_naam}</p>
                  {offerte.klant_adres && <p style={{ margin: "2px 0", fontSize: 12, color: "#555" }}>{offerte.klant_adres}</p>}
                  <p style={{ margin: "2px 0", fontSize: 12, color: "#555" }}>{offerte.klant_email}</p>
                </div>
                <div style={{ backgroundColor: pcTint, borderRadius: 10, padding: "16px 20px" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: pc, margin: "0 0 8px" }}>Opgesteld door</p>
                  <p style={{ fontWeight: 600, margin: "0 0 4px", color: sc }}>{adviseurNaam}</p>
                  <p style={{ margin: "2px 0", fontSize: 12, color: "#555" }}>{partner.naam}</p>
                  {partner.email && <p style={{ margin: "2px 0", fontSize: 12, color: "#555" }}>{partner.email}</p>}
                </div>
              </div>

              <PrijsComp pc={pc} sc={sc} pcTint={pcTint} pcTint2={pcTint2} regels={regels} subtotaal={offerte.subtotaal} btwBedrag={offerte.btw_bedrag} totaalBedrag={offerte.totaal_bedrag} formatCurrency={formatCurrency} />

              <div style={{ marginTop: 28 }}>
                <VoorwaardenComp pc={pc} sc={sc} pcTint={pcTint} pcTint2={pcTint2} partnerNaam={partner.naam} klantNaam={offerte.klant_naam} adviseurNaam={adviseurNaam} datum={formatDate(offerte.created_at)} garantieVw={garantieVw} installTermijn={installTermijn} betalingsvoorwaarden={offerte.betalingsvoorwaarden || null} notities={offerte.notities || null} akkoordTekst={config.akkoord_tekst || ""} />
              </div>
            </div>
            <PageFooter />
          </div>
        );

      case "energieadvies":
        if (config.secties_energieadvies === false || !energieadvies) return null;
        return (
          <div key="energieadvies" style={{ ...pageStyle, padding: "15mm" }}>
            <PageHeader />
            <h2 style={{ fontSize: 22, fontWeight: 800, color: sc, margin: "0 0 6px" }}>Uw besparing & rendement</h2>
            <div style={{ width: 48, height: 3, backgroundColor: pc, borderRadius: 2, marginBottom: 24 }} />
            <p style={{ fontSize: 13, color: "#555", lineHeight: 1.7, marginBottom: 28 }}>
              Op basis van de schouwgegevens en uw energieverbruik hebben wij berekend wat de geschatte besparing en terugverdientijd is van de voorgestelde oplossing.
            </p>
            <EnergieComp
              pc={pc} sc={sc} pcTint={pcTint}
              capaciteit={energieadvies.capaciteit} besparing={energieadvies.besparing}
              terugverdientijd={energieadvies.terugverdientijd} investering={energieadvies.investering}
              formatCurrency={formatCurrency}
              co2Reductie={energieadvies.co2Reductie} maandBesparing={energieadvies.maandBesparing}
              besparingLevensduur={energieadvies.besparingLevensduur} zelfvoorzieningsgraad={energieadvies.zelfvoorzieningsgraad}
            />
            <p style={{ fontSize: 10, color: "#aaa", fontStyle: "italic", marginTop: 24 }}>
              * Dit advies is indicatief en gebaseerd op de opgegeven schouwgegevens en actuele energieprijzen. Werkelijke resultaten kunnen afwijken.
            </p>
            <PageFooter />
          </div>
        );

      case "schouwrapport":
        if (config.secties_schouwrapport === false || !offerte.include_schouw || !schouw) return null;
        return (
          <div key="schouwrapport" style={{ ...pageStyle, padding: "15mm" }}>
            <PageHeader />
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
            {renderGroupedSchouw()}
            {schouw.aandachtspunten && (
              <div style={{ backgroundColor: "#FFF8E1", borderLeft: "4px solid #FFA000", borderRadius: 8, padding: "14px 18px", marginTop: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#E65100", margin: "0 0 6px" }}>⚠ Aandachtspunten</p>
                <p style={{ fontSize: 12, color: "#555", margin: 0, whiteSpace: "pre-wrap" }}>{schouw.aandachtspunten}</p>
              </div>
            )}
            {schouw.notities && (
              <div style={{ marginTop: 12 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: sc, margin: "0 0 6px" }}>Opmerkingen</p>
                <p style={{ fontSize: 12, color: "#555", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{schouw.notities}</p>
              </div>
            )}
            <PageFooter />
          </div>
        );

      case "datasheets": {
        const dsProducts = producten.filter(p => p.datasheet_type === "fabrikant" || p.datasheet_type === "gegenereerd");
        if (dsProducts.length === 0) return null;
        return (
          <div key="datasheets">
            {/* Specs overview page */}
            {producten.filter(p => p.specs && typeof p.specs === "object" && Object.keys(p.specs as object).length > 0).map(p => {
              const specs = p.specs as Record<string, any>;
              // Group specs by section-like prefixes or flat
              const specEntries = Object.entries(specs).filter(([, v]) => v !== null && v !== undefined && v !== "");
              if (specEntries.length === 0) return null;
              return (
                <div key={`specs-${p.id}`} style={{ ...pageStyle, padding: "15mm" }}>
                  <PageHeader />
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: sc, margin: "0 0 6px" }}>Technische specificaties</h2>
                  <p style={{ fontSize: 14, color: "#666", margin: "0 0 4px" }}>{p.merk ? `${p.merk} ` : ""}{p.model || p.naam}</p>
                  <div style={{ width: 48, height: 3, backgroundColor: pc, borderRadius: 2, marginBottom: 24 }} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
                    {specEntries.map(([key, val], i) => (
                      <div key={key} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", backgroundColor: i % 4 < 2 ? "#fff" : pcTint, borderBottom: "1px solid #f0f0f0" }}>
                        <span style={{ fontSize: 11, color: "#666", fontWeight: 500 }}>{key.replace(/_/g, " ")}</span>
                        <span style={{ fontSize: 11, color: sc, fontWeight: 700 }}>{String(val)}</span>
                      </div>
                    ))}
                  </div>
                  <PageFooter />
                </div>
              );
            })}
            {/* Datasheets */}
            {dsProducts.map(p => {
              if (p.datasheet_type === "gegenereerd") {
                const specs = p.specs && typeof p.specs === "object" && !Array.isArray(p.specs) ? (p.specs as Record<string, string>) : null;
                return (
                  <div key={`ds-${p.id}`} style={{ margin: "0 auto", marginBottom: 20 }}>
                    <ProductDatasheet
                      product={{ naam: p.naam, merk: p.merk, model: p.model, categorie: p.categorie, omschrijving: p.omschrijving, afbeelding_url: p.afbeelding_url, specs, certificeringen: p.certificeringen, garantie_jaren: p.garantie_jaren, prijs_excl_btw: p.prijs_excl_btw, onderhoud: p.onderhoud, installatie_instructies: p.installatie_instructies }}
                      partner={partner}
                    />
                  </div>
                );
              }
              return null;
            })}
          </div>
        );
      }

      default:
        return null;
    }
  };

  /* ─── Live preview ─── */
  const renderLivePreview = () => (
    <div style={{ transformOrigin: "top left" }}>
      {sectionOrder.map(sectionId => renderSection(sectionId))}
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden -m-3 md:-m-8">
      {/* ═══ LEFT PANEL ═══ */}
      <div className="hidden md:flex w-[400px] flex-shrink-0 border-r border-border bg-background flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/offertes/${id}`)} className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-base font-semibold text-foreground">Offerte editor</h1>
              <p className="text-xs text-muted-foreground">{offerte.offertenummer}</p>
            </div>
          </div>
          <Button onClick={handleSave} size="sm" className="gap-1.5" disabled={saving}>
            <Save className="h-3.5 w-3.5" /> {saving ? "Opslaan..." : "Opslaan"}
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-1">
            {/* Drag & drop section ordering */}
            <div className="rounded-xl border border-border overflow-hidden mb-3">
              <div className="p-3 pb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sectievolorde</span>
                <p className="text-[10px] text-muted-foreground mt-0.5">Sleep om de volgorde aan te passen</p>
              </div>
              <div className="px-2 pb-2 space-y-1">
                {sectionOrder.map((sectionId, index) => {
                  const toggleKey = sectionToggleKeys[sectionId];
                  const isEnabled = toggleKey ? config[toggleKey] !== false : true;
                  const label = sectionLabels[sectionId] || sectionId;
                  const isDragging = dragIndex === index;
                  const isDragOver = dragOverIndex === index;

                  return (
                    <div
                      key={sectionId}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={() => handleDrop(index)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-grab transition-all text-xs ${
                        isDragging ? "opacity-40 scale-95" : ""
                      } ${isDragOver ? "bg-primary/10 border-primary border" : "bg-muted/40 border border-transparent hover:bg-muted/80"} ${
                        !isEnabled ? "opacity-50" : ""
                      }`}
                    >
                      <GripVertical className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="flex-1 font-medium text-foreground">{label}</span>
                      {toggleKey && (
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={(v) => handleToggle(sectionId, v)}
                          className="scale-[0.6]"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Template variant selection */}
            {templateSecties.map(sectie => {
              const isExpanded = expandedSectie === sectie.id;
              const toggleKey = sectionToggleKeys[sectie.id];
              const isEnabled = toggleKey ? config[toggleKey] !== false : true;

              return (
                <div key={sectie.id} className="rounded-xl border border-border overflow-hidden">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedSectie(isExpanded ? null : sectie.id)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{sectie.naam}</span>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {sectie.varianten.find(v => v.id === config[sectie.id as keyof TemplateConfig])?.naam || "—"}
                      </Badge>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </button>

                  {isExpanded && (
                    <div className="p-3 pt-0 space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        {sectie.varianten.map(variant => {
                          const isSelected = config[sectie.id as keyof TemplateConfig] === variant.id;
                          const thumb = thumbnailMap[variant.id];
                          return (
                            <button
                              key={variant.id}
                              type="button"
                              onClick={() => handleSelect(sectie.id, variant.id)}
                              className={`relative rounded-lg border-2 transition-all hover:shadow-md ${
                                isSelected ? "border-primary ring-2 ring-primary/20 shadow-md" : "border-border hover:border-primary/40"
                              }`}
                            >
                              <div className="w-full aspect-[210/297] rounded-t-md overflow-hidden bg-white relative">
                                {isSelected && (
                                  <div className="absolute top-1.5 right-1.5 z-10 bg-primary text-primary-foreground rounded-full p-0.5">
                                    <Check className="h-3 w-3" />
                                  </div>
                                )}
                                <div style={{ width: 794, height: 1123, transform: "scale(0.155)", transformOrigin: "top left", pointerEvents: "none", overflow: "hidden" }}>
                                  {thumb || <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-xs">Preview</div>}
                                </div>
                              </div>
                              <div className="px-2 py-1.5">
                                <p className="text-xs font-medium text-foreground truncate">{variant.naam}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{variant.beschrijving}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            <Separator className="my-3" />

            {/* Customization panel */}
            <div className="rounded-xl border border-border overflow-hidden">
              <button
                type="button"
                className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                onClick={() => setShowCustomization(!showCustomization)}
              >
                <span className="text-sm font-semibold text-foreground">Tekst & Voorblad aanpassen</span>
                {showCustomization ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>
              {showCustomization && (
                <div className="p-3 pt-0 space-y-3">
                  <div>
                    <Label className="text-xs flex items-center gap-1"><ImageIcon className="h-3 w-3" /> Voorblad titel</Label>
                    <Input value={config.hero_title || ""} onChange={e => setConfig(p => ({ ...p, hero_title: e.target.value }))} className="h-8 text-xs rounded-lg" placeholder="Offerte" />
                  </div>

                  {/* Hero image upload + gallery */}
                  <div>
                    <Label className="text-xs flex items-center gap-1 mb-1.5"><ImageIcon className="h-3 w-3" /> Voorblad afbeelding</Label>
                    <input ref={heroFileRef} type="file" accept="image/*" onChange={handleHeroUpload} className="hidden" />
                    <div className="flex gap-1.5">
                      <Button variant="outline" size="sm" className="h-8 text-xs flex-1 gap-1.5" onClick={() => heroFileRef.current?.click()} disabled={heroUploading}>
                        {heroUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                        {heroUploading ? "Uploaden..." : "Upload"}
                      </Button>
                      {heroGallery.length > 0 && (
                        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => setShowGallery(!showGallery)}>
                          <ImageIcon className="h-3 w-3" /> Galerij ({heroGallery.length})
                        </Button>
                      )}
                      {config.hero_image_url && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setConfig(p => ({ ...p, hero_image_url: "" }))}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>

                    {/* Gallery grid */}
                    {showGallery && heroGallery.length > 0 && (
                      <div className="grid grid-cols-3 gap-1.5 mt-2">
                        {heroGallery.map((url, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => { setConfig(p => ({ ...p, hero_image_url: url })); setShowGallery(false); }}
                            className={`relative rounded-md overflow-hidden border-2 aspect-[3/2] transition-all hover:opacity-90 ${config.hero_image_url === url ? "border-primary ring-1 ring-primary/30" : "border-border"}`}
                          >
                            <img src={url} alt="" className="w-full h-full object-cover" />
                            {config.hero_image_url === url && (
                              <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                                <Check className="h-2.5 w-2.5" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Current preview */}
                    {config.hero_image_url && (
                      <div className="mt-1.5 rounded-lg overflow-hidden border border-border h-20">
                        <img src={config.hero_image_url} alt="Hero preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                    )}

                    {/* Manual URL fallback */}
                    <Input value={config.hero_image_url || ""} onChange={e => setConfig(p => ({ ...p, hero_image_url: e.target.value }))} className="h-7 text-[10px] rounded-lg mt-1.5" placeholder="Of plak een URL..." />
                  </div>

                  <Separator />
                  {(["badge_1", "badge_2", "badge_3"] as const).map((key, i) => (
                    <div key={key}>
                      <Label className="text-xs">Badge {i + 1}</Label>
                      <Input value={config[key] || ""} onChange={e => setConfig(p => ({ ...p, [key]: e.target.value }))} className="h-8 text-xs rounded-lg" />
                    </div>
                  ))}
                  <div>
                    <Label className="text-xs">Akkoord tekst</Label>
                    <Input value={config.akkoord_tekst || ""} onChange={e => setConfig(p => ({ ...p, akkoord_tekst: e.target.value }))} className="h-8 text-xs rounded-lg" placeholder="Door ondertekening gaat u akkoord met..." />
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* ═══ RIGHT PANEL ═══ */}
      <div className="flex-1 bg-muted/30 overflow-auto flex flex-col">
        <div className="flex items-center gap-3 p-3 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Live preview</span>
          <div className="flex items-center gap-2 ml-auto">
            <ZoomIn className="h-3.5 w-3.5 text-muted-foreground" />
            <Slider value={[zoom]} onValueChange={([v]) => setZoom(v)} min={20} max={100} step={1} className="w-28" />
            <span className="text-xs text-muted-foreground w-8">{zoom}%</span>
            <Separator orientation="vertical" className="h-5 mx-1" />
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={handlePrint}>
              <Download className="h-3.5 w-3.5" /> PDF
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => navigate(`/offertes/${id}?email=true`)}>
              <Mail className="h-3.5 w-3.5" /> E-mail
            </Button>
          </div>
        </div>
        <div className="flex-1 p-8">
          <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top left", width: "210mm" }}>
            {renderLivePreview()}
          </div>
        </div>
      </div>
    </div>
  );
}
