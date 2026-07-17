import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Plus, Copy, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import CalendarAccountsLijst from "@/components/agenda/CalendarAccountsLijst";
import { useCalendarAccounts } from "@/hooks/agenda/useCalendarAccounts";

export default function AgendaInstellingen() {
  const [bezig, setBezig] = useState(false);
  const { data: accounts = [], isLoading } = useCalendarAccounts();
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const redirectUri = `${supabaseUrl}/functions/v1/google-calendar-oauth-callback`;

  const koppel = async () => {
    setBezig(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-calendar-oauth-start", {
        body: { return_to: "/instellingen/agendas" },
      });
      if (error || !data?.url) throw new Error(error?.message || "Geen URL ontvangen");
      window.location.href = data.url;
    } catch (e) {
      toast.error("Koppeling starten mislukt", { description: (e as Error).message });
      setBezig(false);
    }
  };

  const copyRedirect = async () => {
    try { await navigator.clipboard.writeText(redirectUri); toast.success("Gekopieerd"); }
    catch { toast.error("Kopiëren mislukt"); }
  };

  return (
    <div className="container mx-auto max-w-3xl p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="gap-2">
          <Link to="/instellingen"><ArrowLeft className="h-4 w-4" /> Terug</Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" /> Agenda's
          </h1>
          <p className="text-sm text-muted-foreground">Beheer al je gekoppelde Google-agenda's. Nieuwe items landen automatisch in je primaire agenda.</p>
        </div>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Gekoppelde agenda's</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Laden…</p>
          ) : accounts.length === 0 ? (
            <div className="rounded-xl border bg-muted/30 p-6 text-center space-y-3">
              <Calendar className="h-10 w-10 text-primary mx-auto" />
              <p className="text-sm">Nog geen agenda gekoppeld. Verbind je Google-account om schouwen en installaties automatisch te synchroniseren.</p>
            </div>
          ) : (
            <CalendarAccountsLijst />
          )}
          <Button onClick={koppel} disabled={bezig} className="rounded-pill gap-2">
            <Plus className="h-4 w-4" /> {bezig ? "Bezig…" : accounts.length ? "Extra agenda koppelen" : "Koppel Google Agenda"}
          </Button>

          <div className="border rounded-xl p-3 bg-muted/30 flex items-start gap-2">
            <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0 text-xs">
              <p className="font-medium text-foreground">Krijg je "redirect_uri_mismatch"?</p>
              <p className="text-muted-foreground mt-0.5">Deze URI moet toegestaan zijn in de Google Cloud OAuth-client:</p>
              <div className="flex items-center gap-2 mt-2">
                <code className="flex-1 bg-background border rounded px-2 py-1 break-all font-mono">{redirectUri}</code>
                <Button type="button" size="sm" variant="outline" onClick={copyRedirect} className="gap-1 shrink-0">
                  <Copy className="h-3 w-3" /> Kopieer
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}