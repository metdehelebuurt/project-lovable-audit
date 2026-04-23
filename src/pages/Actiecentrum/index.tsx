import { useAuth } from "@/contexts/AuthContext";
import { useActiecentrum } from "@/hooks/useActiecentrum";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, RefreshCw } from "lucide-react";
import NotificatiesKaart from "./NotificatiesKaart";
import TakenKaart from "./TakenKaart";
import BerichtenKaart from "./BerichtenKaart";
import TerugbelKaart from "./TerugbelKaart";
import AandachtKaart from "./AandachtKaart";

export default function Actiecentrum() {
  const { profile } = useAuth();
  const { counts, notificaties, taken, berichten, terugbel, aandacht, isLoading, refetch } = useActiecentrum();

  const hour = new Date().getHours();
  const groet = hour < 12 ? "Goedemorgen" : hour < 18 ? "Goedemiddag" : "Goedenavond";
  const naam = profile?.voornaam ?? "";

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 text-primary" /> {groet}{naam ? `, ${naam}` : ""}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Je hebt <strong>{counts.totaal}</strong> openstaand{counts.totaal === 1 ? " item" : "e items"}
              {counts.taken > 0 ? ` · ${counts.taken} taken` : ""}
              {counts.aandacht > 0 ? ` · ${counts.aandacht} vereist aandacht` : ""}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={refetch} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? "animate-spin" : ""}`} /> Vernieuw
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <NotificatiesKaart items={notificaties as never[]} onChanged={refetch} />
        <TakenKaart items={taken as never[]} onChanged={refetch} />
        <BerichtenKaart items={berichten as never[]} />
        <TerugbelKaart items={terugbel as never[]} onChanged={refetch} />
        <AandachtKaart {...aandacht} />
      </div>
    </div>
  );
}