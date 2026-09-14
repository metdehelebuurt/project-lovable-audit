import { supabase } from "@/integrations/supabase/client";
import type { Opleverrapport, OpleverStatus } from "../types";
import { DEFAULT_CONFORMITEITSTEKST } from "../types";
import { STANDAARD_CHECKLIST } from "../GrenswaardenLogic";
import { DEFAULT_CONFORMITEITSTEKST_ISOLATIE, STANDAARD_ISOLATIE_CHECKLIST, STANDAARD_ISOLATIE_DOCUMENTEN } from "../isolatieConfig";

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
  rapport_type?: Opleverrapport["rapport_type"];
}

export async function createRapport(input: CreateRapportInput): Promise<string> {
  const { data: nrData, error: nrErr } = await supabase.rpc("generate_documentnummer_v2", {
    _partner_id: input.partner_id,
    _type: "oplevering",
    _subtype: "regulier",
  });
  if (nrErr) throw nrErr;

  const isIsolatie = input.rapport_type === "isolatie";
  const visuele = isIsolatie ? [] : STANDAARD_CHECKLIST.map((c) => ({ key: c.key, label: c.label, status: null }));

  const insertPayload: Record<string, unknown> = {
    rapport_type: input.rapport_type ?? "elektra",
    partner_id: input.partner_id,
    installateur_id: input.installateur_id,
    installatie_id: input.installatie_id ?? null,
    klant_id: input.klant_id ?? null,
    opdracht_id: input.opdracht_id ?? null,
    created_by: input.installateur_id,
    rapportnummer: nrData as string,
    visuele_inspectie: visuele,
    conformiteitstekst: isIsolatie ? DEFAULT_CONFORMITEITSTEKST_ISOLATIE : DEFAULT_CONFORMITEITSTEKST,
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

export interface OpleverrapportOverzicht extends Opleverrapport {
  klant_naam: string | null;
  opdracht_nummer: string | null;
}

export async function fetchRapportenOverzicht(partnerId: string): Promise<OpleverrapportOverzicht[]> {
  const { data, error } = await supabase
    .from("opleverrapporten" as never)
    .select("*, klant:klanten(voornaam, achternaam, bedrijfsnaam), opdracht:opdrachten(klant_naam, offerte:offertes(offertenummer))")
    .eq("partner_id", partnerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  type Row = Opleverrapport & {
    klant?: { voornaam?: string | null; achternaam?: string | null; bedrijfsnaam?: string | null } | null;
    opdracht?: { klant_naam?: string | null; offerte?: { offertenummer?: string | null } | null } | null;
  };
  return ((data ?? []) as unknown as Row[]).map((r) => {
    const persoon = [r.klant?.voornaam, r.klant?.achternaam].filter(Boolean).join(" ").trim();
    const klant_naam = r.klant?.bedrijfsnaam || persoon || r.opdracht?.klant_naam || null;
    return {
      ...r,
      klant_naam,
      opdracht_nummer: r.opdracht?.offerte?.offertenummer ?? null,
    };
  });
}

export async function findExistingRapportenVoorOpdracht(
  partnerId: string,
  opdrachtId: string | null,
  installatieId: string | null,
): Promise<Opleverrapport[]> {
  if (!opdrachtId && !installatieId) return [];
  const filters: string[] = [];
  if (opdrachtId) filters.push(`opdracht_id.eq.${opdrachtId}`);
  if (installatieId) filters.push(`installatie_id.eq.${installatieId}`);
  const { data, error } = await supabase
    .from("opleverrapporten" as never)
    .select("*")
    .eq("partner_id", partnerId)
    .or(filters.join(","))
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

export interface VervallenInput {
  reden_categorie: string;
  reden: string;
  maak_nieuw: boolean;
  actor_id: string | null;
}

/**
 * Laat een opleverrapport vervallen. Optioneel maakt het een nieuw rapport aan
 * en koppelt beide records (vervangen_door_id / vervangt_id) voor traceability.
 * Returnt het id van het nieuwe rapport wanneer maak_nieuw = true.
 */
export async function vervallenRapport(
  rapport: Opleverrapport,
  input: VervallenInput,
): Promise<{ nieuwRapportId: string | null }> {
  const nu = new Date().toISOString();

  await patchRapport(rapport.id, {
    status: "vervallen",
    vervallen: true,
    vervallen_reden_categorie: input.reden_categorie,
    vervallen_reden: input.reden,
    vervallen_op: nu,
    vervallen_door: input.actor_id ?? undefined,
  } as Partial<Opleverrapport>);

  await logAudit(rapport.id, rapport.partner_id, input.actor_id, "vervallen", {
    reden_categorie: input.reden_categorie,
    reden: input.reden,
    maak_nieuw: input.maak_nieuw,
  });

  if (!input.maak_nieuw) return { nieuwRapportId: null };

  // Nieuw opleverrapport starten met basisgegevens van het oude
  const nieuwId = await createRapport({
    partner_id: rapport.partner_id,
    installateur_id: rapport.installateur_id ?? input.actor_id ?? rapport.created_by,
    installatie_id: rapport.installatie_id,
    klant_id: rapport.klant_id,
    opdracht_id: rapport.opdracht_id,
    scope_omschrijving: rapport.scope_omschrijving,
    batterij_spec: rapport.batterij_spec,
    omvormer_spec: rapport.omvormer_spec,
    backup_box_spec: rapport.backup_box_spec,
    extra_velden: rapport.extra_velden,
  });

  // Koppel oud → nieuw en nieuw → oud
  await patchRapport(rapport.id, { vervangen_door_id: nieuwId } as Partial<Opleverrapport>);
  await patchRapport(nieuwId, { vervangt_id: rapport.id } as Partial<Opleverrapport>);

  await logAudit(nieuwId, rapport.partner_id, input.actor_id, "vervangt_rapport", {
    vervangt_id: rapport.id,
    reden_categorie: input.reden_categorie,
    reden: input.reden,
  });

  return { nieuwRapportId: nieuwId };
}