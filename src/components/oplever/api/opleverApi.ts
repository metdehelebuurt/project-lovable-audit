import { supabase } from "@/integrations/supabase/client";
import type { Opleverrapport, OpleverStatus } from "../types";
import { DEFAULT_CONFORMITEITSTEKST } from "../types";
import { STANDAARD_CHECKLIST } from "../GrenswaardenLogic";

interface CreateRapportInput {
  partner_id: string;
  installateur_id: string;
  installatie_id?: string | null;
  klant_id?: string | null;
  opdracht_id?: string | null;
  scope_omschrijving?: string | null;
  opleverdatum?: string | null;
  batterij_spec?: Opleverrapport["batterij_spec"];
  omvormer_spec?: Opleverrapport["omvormer_spec"];
  backup_box_spec?: Opleverrapport["backup_box_spec"];
  extra_velden?: Opleverrapport["extra_velden"];
}

export async function createRapport(input: CreateRapportInput): Promise<string> {
  const { data: nrData, error: nrErr } = await supabase.rpc("generate_documentnummer_v2", {
    _partner_id: input.partner_id,
    _type: "oplevering",
    _subtype: "regulier",
  });
  if (nrErr) throw nrErr;

  const visuele = STANDAARD_CHECKLIST.map((c) => ({ key: c.key, label: c.label, status: null }));

  const insertPayload: Record<string, unknown> = {
    partner_id: input.partner_id,
    installateur_id: input.installateur_id,
    installatie_id: input.installatie_id ?? null,
    klant_id: input.klant_id ?? null,
    opdracht_id: input.opdracht_id ?? null,
    created_by: input.installateur_id,
    rapportnummer: nrData as string,
    visuele_inspectie: visuele,
    conformiteitstekst: DEFAULT_CONFORMITEITSTEKST,
  };
  if (input.scope_omschrijving) insertPayload.scope_omschrijving = input.scope_omschrijving;
  if (input.opleverdatum) insertPayload.opleverdatum = input.opleverdatum;
  if (input.batterij_spec && Object.keys(input.batterij_spec).length > 0) {
    insertPayload.batterij_spec = input.batterij_spec;
  }
  if (input.omvormer_spec && Object.keys(input.omvormer_spec).length > 0) {
    insertPayload.omvormer_spec = input.omvormer_spec;
  }
  if (input.backup_box_spec && Object.keys(input.backup_box_spec).length > 0) {
    insertPayload.backup_box_spec = input.backup_box_spec;
  }
  if (input.extra_velden && Object.keys(input.extra_velden).length > 0) {
    insertPayload.extra_velden = input.extra_velden;
  }

  const { data, error } = await supabase
    .from("opleverrapporten" as never)
    .insert(insertPayload as never)
    .select("id")
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export async function fetchRapport(id: string): Promise<Opleverrapport> {
  const { data, error } = await supabase
    .from("opleverrapporten" as never)
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as unknown as Opleverrapport;
}

export async function fetchRapporten(partnerId: string): Promise<Opleverrapport[]> {
  const { data, error } = await supabase
    .from("opleverrapporten" as never)
    .select("*")
    .eq("partner_id", partnerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Opleverrapport[];
}

export async function fetchRapportenVoorKlant(klantId: string, opdrachtIds: string[] = []): Promise<Opleverrapport[]> {
  const filters: string[] = [`klant_id.eq.${klantId}`];
  if (opdrachtIds.length > 0) {
    filters.push(`opdracht_id.in.(${opdrachtIds.join(",")})`);
  }
  const { data, error } = await supabase
    .from("opleverrapporten" as never)
    .select("*")
    .or(filters.join(","))
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Opleverrapport[];
}

export async function patchRapport(id: string, patch: Partial<Opleverrapport>): Promise<void> {
  const { error } = await supabase
    .from("opleverrapporten" as never)
    .update(patch as never)
    .eq("id", id);
  if (error) throw error;
}

export async function setStatus(id: string, status: OpleverStatus): Promise<void> {
  await patchRapport(id, { status } as Partial<Opleverrapport>);
}

export async function uploadOpleverFile(
  partnerId: string,
  rapportId: string,
  file: File | Blob,
  filename: string,
): Promise<string> {
  const path = `${partnerId}/${rapportId}/${Date.now()}-${filename}`;
  const { error } = await supabase.storage.from("oplever-media").upload(path, file, {
    contentType: file instanceof File ? file.type : "application/octet-stream",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export async function getSignedUrl(path: string, expiresIn = 3600): Promise<string> {
  const { data, error } = await supabase.storage.from("oplever-media").createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

export async function fetchInstallateurVoorkeuren(userId: string) {
  const { data, error } = await supabase
    .from("installateur_voorkeuren" as never)
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error && error.code !== "PGRST116") throw error;
  return data as unknown as { meetapparatuur?: Record<string, unknown>; kvk_nummer?: string; erkenningsnummer?: string } | null;
}

export async function upsertInstallateurVoorkeuren(
  userId: string,
  patch: { meetapparatuur?: Record<string, unknown>; kvk_nummer?: string; erkenningsnummer?: string },
): Promise<void> {
  const { error } = await supabase
    .from("installateur_voorkeuren" as never)
    .upsert({ user_id: userId, ...patch } as never, { onConflict: "user_id" });
  if (error) throw error;
}

export async function logAudit(
  rapportId: string,
  partnerId: string,
  actorId: string | null,
  actie: string,
  details: Record<string, unknown> = {},
): Promise<void> {
  await supabase.from("opleverrapport_audit" as never).insert({
    rapport_id: rapportId,
    partner_id: partnerId,
    actor_id: actorId,
    actie,
    details,
  } as never);
}