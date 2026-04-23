import type { Database } from "@/integrations/supabase/types";

export type AppKleur =
  | "indigo"
  | "violet"
  | "blauw"
  | "oranje"
  | "teal"
  | "roze"
  | "groen"
  | "amber"
  | "rood"
  | "cyaan"
  | "fuchsia"
  | "limoen"
  | "grijs";

/**
 * HSL-tokens per kleur. Light + dark variant op tegelvlak — labels gebruiken
 * altijd `--foreground` zodat contrast onder de tegel goed is.
 */
export const APP_KLEUR_GRADIENTS: Record<AppKleur, { from: string; to: string; glow: string }> = {
  indigo:  { from: "238 84% 60%",  to: "248 84% 70%", glow: "238 84% 60%" },
  violet:  { from: "262 83% 58%",  to: "278 83% 68%", glow: "262 83% 58%" },
  blauw:   { from: "210 90% 56%",  to: "200 90% 66%", glow: "210 90% 56%" },
  oranje:  { from: "24 94% 55%",   to: "32 94% 65%",  glow: "24 94% 55%"  },
  teal:    { from: "172 70% 42%",  to: "180 70% 52%", glow: "172 70% 42%" },
  roze:    { from: "330 85% 60%",  to: "340 85% 70%", glow: "330 85% 60%" },
  groen:   { from: "142 70% 42%",  to: "150 70% 52%", glow: "142 70% 42%" },
  amber:   { from: "38 92% 50%",   to: "48 92% 60%",  glow: "38 92% 50%"  },
  rood:    { from: "0 84% 58%",    to: "8 84% 68%",   glow: "0 84% 58%"   },
  cyaan:   { from: "188 85% 45%",  to: "196 85% 55%", glow: "188 85% 45%" },
  fuchsia: { from: "292 80% 58%",  to: "302 80% 68%", glow: "292 80% 58%" },
  limoen:  { from: "84 70% 45%",   to: "94 70% 55%",  glow: "84 70% 45%"  },
  grijs:   { from: "220 12% 45%",  to: "220 12% 60%", glow: "220 12% 45%" },
};

export function tegelStyle(kleur: AppKleur): React.CSSProperties {
  const g = APP_KLEUR_GRADIENTS[kleur];
  return {
    backgroundImage: `linear-gradient(135deg, hsl(${g.from}), hsl(${g.to}))`,
  };
}

export function glowStyle(kleur: AppKleur, opacity = 0.4): React.CSSProperties {
  const g = APP_KLEUR_GRADIENTS[kleur];
  return {
    boxShadow: `0 12px 32px -8px hsla(${g.glow} / ${opacity})`,
  };
}

export type AppRole = Database["public"]["Enums"]["app_role"];
