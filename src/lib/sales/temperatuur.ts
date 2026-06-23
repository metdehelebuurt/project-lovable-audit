import { Snowflake, ThermometerSnowflake, Thermometer, Flame } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type Temperatuur = "koud" | "lauw" | "warm" | "heet";

export const TEMPERATUREN: Temperatuur[] = ["koud", "lauw", "warm", "heet"];

export const TEMP_LABEL: Record<Temperatuur, string> = {
  koud: "Koud",
  lauw: "Lauw",
  warm: "Warm",
  heet: "Heet",
};

export const TEMP_ICON: Record<Temperatuur, LucideIcon> = {
  koud: Snowflake,
  lauw: ThermometerSnowflake,
  warm: Thermometer,
  heet: Flame,
};

/** Tailwind-classes voor badges (text + bg + border). */
export const TEMP_COLOR: Record<Temperatuur, string> = {
  koud: "bg-sky-100 text-sky-700 border-sky-200",
  lauw: "bg-amber-100 text-amber-700 border-amber-200",
  warm: "bg-orange-100 text-orange-700 border-orange-200",
  heet: "bg-rose-100 text-rose-700 border-rose-200",
};

/** Compactere ring-classes voor iconen op kaarten. */
export const TEMP_ICON_COLOR: Record<Temperatuur, string> = {
  koud: "text-sky-500",
  lauw: "text-amber-500",
  warm: "text-orange-500",
  heet: "text-rose-500",
};

export const TEMP_SUGGESTIE: Record<Temperatuur, string> = {
  koud: "Eerste contact, geen actieve interesse vastgesteld.",
  lauw: "Wat interesse getoond, opvolging nodig binnen een week.",
  warm: "Concrete behoefte uitgesproken, opvolgen binnen 3 dagen.",
  heet: "Klaar voor afspraak/offerte, dezelfde dag actie nodig.",
};