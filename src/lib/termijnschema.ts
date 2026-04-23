import { supabase } from "@/integrations/supabase/client";

export interface TermijnTemplate {
  slug: string;
  naam: string;
  beschrijving: string;
  termijnen: Array<{
    omschrijving: string;
    percentage: number;
    trigger_status: TriggerStatus | null;
  }>;
}

export type TriggerStatus =
  | "opdracht_bevestigd"
  | "schouw_uitgevoerd"
  | "installatie_gepland"
  | "installatie_gestart"
  | "installatie_uitgevoerd"
  | "opgeleverd";

export const TRIGGER_LABELS: Record<TriggerStatus, string> = {
  opdracht_bevestigd: "Bij opdrachtbevestiging",
  schouw_uitgevoerd: "Na schouw",
  installatie_gepland: "Bij inplanning installatie",
  installatie_gestart: "Bij start installatie",
  installatie_uitgevoerd: "Na uitvoering installatie",
  opgeleverd: "Bij oplevering",
};

export const TERMIJN_TEMPLATES: TermijnTemplate[] = [
  {
    slug: "30_70",
    naam: "30 / 70",
    beschrijving: "30% bij opdracht, 70% na oplevering",
    termijnen: [
      { omschrijving: "Aanbetaling bij opdracht", percentage: 30, trigger_status: "opdracht_bevestigd" },
      { omschrijving: "Eindafrekening na oplevering", percentage: 70, trigger_status: "opgeleverd" },
    ],
  },
  {
    slug: "30_40_30",
    naam: "30 / 40 / 30",
    beschrijving: "30% opdracht, 40% start installatie, 30% oplevering",
    termijnen: [
      { omschrijving: "Aanbetaling bij opdracht", percentage: 30, trigger_status: "opdracht_bevestigd" },
      { omschrijving: "Bij start installatie", percentage: 40, trigger_status: "installatie_gestart" },
      { omschrijving: "Eindafrekening", percentage: 30, trigger_status: "opgeleverd" },
    ],
  },
  {
    slug: "50_50",
    naam: "50 / 50",
    beschrijving: "50% bij opdracht, 50% bij installatie",
    termijnen: [
      { omschrijving: "Aanbetaling bij opdracht", percentage: 50, trigger_status: "opdracht_bevestigd" },
      { omschrijving: "Eindafrekening bij installatie", percentage: 50, trigger_status: "installatie_gestart" },
    ],
  },
  {
    slug: "100",
    naam: "100% achteraf",
    beschrijving: "Volledig na oplevering",
    termijnen: [
      { omschrijving: "Eindafrekening", percentage: 100, trigger_status: "opgeleverd" },
    ],
  },
];

export interface TermijnschemaRecord {
  id: string;
  offerte_id: string;
  partner_id: string;
  volgnummer: number;
  omschrijving: string;
  percentage: number;
  trigger_status: string | null;
  factuur_id: string | null;
  created_at: string;
}

export async function getTermijnschema(offerteId: string): Promise<TermijnschemaRecord[]> {
  const { data, error } = await supabase
    .from("offerte_termijnschema" as any)
    .select("*")
    .eq("offerte_id", offerteId)
    .order("volgnummer", { ascending: true });
  if (error) throw error;
  return (data || []) as unknown as TermijnschemaRecord[];
}

export async function saveTermijnschema(
  offerteId: string,
  partnerId: string,
  termijnen: Array<{ omschrijving: string; percentage: number; trigger_status: string | null }>,
): Promise<void> {
  // Vervang volledig: verwijder bestaande zonder factuur, behoud reeds gefactureerde rijen.
  const { data: bestaand } = await supabase
    .from("offerte_termijnschema" as any)
    .select("id, factuur_id, volgnummer")
    .eq("offerte_id", offerteId);

  const teVerwijderen = ((bestaand || []) as any[]).filter((r) => !r.factuur_id).map((r) => r.id);
  if (teVerwijderen.length > 0) {
    await supabase.from("offerte_termijnschema" as any).delete().in("id", teVerwijderen);
  }

  const startVolg = ((bestaand || []) as any[]).filter((r) => r.factuur_id).length;
  const rows = termijnen.map((t, idx) => ({
    offerte_id: offerteId,
    partner_id: partnerId,
    volgnummer: startVolg + idx + 1,
    omschrijving: t.omschrijving,
    percentage: t.percentage,
    trigger_status: t.trigger_status,
  }));
  if (rows.length > 0) {
    const { error } = await supabase.from("offerte_termijnschema" as any).insert(rows as any);
    if (error) throw error;
  }
}

export async function koppelFactuurAanTermijn(termijnId: string, factuurId: string): Promise<void> {
  await supabase.from("offerte_termijnschema" as any).update({ factuur_id: factuurId }).eq("id", termijnId);
}
