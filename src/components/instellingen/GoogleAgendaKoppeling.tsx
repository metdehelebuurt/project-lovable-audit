import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, ExternalLink, RefreshCw, AlertCircle, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import AgendaDelegaties from "./AgendaDelegaties";
import CalendarAccountsLijst from "@/components/agenda/CalendarAccountsLijst";
import { useCalendarAccounts } from "@/hooks/agenda/useCalendarAccounts";

export default function GoogleAgendaKoppeling() {
  const { user } = useAuth();
  const { data: accounts = [], isLoading } = useCalendarAccounts();
  const [bezig, setBezig] = useState(false);

  useEffect(() => {
    if (!user) return;
    toonResultaatBoodschap();
  }, [user]);

  function toonResultaatBoodschap() {
    const params = new URLSearchParams(window.location.search);
    const gcal = params.get("gcal");
    if (!gcal) return;
    const map: Record<string, { type: "success" | "error"; msg: string }> = {
      ok: { type: "success", msg: "Google Agenda gekoppeld" },
      denied: { type: "error", msg: "Koppeling geweigerd" },
      expired: { type: "error", msg: "Sessie verlopen, probeer opnieuw" },
      invalid: { type: "error", msg: "Ongeldige callback" },
      token_error: { type: "error", msg: "Google gaf geen token terug" },
      error: { type: "error", msg: "Onbekende fout bij koppelen" },
      no_partner: { type: "error", msg: "Geen organisatie gevonden" },
    };
    const m = map[gcal];
    if (m) (m.type === "success" ? toast.success : toast.error)(m.msg);
    window.history.replaceState({}, "", window.location.pathname);
  }

  async function koppel() {
    setBezig(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-calendar-oauth-start", {
        body: { return_to: "/instellingen/agendas" },
      });
      if (error || !data?.url) throw new Error(error?.message || "Geen URL ontvangen");
      window.location.href = data.url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kon koppeling niet starten");
      setBezig(false);
    }
  }

  async function nuSynchroniseren() {
    if (!user) return;
    setBezig(true);
    try {
      // 1) Pull: wijzigingen vanuit Google terughalen
      const pull = await supabase.functions.invoke("google-calendar-sync-pull", {
        body: { user_id: user.id },
      });
      if (pull.error) throw pull.error;

      // 2) Push: bestaande platform-items (her)versturen naar Google
      const push = await supabase.functions.invoke("google-calendar-backfill", {
        body: { user_id: user.id },
      });
      if (push.error) throw push.error;

      const r = (push.data || {}) as { totaal?: number; gelukt?: number; overgeslagen?: number; mislukt?: number };
      const totaal = r.totaal ?? 0;
      if (totaal === 0) {
        toast.success("Synchronisatie voltooid – geen items om te versturen");
      } else {
        toast.success(
          `Synchronisatie voltooid (${r.gelukt ?? 0} verstuurd, ${r.overgeslagen ?? 0} ongewijzigd${r.mislukt ? `, ${r.mislukt} mislukt` : ""})`,
        );
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Synchronisatie mislukt");
    } finally { setBezig(false); }
  }

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Laden...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" /> Google Agenda
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {accounts.length === 0 ? (
          <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
            Koppel je Google Agenda zodat schouwen, installaties, afspraken en taken automatisch in je agenda verschijnen.
          </div>
        ) : (
          <CalendarAccountsLijst />
        )}

        {accounts.some((account) => account.laatste_fout) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Minstens één agenda heeft een foutmelding. Open de lijst om de koppeling opnieuw te controleren.</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2 flex-wrap">
          {accounts.length > 0 && (
            <Button variant="outline" size="sm" onClick={nuSynchroniseren} disabled={bezig} className="gap-2 rounded-pill">
              <RefreshCw className={`h-3.5 w-3.5 ${bezig ? "animate-spin" : ""}`} />
              {bezig ? "Synchroniseren..." : "Nu synchroniseren"}
            </Button>
          )}
          <Button onClick={koppel} disabled={bezig} className="gap-2 rounded-pill">
            {accounts.length > 0 ? <Plus className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
            {bezig ? "Bezig..." : accounts.length > 0 ? "Extra agenda koppelen" : "Google Agenda koppelen"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Nieuwe items worden standaard in je primaire agenda gezet. Google vraagt bij elke nieuwe koppeling welk account je wilt gebruiken.
        </p>
      </CardContent>
      </Card>
      <AgendaDelegaties />
    </div>
  );
}