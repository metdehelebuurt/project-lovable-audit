import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ZoekResultaat {
  id: string;
  type: "lead" | "klant" | "offerte" | "opdracht" | "installatie";
  label: string;
  sublabel?: string;
  url: string;
}

/**
 * Globale zoek over de belangrijkste entiteiten. Pakt max 5 per type.
 * Wordt alleen uitgevoerd als de query >= 2 tekens is.
 */
export function useGlobaleZoek(query: string) {
  const { profile } = useAuth();
  const trimmed = query.trim();
  const enabled = trimmed.length >= 2 && !!profile;

  return useQuery({
    queryKey: ["globale-zoek", trimmed, profile?.id],
    enabled,
    queryFn: async (): Promise<ZoekResultaat[]> => {
      const term = `%${trimmed}%`;
      const [leads, klanten, offertes, opdrachten, installaties] = await Promise.all([
        supabase.from("leads")
          .select("id, voornaam, achternaam, email, plaats")
          .or(`voornaam.ilike.${term},achternaam.ilike.${term},email.ilike.${term}`)
          .limit(5),
        supabase.from("klanten")
          .select("id, voornaam, achternaam, email, plaats")
          .or(`voornaam.ilike.${term},achternaam.ilike.${term},email.ilike.${term}`)
          .limit(5),
        supabase.from("offertes")
          .select("id, offertenummer, klant_naam, status")
          .or(`offertenummer.ilike.${term},klant_naam.ilike.${term}`)
          .limit(5),
        supabase.from("opdrachten")
          .select("id, klant_naam, status")
          .ilike("klant_naam", term)
          .limit(5),
        supabase.from("installaties")
          .select("id, installatienummer, consument_naam, status")
          .or(`installatienummer.ilike.${term},consument_naam.ilike.${term}`)
          .limit(5),
      ]);

      const out: ZoekResultaat[] = [];
      (leads.data ?? []).forEach((l) => out.push({
        id: l.id, type: "lead",
        label: `${l.voornaam ?? ""} ${l.achternaam ?? ""}`.trim() || l.email,
        sublabel: [l.email, l.plaats].filter(Boolean).join(" • "),
        url: `/leads/${l.id}`,
      }));
      (klanten.data ?? []).forEach((k) => out.push({
        id: k.id, type: "klant",
        label: `${k.voornaam ?? ""} ${k.achternaam ?? ""}`.trim() || (k.email ?? ""),
        sublabel: [k.email, k.plaats].filter(Boolean).join(" • "),
        url: `/klanten/${k.id}`,
      }));
      (offertes.data ?? []).forEach((o) => out.push({
        id: o.id, type: "offerte",
        label: o.offertenummer,
        sublabel: `${o.klant_naam} • ${o.status}`,
        url: `/offertes/${o.id}`,
      }));
      (opdrachten.data ?? []).forEach((o: any) => out.push({
        id: o.id, type: "opdracht",
        label: o.klant_naam,
        sublabel: o.status,
        url: `/opdrachten/${o.id}`,
      }));
      (installaties.data ?? []).forEach((i: any) => out.push({
        id: i.id, type: "installatie",
        label: i.installatienummer,
        sublabel: `${i.consument_naam ?? ""} • ${i.status}`,
        url: `/installaties/${i.id}`,
      }));
      return out;
    },
  });
}