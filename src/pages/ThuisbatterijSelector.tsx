import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Battery, Zap, FileText, Star, AlertTriangle } from "lucide-react";
import { LeadSearchInput } from "@/components/shared/LeadSearchInput";
import {
  type BatterijSituatie,
  type BatterijWensen,
  type BatterijProductMatch,
  berekenBatterijAdvies,
  matchBatterijProducten,
} from "@/components/thuisbatterij/BatterijLogic";
import type { Database } from "@/integrations/supabase/types";

type Product = Database["public"]["Tables"]["producten"]["Row"];

const initialSituatie: BatterijSituatie = {
  heeftZonnepanelen: true,
  zonnepanelenWp: null,
  zonnepanelenLeeftijd: null,
  jaarverbruikKwh: null,
  terugleveringKwh: null,
  contractType: "",
  aantalFasen: 1,
  heeftOmvormer: false,
  omvormerMerk: "",
};

const initialWensen: BatterijWensen = {
  budgetMin: null,
  budgetMax: null,
  merkvoorkeur: "",
  gewensteCapaciteitKwh: null,
  motivatie: [],
};

const formatCurrency = (n: number) => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

const ThuisbatterijSelector = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [stap, setStap] = useState(0);
  const [situatie, setSituatie] = useState<BatterijSituatie>(initialSituatie);
  const [wensen, setWensen] = useState<BatterijWensen>(initialWensen);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  const { data: producten = [] } = useQuery({
    queryKey: ["producten-batterij"],
    queryFn: async () => {
      const { data, error } = await supabase.from("producten").select("*").eq("status", "actief");
      if (error) throw error;
      return data as Product[];
    },
  });

  const advies = stap >= 2 ? berekenBatterijAdvies(situatie, wensen) : null;
  const matches = advies ? matchBatterijProducten(producten, advies, situatie, wensen) : [];

  const toggleMotivatie = (m: BatterijWensen["motivatie"][number]) => {
    setWensen(p => ({
      ...p,
      motivatie: p.motivatie.includes(m) ? p.motivatie.filter(x => x !== m) : [...p.motivatie, m],
    }));
  };

  const maakOfferte = (match: BatterijProductMatch) => {
    const prefill = {
      regels: [{
        product_id: match.product.id,
        omschrijving: `${match.product.naam}${match.product.merk ? ` — ${match.product.merk}` : ""}${match.product.model ? ` ${match.product.model}` : ""}`,
        aantal: 1,
        prijs_per_stuk: match.product.prijs_excl_btw,
        btw_percentage: match.product.btw_percentage ?? 21,
        korting_percentage: 0,
      }],
      lead: selectedLead || undefined,
    };
    sessionStorage.setItem("offerte-prefill", JSON.stringify(prefill));
    navigate("/offertes/nieuw");
  };

  const stappen = ["Situatie", "Wensen", "Resultaat"];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/tools")} className="rounded-xl">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Battery className="h-6 w-6 text-emerald-500" /> Thuisbatterij Selector
          </h1>
          <p className="text-muted-foreground text-sm">Selecteer de ideale batterij voor uw klant</p>
        </div>
      </div>

      {/* Stap indicator */}
      <div className="flex items-center gap-2">
        {stappen.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${i <= stap ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {i + 1}
            </div>
            <span className={`text-sm ${i <= stap ? "text-foreground font-medium" : "text-muted-foreground"}`}>{s}</span>
            {i < stappen.length - 1 && <div className="flex-1 h-px bg-border" />}
          </div>
        ))}
      </div>

      {/* Lead koppeling (altijd zichtbaar) */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Klant (optioneel)</CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <LeadSearchInput
            selectedLead={selectedLead}
            onSelectLead={setSelectedLead}
            onClearLead={() => setSelectedLead(null)}
          />
        </CardContent>
      </Card>

      {/* Stap 1: Situatie */}
      {stap === 0 && (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Huidige situatie</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox checked={situatie.heeftZonnepanelen} onCheckedChange={c => setSituatie(p => ({ ...p, heeftZonnepanelen: !!c }))} id="hzp" />
              <Label htmlFor="hzp" className="cursor-pointer">Heeft zonnepanelen</Label>
            </div>
            {situatie.heeftZonnepanelen && (
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div><Label>Vermogen (Wp)</Label><Input type="number" value={situatie.zonnepanelenWp || ""} onChange={e => setSituatie(p => ({ ...p, zonnepanelenWp: Number(e.target.value) || null }))} placeholder="bijv. 5000" className="rounded-xl" /></div>
                <div><Label>Leeftijd (jaar)</Label><Input type="number" value={situatie.zonnepanelenLeeftijd || ""} onChange={e => setSituatie(p => ({ ...p, zonnepanelenLeeftijd: Number(e.target.value) || null }))} placeholder="bijv. 3" className="rounded-xl" /></div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Jaarverbruik (kWh)</Label><Input type="number" value={situatie.jaarverbruikKwh || ""} onChange={e => setSituatie(p => ({ ...p, jaarverbruikKwh: Number(e.target.value) || null }))} placeholder="bijv. 3500" className="rounded-xl" /></div>
              <div><Label>Teruglevering (kWh/jaar)</Label><Input type="number" value={situatie.terugleveringKwh || ""} onChange={e => setSituatie(p => ({ ...p, terugleveringKwh: Number(e.target.value) || null }))} placeholder="bijv. 2000" className="rounded-xl" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Contracttype</Label>
                <Select value={situatie.contractType || "none"} onValueChange={v => setSituatie(p => ({ ...p, contractType: v === "none" ? "" : v as any }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecteer" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Onbekend</SelectItem>
                    <SelectItem value="vast">Vast tarief</SelectItem>
                    <SelectItem value="dynamisch">Dynamisch tarief</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Aantal fasen</Label>
                <Select value={String(situatie.aantalFasen)} onValueChange={v => setSituatie(p => ({ ...p, aantalFasen: Number(v) as 1 | 3 }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1-fase</SelectItem>
                    <SelectItem value="3">3-fase</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={situatie.heeftOmvormer} onCheckedChange={c => setSituatie(p => ({ ...p, heeftOmvormer: !!c }))} id="homv" />
              <Label htmlFor="homv" className="cursor-pointer">Heeft hybride omvormer</Label>
            </div>
            {situatie.heeftOmvormer && (
              <div className="pl-6">
                <Label>Omvormer merk</Label>
                <Input value={situatie.omvormerMerk} onChange={e => setSituatie(p => ({ ...p, omvormerMerk: e.target.value }))} placeholder="bijv. SolarEdge, Huawei" className="rounded-xl" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stap 2: Wensen */}
      {stap === 1 && (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Wensen & voorkeuren</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Budget min (€)</Label><Input type="number" value={wensen.budgetMin || ""} onChange={e => setWensen(p => ({ ...p, budgetMin: Number(e.target.value) || null }))} placeholder="bijv. 3000" className="rounded-xl" /></div>
              <div><Label>Budget max (€)</Label><Input type="number" value={wensen.budgetMax || ""} onChange={e => setWensen(p => ({ ...p, budgetMax: Number(e.target.value) || null }))} placeholder="bijv. 8000" className="rounded-xl" /></div>
            </div>
            <div><Label>Merkvoorkeur</Label><Input value={wensen.merkvoorkeur} onChange={e => setWensen(p => ({ ...p, merkvoorkeur: e.target.value }))} placeholder="bijv. Tesla, BYD, Huawei" className="rounded-xl" /></div>
            <div><Label>Gewenste capaciteit (kWh, leeg = automatisch)</Label><Input type="number" value={wensen.gewensteCapaciteitKwh || ""} onChange={e => setWensen(p => ({ ...p, gewensteCapaciteitKwh: Number(e.target.value) || null }))} placeholder="Automatisch berekend" className="rounded-xl" /></div>
            <div>
              <Label className="mb-2 block">Motivatie</Label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { key: "zelfconsumptie" as const, label: "Maximaal zelfconsumptie" },
                  { key: "piekshaving" as const, label: "Piekshaving" },
                  { key: "noodstroom" as const, label: "Noodstroom" },
                  { key: "dynamisch_laden" as const, label: "Dynamisch laden/ontladen" },
                ]).map(m => (
                  <div key={m.key} className="flex items-center gap-2">
                    <Checkbox checked={wensen.motivatie.includes(m.key)} onCheckedChange={() => toggleMotivatie(m.key)} id={`mot-${m.key}`} />
                    <Label htmlFor={`mot-${m.key}`} className="cursor-pointer text-sm">{m.label}</Label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stap 3: Resultaat */}
      {stap === 2 && advies && (
        <div className="space-y-6">
          <Card className="rounded-2xl border-0 shadow-sm bg-emerald-50 dark:bg-emerald-950/20">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Zap className="h-5 w-5 text-emerald-500" /> Advies</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">{advies.toelichting}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-background rounded-xl">
                  <p className="text-2xl font-bold text-emerald-600">{advies.aanbevolenCapaciteitKwh}</p>
                  <p className="text-xs text-muted-foreground">kWh aanbevolen</p>
                </div>
                <div className="text-center p-3 bg-background rounded-xl">
                  <p className="text-2xl font-bold text-emerald-600">{advies.dagelijksOverschot}</p>
                  <p className="text-xs text-muted-foreground">kWh dag overschot</p>
                </div>
                <div className="text-center p-3 bg-background rounded-xl">
                  <p className="text-2xl font-bold text-emerald-600">{formatCurrency(advies.geschatteBesparingJaar)}</p>
                  <p className="text-xs text-muted-foreground">besparing/jaar</p>
                </div>
                <div className="text-center p-3 bg-background rounded-xl">
                  <p className="text-2xl font-bold text-emerald-600">{advies.terugverdientijdJaar ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">jaar terugverdientijd</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <h2 className="text-lg font-semibold">Productmatches ({matches.length})</h2>
          {matches.length === 0 ? (
            <Card className="rounded-2xl border-0 shadow-sm p-8 text-center">
              <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Geen thuisbatterijen gevonden in de productcatalogus. Voeg eerst producten toe met categorie "thuisbatterij".</p>
            </Card>
          ) : matches.map(match => (
            <Card key={match.product.id} className={`rounded-2xl border shadow-sm transition-all ${selectedProduct === match.product.id ? "ring-2 ring-primary border-primary" : "border-0"}`}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{match.product.naam}</h3>
                      {match.score >= 75 && <Badge className="bg-emerald-100 text-emerald-700"><Star className="h-3 w-3 mr-1" />Top match</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {match.product.merk}{match.product.model ? ` ${match.product.model}` : ""}
                      {match.capaciteitKwh ? ` — ${match.capaciteitKwh} kWh` : ""}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {match.redenen.map((r, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{r}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold">{formatCurrency(match.product.prijs_excl_btw)}</p>
                    <p className="text-xs text-muted-foreground">excl. BTW</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Score</span>
                      <Progress value={match.score} className="w-20 h-2" />
                      <span className="text-xs font-medium">{match.score}%</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button
                    size="sm"
                    className="rounded-pill gap-2"
                    onClick={() => maakOfferte(match)}
                  >
                    <FileText className="h-4 w-4" /> Maak offerte
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Navigatie */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          className="rounded-pill gap-2"
          onClick={() => setStap(p => p - 1)}
          disabled={stap === 0}
        >
          <ArrowLeft className="h-4 w-4" /> Vorige
        </Button>
        {stap < 2 && (
          <Button
            className="rounded-pill gap-2"
            onClick={() => setStap(p => p + 1)}
          >
            Volgende <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default ThuisbatterijSelector;
