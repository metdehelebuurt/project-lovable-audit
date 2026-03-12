import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle, TrendingUp, Battery, Sun, Flame, Car, Cpu, ShoppingCart, FileText, Star, Info } from "lucide-react";
import type { AdviesResultaat, ProductMatch } from "./types";

interface Props {
  adviezen: AdviesResultaat[];
  producten: ProductMatch[];
  isAdviseur: boolean;
}

const categorieIcons: Record<string, typeof Sun> = {
  zonnepanelen: Sun,
  thuisbatterij: Battery,
  warmtepomp: Flame,
  laadpaal: Car,
  omvormer: Cpu,
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

export default function WizardStepResultaat({ adviezen, producten, isAdviseur }: Props) {
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

  return (
    <div className="space-y-6">
      {/* Adviezen */}
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
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{advies.titel}</h3>
                        {advies.aanbevolen && <Badge className="bg-primary/10 text-primary text-xs">Aanbevolen</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{advies.toelichting}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Producten */}
      {producten.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Aanbevolen producten
            </h2>
            {isAdviseur && selectedCount > 0 && (
              <Button onClick={maakOfferte} className="rounded-full gap-2">
                <FileText className="h-4 w-4" />
                Offerte aanmaken ({selectedCount})
              </Button>
            )}
          </div>

          {/* Groepeer per categorie */}
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
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium text-foreground text-sm">{product.naam}</p>
                                <p className="text-xs text-muted-foreground">
                                  {[product.merk, product.model].filter(Boolean).join(" ")}
                                  {product.garantie_jaren ? ` • ${product.garantie_jaren} jaar garantie` : ""}
                                </p>
                              </div>
                              <p className="font-semibold text-foreground whitespace-nowrap">
                                {formatCurrency(product.prijs_excl_btw)}
                                <span className="text-xs text-muted-foreground font-normal"> excl. BTW</span>
                              </p>
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                              <div className="flex items-center gap-1.5 flex-1">
                                <Star className="h-3.5 w-3.5 text-primary" />
                                <Progress value={product.geschiktheidScore} className="h-2 flex-1" />
                                <span className="text-xs text-muted-foreground font-medium">{product.geschiktheidScore}%</span>
                              </div>
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
    </div>
  );
}
