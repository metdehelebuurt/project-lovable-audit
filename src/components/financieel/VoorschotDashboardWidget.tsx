import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, ArrowRight, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/types/offerte";
import { TRIGGER_LABELS } from "@/lib/termijnschema";

interface OpenstaandeTermijn {
  id: string;
  offerte_id: string;
  offertenummer: string;
  klant_naam: string;
  omschrijving: string;
  percentage: number;
  bedrag: number;
  trigger_status: string | null;
  volgnummer: number;
}

export default function VoorschotDashboardWidget() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [items, setItems] = useState<OpenstaandeTermijn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.partner_id) return;
    let mounted = true;
    (async () => {
      const { data: termijnen } = await supabase
        .from("offerte_termijnschema" as any)
        .select("id, offerte_id, omschrijving, percentage, trigger_status, volgnummer, factuur_id")
        .eq("partner_id", profile.partner_id)
        .is("factuur_id", null);

      const offerteIds = Array.from(new Set(((termijnen || []) as any[]).map((t) => t.offerte_id)));
      if (offerteIds.length === 0) {
        if (mounted) { setItems([]); setLoading(false); }
        return;
      }

      const { data: offertes } = await supabase
        .from("offertes")
        .select("id, offertenummer, klant_naam, totaal_bedrag, status")
        .in("id", offerteIds)
        .in("status", ["geaccepteerd", "verzonden"]);

      const offerteMap = new Map(((offertes || []) as any[]).map((o) => [o.id, o]));

      const result: OpenstaandeTermijn[] = ((termijnen || []) as any[])
        .filter((t) => offerteMap.has(t.offerte_id))
        .map((t) => {
          const off = offerteMap.get(t.offerte_id)!;
          return {
            id: t.id,
            offerte_id: t.offerte_id,
            offertenummer: off.offertenummer,
            klant_naam: off.klant_naam,
            omschrijving: t.omschrijving,
            percentage: Number(t.percentage),
            bedrag: (Number(off.totaal_bedrag) * Number(t.percentage)) / 100,
            trigger_status: t.trigger_status,
            volgnummer: t.volgnummer,
          };
        })
        .sort((a, b) => b.bedrag - a.bedrag);

      if (mounted) {
        setItems(result);
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [profile?.partner_id]);

  const totaal = items.reduce((s, i) => s + i.bedrag, 0);
  const top = items.slice(0, 5);

  if (loading || items.length === 0) return null;

  return (
    <Card className="rounded-2xl border-0 shadow-sm bg-primary/5">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-primary" /> Openstaande termijnen
        </CardTitle>
        <Badge variant="secondary" className="gap-1">
          <TrendingUp className="h-3 w-3" /> {formatCurrency(totaal)}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-muted-foreground">
          {items.length} openstaande termijn{items.length === 1 ? "" : "en"} klaar om te factureren
        </p>
        <div className="space-y-2">
          {top.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-lg border bg-card p-2 text-sm">
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs shrink-0">#{t.volgnummer}</Badge>
                  <span className="font-medium truncate">{t.klant_naam}</span>
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {t.offertenummer} · {t.omschrijving}
                  {t.trigger_status && (
                    <> · {TRIGGER_LABELS[t.trigger_status as keyof typeof TRIGGER_LABELS] || t.trigger_status}</>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-semibold">{formatCurrency(t.bedrag)}</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-pill gap-1"
                  onClick={() =>
                    navigate(`/financieel/nieuw/verkoopfactuur?offerte_id=${t.offerte_id}&termijn_id=${t.id}`)
                  }
                >
                  Factureren <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
