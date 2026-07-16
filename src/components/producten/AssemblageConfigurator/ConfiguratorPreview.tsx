import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Eye, Loader2, RefreshCw, AlertTriangle, Package } from "lucide-react";
import { formatCurrency } from "@/types/offerte";
import { toast } from "sonner";

interface Props {
  assemblageId: string | null;
  dirty: boolean;
  toonOpWebsite: boolean;
  status: string;
}

type Optie = {
  id: string;
  naam: string;
  merk: string | null;
  prijs_excl_btw: number | string | null;
  afbeelding_url: string | null;
  specs: Record<string, unknown> | null;
};

type ConfigResponse = {
  assemblage: {
    naam: string;
    btw_percentage: number;
    prijs_strategie: string;
  };
  template_attributen: Record<string, unknown>;
  slots: Array<{
    id: string;
    sleutel: string;
    label: string;
    slot_type: "single_select" | "multi_select" | "quantity_step";
    min_aantal: number;
    max_aantal: number;
    default_aantal: number;
    verplicht: boolean;
    helptekst: string | null;
  }>;
  opties: Record<string, Optie[]>;
  prijs: null | {
    subtotaal_excl_btw: number;
    totaal_excl_btw: number;
    totaal_incl_btw: number;
    btw_percentage: number;
    waarschuwingen: string[];
  };
};

type Keuzes = Record<string, Array<{ product_id: string; aantal: number }>>;

