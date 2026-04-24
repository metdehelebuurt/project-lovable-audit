import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, ShieldCheck, History } from "lucide-react";
import { useAccessGrants, getGrantStatus } from "@/hooks/useAccessGrants";
import { RequestAccessDialog } from "./RequestAccessDialog";
import { GrantsTable } from "./GrantsTable";

export default function AccessGrantsPage() {
  const { data: grants = [], isLoading } = useAccessGrants();

  const { actief, historie } = useMemo(() => {
    const a: typeof grants = [];
    const h: typeof grants = [];
    for (const g of grants) {
      if (getGrantStatus(g) === "actief") a.push(g);
      else h.push(g);
    }
    return { actief: a, historie: h };
  }, [grants]);

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-6xl">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-primary" />
            Tijdelijke partnertoegang
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Platformbeheerders zien standaard geen partner-data. Vraag hier kortdurende
            toegang aan voor concrete supportvragen. Iedere actie wordt vastgelegd.
          </p>
        </div>
        <RequestAccessDialog />
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-success" />
            Actieve toegang
            {actief.length > 0 && (
              <span className="text-xs text-muted-foreground font-normal">
                ({actief.length})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Laden...</p>
          ) : (
            <GrantsTable grants={actief} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            Historie
            {historie.length > 0 && (
              <span className="text-xs text-muted-foreground font-normal">
                ({historie.length})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Laden...</p>
          ) : (
            <GrantsTable grants={historie} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}