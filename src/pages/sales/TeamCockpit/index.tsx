import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useTeamStats } from "@/hooks/sales/useTeamStats";
import RepKaart from "./RepKaart";
import DagelijkseBriefing from "./DagelijkseBriefing";
import NextBestActionLijst from "./NextBestActionLijst";

function magTeamCockpitZien(rollen: string[]): boolean {
  return rollen.some((r) => r === "superadmin" || r === "sales_manager");
}

export default function TeamCockpit() {
  const { profile } = useAuth();
  const rollen = [profile?.rol, ...(profile?.extra_rollen ?? [])].filter(Boolean) as string[];
  const magZien = magTeamCockpitZien(rollen);
  const { stats, isLoading } = useTeamStats();

  if (!magZien) {
    return (
      <div className="p-6 text-sm text-muted-foreground" data-testid="team-cockpit-geen-toegang">
        Deze cockpit is alleen zichtbaar voor sales managers.
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="team-cockpit">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DagelijkseBriefing />
        <NextBestActionLijst />
      </div>
      <div>
        <h2 className="text-sm font-semibold mb-2 uppercase tracking-wide text-muted-foreground">
          Team overzicht
        </h2>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
          </div>
        ) : stats.length === 0 ? (
          <div className="text-sm text-muted-foreground">Nog geen team-data.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {stats.map((s) => <RepKaart key={s.eigenaar_id ?? "platform"} rep={s} />)}
          </div>
        )}
      </div>
    </div>
  );
}