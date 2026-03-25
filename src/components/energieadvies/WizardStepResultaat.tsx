import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle, TrendingUp, Battery, Sun, Flame, Car, Cpu,
  ShoppingCart, FileText, Info, Leaf, Zap, ArrowRight, Download, UserPlus,
} from "lucide-react";
import type { AdviesResultaat, ProductMatch } from "./types";

interface Props {
  adviezen: AdviesResultaat[];
  producten: ProductMatch[];
  isAdviseur: boolean;
  onLeadKoppelen?: () => void;
  onPDFDownload?: () => void;
}

const categorieIcons: Record<string, typeof Sun> = {
  zonnepanelen: Sun,
  thuisbatterij: Battery,
  warmtepomp: Flame,
  laadpaal: Car,
  omvormer: Cpu,
};

const prioriteitKleur: Record<string, string> = {
  hoog: "bg-red-500/10 text-red-700 dark:text-red-400",
  middel: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  laag: "bg-muted text-muted-foreground",
};

const matchLabelKleur: Record<string, string> = {
  "Beste keuze": "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200",
  "Goede match": "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200",
  "Alternatief": "bg-muted text-muted-foreground border-border",
  "Beperkt geschikt": "bg-muted text-muted-foreground border-border",
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

export default function WizardStepResultaat({ adviezen, producten, isAdviseur, onLeadKoppelen, onPDFDownload }: Props) {
  const navigate = useNavigate();
  const [geselecteerdeProducten, setGeselecteerdeProducten] = useState<Record<string, number>>({});

  const toggleProduct = (id: string) => {
    setGeselecteerdeProducten(prev => {
      if (prev[id]) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: 1 };
    });
  };

  const updateAantal = (id: string, aantal: number) => {
    setGeselecteerdeProducten(prev => ({ ...prev, [id]: Math.max(1, aantal) }));
  };

  const maakOfferte = () => {
    const regels = Object.entries(geselecteerdeProducten).map(([id, aantal]) => {
      const p = producten.find(pr => pr.id === id)!;
      return {
        product_id: p.id,
        omschrijving: `${p.naam}${p.merk ? ` — ${p.merk}` : ""}${p.model ? ` ${p.model}` : ""}`,
        aantal,
        prijs_per_stuk: p.prijs_excl_btw,
        btw_percentage: p.btw_percentage ?? 21,
        korting_percentage: 0,
      };
    });
    sessionStorage.setItem("offerte-prefill", JSON.stringify({ regels }));
    navigate("/offertes?nieuw=1");
  };

  const selectedCount = Object.keys(geselecteerdeProducten).length;

  // Totalen berekenen
  const totaleBesparing = adviezen.reduce((sum, a) => sum + (a.geschatteBesparing || 0), 0);
  const totaleCO2 = adviezen.reduce((sum, a) => sum + (a.co2BesparingKg || 0), 0);
  const maxZelfvoorzieningsgraad = Math.max(...adviezen.map(a => a.zelfvoorzieningsgraad || 0), 0);

  return (
    <div className="space-y-6">
      {/* === Samenvatting === */}
      {adviezen.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="rounded-2xl border-0 shadow-sm bg-emerald-500/5">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Geschatte besparing/jaar</p>
                <p className="text-xl font-bold text-foreground">{formatCurrency(totaleBesparing)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-0 shadow-sm bg-blue-500/5">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Leaf className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">CO₂-reductie per jaar</p>
                <p className="text-xl font-bold text-foreground">{totaleCO2.toLocaleString("nl-NL")} kg</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-0 shadow-sm bg-amber-500/5">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Zelfvoorzieningsgraad</p>
                <p className="text-xl font-bold text-foreground">{maxZelfvoorzieningsgraad}%</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* === Adviezen === */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-primary" />
          Uw persoonlijk advies
        </h2>

        {adviezen.length === 0 ? (
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardContent className="py-12 text-center">
              <Info className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Selecteer minimaal één categorie in de vorige stap om advies te ontvangen.</p>
            </CardContent>
          </Card>
        ) : (
          adviezen.map((advies, i) => {
            const Icon = categorieIcons[advies.categorie] || Sun;
            return (
              <Card key={i} className={`rounded-2xl border-0 shadow-sm ${advies.aanbevolen ? "ring-2 ring-primary/20 bg-primary/[0.02]" : ""}`}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground">{advies.titel}</h3>
                        {advies.aanbevolen && <Badge className="bg-primary/10 text-primary text-xs">Aanbevolen</Badge>}
                        <Badge className={`text-xs ${prioriteitKleur[advies.prioriteit]}`}>
                          Prioriteit: {advies.prioriteit}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{advies.toelichting}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {advies.geschatteCapaciteit && (
                          <div className="bg-muted/50 rounded-lg p-2.5">
                            <p className="text-xs text-muted-foreground">Capaciteit</p>
                            <p className="font-semibold text-sm text-foreground">{advies.geschatteCapaciteit}</p>
                          </div>
                        )}
                        {advies.geschatteBesparing !== undefined && (
                          <div className="bg-muted/50 rounded-lg p-2.5">
                            <p className="text-xs text-muted-foreground">Besparing/jaar</p>
                            <p className="font-semibold text-sm text-foreground">{formatCurrency(advies.geschatteBesparing)}</p>
                          </div>
                        )}
                        {advies.geschatteInvestering && (
                          <div className="bg-muted/50 rounded-lg p-2.5">
                            <p className="text-xs text-muted-foreground">Investering</p>
                            <p className="font-semibold text-sm text-foreground">{advies.geschatteInvestering}</p>
                          </div>
                        )}
                        {advies.terugverdientijd && (
                          <div className="bg-muted/50 rounded-lg p-2.5">
                            <p className="text-xs text-muted-foreground">Terugverdientijd</p>
                            <p className="font-semibold text-sm text-foreground">{advies.terugverdientijd}</p>
                          </div>
                        )}
                        {advies.co2BesparingKg !== undefined && advies.co2BesparingKg > 0 && (
                          <div className="bg-emerald-500/5 rounded-lg p-2.5">
                            <p className="text-xs text-muted-foreground">CO₂-reductie</p>
                            <p className="font-semibold text-sm text-emerald-700 dark:text-emerald-400">{advies.co2BesparingKg} kg/jaar</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* === Producten === */}
      {producten.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Aanbevolen producten
            </h2>
            <div className="flex gap-2">
              {isAdviseur && selectedCount > 0 && (
                <Button onClick={maakOfferte} className="rounded-full gap-2">
                  <FileText className="h-4 w-4" />
                  Offerte aanmaken ({selectedCount})
                </Button>
              )}
            </div>
          </div>

          {Array.from(new Set(producten.map(p => p.categorie))).map(cat => {
            const catProducten = producten.filter(p => p.categorie === cat);
            const Icon = categorieIcons[cat] || Sun;
            return (
              <div key={cat} className="space-y-3">
                <h3 className="font-medium text-foreground flex items-center gap-2 text-sm">
                  <Icon className="h-4 w-4 text-primary" />
                  {cat.charAt(0).toUpperCase() + cat.slice(1).replace("_", " ")}
                </h3>
                {catProducten.map(product => {
                  const selected = !!geselecteerdeProducten[product.id];
                  return (
                    <Card key={product.id} className={`rounded-xl border shadow-sm transition-all ${selected ? "ring-2 ring-primary/30" : ""}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {isAdviseur && (
                            <Checkbox
                              checked={selected}
                              onCheckedChange={() => toggleProduct(product.id)}
                              className="mt-1"
                            />
                          )}
                          {product.afbeelding_url && (
                            <img
                              src={product.afbeelding_url}
                              alt={product.naam}
                              className="h-16 w-16 rounded-lg object-cover shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-medium text-foreground text-sm">{product.naam}</p>
                                  <Badge className={`text-xs ${matchLabelKleur[product.matchLabel]}`}>
                                    {product.matchLabel}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {[product.merk, product.model].filter(Boolean).join(" ")}
                                </p>
                              </div>
                              <p className="font-semibold text-foreground whitespace-nowrap">
                                {formatCurrency(product.prijs_excl_btw)}
                                <span className="text-xs text-muted-foreground font-normal"> excl. BTW</span>
                              </p>
                            </div>
                            {/* Kern specs */}
                            {Object.keys(product.kernSpecs).length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {Object.entries(product.kernSpecs).slice(0, 5).map(([key, val]) => (
                                  <span key={key} className="text-xs bg-muted/60 rounded-md px-2 py-0.5 text-muted-foreground">
                                    {key}: <span className="font-medium text-foreground">{val}</span>
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-muted-foreground">{product.scoreReden}</span>
                            </div>
                            {selected && isAdviseur && (
                              <div className="mt-2 flex items-center gap-2">
                                <Label className="text-xs text-muted-foreground">Aantal:</Label>
                                <Input
                                  type="number"
                                  min={1}
                                  value={geselecteerdeProducten[product.id]}
                                  onChange={e => updateAantal(product.id, parseInt(e.target.value) || 1)}
                                  className="h-8 w-20 rounded-lg text-sm"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* === Acties === */}
      {adviezen.length > 0 && isAdviseur && (
        <div className="flex flex-wrap gap-3 pt-2">
          {onLeadKoppelen && (
            <Button variant="outline" onClick={onLeadKoppelen} className="rounded-full gap-2">
              <UserPlus className="h-4 w-4" />
              Lead koppelen / aanmaken
            </Button>
          )}
          {onPDFDownload && (
            <Button variant="outline" onClick={onPDFDownload} className="rounded-full gap-2">
              <Download className="h-4 w-4" />
              Adviesrapport downloaden
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
