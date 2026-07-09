import type { SalesTrialPartner } from "@/hooks/sales/useSalesTrials";

export type TrialBron = NonNullable<SalesTrialPartner["trial_bron"]>;

export const TRIAL_BRON_LABEL: Record<TrialBron, string> = {
  selfservice: "Selfservice (frontpage)",
  affiliate: "Via wederverkoper",
  sales: "Sales-team",
  google_oauth: "Google-registratie",
};

export const TRIAL_BRON_KORT: Record<TrialBron, string> = {
  selfservice: "Selfservice",
  affiliate: "Wederverkoper",
  sales: "Sales",
  google_oauth: "Google",
};

export const TRIAL_BRON_KLEUR: Record<TrialBron, string> = {
  selfservice: "bg-primary/10 text-primary border-primary/30",
  affiliate: "bg-emerald-100 text-emerald-800 border-emerald-200",
  sales: "bg-sky-100 text-sky-800 border-sky-200",
  google_oauth: "bg-amber-100 text-amber-800 border-amber-200",
};

export const TRIAL_BRON_VOLGORDE: TrialBron[] = ["selfservice", "affiliate", "sales", "google_oauth"];

export function bepaalBron(t: SalesTrialPartner): TrialBron {
  if (t.trial_bron) return t.trial_bron;
  if (t.affiliate) return "affiliate";
  return "selfservice";
}

export type BronFilter = "alles" | TrialBron;

export type BronTellingen = Record<BronFilter, number>;

/** Telt hoeveel trials per bron voorkomen, plus totaal onder key `alles`. */
export function telBronnen(trials: SalesTrialPartner[]): BronTellingen {
  const map: BronTellingen = {
    alles: trials.length,
    selfservice: 0,
    affiliate: 0,
    sales: 0,
    google_oauth: 0,
  };
  for (const t of trials) map[bepaalBron(t)] += 1;
  return map;
}

/** Filtert trials op de gekozen bron. `alles` retourneert de lijst ongewijzigd. */
export function filterOpBron(trials: SalesTrialPartner[], bron: BronFilter): SalesTrialPartner[] {
  if (bron === "alles") return trials;
  return trials.filter((t) => bepaalBron(t) === bron);
}