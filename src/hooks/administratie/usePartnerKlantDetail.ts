import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface KlantGebruiker {
  id: string;
  naam: string | null;
  email: string | null;
  rol: string | null;
  status: string | null;
  laatste_login: string | null;
}

export interface KlantFactuur {
  id: string;
  factuurnummer: string;
  totaal_bedrag: number | null;
  status: string;
  periode_eind: string | null;
}

export interface KlantDetail {
  partner: {
    id: string;
    naam: string;
    email: string | null;
    telefoon: string | null;
    status: string;
    trial_einddatum: string | null;
    geblokkeerd_op: string | null;
    geblokkeerd_reden: string | null;
    geblokkeerd_betaal_url: string | null;
  };
  abonnement: {
    plan: string;
    status: string;
    interval: string;
    maand_bedrag: number;
    start_datum: string;
    verloop_datum: string | null;
  } | null;
  gebruikers: KlantGebruiker[];
  facturen: KlantFactuur[];
  openstaandBedrag: number;
  statistieken: { leads: number; offertes: number; opdrachten: number; installaties: number };
}

const OPENSTAANDE_STATUSSEN = ["verstuurd", "vervallen"];

async function telRijen(tabel: "leads" | "offertes" | "opdrachten" | "installaties", partnerId: string) {
  const { count } = await supabase
    .from(tabel)
    .select("id", { count: "exact", head: true })
    .eq("partner_id", partnerId);
  return count ?? 0;
}

/** Alle beheergegevens en statistieken van één klantorganisatie. */
export function usePartnerKlantDetail(partnerId: string | undefined) {
  return useQuery({
    queryKey: ["partner-klantdetail", partnerId],
    enabled: !!partnerId,
    queryFn: async (): Promise<KlantDetail> => {
      const id = partnerId!;
      const [partnerRes, aboRes, userRes, factuurRes, leads, offertes, opdrachten, installaties] =
        await Promise.all([
          supabase
            .from("partners")
            .select("id, naam, email, telefoon, status, trial_einddatum, geblokkeerd_op, geblokkeerd_reden, geblokkeerd_betaal_url")
            .eq("id", id)
            .maybeSingle(),
          supabase
            .from("abonnementen")
            .select("plan, status, interval, maand_bedrag, start_datum, verloop_datum")
            .eq("partner_id", id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("users")
            .select("id, naam, email, rol, status, laatste_login")
            .eq("partner_id", id)
            .order("naam"),
          supabase
            .from("facturen")
            .select("id, factuurnummer, totaal_bedrag, status, periode_eind")
            .eq("partner_id", id)
            .order("periode_eind", { ascending: false })
            .limit(20),
          telRijen("leads", id),
          telRijen("offertes", id),
          telRijen("opdrachten", id),
          telRijen("installaties", id),
        ]);

      if (partnerRes.error) throw partnerRes.error;
      if (!partnerRes.data) throw new Error("Klant niet gevonden");

      const facturen = (factuurRes.data ?? []) as KlantFactuur[];
      return {
        partner: partnerRes.data as KlantDetail["partner"],
        abonnement: (aboRes.data ?? null) as KlantDetail["abonnement"],
        gebruikers: (userRes.data ?? []) as KlantGebruiker[],
        facturen,
        openstaandBedrag: facturen
          .filter((f) => OPENSTAANDE_STATUSSEN.includes(f.status))
          .reduce((som, f) => som + Number(f.totaal_bedrag ?? 0), 0),
        statistieken: { leads, offertes, opdrachten, installaties },
      };
    },
  });
}
