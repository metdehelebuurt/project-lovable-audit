export type FeedbackStatus =
  | "nieuw"
  | "in_behandeling"
  | "gepland"
  | "in_review"
  | "afgerond"
  | "afgewezen";

export const STATUS_OPTIONS: Array<{ value: FeedbackStatus; label: string }> = [
  { value: "nieuw", label: "Nieuw" },
  { value: "in_behandeling", label: "In behandeling" },
  { value: "gepland", label: "Gepland" },
  { value: "in_review", label: "In review" },
  { value: "afgerond", label: "Afgerond" },
  { value: "afgewezen", label: "Afgewezen" },
];

export const STATUS_KLEUR: Record<FeedbackStatus, string> = {
  nieuw: "bg-primary/10 text-primary border-primary/20",
  in_behandeling: "bg-amber-100 text-amber-700 border-amber-200",
  gepland: "bg-blue-100 text-blue-700 border-blue-200",
  in_review: "bg-violet-100 text-violet-700 border-violet-200",
  afgerond: "bg-emerald-100 text-emerald-700 border-emerald-200",
  afgewezen: "bg-muted text-muted-foreground border-transparent",
};

export const STATUS_KOLOM_VOLGORDE: FeedbackStatus[] = [
  "nieuw",
  "in_behandeling",
  "gepland",
  "in_review",
  "afgerond",
  "afgewezen",
];

export const PRIORITEIT_KLEUR: Record<string, string> = {
  laag: "text-muted-foreground",
  normaal: "text-foreground",
  hoog: "text-amber-600",
  kritiek: "text-destructive",
};

export type BevestigingStatus =
  | "wachten_op_indiener"
  | "bevestigd_werkt"
  | "werkt_niet"
  | "deels";

export const BEVESTIGING_LABEL: Record<BevestigingStatus, string> = {
  wachten_op_indiener: "Wacht op indiener",
  bevestigd_werkt: "Bevestigd door indiener",
  werkt_niet: "Indiener: werkt niet",
  deels: "Indiener: werkt deels",
};

export const BEVESTIGING_KLEUR: Record<BevestigingStatus, string> = {
  wachten_op_indiener: "bg-amber-100 text-amber-700 border-amber-200",
  bevestigd_werkt: "bg-emerald-100 text-emerald-700 border-emerald-200",
  werkt_niet: "bg-destructive/15 text-destructive border-destructive/30",
  deels: "bg-amber-100 text-amber-700 border-amber-200",
};

export const CATEGORIE_OPTIES = [
  { value: "ui", label: "UI/UX" },
  { value: "performance", label: "Performance" },
  { value: "nieuwe_functie", label: "Nieuwe functie" },
  { value: "bug", label: "Bug" },
  { value: "integratie", label: "Integratie" },
  { value: "workflow", label: "Workflow" },
  { value: "overig", label: "Overig" },
];