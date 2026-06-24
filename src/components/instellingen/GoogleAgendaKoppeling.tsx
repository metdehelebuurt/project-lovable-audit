import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, ExternalLink, RefreshCw, Unplug, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import AgendaDelegaties from "./AgendaDelegaties";

interface Account {
  id: string;
  google_email: string;
  calendar_id: string;
  calendar_summary: string | null;
  actief: boolean;
  sync_schouwen: boolean;
  sync_installaties: boolean;
  sync_afspraken: boolean;
  sync_taken: boolean;
  sync_handmatig: boolean;
  laatst_gesynchroniseerd_op: string | null;
  laatste_fout: string | null;
  channel_expiry: string | null;
}

const SYNC_OPTIES: Array<{ key: keyof Account; label: string; beschrijving: string }> = [
  { key: "sync_schouwen", label: "Schouwen", beschrijving: "Geplande schouwen incl. consument en locatie" },
  { key: "sync_installaties", label: "Installaties", beschrijving: "Geplande installaties met start- en einddatum" },
  { key: "sync_afspraken", label: "Afspraken", beschrijving: "Belafspraken, video- en locatie-afspraken" },
  { key: "sync_taken", label: "Helpdesk-taken", beschrijving: "Geplande servicetaken en monteurtaken" },
  { key: "sync_handmatig", label: "Handmatige agenda-items", beschrijving: "Losse afspraken die je zelf aanmaakt" },
];

export default function GoogleAgendaKoppeling() {
  const { user } = useAuth();
  const [account, setAccount] = useState<Account | null>(null);
  const [laden, setLaden] = useState(true);
  const [bezig, setBezig] = useState(false);

  useEffect(() => {
    if (!user) return;
    laadAccount();
    toonResultaatBoodschap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function laadAccount() {
    setLaden(true);
    const { data } = await supabase
      .from("google_calendar_accounts")
      .select("id, google_email, calendar_id, calendar_summary, actief, sync_schouwen, sync_installaties, sync_afspraken, sync_taken, sync_handmatig, laatst_gesynchroniseerd_op, laatste_fout, channel_expiry")
      .maybeSingle();
    setAccount(data as Account | null);
    setLaden(false);
  }

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
        body: { return_to: "/instellingen" },
      });
      if (error || !data?.url) throw new Error(error?.message || "Geen URL ontvangen");
      window.location.href = data.url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kon koppeling niet starten");
      setBezig(false);
    }
  }

  async function ontkoppel() {
    if (!confirm("Weet je zeker dat je Google Agenda wilt ontkoppelen? Bestaande events blijven in Google staan.")) return;
    setBezig(true);
    try {
      const { error } = await supabase.functions.invoke("google-calendar-disconnect", { body: {} });
      if (error) throw error;
      toast.success("Google Agenda ontkoppeld");
      setAccount(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ontkoppelen mislukt");
    } finally { setBezig(false); }
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
      setTimeout(laadAccount, 1500);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Synchronisatie mislukt");
    } finally { setBezig(false); }
  }

  async function toggleSync(veld: keyof Account, waarde: boolean) {
    if (!account) return;
    const oud = account[veld];
    setAccount({ ...account, [veld]: waarde });
    const { error } = await supabase
      .from("google_calendar_accounts")
      .update({ [veld]: waarde })
      .eq("id", account.id);
    if (error) {
      setAccount({ ...account, [veld]: oud });
      toast.error("Opslaan mislukt");
    }
  }

  if (laden) {
    return <div className="text-sm text-muted-foreground">Laden...</div>;
  }

  if (!account) {
    return (
      <div className="space-y-6">
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" /> Google Agenda
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Koppel je Google Agenda zodat schouwen, installaties, afspraken en taken automatisch in je agenda verschijnen.
            Wijzigingen die je in Google maakt komen terug in het platform.
          </p>
          <Button onClick={koppel} disabled={bezig}>
            <ExternalLink className="mr-2 h-4 w-4" />
            {bezig ? "Bezig..." : "Google Agenda koppelen"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Je wordt doorgestuurd naar Google om toestemming te geven. We slaan alleen tokens op die nodig zijn voor synchronisatie.
          </p>
        </CardContent>
        </Card>
        <AgendaDelegaties />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" /> Google Agenda
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Gekoppeld
            </div>
            <div className="text-sm text-muted-foreground">{account.google_email}</div>
            {account.laatst_gesynchroniseerd_op && (
              <div className="text-xs text-muted-foreground">
                Laatste sync: {new Date(account.laatst_gesynchroniseerd_op).toLocaleString("nl-NL")}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={nuSynchroniseren} disabled={bezig}>
              <RefreshCw className="mr-2 h-4 w-4" /> Nu synchroniseren
            </Button>
            <Button variant="outline" size="sm" onClick={ontkoppel} disabled={bezig}>
              <Unplug className="mr-2 h-4 w-4" /> Ontkoppelen
            </Button>
          </div>
        </div>

        {account.laatste_fout && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{account.laatste_fout}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <div className="text-sm font-medium">Wat wil je synchroniseren?</div>
          {SYNC_OPTIES.map((opt) => (
            <div key={opt.key} className="flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor={opt.key as string} className="text-sm">{opt.label}</Label>
                <div className="text-xs text-muted-foreground">{opt.beschrijving}</div>
              </div>
              <Switch
                id={opt.key as string}
                checked={!!account[opt.key]}
                onCheckedChange={(v) => toggleSync(opt.key, v)}
              />
            </div>
          ))}
        </div>
      </CardContent>
      </Card>
      <AgendaDelegaties />
    </div>
  );
}