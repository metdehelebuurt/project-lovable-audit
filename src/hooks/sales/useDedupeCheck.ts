import { supabase } from "@/integrations/supabase/client";

export interface DedupeMatch {
  /** Index in de oorspronkelijke rijen-array */
  rij_index: number;
  /** Reden van match (email, telefoon, website, bedrijfsnaam, intern duplicaat) */
  redenen: string[];
  /** Bestaand lead-id indien database-match (null bij intern duplicaat) */
  bestaand_lead_id: string | null;
  /** Korte beschrijving van de matchende waarde */
  match_waarde: string;
}

export interface DedupeResultaat {
  duplicaten: DedupeMatch[];
  uniek: number;
  totaal: number;
}

function normEmail(v: string | undefined): string | null {
  if (!v) return null;
  const s = v.trim().toLowerCase();
  return s || null;
}

function normTelefoon(v: string | undefined): string | null {
  if (!v) return null;
  const s = v.replace(/[^\d+]/g, "");
  return s.length >= 6 ? s : null;
}

function normWebsite(v: string | undefined): string | null {
  if (!v) return null;
  let s = v.trim().toLowerCase();
  s = s.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "");
  return s || null;
}

function normBedrijf(v: string | undefined): string | null {
  if (!v) return null;
  const s = v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(b\.?v\.?|n\.?v\.?|v\.?o\.?f\.?|holding|group|nederland)\b/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
  return s.length >= 3 ? s : null;
}

/** Check dedupe binnen het bestand én tegen bestaande affiliate_leads. */
export async function checkDedupe(
  rijen: Record<string, string>[],
): Promise<DedupeResultaat> {
  const emails = new Set<string>();
  const telefoons = new Set<string>();
  const websites = new Set<string>();
  const bedrijven = new Set<string>();

  // Per rij genormaliseerde sleutels
  const sleutels = rijen.map((r) => ({
    email: normEmail(r.email),
    telefoon: normTelefoon(r.telefoon),
    website: normWebsite(r.website),
    bedrijf: normBedrijf(r.bedrijfsnaam),
  }));

  for (const s of sleutels) {
    if (s.email) emails.add(s.email);
    if (s.telefoon) telefoons.add(s.telefoon);
    if (s.website) websites.add(s.website);
    if (s.bedrijf) bedrijven.add(s.bedrijf);
  }

  // Haal bestaande matches op (batched per kolom)
  const bestaand: Record<string, { id: string; reden: string; waarde: string }[]> = {
    email: [],
    telefoon: [],
    website: [],
    bedrijf: [],
  };

  if (emails.size > 0) {
    const { data } = await supabase
      .from("affiliate_leads")
      .select("id, email")
      .in("email", Array.from(emails));
    for (const r of data ?? []) {
      if (r.email) bestaand.email.push({ id: r.id, reden: "email", waarde: r.email });
    }
  }
  if (telefoons.size > 0) {
    const { data } = await supabase
      .from("affiliate_leads")
      .select("id, telefoon")
      .in("telefoon", Array.from(telefoons));
    for (const r of data ?? []) {
      if (r.telefoon) bestaand.telefoon.push({ id: r.id, reden: "telefoon", waarde: r.telefoon });
    }
  }
  if (websites.size > 0) {
    // website ruwer opgeslagen — fetch ruim, vergelijk genormaliseerd
    const { data } = await supabase
      .from("affiliate_leads")
      .select("id, website")
      .not("website", "is", null);
    for (const r of data ?? []) {
      const n = normWebsite(r.website ?? undefined);
      if (n && websites.has(n)) bestaand.website.push({ id: r.id, reden: "website", waarde: n });
    }
  }
  if (bedrijven.size > 0) {
    const { data } = await supabase
      .from("affiliate_leads")
      .select("id, bedrijfsnaam")
      .not("bedrijfsnaam", "is", null);
    for (const r of data ?? []) {
      const n = normBedrijf(r.bedrijfsnaam ?? undefined);
      if (n && bedrijven.has(n)) bestaand.bedrijf.push({ id: r.id, reden: "bedrijfsnaam", waarde: n });
    }
  }

  // Maak lookup-maps
  const map = {
    email: new Map(bestaand.email.map((b) => [b.waarde, b.id])),
    telefoon: new Map(bestaand.telefoon.map((b) => [b.waarde, b.id])),
    website: new Map(bestaand.website.map((b) => [b.waarde, b.id])),
    bedrijf: new Map(bestaand.bedrijf.map((b) => [b.waarde, b.id])),
  };

  // Interne duplicaten tracken
  const eersteIndex: Record<string, Record<string, number>> = {
    email: {}, telefoon: {}, website: {}, bedrijf: {},
  };

  const duplicaten: DedupeMatch[] = [];
  sleutels.forEach((s, i) => {
    const redenen: string[] = [];
    let bestaand_id: string | null = null;
    const waarden: string[] = [];

    (["email", "telefoon", "website", "bedrijf"] as const).forEach((k) => {
      const v = s[k];
      if (!v) return;
      const dbId = map[k].get(v);
      if (dbId) {
        redenen.push(`bestaand · ${k}`);
        bestaand_id = bestaand_id ?? dbId;
        waarden.push(v);
        return;
      }
      if (eersteIndex[k][v] !== undefined && eersteIndex[k][v] !== i) {
        redenen.push(`intern duplicaat · ${k} (rij ${eersteIndex[k][v] + 1})`);
        waarden.push(v);
      } else {
        eersteIndex[k][v] = i;
      }
    });

    if (redenen.length > 0) {
      duplicaten.push({
        rij_index: i,
        redenen,
        bestaand_lead_id: bestaand_id,
        match_waarde: waarden[0] ?? "",
      });
    }
  });

  return {
    duplicaten,
    uniek: rijen.length - duplicaten.length,
    totaal: rijen.length,
  };
}