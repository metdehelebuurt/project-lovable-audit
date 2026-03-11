import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Battery, Sun, Zap, TrendingUp, Calculator, Info } from "lucide-react";

// Configureerbare adviesregels
const CONFIG = {
  gemiddelde_stroomprijs_kwh: 0.40,       // €/kWh
  teruglever_vergoeding_kwh: 0.07,        // €/kWh (na saldering)
  dynamisch_contract_winst_factor: 0.15,  // 15% extra besparing met dynamisch
  batterij_prijs_per_kwh: 500,            // €/kWh capaciteit
  batterij_rendement: 0.90,               // 90% round-trip
  zelfconsumptie_zonder_batterij: 0.30,   // 30% zonder batterij
  zelfconsumptie_met_batterij: 0.70,      // 70% met batterij
  levensduur_jaren: 15,
};

interface AdviesResultaat {
  aanbevolenCapaciteit: number;
  jaarlijkseBesparing: number;
  terugverdientijd: number;
  totaleInvestering: number;
  co2Besparing: number;
  extraZelfconsumptie: number;
}

const berekenAdvies = (
  zonnepanelenWp: number,
  jaarverbruik: number,
  teruglevering: number,
  dynamischContract: boolean
): AdviesResultaat | null => {
  if (!zonnepanelenWp || !jaarverbruik) return null;

  // Geschatte jaarlijkse opwekking (Wp * 0.85 uur = kWh/jaar in NL)
  const jaarOpwekking = zonnepanelenWp * 0.85 / 1000;
  
  // Dagelijks overschot dat opgeslagen kan worden
  const dagelijksOverschot = (jaarOpwekking * (1 - CONFIG.zelfconsumptie_zonder_batterij)) / 365;
  
  // Aanbevolen capaciteit: dagelijks overschot, afgerond naar boven in hele kWh, max 20 kWh
  const aanbevolenCapaciteit = Math.min(Math.ceil(dagelijksOverschot), 20);
  
  if (aanbevolenCapaciteit < 1) return null;

  // Extra zelfconsumptie door batterij
  const extraZelfconsumptie = jaarOpwekking * (CONFIG.zelfconsumptie_met_batterij - CONFIG.zelfconsumptie_zonder_batterij) * CONFIG.batterij_rendement;
  
  // Waarde van die extra zelfconsumptie
  const prijsverschil = CONFIG.gemiddelde_stroomprijs_kwh - CONFIG.teruglever_vergoeding_kwh;
  let jaarlijkseBesparing = extraZelfconsumptie * prijsverschil;
  
  // Dynamisch contract bonus
  if (dynamischContract) {
    jaarlijkseBesparing *= (1 + CONFIG.dynamisch_contract_winst_factor);
  }
  
  const totaleInvestering = aanbevolenCapaciteit * CONFIG.batterij_prijs_per_kwh;
  const terugverdientijd = jaarlijkseBesparing > 0 ? totaleInvestering / jaarlijkseBesparing : 999;
  
  // CO2 besparing: ~0.4 kg CO2/kWh
  const co2Besparing = extraZelfconsumptie * 0.4;

  return {
    aanbevolenCapaciteit,
    jaarlijkseBesparing: Math.round(jaarlijkseBesparing),
    terugverdientijd: Math.round(terugverdientijd * 10) / 10,
    totaleInvestering: Math.round(totaleInvestering),
    co2Besparing: Math.round(co2Besparing),
    extraZelfconsumptie: Math.round(extraZelfconsumptie),
  };
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const Energieadvies = () => {
  const [zonnepanelenWp, setZonnepanelenWp] = useState<number>(0);
  const [jaarverbruik, setJaarverbruik] = useState<number>(0);
  const [teruglevering, setTeruglevering] = useState<number>(0);
  const [dynamischContract, setDynamischContract] = useState(false);

  const resultaat = berekenAdvies(zonnepanelenWp, jaarverbruik, teruglevering, dynamischContract);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Energieadvies</h1>
        <p className="text-muted-foreground mt-1">Thuisbatterij advies calculator</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input */}
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calculator className="h-5 w-5 text-primary" />
              Woninggegevens invoeren
            </CardTitle>
            <CardDescription>Vul de gegevens in voor een batterij-advies op maat.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label>Vermogen zonnepanelen (Wp)</Label>
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="bijv. 6000"
                  value={zonnepanelenWp || ""}
                  onChange={e => setZonnepanelenWp(parseFloat(e.target.value) || 0)}
                  className="rounded-xl"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Totaal Wattpiek van alle panelen</p>
            </div>

            <div>
              <Label>Jaarverbruik (kWh)</Label>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="bijv. 3500"
                  value={jaarverbruik || ""}
                  onChange={e => setJaarverbruik(parseFloat(e.target.value) || 0)}
                  className="rounded-xl"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Totaal elektriciteitsverbruik per jaar</p>
            </div>

            <div>
              <Label>Huidige teruglevering (kWh/jaar)</Label>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="bijv. 2000"
                  value={teruglevering || ""}
                  onChange={e => setTeruglevering(parseFloat(e.target.value) || 0)}
                  className="rounded-xl"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Hoeveel levert u jaarlijks terug aan het net?</p>
            </div>

            <div className="flex items-center justify-between rounded-xl border p-4">
              <div>
                <Label>Dynamisch energiecontract</Label>
                <p className="text-xs text-muted-foreground">Bijv. Tibber, ANWB Energie Dynamisch</p>
              </div>
              <Switch checked={dynamischContract} onCheckedChange={setDynamischContract} />
            </div>
          </CardContent>
        </Card>

        {/* Resultaat */}
        <div className="space-y-4">
          {resultaat ? (
            <>
              <Card className="rounded-2xl border-0 shadow-sm bg-primary/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Battery className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Aanbevolen capaciteit</p>
                      <p className="text-3xl font-bold text-foreground">{resultaat.aanbevolenCapaciteit} kWh</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Card className="rounded-2xl border-0 shadow-sm">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Jaarlijkse besparing</p>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(resultaat.jaarlijkseBesparing)}</p>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl border-0 shadow-sm">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Terugverdientijd</p>
                    <p className="text-2xl font-bold text-foreground">{resultaat.terugverdientijd} jaar</p>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl border-0 shadow-sm">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Investering</p>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(resultaat.totaleInvestering)}</p>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl border-0 shadow-sm">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">CO₂ besparing</p>
                    <p className="text-2xl font-bold text-foreground">{resultaat.co2Besparing} kg/jaar</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="rounded-2xl border-0 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Met een batterij van <strong>{resultaat.aanbevolenCapaciteit} kWh</strong> kunt u jaarlijks <strong>{resultaat.extraZelfconsumptie} kWh</strong> extra zelf verbruiken in plaats van terugleveren.</p>
                      <p>Over {CONFIG.levensduur_jaren} jaar bespaart u in totaal <strong>{formatCurrency(resultaat.jaarlijkseBesparing * CONFIG.levensduur_jaren)}</strong>.</p>
                      {dynamischContract && <p><Badge variant="outline" className="text-xs">Dynamisch contract</Badge> Extra {Math.round(CONFIG.dynamisch_contract_winst_factor * 100)}% besparing door slim laden/ontladen.</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardContent className="py-16 text-center">
                <Battery className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Vul de woninggegevens in om een advies te ontvangen</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Energieadvies;
