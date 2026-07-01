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
  manueel?: boolean;
  systeem?: boolean;
  voltooid_op?: string | null;
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

      // Handmatige overrides ophalen
      const { data: overridesRows } = await supabase
        .from("installatie_gereedheid_overrides")
        .select("item_key, voltooid_op, notitie")
        .eq("installatie_id", installatie.id);
      const overrides = new Map<string, { voltooid_op: string; notitie: string | null }>();
      for (const o of overridesRows ?? []) {
        overrides.set(o.item_key as string, {
          voltooid_op: o.voltooid_op as string,
          notitie: (o.notitie as string | null) ?? null,
        });
      }
      const pushSysteem = (item: GereedheidsItem) => {
        const ov = overrides.get(item.key);
        if (ov && item.status !== "ok") {
          items.push({
            ...item,
            status: "ok",
            blokkerend: false,
            manueel: true,
            systeem: true,
            voltooid_op: ov.voltooid_op,
            details: `Handmatig gemarkeerd${ov.notitie ? ` — ${ov.notitie}` : ""}`,
          });
        } else {
          items.push({ ...item, systeem: true });
        }
      };

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
      pushSysteem({
        key: "schouw", label: "Schouw uitgevoerd",
        status: schouwOk ? "ok" : "fail", details: schouwDetail, blokkerend: !schouwOk,
      });

      // Klant bevestigd
      const klantOk = !!installatie.bevestiging_verzonden_op && !!installatie.monteur_geaccepteerd_op;
      pushSysteem({
        key: "klant_bevestigd", label: "Afspraakbevestiging klant",
        status: klantOk ? "ok" : installatie.bevestiging_verzonden_op ? "warn" : "fail",
        details: klantOk
          ? "Klant + monteur akkoord"
          : installatie.bevestiging_verzonden_op
            ? `Verzonden op ${new Date(installatie.bevestiging_verzonden_op).toLocaleDateString("nl-NL")}`
            : "Nog niet verzonden",
      });

      // Monteur
      pushSysteem({
        key: "monteur", label: "Monteur toegewezen",
        status: installatie.installateur_id ? "ok" : "fail",
        details: installatie.installateur_id ? undefined : "Nog geen monteur",
      });

      // Werkadres
      const adresOk = !!installatie.werkadres && !!installatie.klant_postcode && !!installatie.klant_plaats;
      pushSysteem({
        key: "werkadres", label: "Werkadres compleet",
        status: adresOk ? "ok" : "warn",
      });

      // Producten + voorraad
      const producten = Array.isArray(installatie.producten) ? installatie.producten as Array<{ product_id?: string | null; aantal?: number; omschrijving?: string }> : [];
      const productenOk = producten.length > 0;
      pushSysteem({
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
      if (productenOk) pushSysteem({ key: "voorraad", label: "Voorraad beschikbaar", status: voorraadStatus, details: voorraadDetail });

      // Serienummers (alleen vereist na 'gereed')
      if (installatie.status === "gereed" || installatie.status === "afgerond") {
        const { data: sn } = await supabase
          .from("product_serienummers")
          .select("id")
          .eq("installatie_id", installatie.id);
        const heeft = (sn?.length ?? 0) > 0;
        pushSysteem({ key: "serienummers", label: "Serienummers ingevoerd", status: heeft ? "ok" : "warn", details: heeft ? `${sn!.length} stuks` : "Nog niet ingevuld" });
      }

      // Werkomschrijving + datum
      pushSysteem({
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
          systeem: false,
          voltooid_op: c.voltooid_op,
        });
      }

      const ok = items.filter(i => i.status === "ok").length;
      const blokkades = items.filter(i => i.blokkerend);
      return { items, open_blokkades: blokkades, totaal: items.length, ok, klaar: blokkades.length === 0 };
    },
  });
}