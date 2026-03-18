import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Check, Palette } from "lucide-react";
import { templateSecties, defaultTemplateConfig, type TemplateConfig } from "./templates/templateRegistry";
import { HeroDark, HeroSplit, HeroMinimal, HeroGradient, HeroPhoto } from "./templates/VoorbladTemplates";
import { ProductList, ProductCards, ProductGrid, ProductSpotlight } from "./templates/ProductTemplates";
import { PriceClassic, PriceModern, PriceCompact, PriceDetailed } from "./templates/PrijstabelTemplates";
import { EnergyCards, EnergyInfographic, EnergyMinimal } from "./templates/EnergieadviesTemplates";
import { TermsSimple, TermsBoxed, TermsSidebar } from "./templates/VoorwaardenTemplates";

interface OfferteTemplateBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentConfig: TemplateConfig;
  onSave: (config: TemplateConfig) => void;
}

// Sample data for thumbnail previews
const sampleProps = {
  pc: "#5B58E1",
  sc: "#1a1a2e",
  pcTint: "rgba(91,88,225,0.08)",
  logoUrl: null,
  partnerNaam: "Bedrijf",
  klantNaam: "Jan de Vries",
  offertenummer: "OF-240101-0001",
  adviseurNaam: "Piet Jansen",
  datum: "1 januari 2025",
  categoryLabel: "Zonnepanelen",
  productNaam: "SolarMax 400W",
  slogan: "Slim verduurzamen",
  introTekst: "Beste Jan, graag presenteren wij u onze offerte.",
  badges: ["Gecertificeerd", "Persoonlijk advies", "Professioneel"],
  telefoon: "020-1234567",
  klantAdres: "Keizersgracht 1",
  klantPostcode: "1015 AA",
  klantPlaats: "Amsterdam",
  isThumbnail: true,
};

