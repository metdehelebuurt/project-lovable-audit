import { useAuth } from "@/contexts/AuthContext";
import { useActiecentrum } from "@/hooks/useActiecentrum";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, RefreshCw, Plus } from "lucide-react";
import { useState } from "react";
import NotificatiesKaart from "./NotificatiesKaart";
import TakenKaart from "./TakenKaart";
import BerichtenKaart from "./BerichtenKaart";
import TerugbelKaart from "./TerugbelKaart";
import AandachtKaart from "./AandachtKaart";
import NieuweTaakDialog from "./NieuweTaakDialog";
import InstellingenPopover from "./InstellingenPopover";
import { useActiecentrumInstellingen, type KaartKey } from "./useActiecentrumInstellingen";

export default function Actiecentrum() {
  const { profile } = useAuth();
  const { counts, notificaties, taken, berichten, terugbel, aandacht, isLoading, refetch } = useActiecentrum();
  const { instellingen, setView, toggleKaart, verplaats, reset } = useActiecentrumInstellingen();
  const [nieuweTaakOpen, setNieuweTaakOpen] = useState(false);

  const hour = new Date().getHours();
  const groet = hour < 12 ? "Goedemorgen" : hour < 18 ? "Goedemiddag" : "Goedenavond";
  const naam = profile?.voornaam ?? "";

  const renderKaart = (key: KaartKey) => {
    switch (key) {
      case "notificaties": return <NotificatiesKaart key={key} items={notificaties as never[]} onChanged={refetch} />;
      case "taken": return <TakenKaart key={key} items={taken as never[]} onChanged={refetch} onNieuw={() => setNieuweTaakOpen(true)} compact={instellingen.view === "compact"} />;
      case "berichten": return <BerichtenKaart key={key} items={berichten as never[]} />;
      case "terugbel": return <TerugbelKaart key={key} items={terugbel as never[]} onChanged={refetch} />;
      case "aandacht": return <AandachtKaart key={key} {...aandacht} />;
    }
  };

  const focusKaarten: KaartKey[] = ["taken", "aandacht"];
  const actieveKaarten = instellingen.volgorde.filter((k) => {
    if (instellingen.view === "focus") return focusKaarten.includes(k);
    return instellingen.zichtbaar[k];
  });

  const gridClasses = instellingen.view === "compact"
    ? "grid grid-cols-1 lg:grid-cols-2 gap-4"
    : instellingen.view === "focus"
    ? "grid grid-cols-1 lg:grid-cols-2 gap-4"
    : "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4";

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-wrap">
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
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" onClick={() => setNieuweTaakOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Nieuwe taak
            </Button>
            <InstellingenPopover
              instellingen={instellingen}
              setView={setView}
              toggleKaart={toggleKaart}
              verplaats={verplaats}
              reset={reset}
            />
            <Button variant="outline" size="sm" onClick={refetch} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? "animate-spin" : ""}`} /> Vernieuw
            </Button>
          </div>
        </CardContent>
      </Card>

      {actieveKaarten.length === 0 ? (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Geen kaarten zichtbaar — open <strong>Aanpassen</strong> om er een aan te zetten.
          </CardContent>
        </Card>
      ) : (
        <div className={gridClasses}>
          {actieveKaarten.map(renderKaart)}
        </div>
      )}

      <NieuweTaakDialog
        open={nieuweTaakOpen}
        onOpenChange={setNieuweTaakOpen}
        onCreated={refetch}
      />
    </div>
  );
}