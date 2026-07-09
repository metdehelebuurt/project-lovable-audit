import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useSalesTrials, usePartnerUpsells } from "@/hooks/sales/useSalesTrials";
import { useSalesDemoZonderTrial } from "@/hooks/sales/useSalesDemoZonderTrial";
import TrialsTabel from "./TrialsTabel";
import DemoZonderTrialTabel from "./DemoZonderTrialTabel";
import NotitiesDialog from "./NotitiesDialog";
import type { SalesTrialPartner } from "@/hooks/sales/useSalesTrials";
import { bepaalBron, TRIAL_BRON_KORT, TRIAL_BRON_VOLGORDE, type TrialBron } from "@/lib/sales/trialBron";

type Weergave = "actief" | "verlopen" | "alles";
type BronFilter = "alles" | TrialBron;

export default function SalesTrials() {
  const { data: trials, isLoading } = useSalesTrials();
  const { data: demoLeads, isLoading: demoLaadt } = useSalesDemoZonderTrial();
  const [weergave, setWeergave] = useState<Weergave>("actief");
  const [bronFilter, setBronFilter] = useState<BronFilter>("alles");
  const [openNotities, setOpenNotities] = useState<SalesTrialPartner | null>(null);

  const gefilterd = useMemo(() => {
    const alle = trials ?? [];
    const vandaag = new Date();
    vandaag.setHours(0, 0, 0, 0);
    let lijst = alle;
    if (weergave === "actief") {
      lijst = lijst.filter((p) => p.trial_einddatum && new Date(p.trial_einddatum) >= vandaag);
    } else if (weergave === "verlopen") {
      lijst = lijst.filter((p) => p.trial_einddatum && new Date(p.trial_einddatum) < vandaag);
    }
    if (bronFilter !== "alles") {
      lijst = lijst.filter((p) => bepaalBron(p) === bronFilter);
    }
    return lijst;
  }, [trials, weergave, bronFilter]);

  const bronTellingen = useMemo(() => {
    const alle = trials ?? [];
    const map: Record<BronFilter, number> = { alles: alle.length, selfservice: 0, affiliate: 0, sales: 0, google_oauth: 0 };
    for (const t of alle) map[bepaalBron(t)] += 1;
    return map;
  }, [trials]);

  const partnerIds = useMemo(() => gefilterd.map((p) => p.id), [gefilterd]);
  const { data: upsells } = usePartnerUpsells(partnerIds);

  const { data: notitiesMap } = useQuery({
    queryKey: ["partner-notities-counts", partnerIds.sort().join(",")],
    enabled: partnerIds.length > 0,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("klant_notities")
        .select("partner_id, created_at")
        .in("partner_id", partnerIds);
      if (error) throw error;
      const map: Record<string, { aantal: number; laatste: string | null }> = {};
      for (const row of data ?? []) {
        const cur = map[row.partner_id] ?? { aantal: 0, laatste: null };
        cur.aantal += 1;
        if (!cur.laatste || row.created_at > cur.laatste) cur.laatste = row.created_at;
        map[row.partner_id] = cur;
      }
      return map;
    },
  });

  const kpis = useMemo(() => {
    const alle = trials ?? [];
    const vandaag = new Date();
    vandaag.setHours(0, 0, 0, 0);
    const actief = alle.filter((p) => p.trial_einddatum && new Date(p.trial_einddatum) >= vandaag);
    const bijnaVerlopen = actief.filter((p) => {
      const d = new Date(p.trial_einddatum!);
      const dagen = Math.ceil((d.getTime() - Date.now()) / 86_400_000);
      return dagen <= 7;
    });
    const verlopen = alle.length - actief.length;
    return { actief: actief.length, bijna: bijnaVerlopen.length, verlopen };
  }, [trials]);

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Demo geweest, wacht op trial-start</h2>
          <p className="text-xs text-muted-foreground">
            Leads waar een demo gepland of afgerond is, maar die nog geen trial hebben. Proactief opvolgen om alsnog om te zetten.
          </p>
        </div>
        {demoLaadt ? (
          <Skeleton className="h-24" />
        ) : (
          <DemoZonderTrialTabel leads={demoLeads ?? []} />
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Trial-klanten</h2>
            <p className="text-xs text-muted-foreground">
              Alle partners met een lopende of onlangs verlopen trial. Upsell-signaal verschijnt wanneer de Smartaccu-addon nog niet actief is.
            </p>
          </div>
          <div className="flex gap-1.5">
            {(["actief", "verlopen", "alles"] as Weergave[]).map((w) => (
              <Button
                key={w}
                size="sm"
                variant={weergave === w ? "default" : "outline"}
                onClick={() => setWeergave(w)}
                className="h-8"
              >
                {w === "actief" && `Actief (${kpis.actief})`}
                {w === "verlopen" && `Verlopen (${kpis.verlopen})`}
                {w === "alles" && "Alles"}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(["alles", ...TRIAL_BRON_VOLGORDE] as BronFilter[]).map((b) => (
            <Button
              key={b}
              size="sm"
              variant={bronFilter === b ? "default" : "outline"}
              onClick={() => setBronFilter(b)}
              className="h-8"
            >
              {b === "alles" ? "Alle bronnen" : TRIAL_BRON_KORT[b as TrialBron]}
              <span className="ml-1.5 text-[10px] rounded-full bg-black/10 px-1.5 py-0.5">
                {bronTellingen[b]}
              </span>
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <KpiTegel label="Actief in trial" waarde={kpis.actief} toon="emerald" />
          <KpiTegel label="≤ 7 dagen resterend" waarde={kpis.bijna} toon="amber" />
          <KpiTegel label="Recent verlopen" waarde={kpis.verlopen} toon="rose" />
        </div>
        {isLoading ? (
          <Skeleton className="h-40" />
        ) : (
          <TrialsTabel
            trials={gefilterd}
            upsells={upsells ?? {}}
            notitiesPerPartner={notitiesMap ?? {}}
            onOpenNotities={(t) => setOpenNotities(t)}
          />
        )}
      </section>

      <NotitiesDialog
        partnerId={openNotities?.id ?? null}
        partnerNaam={openNotities?.naam ?? null}
        open={!!openNotities}
        onOpenChange={(o) => !o && setOpenNotities(null)}
      />
    </div>
  );
}

function KpiTegel({
  label,
  waarde,
  toon,
}: {
  label: string;
  waarde: number;
  toon: "emerald" | "amber" | "rose";
}) {
  const kleur =
    toon === "emerald"
      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
      : toon === "amber"
        ? "bg-amber-50 border-amber-200 text-amber-800"
        : "bg-rose-50 border-rose-200 text-rose-800";
  return (
    <div className={`rounded-xl border p-3 ${kleur}`}>
      <p className="text-[11px] uppercase tracking-wide font-medium opacity-80">{label}</p>
      <p className="text-2xl font-semibold leading-tight mt-1">{waarde}</p>
    </div>
  );
}