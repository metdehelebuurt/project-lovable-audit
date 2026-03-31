import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Check, Save, Eye, EyeOff, ChevronDown, ChevronUp, ZoomIn, ImageIcon } from "lucide-react";
import {
  templateSecties,
  defaultTemplateConfig,
  type TemplateConfig,
} from "@/components/offertes/templates/templateRegistry";
import {
  HeroDark, HeroSplit, HeroMinimal, HeroGradient, HeroPhoto,
} from "@/components/offertes/templates/VoorbladTemplates";
import {
  ProductList, ProductCards, ProductGrid, ProductSpotlight, ProductShowcase,
} from "@/components/offertes/templates/ProductTemplates";
import {
  PriceClassic, PriceModern, PriceCompact, PriceDetailed,
} from "@/components/offertes/templates/PrijstabelTemplates";
import {
  EnergyCards, EnergyInfographic, EnergyMinimal,
} from "@/components/offertes/templates/EnergieadviesTemplates";
import {
  TermsSimple, TermsBoxed, TermsSidebar,
} from "@/components/offertes/templates/VoorwaardenTemplates";
import { toast } from "sonner";

/* ─── Sample data for live preview ─── */
const pc = "#5B58E1";
const sc = "#1a1a2e";
const pcTint = "rgba(91,88,225,0.08)";
const pcTint2 = "rgba(91,88,225,0.15)";

const sampleVoorblad = {
  pc, sc, pcTint,
  logoUrl: null,
  partnerNaam: "Uw Bedrijfsnaam",
  klantNaam: "Jan de Vries",
  offertenummer: "OF-250318-0001",
  adviseurNaam: "Piet Jansen",
  datum: "18 maart 2025",
  categoryLabel: "Zonnepanelen",
  productNaam: "SolarMax 400W All-Black",
  slogan: "Slim verduurzamen begint hier",
  introTekst: "Beste Jan, graag presenteren wij u onze offerte voor de verduurzaming van uw woning. Na ons bezoek hebben wij een passende oplossing samengesteld.",
  badges: ["Gecertificeerd installateur", "Persoonlijk advies", "Professionele installatie"],
  telefoon: "020-1234567",
  klantAdres: "Keizersgracht 1",
  klantPostcode: "1015 AA",
  klantPlaats: "Amsterdam",
  isThumbnail: false,
};

const sampleProduct = {
  naam: "SolarMax 400W All-Black",
  merk: "SolarMax",
  model: "SM-400-AB",
  omschrijving: "Hoogrendement full-black zonnepaneel met 25 jaar vermogensgarantie. Geschikt voor zowel schuin- als platdak montage.",
  afbeelding_url: null as string | null,
  garantie_jaren: 25 as number | null,
  certificeringen: "IEC 61215, IEC 61730" as string | null,
  specs: { Vermogen: "400 Wp", Rendement: "21.3%", Afmetingen: "1722 × 1134 × 30mm" } as Record<string, any> | null,
  onderhoud: null as string | null,
};

const sampleRegels = [
  { omschrijving: "SolarMax 400W All-Black (12×)", aantal: 12, prijs_per_stuk: 350, btw_percentage: 21, korting_percentage: 5 },
  { omschrijving: "SolarEdge SE5000H Omvormer", aantal: 1, prijs_per_stuk: 1200, btw_percentage: 21, korting_percentage: 0 },
  { omschrijving: "Montagesysteem schuin dak", aantal: 1, prijs_per_stuk: 450, btw_percentage: 21, korting_percentage: 0 },
  { omschrijving: "Installatie & aansluiting", aantal: 1, prijs_per_stuk: 800, btw_percentage: 21, korting_percentage: 0 },
];

const fmtCur = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

