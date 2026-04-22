import { supabase } from "@/integrations/supabase/client";

export interface OpleverPdfVersie {
  id: string;
  rapport_id: string;
  partner_id: string;
  versie: number;
  pdf_path: string;
  pdf_hash: string;
  bestandsgrootte: number | null;
  gegenereerd_door: string | null;
  reden: string | null;
  status_op_moment: string | null;
  created_at: string;
}

export type VersieReden = "handmatige_download" | "klant_ondertekening" | "verzonden_naar_klant";

interface InsertVersieInput {
  rapportId: string;
  partnerId: string;
  pdfPath: string;
  pdfHash: string;
  bestandsgrootte?: number | null;
  gegenereerdDoor?: string | null;
  reden: VersieReden;
  statusOpMoment?: string | null;
}

export async function insertOpleverPdfVersie(input: InsertVersieInput): Promise<{ id: string; versie: number } | null> {
  try {
    const { data, error } = await supabase.rpc("insert_oplever_pdf_versie" as never, {
      _rapport_id: input.rapportId,
      _partner_id: input.partnerId,
      _pdf_path: input.pdfPath,
      _pdf_hash: input.pdfHash,
      _bestandsgrootte: input.bestandsgrootte ?? null,
      _gegenereerd_door: input.gegenereerdDoor ?? null,
      _reden: input.reden,
      _status_op_moment: input.statusOpMoment ?? null,
    } as never);
    if (error) {
      console.warn("PDF-versie registratie mislukt:", error.message);
      return null;
    }
    const arr = data as unknown as { id: string; versie: number }[] | null;
    return Array.isArray(arr) && arr[0] ? arr[0] : null;
  } catch (e) {
    console.warn("PDF-versie registratie faalde:", e);
    return null;
  }
}

export async function fetchOpleverPdfVersies(rapportId: string): Promise<OpleverPdfVersie[]> {
  const { data, error } = await supabase
    .from("opleverrapport_pdf_versies" as never)
    .select("*")
    .eq("rapport_id", rapportId)
    .order("versie", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as OpleverPdfVersie[];
}

export async function fetchLaatsteVersieVoorRapporten(
  rapportIds: string[],
): Promise<Record<string, number>> {
  if (rapportIds.length === 0) return {};
  const { data, error } = await supabase
    .from("opleverrapport_pdf_versies" as never)
    .select("rapport_id, versie")
    .in("rapport_id", rapportIds);
  if (error) {
    console.warn("Versie-aantallen ophalen mislukt:", error.message);
    return {};
  }
  const map: Record<string, number> = {};
  for (const row of (data ?? []) as unknown as { rapport_id: string; versie: number }[]) {
    if (!map[row.rapport_id] || row.versie > map[row.rapport_id]) {
      map[row.rapport_id] = row.versie;
    }
  }
  return map;
}

export async function getSignedUrlForVersie(pdfPath: string, expiresIn = 300): Promise<string | null> {
  const { data, error } = await supabase.storage.from("oplever-media").createSignedUrl(pdfPath, expiresIn);
  if (error) {
    console.warn("Signed URL ophalen mislukt:", error.message);
    return null;
  }
  return data?.signedUrl ?? null;
}
