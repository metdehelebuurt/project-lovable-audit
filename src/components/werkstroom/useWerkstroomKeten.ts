import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type WerkstroomStap = "lead" | "schouw" | "offerte" | "opdracht" | "installatie" | "oplevering";

export interface KetenItem {
  id: string;
  label: string;
  status?: string | null;
}

export interface WerkstroomKeten {
  lead?: KetenItem;
  schouw?: KetenItem;
  offerte?: KetenItem;
  opdracht?: KetenItem;
  installatie?: KetenItem;
  oplevering?: KetenItem;
}

interface KetenInput {
  vanaf: WerkstroomStap;
  id: string;
}

function naamVanLead(voornaam?: string | null, achternaam?: string | null): string {
  return [voornaam, achternaam].filter(Boolean).join(" ").trim() || "Lead";
}

async function laadInstallatie(id: string) {
  const { data } = await supabase
    .from("installaties")
    .select("id, status, lead_id, schouw_id, offerte_id, opdracht_id, consument_naam, installatienummer")
    .eq("id", id)
    .maybeSingle();
  return data;
}

async function laadOpdracht(id: string) {
  const { data } = await supabase
    .from("opdrachten")
    .select("id, status, klant_naam, lead_id, schouw_id, offerte_id, installatie_id")
    .eq("id", id)
    .maybeSingle();
  return data;
}

async function laadOfferte(id: string) {
  const { data } = await supabase
    .from("offertes")
    .select("id, status, offertenummer, lead_id, schouw_id")
    .eq("id", id)
    .maybeSingle();
  return data;
}

async function laadSchouw(id: string) {
  const { data } = await supabase
    .from("schouwen")
    .select("id, status, schouw_nummer, lead_id")
    .eq("id", id)
    .maybeSingle();
  return data;
}

async function laadLead(id: string) {
  const { data } = await supabase
    .from("leads")
    .select("id, lead_status, voornaam, achternaam")
    .eq("id", id)
    .maybeSingle();
  return data;
}

async function fetchKeten({ vanaf, id }: KetenInput): Promise<WerkstroomKeten> {
  const keten: WerkstroomKeten = {};
  let leadId: string | null = vanaf === "lead" ? id : null;
  let schouwId: string | null = vanaf === "schouw" ? id : null;
  let offerteId: string | null = vanaf === "offerte" ? id : null;
  let opdrachtId: string | null = vanaf === "opdracht" ? id : null;
  let installatieId: string | null = vanaf === "installatie" ? id : null;

  if (installatieId) {
    const data = await laadInstallatie(installatieId);
    if (data) {
      keten.installatie = { id: data.id, label: data.installatienummer ?? data.consument_naam ?? "Installatie", status: data.status };
      leadId ??= data.lead_id;
      schouwId ??= data.schouw_id;
      offerteId ??= data.offerte_id;
      opdrachtId ??= data.opdracht_id;
    }
  }

  if (opdrachtId && !keten.opdracht) {
    const data = await laadOpdracht(opdrachtId);
    if (data) {
      keten.opdracht = { id: data.id, label: data.klant_naam ?? "Opdracht", status: data.status };
      leadId ??= data.lead_id;
      schouwId ??= data.schouw_id;
      offerteId ??= data.offerte_id;
      installatieId ??= data.installatie_id;
    }
  }

  if (offerteId && !keten.offerte) {
    const data = await laadOfferte(offerteId);
    if (data) {
      keten.offerte = { id: data.id, label: data.offertenummer ?? "Offerte", status: data.status };
      leadId ??= data.lead_id;
      schouwId ??= data.schouw_id;
    }
  }

  if (schouwId && !keten.schouw) {
    const data = await laadSchouw(schouwId);
    if (data) {
      keten.schouw = { id: data.id, label: data.schouw_nummer ?? "Schouw", status: data.status };
      leadId ??= data.lead_id;
    }
  }

  if (leadId && !keten.lead) {
    const data = await laadLead(leadId);
    if (data) {
      keten.lead = { id: data.id, label: naamVanLead(data.voornaam, data.achternaam), status: data.lead_status };
    }
  }

  // Vooruit: zoek vervolg-stappen vanaf bekend startpunt
  if (leadId && !keten.schouw) {
    const { data } = await supabase
      .from("schouwen")
      .select("id, status, schouw_nummer")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) keten.schouw = { id: data.id, label: data.schouw_nummer ?? "Schouw", status: data.status };
  }

  if (leadId && !keten.offerte) {
    const { data } = await supabase
      .from("offertes")
      .select("id, status, offertenummer")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) keten.offerte = { id: data.id, label: data.offertenummer ?? "Offerte", status: data.status };
  }

  const refOfferte = keten.offerte?.id ?? offerteId;
  if (refOfferte && !keten.opdracht) {
    const { data } = await supabase
      .from("opdrachten")
      .select("id, status, klant_naam")
      .eq("offerte_id", refOfferte)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) keten.opdracht = { id: data.id, label: data.klant_naam ?? "Opdracht", status: data.status };
  }

  const refOpdracht = keten.opdracht?.id ?? opdrachtId;
  if (refOpdracht && !keten.installatie) {
    const { data } = await supabase
      .from("installaties")
      .select("id, status, installatienummer, consument_naam")
      .eq("opdracht_id", refOpdracht)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) keten.installatie = { id: data.id, label: data.installatienummer ?? data.consument_naam ?? "Installatie", status: data.status };
  }

  const refInstallatie = keten.installatie?.id ?? installatieId;
  if (refInstallatie) {
    const { data } = await supabase
      .from("opleverrapporten")
      .select("id, status, rapportnummer")
      .eq("installatie_id", refInstallatie)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) keten.oplevering = { id: data.id, label: data.rapportnummer ?? "Oplevering", status: data.status };
  }

  return keten;
}

export function useWerkstroomKeten(input: KetenInput) {
  return useQuery({
    queryKey: ["werkstroom-keten", input.vanaf, input.id],
    queryFn: () => fetchKeten(input),
    enabled: Boolean(input.id),
    staleTime: 30_000,
  });
}