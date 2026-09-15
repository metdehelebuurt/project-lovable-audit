import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PartnerAdministratieRij {
  partner_id: string;
  naam: string;
  email: string | null;
  status: string;
  geblokkeerd_op: string | null;
  geblokkeerd_reden: string | null;
  openstaand_bedrag: number;
  aantal_openstaand: number;
  oudste_factuurnummer: string | null;
  oudste_periode_eind: string | null;
  dagen_te_laat: number;
}

interface FactuurRij {
  partner_id: string;
  factuurnummer: string;
  totaal_bedrag: number | null;
  periode_eind: string | null;
  status: string;
}

const DAG_MS = 86_400_000;

function dagenSinds(datum: string | null): number {
  if (!datum) return 0;
  const verschil = Date.now() - new Date(`${datum}T23:59:59`).getTime();
  return verschil <= 0 ? 0 : Math.floor(verschil / DAG_MS);
}

function bouwRij(
  partner: { id: string; naam: string; email: string | null; status: string; geblokkeerd_op: string | null; geblokkeerd_reden: string | null },
  facturen: FactuurRij[],
): PartnerAdministratieRij {
  const open = facturen
    .filter((f) => f.partner_id === partner.id)
    .sort((a, b) => (a.periode_eind ?? "").localeCompare(b.periode_eind ?? ""));
  const oudste = open[0] ?? null;
  return {
    partner_id: partner.id,
    naam: partner.naam,
    email: partner.email,
    status: partner.status,
    geblokkeerd_op: partner.geblokkeerd_op,
    geblokkeerd_reden: partner.geblokkeerd_reden,
    openstaand_bedrag: open.reduce((som, f) => som + Number(f.totaal_bedrag ?? 0), 0),
    aantal_openstaand: open.length,
    oudste_factuurnummer: oudste?.factuurnummer ?? null,
    oudste_periode_eind: oudste?.periode_eind ?? null,
    dagen_te_laat: dagenSinds(oudste?.periode_eind ?? null),
  };
}

/** Debiteurenoverzicht: alle klantorganisaties met hun openstaande abonnementsfacturen. */
export function usePartnerAdministratie() {
  return useQuery({
    queryKey: ["partner-administratie"],
    queryFn: async (): Promise<PartnerAdministratieRij[]> => {
      const [partnersRes, factuurRes] = await Promise.all([
        supabase
          .from("partners")
          .select("id, naam, email, status, geblokkeerd_op, geblokkeerd_reden")
          .order("naam"),
        supabase
          .from("facturen")
          .select("partner_id, factuurnummer, totaal_bedrag, periode_eind, status")
          .in("status", ["verstuurd", "vervallen"]),
      ]);
      if (partnersRes.error) throw partnersRes.error;
      if (factuurRes.error) throw factuurRes.error;
      const facturen = (factuurRes.data ?? []) as FactuurRij[];
      return (partnersRes.data ?? []).map((p) => bouwRij(p, facturen));
    },
  });
}
