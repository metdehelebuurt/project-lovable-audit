import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, Package } from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
  klantId: string;
  leadId: string | null;
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

function pickField(obj: any, keys: string[]): string | null {
  if (!obj || typeof obj !== "object") return null;
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null && v !== "") return String(v);
  }
  return null;
}

const WoningProductenTab = ({ klantId, leadId }: Props) => {
  // Laatste schouw met gegevens-jsonb
  const { data: schouw } = useQuery({
    queryKey: ["klant-laatste-schouw", leadId],
    enabled: !!leadId,
    queryFn: async () => {
      const { data } = await supabase
        .from("schouwen")
        .select("id, schouw_nummer, gegevens, created_at")
        .eq("lead_id", leadId!)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data as any;
    },
  });

  // Lead-eigenschappen
  const { data: leadEig } = useQuery({
    queryKey: ["klant-lead-eigenschappen", leadId],
    enabled: !!leadId,
    queryFn: async () => {
      const { data } = await supabase
        .from("lead_eigenschappen" as any)
        .select("*")
        .eq("lead_id", leadId!)
        .maybeSingle();
      return data as any;
    },
  });

  // Alle opdrachten van deze klant -> verzamel regels
  const { data: opdrachten = [] } = useQuery({
    queryKey: ["klant-opdracht-regels", leadId],
    enabled: !!leadId,
    queryFn: async () => {
      const { data } = await supabase
        .from("opdrachten")
        .select("id, regels, created_at")
        .eq("lead_id", leadId!)
        .order("created_at", { ascending: false });
      return (data ?? []) as any[];
    },
  });

  const woningVelden = [
    { label: "Woningtype", waarde: pickField(leadEig, ["woningtype"]) ?? pickField(schouw?.gegevens, ["woningtype"]), bron: leadEig?.woningtype ? "lead" : schouw?.schouw_nummer },
    { label: "Bouwjaar", waarde: pickField(leadEig, ["bouwjaar"]) ?? pickField(schouw?.gegevens, ["bouwjaar"]), bron: leadEig?.bouwjaar ? "lead" : schouw?.schouw_nummer },
    { label: "Daktype", waarde: pickField(leadEig, ["daktype"]) ?? pickField(schouw?.gegevens, ["daktype"]), bron: leadEig?.daktype ? "lead" : schouw?.schouw_nummer },
    { label: "Dakrichting", waarde: pickField(schouw?.gegevens, ["dakrichting", "orientatie"]), bron: schouw?.schouw_nummer },
    { label: "Energielabel", waarde: pickField(leadEig, ["energielabel"]) ?? pickField(schouw?.gegevens, ["energielabel"]), bron: leadEig?.energielabel ? "lead" : schouw?.schouw_nummer },
    { label: "Verbruik (kWh)", waarde: pickField(leadEig, ["verbruik_kwh", "verbruik"]) ?? pickField(schouw?.gegevens, ["verbruik_kwh", "verbruik"]), bron: leadEig?.verbruik_kwh ? "lead" : schouw?.schouw_nummer },
    { label: "Aantal panelen", waarde: pickField(schouw?.gegevens, ["aantal_panelen", "panelen"]), bron: schouw?.schouw_nummer },
  ].filter((v) => v.waarde);

  // Aggregeer regels per omschrijving
  type Agg = { omschrijving: string; aantal: number; totaal: number; opdrachtId: string };
  const productMap = new Map<string, Agg>();
  for (const o of opdrachten) {
    const regels = Array.isArray(o.regels) ? o.regels : [];
    for (const r of regels as any[]) {
      const naam = r?.omschrijving || r?.naam;
      if (!naam) continue;
      const aantal = Number(r?.aantal ?? 1);
      const prijs = Number(r?.prijs_per_stuk ?? r?.prijs ?? 0);
      const sub = aantal * prijs;
      const cur = productMap.get(naam);
      if (cur) {
        cur.aantal += aantal;
        cur.totaal += sub;
      } else {
        productMap.set(naam, { omschrijving: naam, aantal, totaal: sub, opdrachtId: o.id });
      }
    }
  }
  const producten = Array.from(productMap.values());

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Home className="h-4 w-4 text-primary" /> Woninggegevens
          </CardTitle>
        </CardHeader>
        <CardContent>
          {woningVelden.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nog geen woninggegevens beschikbaar uit schouw of lead-eigenschappen.
            </p>
          ) : (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {woningVelden.map((v) => (
                <div key={v.label} className="border rounded-xl p-3">
                  <dt className="text-xs text-muted-foreground">{v.label}</dt>
                  <dd className="text-sm font-medium flex items-center gap-2 mt-0.5">
                    {v.waarde}
                    {v.bron && (
                      <Badge variant="outline" className="text-[10px] font-normal">
                        {v.bron === "lead" ? "uit lead" : `uit ${v.bron}`}
                      </Badge>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          )}
          {leadEig?.extra_json?.productgroepen && Array.isArray(leadEig.extra_json.productgroepen) && leadEig.extra_json.productgroepen.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-2">Productinteresses</p>
              <div className="flex flex-wrap gap-1.5">
                {leadEig.extra_json.productgroepen.map((p: string) => (
                  <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" /> Geleverde producten
          </CardTitle>
        </CardHeader>
        <CardContent>
          {producten.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nog geen producten geleverd via opdrachten.
            </p>
          ) : (
            <ul className="divide-y">
              {producten.map((p) => (
                <li key={p.omschrijving} className="py-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.omschrijving}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.aantal}× • <Link to={`/opdrachten/${p.opdrachtId}`} className="underline hover:text-foreground">bekijk opdracht</Link>
                    </p>
                  </div>
                  <span className="text-sm font-semibold shrink-0">{formatCurrency(p.totaal)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WoningProductenTab;