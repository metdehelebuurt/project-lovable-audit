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