import type { Database } from "@/integrations/supabase/types";

export type InstallatieStatus = Database["public"]["Enums"]["installatie_status"];

export const INSTALLATIE_STATUS_LABELS: Record<InstallatieStatus, string> = {
  concept: "Concept",
  gepland: "Gepland",
  bevestigd: "Bevestigd",
  onderweg: "Onderweg",
  in_uitvoering: "In uitvoering",
  gereed: "Gereed",
  afgerond: "Afgerond",
  geannuleerd: "Geannuleerd",
};

export const INSTALLATIE_STATUS_COLORS: Record<InstallatieStatus, string> = {
  concept: "bg-muted text-muted-foreground",
  gepland: "bg-primary/10 text-primary",
  bevestigd: "bg-accent/50 text-accent-foreground",
  onderweg: "bg-warning-light text-warning-foreground",
  in_uitvoering: "bg-warning-light text-warning-foreground",
  gereed: "bg-success-light text-success",
  afgerond: "bg-success-light text-success",
  geannuleerd: "bg-error-light text-error",
};

export const INSTALLATIE_STATUS_VOLGORDE: InstallatieStatus[] = [
  "concept", "gepland", "bevestigd", "onderweg", "in_uitvoering", "gereed", "afgerond", "geannuleerd",
];