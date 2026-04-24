import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Inbox } from "lucide-react";
import { useVandaagData } from "./useVandaagData";
import { VandaagAgendaKaart } from "./VandaagAgendaKaart";
import { VandaagActieKaart } from "./VandaagActieKaart";
import { VandaagRecentKaart } from "./VandaagRecentKaart";
import { VandaagBegroeting } from "./VandaagBegroeting";

/**
 * /vandaag — persona-dashboard met focus op acties van vandaag.
 * Toont rol-specifieke widgets: actiecentrum (taken/notificaties),
 * agenda van vandaag, en recente activiteit per modulesoort.
 */

export default function Vandaag() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const rol = profile?.rol ?? "consument";
  const { agenda, recent, actiecentrum, isLoading } = useVandaagData();

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      <VandaagBegroeting voornaam={profile?.voornaam} rol={rol} />

      {/* Actiecentrum: hoogste prioriteit bovenaan */}
      {actiecentrum.totaal > 0 ? (
        <VandaagActieKaart counts={actiecentrum} />
      ) : (
        <Card className="rounded-2xl border-0 shadow-sm bg-primary/5">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Inbox className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Geen openstaande acties</p>
              <p className="text-xs text-muted-foreground">Je bent helemaal bij. Mooi werk.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <VandaagAgendaKaart afspraken={agenda} isLoading={isLoading} />
          <VandaagRecentKaart items={recent} isLoading={isLoading} />
        </div>

        <div className="space-y-4">
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Snel naar</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-1.5">
              <SnelLink label="Mijn pipeline" naar="/leads" onNavigate={navigate} />
              <SnelLink label="Open offertes" naar="/offertes" onNavigate={navigate} />
              <SnelLink label="Volledige planning" naar="/planning" onNavigate={navigate} />
              <SnelLink label="Klassiek dashboard" naar="/dashboard" onNavigate={navigate} />
            </CardContent>
          </Card>

          {isLoading && (
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function SnelLink({
  label, naar, onNavigate,
}: { label: string; naar: string; onNavigate: (to: string) => void }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-between"
      onClick={() => onNavigate(naar)}
    >
      <span>{label}</span>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
    </Button>
  );
}