export default function ConfiguratorPreview({ assemblageId, dirty, toonOpWebsite, status }: Props) {
  const [data, setData] = useState<ConfigResponse | null>(null);
  const [keuzes, setKeuzes] = useState<Keuzes>({});

  const load = useMutation({
    mutationFn: async (payload?: { keuzes: Keuzes }) => {
      if (!assemblageId) throw new Error("Geen assemblage-id");
      const { data: resp, error } = await supabase.functions.invoke("assemblage-config", {
        body: {
          assemblage_id: assemblageId,
          keuzes: payload?.keuzes ?? {},
        },
      });
      if (error) throw error;
      if ((resp as { error?: string })?.error) throw new Error((resp as { error: string }).error);
      return resp as ConfigResponse;
    },
    onSuccess: (resp) => {
      setData(resp);
      // Init default keuzes eerste keer
      setKeuzes((prev) => {
        if (Object.keys(prev).length > 0) return prev;
        const init: Keuzes = {};
        for (const slot of resp.slots) {
          const eerste = resp.opties[slot.sleutel]?.[0];
          if (eerste && slot.default_aantal > 0) {
            init[slot.sleutel] = [{ product_id: eerste.id, aantal: slot.default_aantal }];
          }
        }
        return init;
      });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  useEffect(() => {
    if (assemblageId && toonOpWebsite && status === "actief" && !dirty) {
      load.mutate(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assemblageId, toonOpWebsite, status]);

  const totalen = data?.prijs;
  const waarschuwingen = totalen?.waarschuwingen ?? [];

  const bereken = () => load.mutate({ keuzes });

  const kanTonen = assemblageId && toonOpWebsite && status === "actief";

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Eye className="h-5 w-5 text-primary" /> Live preview (zoals website)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!assemblageId && (
          <p className="text-sm text-muted-foreground">Sla eerst op om de preview te laden.</p>
        )}
        {assemblageId && !toonOpWebsite && (
          <p className="text-sm text-muted-foreground rounded-xl border border-dashed p-4">
            Zet "Toon op website" aan om deze assemblage publiek via de API beschikbaar te maken.
          </p>
        )}
        {assemblageId && toonOpWebsite && status !== "actief" && (
          <p className="text-sm text-muted-foreground rounded-xl border border-dashed p-4">
            Alleen actieve assemblages zijn zichtbaar via de publieke API.
          </p>
        )}
        {dirty && kanTonen && (
          <p className="text-xs text-warning-foreground bg-warning/10 rounded-lg p-2">
            Er zijn niet-opgeslagen wijzigingen — sla op om ze in de preview te zien.
          </p>
        )}
        {kanTonen && (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => load.mutate(undefined)}
              disabled={load.isPending}>
              {load.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1" />}
              Preview herladen
            </Button>
            <Button size="sm" onClick={bereken} disabled={load.isPending || !data}>
              Prijs berekenen
            </Button>
          </div>
        )}

        {data && (
          <div className="space-y-4">
            {data.slots.length === 0 && (
              <p className="text-sm text-muted-foreground">Geen slots geconfigureerd.</p>
            )}
            {data.slots.map((slot) => {
              const opties = data.opties[slot.sleutel] ?? [];
              const huidig = keuzes[slot.sleutel]?.[0];
              return (
                <div key={slot.id} className="rounded-xl border p-3 space-y-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <Label className="font-medium">
                      {slot.label} {slot.verplicht && <span className="text-error">*</span>}
                    </Label>
                    <Badge variant="outline" className="text-xs">
                      {opties.length} opties
                    </Badge>
                  </div>
                  {slot.helptekst && (
                    <p className="text-xs text-muted-foreground">{slot.helptekst}</p>
                  )}
                  {opties.length === 0 ? (
                    <p className="text-xs text-warning-foreground bg-warning/10 rounded p-2">
                      Geen matchende producten. Controleer rol, categorie en spec-filter.
                    </p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {opties.slice(0, 6).map((o) => {
                        const geselecteerd = huidig?.product_id === o.id;
                        return (
                          <button
                            key={o.id}
                            type="button"
                            onClick={() =>
                              setKeuzes((prev) => ({
                                ...prev,
                                [slot.sleutel]: [{
                                  product_id: o.id,
                                  aantal: huidig?.aantal ?? slot.default_aantal || 1,
                                }],
                              }))
                            }
                            className={`text-left rounded-lg border p-2 flex gap-2 hover:border-primary transition ${
                              geselecteerd ? "border-primary bg-primary/5" : ""
                            }`}
                          >
                            {o.afbeelding_url ? (
                              <img src={o.afbeelding_url} alt="" className="w-10 h-10 rounded object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                                <Package className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium truncate">{o.naam}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {o.merk} · {formatCurrency(Number(o.prijs_excl_btw) || 0)}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {slot.slot_type === "quantity_step" && huidig && (
                    <div className="flex items-center gap-2 pt-1">
                      <Label className="text-xs">Aantal:</Label>
                      <input
                        type="number"
                        min={slot.min_aantal}
                        max={slot.max_aantal}
                        value={huidig.aantal}
                        onChange={(e) =>
                          setKeuzes((prev) => ({
                            ...prev,
                            [slot.sleutel]: [{ ...huidig, aantal: Number(e.target.value) || slot.min_aantal }],
                          }))
                        }
                        className="w-20 rounded border px-2 py-1 text-sm"
                      />
                      <span className="text-xs text-muted-foreground">
                        (min {slot.min_aantal}, max {slot.max_aantal})
                      </span>
                    </div>
                  )}
                </div>
              );
            })}

            {waarschuwingen.length > 0 && (
              <div className="rounded-xl bg-warning/10 border border-warning/40 p-3 space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-warning-foreground">
                  <AlertTriangle className="h-4 w-4" /> Waarschuwingen
                </div>
                <ul className="list-disc pl-5 text-xs text-warning-foreground space-y-0.5">
                  {waarschuwingen.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            )}

            {totalen && (
              <div className="rounded-xl border p-3 space-y-1 text-sm bg-muted/30">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotaal (excl. btw)</span>
                  <strong>{formatCurrency(totalen.subtotaal_excl_btw)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Totaal excl. btw</span>
                  <strong>{formatCurrency(totalen.totaal_excl_btw)}</strong>
                </div>
                <div className="flex justify-between text-base">
                  <span className="text-muted-foreground">Totaal incl. {totalen.btw_percentage}% btw</span>
                  <strong className="text-primary">{formatCurrency(totalen.totaal_incl_btw)}</strong>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}