const subtotaal = sampleRegels.reduce((s, r) => s + r.aantal * r.prijs_per_stuk * (1 - r.korting_percentage / 100), 0);
const btwBedrag = sampleRegels.reduce((s, r) => {
  const sub = r.aantal * r.prijs_per_stuk * (1 - r.korting_percentage / 100);
  return s + sub * (r.btw_percentage / 100);
}, 0);
const totaalBedrag = subtotaal + btwBedrag;

/* Thumbnail page wrapper to simulate real PDF page structure */
const ThumbnailPage: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ width: 794, height: 1123, backgroundColor: "#fff", fontFamily: "'Rubik', sans-serif", fontSize: 13, color: "#1a1a2e", display: "flex", flexDirection: "column", boxSizing: "border-box", padding: "56px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 14, borderBottom: `2px solid ${pc}`, marginBottom: 20 }}>
      <div style={{ width: 80, height: 28, backgroundColor: pcTint, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#999" }}>Logo</div>
      <div style={{ fontSize: 9, color: "#999" }}>info@bedrijf.nl • 020-1234567</div>
    </div>
    <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1a1a2e", margin: "0 0 6px" }}>{title}</h2>
    <div style={{ width: 48, height: 3, backgroundColor: pc, borderRadius: 2, marginBottom: 20 }} />
    <div style={{ flex: 1, overflow: "hidden" }}>{children}</div>
    <div style={{ borderTop: `2px solid ${pc}`, paddingTop: 10, marginTop: "auto", fontSize: 8, color: "#999", textAlign: "center" }}>
      Bedrijf • Voorbeeldstraat 1 • 1234 AB Amsterdam • KVK 12345678
    </div>
  </div>
);

/* ─── Thumbnail component map ─── */
const thumbnailMap: Record<string, React.ReactNode> = {
  "hero-dark": <HeroDark {...sampleVoorblad} isThumbnail />,
  "hero-split": <HeroSplit {...sampleVoorblad} isThumbnail />,
  "hero-minimal": <HeroMinimal {...sampleVoorblad} isThumbnail />,
  "hero-gradient": <HeroGradient {...sampleVoorblad} isThumbnail />,
  "hero-photo": <HeroPhoto {...sampleVoorblad} isThumbnail />,
  "product-list": <ThumbnailPage title="Producten"><ProductList pc={pc} sc={sc} pcTint={pcTint} producten={[sampleProduct]} isThumbnail /></ThumbnailPage>,
  "product-cards": <ThumbnailPage title="Producten"><ProductCards pc={pc} sc={sc} pcTint={pcTint} producten={[sampleProduct]} isThumbnail /></ThumbnailPage>,
  "product-grid": <ThumbnailPage title="Producten"><ProductGrid pc={pc} sc={sc} pcTint={pcTint} producten={[sampleProduct]} isThumbnail /></ThumbnailPage>,
  "product-spotlight": <ThumbnailPage title="Producten"><ProductSpotlight pc={pc} sc={sc} pcTint={pcTint} producten={[sampleProduct]} isThumbnail /></ThumbnailPage>,
  "product-showcase": <ThumbnailPage title="Product Showcase"><ProductShowcase pc={pc} sc={sc} pcTint={pcTint} producten={[sampleProduct]} index={0} /></ThumbnailPage>,
  "price-classic": <ThumbnailPage title="Opdrachtbevestiging"><PriceClassic pc={pc} sc={sc} pcTint={pcTint} pcTint2={pcTint2} regels={sampleRegels} subtotaal={subtotaal} btwBedrag={btwBedrag} totaalBedrag={totaalBedrag} formatCurrency={fmtCur} isThumbnail /></ThumbnailPage>,
  "price-modern": <ThumbnailPage title="Opdrachtbevestiging"><PriceModern pc={pc} sc={sc} pcTint={pcTint} pcTint2={pcTint2} regels={sampleRegels} subtotaal={subtotaal} btwBedrag={btwBedrag} totaalBedrag={totaalBedrag} formatCurrency={fmtCur} isThumbnail /></ThumbnailPage>,
  "price-compact": <ThumbnailPage title="Opdrachtbevestiging"><PriceCompact pc={pc} sc={sc} pcTint={pcTint} pcTint2={pcTint2} regels={sampleRegels} subtotaal={subtotaal} btwBedrag={btwBedrag} totaalBedrag={totaalBedrag} formatCurrency={fmtCur} isThumbnail /></ThumbnailPage>,
  "price-detailed": <ThumbnailPage title="Opdrachtbevestiging"><PriceDetailed pc={pc} sc={sc} pcTint={pcTint} pcTint2={pcTint2} regels={sampleRegels} subtotaal={subtotaal} btwBedrag={btwBedrag} totaalBedrag={totaalBedrag} formatCurrency={fmtCur} isThumbnail /></ThumbnailPage>,
  "energy-cards": <ThumbnailPage title="Besparing & Rendement"><EnergyCards pc={pc} sc={sc} pcTint={pcTint} capaciteit={5} besparing={850} terugverdientijd={6.5} investering={5500} formatCurrency={fmtCur} isThumbnail /></ThumbnailPage>,
  "energy-infographic": <ThumbnailPage title="Besparing & Rendement"><EnergyInfographic pc={pc} sc={sc} pcTint={pcTint} capaciteit={5} besparing={850} terugverdientijd={6.5} investering={5500} formatCurrency={fmtCur} isThumbnail /></ThumbnailPage>,
  "energy-minimal": <ThumbnailPage title="Besparing & Rendement"><EnergyMinimal pc={pc} sc={sc} pcTint={pcTint} capaciteit={5} besparing={850} terugverdientijd={6.5} investering={5500} formatCurrency={fmtCur} isThumbnail /></ThumbnailPage>,
  "terms-simple": <ThumbnailPage title="Voorwaarden & Akkoord"><TermsSimple pc={pc} sc={sc} pcTint={pcTint} pcTint2={pcTint2} partnerNaam="Uw Bedrijf" klantNaam="Jan de Vries" adviseurNaam="Piet Jansen" datum="18 maart 2025" garantieVw="Productgarantie conform fabrikant" installTermijn="Binnen 4 weken" betalingsvoorwaarden="30 dagen netto" notities={null} akkoordTekst="" isThumbnail /></ThumbnailPage>,
  "terms-boxed": <ThumbnailPage title="Voorwaarden & Akkoord"><TermsBoxed pc={pc} sc={sc} pcTint={pcTint} pcTint2={pcTint2} partnerNaam="Uw Bedrijf" klantNaam="Jan de Vries" adviseurNaam="Piet Jansen" datum="18 maart 2025" garantieVw="Productgarantie conform fabrikant" installTermijn="Binnen 4 weken" betalingsvoorwaarden="30 dagen netto" notities={null} akkoordTekst="" isThumbnail /></ThumbnailPage>,
  "terms-sidebar": <ThumbnailPage title="Voorwaarden & Akkoord"><TermsSidebar pc={pc} sc={sc} pcTint={pcTint} pcTint2={pcTint2} partnerNaam="Uw Bedrijf" klantNaam="Jan de Vries" adviseurNaam="Piet Jansen" datum="18 maart 2025" garantieVw="Productgarantie conform fabrikant" installTermijn="Binnen 4 weken" betalingsvoorwaarden="30 dagen netto" notities={null} akkoordTekst="" isThumbnail /></ThumbnailPage>,
};

/* ─── Live preview component map ─── */
const liveVoorbladMap: Record<string, React.FC<any>> = {
  "hero-dark": HeroDark, "hero-split": HeroSplit, "hero-minimal": HeroMinimal, "hero-gradient": HeroGradient, "hero-photo": HeroPhoto,
};
const liveProductMap: Record<string, React.FC<any>> = {
  "product-list": ProductList, "product-cards": ProductCards, "product-grid": ProductGrid, "product-spotlight": ProductSpotlight, "product-showcase": ProductShowcase,
};
const livePrijsMap: Record<string, React.FC<any>> = {
  "price-classic": PriceClassic, "price-modern": PriceModern, "price-compact": PriceCompact, "price-detailed": PriceDetailed,
};
const liveEnergieMap: Record<string, React.FC<any>> = {
  "energy-cards": EnergyCards, "energy-infographic": EnergyInfographic, "energy-minimal": EnergyMinimal,
};
const liveVoorwaardenMap: Record<string, React.FC<any>> = {
  "terms-simple": TermsSimple, "terms-boxed": TermsBoxed, "terms-sidebar": TermsSidebar,
};

const sectionToggleKeys: Record<string, keyof TemplateConfig> = {
  voorblad: "secties_voorblad",
  producten: "secties_producten",
  energieadvies: "secties_energieadvies",
};

export default function OfferteTemplatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Load config from sessionStorage or defaults
  const [config, setConfig] = useState<TemplateConfig>(() => {
    const raw = sessionStorage.getItem("offerte-template-config");
    if (raw) {
      try { return { ...defaultTemplateConfig, ...JSON.parse(raw) }; } catch {}
    }
    return { ...defaultTemplateConfig };
  });

  const [expandedSectie, setExpandedSectie] = useState<string | null>("voorblad");
  const [showCustomization, setShowCustomization] = useState(false);
  const [zoom, setZoom] = useState(52);

  const handleSelect = (sectieId: string, variantId: string) => {
    setConfig(prev => ({ ...prev, [sectieId]: variantId }));
  };

  const handleToggle = (sectieId: string, enabled: boolean) => {
    const key = sectionToggleKeys[sectieId];
    if (key) {
      setConfig(prev => ({ ...prev, [key]: enabled }));
    }
  };

  const handleSave = () => {
    sessionStorage.setItem("offerte-template-config", JSON.stringify(config));
    toast.success("Template opgeslagen");
    const returnTo = searchParams.get("return") || "/offertes/nieuw";
    navigate(returnTo);
  };

  /* ─── Live preview renderer ─── */
  const renderLivePreview = () => {
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

    const badges = [
      config.badge_1 || "Gecertificeerd installateur",
      config.badge_2 || "Persoonlijk advies",
      config.badge_3 || "Professionele installatie",
    ];

    return (
      <div style={{ transformOrigin: "top left" }}>
        {/* Voorblad */}
        {config.secties_voorblad !== false && (() => {
          const Comp = liveVoorbladMap[config.voorblad] || HeroDark;
          return (
            <div style={{ ...pageStyle, padding: 0 }}>
              <Comp {...sampleVoorblad} badges={badges} heroImageUrl={config.hero_image_url || null} heroTitle={config.hero_title || "Offerte"} />
            </div>
          );
        })()}

        {/* Inhoudsopgave */}
        <div style={{ ...pageStyle, padding: "15mm" }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: sc, margin: "0 0 6px" }}>Inhoudsopgave</h2>
          <div style={{ width: 64, height: 4, backgroundColor: pc, borderRadius: 2, marginBottom: 40 }} />
          <div style={{ maxWidth: 500 }}>
            {["Voorblad", "Producten", "Opdrachtbevestiging", "Besparing & Rendement", "Voorwaarden & Akkoord"].map((label, i) => (
              <div key={i} style={{ display: "flex", alignItems: "baseline", padding: "14px 0", borderBottom: `1px solid ${pcTint2}` }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: pcTint, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: pc, flexShrink: 0, marginRight: 16 }}>
                  {i + 1}
                </div>
                <span style={{ fontSize: 15, fontWeight: 500, color: sc, flex: 1 }}>{label}</span>
                <span style={{ fontSize: 12, color: "#aaa", marginLeft: 12 }}>p. {i + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Producten */}
        {config.secties_producten !== false && (() => {
          const Comp = liveProductMap[config.producten] || ProductCards;
          return (
            <div style={{ ...pageStyle, padding: "15mm" }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: sc, margin: "0 0 6px" }}>Uw producten</h2>
              <div style={{ width: 48, height: 3, backgroundColor: pc, borderRadius: 2, marginBottom: 24 }} />
              <Comp pc={pc} sc={sc} pcTint={pcTint} producten={[sampleProduct]} />
            </div>
          );
        })()}

        {/* Prijstabel */}
        {(() => {
          const Comp = livePrijsMap[config.prijstabel] || PriceModern;
          return (
            <div style={{ ...pageStyle, padding: "15mm" }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: sc, margin: "0 0 6px" }}>Opdrachtbevestiging</h2>
              <div style={{ width: 48, height: 3, backgroundColor: pc, borderRadius: 2, marginBottom: 24 }} />
              <Comp pc={pc} sc={sc} pcTint={pcTint} pcTint2={pcTint2} regels={sampleRegels} subtotaal={subtotaal} btwBedrag={btwBedrag} totaalBedrag={totaalBedrag} formatCurrency={fmtCur} />
            </div>
          );
        })()}

        {/* Energieadvies */}
        {config.secties_energieadvies !== false && (() => {
          const Comp = liveEnergieMap[config.energieadvies] || EnergyCards;
          return (
            <div style={{ ...pageStyle, padding: "15mm" }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: sc, margin: "0 0 6px" }}>Uw besparing & rendement</h2>
              <div style={{ width: 48, height: 3, backgroundColor: pc, borderRadius: 2, marginBottom: 24 }} />
              <Comp pc={pc} sc={sc} pcTint={pcTint} capaciteit={5} besparing={850} terugverdientijd={6.5} investering={5500} formatCurrency={fmtCur} />
            </div>
          );
        })()}

        {/* Voorwaarden */}
        {(() => {
          const Comp = liveVoorwaardenMap[config.voorwaarden] || TermsSimple;
          return (
            <div style={{ ...pageStyle, padding: "15mm" }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: sc, margin: "0 0 6px" }}>Voorwaarden & Akkoord</h2>
              <div style={{ width: 48, height: 3, backgroundColor: pc, borderRadius: 2, marginBottom: 24 }} />
              <Comp
                pc={pc} sc={sc} pcTint={pcTint} pcTint2={pcTint2}
                partnerNaam="Uw Bedrijf"
                klantNaam="Jan de Vries"
                adviseurNaam="Piet Jansen"
                datum="18 maart 2025"
                garantieVw="Productgarantie conform fabrikant"
                installTermijn="Binnen 4 weken"
                betalingsvoorwaarden="30 dagen netto"
                notities={null}
                akkoordTekst={config.akkoord_tekst || ""}
              />
            </div>
          );
        })()}
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* ═══ LEFT PANEL: Section selection ═══ */}
      <div className="w-[420px] flex-shrink-0 border-r border-border bg-background flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(searchParams.get("return") || "/offertes/nieuw")} className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Template builder</h1>
              <p className="text-xs text-muted-foreground">Kies per sectie het design</p>
            </div>
          </div>
          <Button onClick={handleSave} size="sm" className="gap-1.5">
            <Save className="h-3.5 w-3.5" /> Opslaan
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-1">
            {templateSecties.map(sectie => {
              const isExpanded = expandedSectie === sectie.id;
              const toggleKey = sectionToggleKeys[sectie.id];
              const isEnabled = toggleKey ? config[toggleKey] !== false : true;

              return (
                <div key={sectie.id} className="rounded-xl border border-border overflow-hidden">
                  {/* Sectie header */}
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
                    <div className="flex items-center gap-2">
                      {toggleKey && (
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={(v) => { handleToggle(sectie.id, v); }}
                          onClick={(e) => e.stopPropagation()}
                          className="scale-75"
                        />
                      )}
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </button>

                  {/* Variant grid */}
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
                                isSelected
                                  ? "border-primary ring-2 ring-primary/20 shadow-md"
                                  : "border-border hover:border-primary/40"
                              }`}
                            >
                              {/* Thumbnail */}
                              <div className="w-full aspect-[210/297] rounded-t-md overflow-hidden bg-white relative">
                                {isSelected && (
                                  <div className="absolute top-1.5 right-1.5 z-10 bg-primary text-primary-foreground rounded-full p-0.5">
                                    <Check className="h-3 w-3" />
                                  </div>
                                )}
                                <div
                                  style={{
                                    width: 794,
                                    height: 1123,
                                    transform: "scale(0.155)",
                                    transformOrigin: "top left",
                                    pointerEvents: "none",
                                    overflow: "hidden",
                                  }}
                                >
                                  {thumb || (
                                    <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-xs">
                                      Preview
                                    </div>
                                  )}
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
                    <Input
                      value={config.hero_title || ""}
                      onChange={e => setConfig(p => ({ ...p, hero_title: e.target.value }))}
                      className="h-8 text-xs rounded-lg"
                      placeholder="Offerte"
                    />
                  </div>
                  <div>
                    <Label className="text-xs flex items-center gap-1"><ImageIcon className="h-3 w-3" /> Hero afbeelding URL</Label>
                    <Input
                      value={config.hero_image_url || ""}
                      onChange={e => setConfig(p => ({ ...p, hero_image_url: e.target.value }))}
                      className="h-8 text-xs rounded-lg"
                      placeholder="https://voorbeeld.nl/afbeelding.jpg"
                    />
                    {config.hero_image_url && (
                      <div className="mt-1.5 rounded-lg overflow-hidden border border-border h-16">
                        <img src={config.hero_image_url} alt="Hero preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                    )}
                  </div>
                  <Separator />
                  <div>
                    <Label className="text-xs">Badge 1</Label>
                    <Input
                      value={config.badge_1 || ""}
                      onChange={e => setConfig(p => ({ ...p, badge_1: e.target.value }))}
                      className="h-8 text-xs rounded-lg"
                      placeholder="Gecertificeerd installateur"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Badge 2</Label>
                    <Input
                      value={config.badge_2 || ""}
                      onChange={e => setConfig(p => ({ ...p, badge_2: e.target.value }))}
                      className="h-8 text-xs rounded-lg"
                      placeholder="Persoonlijk advies"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Badge 3</Label>
                    <Input
                      value={config.badge_3 || ""}
                      onChange={e => setConfig(p => ({ ...p, badge_3: e.target.value }))}
                      className="h-8 text-xs rounded-lg"
                      placeholder="Professionele installatie"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Akkoord tekst</Label>
                    <Input
                      value={config.akkoord_tekst || ""}
                      onChange={e => setConfig(p => ({ ...p, akkoord_tekst: e.target.value }))}
                      className="h-8 text-xs rounded-lg"
                      placeholder="Door ondertekening gaat u akkoord met..."
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* ═══ RIGHT PANEL: Live preview ═══ */}
      <div className="flex-1 bg-muted/30 overflow-auto flex flex-col">
        <div className="flex items-center gap-3 p-3 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Live preview</span>
          <div className="ml-auto flex items-center gap-2">
            <ZoomIn className="h-3.5 w-3.5 text-muted-foreground" />
            <Slider
              value={[zoom]}
              onValueChange={([v]) => setZoom(v)}
              min={25}
              max={100}
              step={1}
              className="w-28"
            />
            <span className="text-xs text-muted-foreground w-8">{zoom}%</span>
          </div>
        </div>
        <div className="flex-1 p-8">
          <div
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: "top left",
              width: "210mm",
            }}
          >
            {renderLivePreview()}
          </div>
        </div>
      </div>
    </div>
  );
}
