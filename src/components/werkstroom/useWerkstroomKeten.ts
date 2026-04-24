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

async function fetchKeten({ vanaf, id }: KetenInput): Promise<WerkstroomKeten> {
  const keten: WerkstroomKeten = {};

  // Bepaal lead_id als startpunt
  let leadId: string | null = null;
  let schouwId: string | null = null;
  let offerteId: string | null = null;
  let opdrachtId: string | null = null;
  let installatieId: string | null = null;

  if (vanaf === "lead") leadId = id;
  if (vanaf === "schouw") schouwId = id;
  if (vanaf === "offerte") offerteId = id;
  if (vanaf === "opdracht") opdrachtId = id;
  if (vanaf === "installatie") installatieId = id;

  // Als we starten verderop in de keten: haal terug-referenties op
  if (installatieId) {
    const { data } = await supabase
      .from("installaties")
      .select("id, status, lead_id, schouw_id, offerte_id, opdracht_id, klant_naam")
      .eq("id", installatieId)
      .maybeSingle();
    if (data) {
      keten.installatie = { id: data.id, label: data.klant_naam ?? "Installatie", status: data.status };
      leadId = leadId ?? data.lead_id;
      schouwId = schouwId ?? data.schouw_id;
      offerteId = offerteId ?? data.offerte_id;
      opdrachtId = opdrachtId ?? data.opdracht_id;
    }
  }

  if (opdrachtId && !keten.opdracht) {
    const { data } = await supabase
      .from("opdrachten")
      .select("id, status, ordernummer, lead_id, schouw_id, offerte_id, installatie_id")
      .eq("id", opdrachtId)
      .maybeSingle();
    if (data) {
      keten.opdracht = { id: data.id, label: data.ordernummer ?? "Opdracht", status: data.status };
      leadId = leadId ?? data.lead_id;
      schouwId = schouwId ?? data.schouw_id;
      offerteId = offerteId ?? data.offerte_id;
      installatieId = installatieId ?? data.installatie_id;
    }
  }

  if (offerteId && !keten.offerte) {
    const { data } = await supabase
      .from("offertes")
      .select("id, status, offertenummer, lead_id, schouw_id")
      .eq("id", offerteId)
      .maybeSingle();
    if (data) {
      keten.offerte = { id: data.id, label: data.offertenummer ?? "Offerte", status: data.status };
      leadId = leadId ?? data.lead_id;
      schouwId = schouwId ?? data.schouw_id;
    }
  }

  if (schouwId && !keten.schouw) {
    const { data } = await supabase
      .from("schouwen")
      .select("id, status, schouwnummer, lead_id")
      .eq("id", schouwId)
      .maybeSingle();
    if (data) {
      keten.schouw = { id: data.id, label: data.schouwnummer ?? "Schouw", status: data.status };
      leadId = leadId ?? data.lead_id;
    }
  }

  if (leadId && !keten.lead) {
    const { data } = await supabase
      .from("leads")
      .select("id, status, voornaam, achternaam")
      .eq("id", leadId)
      .maybeSingle();
    if (data) {
      const naam = [data.voornaam, data.achternaam].filter(Boolean).join(" ").trim();
      keten.lead = { id: data.id, label: naam || "Lead", status: data.status };
    }
  }

  // Vooruit kijken: haal latere stappen op vanaf het laagste bekende punt
  if (leadId && !keten.schouw) {
    const { data } = await supabase
      .from("schouwen")
      .select("id, status, schouwnummer")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) keten.schouw = { id: data.id, label: data.schouwnummer ?? "Schouw", status: data.status };
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

  const refOfferteId = keten.offerte?.id ?? offerteId;
  if (refOfferteId && !keten.opdracht) {
    const { data } = await supabase
      .from("opdrachten")
      .select("id, status, ordernummer")
      .eq("offerte_id", refOfferteId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) keten.opdracht = { id: data.id, label: data.ordernummer ?? "Opdracht", status: data.status };
  }

  const refOpdrachtId = keten.opdracht?.id ?? opdrachtId;
  if (refOpdrachtId && !keten.installatie) {
    const { data } = await supabase
      .from("installaties")
      .select("id, status, klant_naam")
      .eq("opdracht_id", refOpdrachtId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) keten.installatie = { id: data.id, label: data.klant_naam ?? "Installatie", status: data.status };
  }

  const refInstallatieId = keten.installatie?.id ?? installatieId;
  if (refInstallatieId) {
    const { data } = await supabase
      .from("opleverrapporten")
      .select("id, status, rapportnummer")
      .eq("installatie_id", refInstallatieId)
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