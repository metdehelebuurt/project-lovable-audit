import { useMemo } from "react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";

function begroeting(uur: number): string {
  if (uur < 6) return "Goedenacht";
  if (uur < 12) return "Goedemorgen";
  if (uur < 18) return "Goedemiddag";
  return "Goedenavond";
}

export function WelkomBlok() {
  const { profile } = useAuth();
  const { groet, datum } = useMemo(() => {
    const nu = new Date();
    return {
      groet: begroeting(nu.getHours()),
      datum: format(nu, "EEEE d MMMM", { locale: nl }),
    };
  }, []);
  const naam = profile?.voornaam || "";

  return (
    <div className="flex flex-col">
      <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
        {groet}{naam ? `, ${naam}` : ""}
      </h1>
      <p className="text-sm text-muted-foreground capitalize mt-0.5">{datum}</p>
    </div>
  );
}
