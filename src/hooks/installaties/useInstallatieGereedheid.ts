import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Installatie } from "@/components/installaties/api/installatieApi";

export type CheckStatus = "ok" | "warn" | "fail" | "info";

export interface GereedheidsItem {
  key: string;
  label: string;
  status: CheckStatus;
  details?: string;
  link?: string;
  blokkerend?: boolean;
}

export interface ChecklistRow {
  id: string;
  item_key: string;
  label: string;
  blokkerend: boolean;
  voltooid_op: string | null;
  voltooid_door: string | null;
  notitie: string | null;
}

export interface GereedheidResult {
  items: GereedheidsItem[];
  open_blokkades: GereedheidsItem[];
  totaal: number;
  ok: number;
  klaar: boolean;
}

export function useInstallatieGereedheid(installatie: Installatie | null | undefined) {
  return useQuery({
    queryKey: ["installatie-gereedheid", installatie?.id, installatie?.updated_at],
    enabled: !!installatie?.id,
    queryFn: async (): Promise<GereedheidResult> => {
      const items: GereedheidsItem[] = [];
      if (!installatie) return { items, open_blokkades: [], totaal: 0, ok: 0, klaar: true };

      // Schouw — direct via installatie.schouw_id, anders via opdracht.schouw_id
      let schouwOk = false;
      let schouwDetail = "Geen gekoppelde schouw";
      const directSchouwId = (installatie as unknown as { schouw_id?: string | null }).schouw_id ?? null;
      let resolvedSchouwId: string | null = directSchouwId;
      if (!resolvedSchouwId && installatie.opdracht_id) {
        const { data: opd } = await supabase
          .from("opdrachten")
          .select("schouw_id")
          .eq("id", installatie.opdracht_id)
          .maybeSingle();
        resolvedSchouwId = opd?.schouw_id ?? null;
      }
      if (resolvedSchouwId) {
        const { data: sch } = await supabase
          .from("schouwen")
          .select("id,status")
          .eq("id", resolvedSchouwId)
          .maybeSingle();
        if (sch?.status === "uitgevoerd") { schouwOk = true; schouwDetail = "Uitgevoerd"; }
        else if (sch) schouwDetail = `Status: ${sch.status}`;
      }
      items.push({
        key: "schouw", label: "Schouw uitgevoerd",
        status: schouwOk ? "ok" : "fail", details: schouwDetail, blokkerend: !schouwOk,
      });

      // Klant bevestigd
      const klantOk = !!installatie.bevestiging_verzonden_op && !!installatie.monteur_geaccepteerd_op;
      items.push({
        key: "klant_bevestigd", label: "Klantbevestiging compleet",
        status: klantOk ? "ok" : installatie.bevestiging_verzonden_op ? "warn" : "fail",
        details: klantOk ? "Klant + monteur akkoord" : installatie.bevestiging_verzonden_op ? "Klant nog te bevestigen" : "Nog niet verzonden",
      });

      // Monteur
      items.push({
        key: "monteur", label: "Monteur toegewezen",
        status: installatie.installateur_id ? "ok" : "fail",
        details: installatie.installateur_id ? undefined : "Nog geen monteur",
      });

      // Werkadres
      const adresOk = !!installatie.werkadres && !!installatie.klant_postcode && !!installatie.klant_plaats;
      items.push({
        key: "werkadres", label: "Werkadres compleet",
        status: adresOk ? "ok" : "warn",
      });

      // Producten + voorraad
      const producten = Array.isArray(installatie.producten) ? installatie.producten as Array<{ product_id?: string | null; aantal?: number; omschrijving?: string }> : [];
      const productenOk = producten.length > 0;
      items.push({
        key: "producten", label: "Producten gekoppeld",
        status: productenOk ? "ok" : "fail",
        details: productenOk ? `${producten.length} regel(s)` : "Geen producten",
      });

      let voorraadStatus: CheckStatus = "ok";
      let voorraadDetail = "Voldoende op voorraad";
      const tekorten: string[] = [];
      for (const p of producten) {
        if (!p.product_id) continue;
        const { data: stand } = await supabase.rpc("get_voorraad_stand", { _product_id: p.product_id });
        if (typeof stand === "number" && stand < (Number(p.aantal) || 1)) {
          tekorten.push(`${p.omschrijving || p.product_id}: ${stand}/${p.aantal}`);
        }
      }
      if (tekorten.length > 0) {
        voorraadStatus = "warn";
        voorraadDetail = `Tekort: ${tekorten.join(", ")}`;
      }
      if (productenOk) items.push({ key: "voorraad", label: "Voorraad beschikbaar", status: voorraadStatus, details: voorraadDetail });

      // Serienummers (alleen vereist na 'gereed')
      if (installatie.status === "gereed" || installatie.status === "afgerond") {
        const { data: sn } = await supabase
          .from("product_serienummers")
          .select("id")
          .eq("installatie_id", installatie.id);
        const heeft = (sn?.length ?? 0) > 0;
        items.push({ key: "serienummers", label: "Serienummers ingevoerd", status: heeft ? "ok" : "warn", details: heeft ? `${sn!.length} stuks` : "Nog niet ingevuld" });
      }

      // Werkomschrijving + datum
      items.push({
        key: "planning", label: "Werkomschrijving + datum",
        status: installatie.geplande_startdatum && installatie.werkomschrijving ? "ok" : "warn",
        details: !installatie.geplande_startdatum ? "Geen datum" : !installatie.werkomschrijving ? "Geen werkomschrijving" : undefined,
      });

      // Checklist items
      const { data: cl } = await supabase
        .from("installatie_checklist_items")
        .select("*")
        .eq("installatie_id", installatie.id)
        .order("created_at");
      for (const c of (cl ?? []) as ChecklistRow[]) {
        const ok = !!c.voltooid_op;
        items.push({
          key: `cl_${c.id}`, label: c.label,
          status: ok ? "ok" : c.blokkerend ? "fail" : "warn",
          blokkerend: c.blokkerend && !ok,
          details: ok ? "Voltooid" : c.notitie ?? undefined,
        });
      }

      const ok = items.filter(i => i.status === "ok").length;
      const blokkades = items.filter(i => i.blokkerend);
      return { items, open_blokkades: blokkades, totaal: items.length, ok, klaar: blokkades.length === 0 };
    },
  });
}