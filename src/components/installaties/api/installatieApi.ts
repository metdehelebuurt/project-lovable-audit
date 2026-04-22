import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { InstallatieStatus } from "../status";

type InstallatieRow = Database["public"]["Tables"]["installaties"]["Row"];
type InstallatieInsert = Database["public"]["Tables"]["installaties"]["Insert"];

export type Installatie = InstallatieRow;

export async function generateInstallatienummer(partnerId: string): Promise<string> {
  const { data, error } = await supabase.rpc("generate_documentnummer_v2", {
    _partner_id: partnerId,
    _type: "installatie",
    _subtype: "regulier",
  });
  if (error) throw new Error(`Kon installatienummer niet genereren: ${error.message}`);
  if (typeof data !== "string" || data.length === 0) {
    throw new Error("Installatienummer-generator gaf geen geldig nummer terug");
  }
  return data;
}

export async function fetchInstallatie(id: string): Promise<Installatie | null> {
  const { data, error } = await supabase
    .from("installaties")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchInstallaties(filters?: {
  partnerId?: string;
  monteurId?: string;
  status?: InstallatieStatus;
}) {
  let query = supabase.from("installaties").select("*").order("geplande_startdatum", { ascending: true, nullsFirst: false });
  if (filters?.partnerId) query = query.eq("partner_id", filters.partnerId);
  if (filters?.monteurId) query = query.eq("installateur_id", filters.monteurId);
  if (filters?.status) query = query.eq("status", filters.status);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function createInstallatie(payload: InstallatieInsert): Promise<Installatie> {
  const insert: InstallatieInsert = { ...payload };
  if (!insert.installatienummer) {
    insert.installatienummer = await generateInstallatienummer(insert.partner_id);
  }
  const { data, error } = await supabase.from("installaties").insert(insert).select("*").single();
  if (error) throw error;
  return data as Installatie;
}

export async function updateInstallatie(id: string, patch: Partial<InstallatieRow>): Promise<void> {
  const { error } = await supabase.from("installaties").update(patch).eq("id", id);
  if (error) throw error;
}

export async function fetchInstallatieNotities(installatieId: string) {
  const { data, error } = await supabase
    .from("installatie_notities")
    .select("*")
    .eq("installatie_id", installatieId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addInstallatieNotitie(payload: {
  installatie_id: string;
  partner_id: string;
  auteur_id: string;
  inhoud: string;
  intern: boolean;
}) {
  const { error } = await supabase.from("installatie_notities").insert(payload);
  if (error) throw error;
}

export async function deleteInstallatieNotitie(id: string) {
  const { error } = await supabase.from("installatie_notities").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchInstallatieHistorie(installatieId: string) {
  const { data, error } = await supabase
    .from("installatie_historie")
    .select("*")
    .eq("installatie_id", installatieId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}