const sampleProduct = {
  naam: "SolarMax 400W",
  merk: "SolarMax",
  model: "SM-400",
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

const pcTint2 = "rgba(91,88,225,0.15)";

// Map variant IDs to their actual components
const thumbnailComponents: Record<string, React.ReactNode> = {
  "hero-dark": <HeroDark {...sampleProps} />,
  "hero-split": <HeroSplit {...sampleProps} />,
  "hero-minimal": <HeroMinimal {...sampleProps} />,
  "hero-gradient": <HeroGradient {...sampleProps} />,
  "hero-photo": <HeroPhoto {...sampleProps} />,
  "product-list": <ProductList pc={sampleProps.pc} sc={sampleProps.sc} pcTint={sampleProps.pcTint} producten={[sampleProduct]} isThumbnail />,
  "product-cards": <ProductCards pc={sampleProps.pc} sc={sampleProps.sc} pcTint={sampleProps.pcTint} producten={[sampleProduct]} isThumbnail />,
  "product-grid": <ProductGrid pc={sampleProps.pc} sc={sampleProps.sc} pcTint={sampleProps.pcTint} producten={[sampleProduct]} isThumbnail />,
  "product-spotlight": <ProductSpotlight pc={sampleProps.pc} sc={sampleProps.sc} pcTint={sampleProps.pcTint} producten={[sampleProduct]} isThumbnail />,
  "price-classic": <PriceClassic pc={sampleProps.pc} sc={sampleProps.sc} pcTint={sampleProps.pcTint} pcTint2={pcTint2} regels={sampleRegels} subtotaal={5050} btwBedrag={1060.5} totaalBedrag={6110.5} formatCurrency={fmtCur} isThumbnail />,
  "price-modern": <PriceModern pc={sampleProps.pc} sc={sampleProps.sc} pcTint={sampleProps.pcTint} pcTint2={pcTint2} regels={sampleRegels} subtotaal={5050} btwBedrag={1060.5} totaalBedrag={6110.5} formatCurrency={fmtCur} isThumbnail />,
  "price-compact": <PriceCompact pc={sampleProps.pc} sc={sampleProps.sc} pcTint={sampleProps.pcTint} pcTint2={pcTint2} regels={sampleRegels} subtotaal={5050} btwBedrag={1060.5} totaalBedrag={6110.5} formatCurrency={fmtCur} isThumbnail />,
  "price-detailed": <PriceDetailed pc={sampleProps.pc} sc={sampleProps.sc} pcTint={sampleProps.pcTint} pcTint2={pcTint2} regels={sampleRegels} subtotaal={5050} btwBedrag={1060.5} totaalBedrag={6110.5} formatCurrency={fmtCur} isThumbnail />,
  "energy-cards": <EnergyCards pc={sampleProps.pc} sc={sampleProps.sc} pcTint={sampleProps.pcTint} capaciteit={5} besparing={850} terugverdientijd={6.5} investering={5500} formatCurrency={fmtCur} isThumbnail />,
  "energy-infographic": <EnergyInfographic pc={sampleProps.pc} sc={sampleProps.sc} pcTint={sampleProps.pcTint} capaciteit={5} besparing={850} terugverdientijd={6.5} investering={5500} formatCurrency={fmtCur} isThumbnail />,
  "energy-minimal": <EnergyMinimal pc={sampleProps.pc} sc={sampleProps.sc} pcTint={sampleProps.pcTint} capaciteit={5} besparing={850} terugverdientijd={6.5} investering={5500} formatCurrency={fmtCur} isThumbnail />,
  "terms-simple": <TermsSimple pc={sampleProps.pc} sc={sampleProps.sc} pcTint={sampleProps.pcTint} pcTint2={pcTint2} partnerNaam={sampleProps.partnerNaam} klantNaam={sampleProps.klantNaam} adviseurNaam={sampleProps.adviseurNaam} datum="1 januari 2025" garantieVw="Productgarantie conform fabrikant" installTermijn="Binnen 4 weken" betalingsvoorwaarden="30 dagen netto" notities={null} akkoordTekst="" isThumbnail />,
  "terms-boxed": <TermsBoxed pc={sampleProps.pc} sc={sampleProps.sc} pcTint={sampleProps.pcTint} pcTint2={pcTint2} partnerNaam={sampleProps.partnerNaam} klantNaam={sampleProps.klantNaam} adviseurNaam={sampleProps.adviseurNaam} datum="1 januari 2025" garantieVw="Productgarantie conform fabrikant" installTermijn="Binnen 4 weken" betalingsvoorwaarden="30 dagen netto" notities={null} akkoordTekst="" isThumbnail />,
  "terms-sidebar": <TermsSidebar pc={sampleProps.pc} sc={sampleProps.sc} pcTint={sampleProps.pcTint} pcTint2={pcTint2} partnerNaam={sampleProps.partnerNaam} klantNaam={sampleProps.klantNaam} adviseurNaam={sampleProps.adviseurNaam} datum="1 januari 2025" garantieVw="Productgarantie conform fabrikant" installTermijn="Binnen 4 weken" betalingsvoorwaarden="30 dagen netto" notities={null} akkoordTekst="" isThumbnail />,
};

export default function OfferteTemplateBuilder({ open, onOpenChange, currentConfig, onSave }: OfferteTemplateBuilderProps) {
  const [config, setConfig] = useState<TemplateConfig>(currentConfig || defaultTemplateConfig);

  const handleSelect = (sectieId: string, variantId: string) => {
    setConfig(prev => ({ ...prev, [sectieId]: variantId }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Offerte template kiezen
          </DialogTitle>
          <p className="text-sm text-muted-foreground">Kies per sectie het gewenste design. Alle templates worden in jouw huisstijl weergegeven.</p>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-8">
            {templateSecties.map(sectie => (
              <div key={sectie.id}>
                <h3 className="text-sm font-semibold text-foreground mb-3">{sectie.naam}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {sectie.varianten.map(variant => {
                    const isSelected = config[sectie.id as keyof TemplateConfig] === variant.id;
                    const component = thumbnailComponents[variant.id];
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => handleSelect(sectie.id, variant.id)}
                        className={`relative rounded-xl border-2 p-1 transition-all hover:shadow-md ${
                          isSelected
                            ? "border-primary ring-2 ring-primary/20 shadow-md"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        {/* Mini-render thumbnail */}
                        <div className="w-full aspect-[3/2] rounded-lg overflow-hidden bg-white relative">
                          {isSelected && (
                            <div className="absolute top-1 right-1 z-10 bg-primary text-primary-foreground rounded-full p-0.5">
                              <Check className="h-3 w-3" />
                            </div>
                          )}
                          <div
                            style={{
                              width: 794,
                              height: 530,
                              transform: "scale(0.18)",
                              transformOrigin: "top left",
                              pointerEvents: "none",
                              overflow: "hidden",
                            }}
                          >
                            {component || (
                              <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-xs">
                                Preview
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-xs font-medium text-foreground truncate mt-1">{variant.naam}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{variant.beschrijving}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {Object.entries(config).map(([key, val]) => (
              <Badge key={key} variant="secondary" className="text-xs">
                {templateSecties.find(s => s.id === key)?.naam}: {templateSecties.find(s => s.id === key)?.varianten.find(v => v.id === val)?.naam}
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-pill">Annuleren</Button>
            <Button onClick={() => { onSave(config); onOpenChange(false); }} className="rounded-pill">Opslaan</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
