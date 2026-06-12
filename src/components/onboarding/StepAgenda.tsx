import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Calendar, CheckCircle2, ExternalLink, Info, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import InfoCallout from "./InfoCallout";

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

export const StepAgenda = ({ onNext, onPrev }: Props) => {
  const [gekoppeld, setGekoppeld] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [bezig, setBezig] = useState(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const redirectUri = `${supabaseUrl}/functions/v1/google-calendar-oauth-callback`;

  const laad = async () => {
    const { data } = await supabase
      .from("google_calendar_accounts")
      .select("google_email, actief")
      .maybeSingle();
    setGekoppeld(!!data?.actief);
    setEmail(data?.google_email ?? null);
  };

  useEffect(() => { laad(); }, []);

  const koppel = async () => {
    setBezig(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-calendar-oauth-start", {
        body: { return_to: "/onboarding" },
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
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" /> Agenda koppelen</h2>
        <p className="text-sm text-muted-foreground mt-1">Synchroniseer schouwen, installaties en afspraken automatisch met Google Agenda.</p>
      </div>

      <InfoCallout title="Wat krijg je?">
        Alle geplande schouwen en installaties verschijnen automatisch in je Google Agenda — met klantgegevens en locatie. Wijzigingen worden tweezijdig gesynchroniseerd.
      </InfoCallout>

      {gekoppeld ? (
        <div className="rounded-xl border border-success/20 bg-success/5 p-4">
          <p className="text-sm flex items-center gap-2 text-success font-medium">
            <CheckCircle2 className="h-4 w-4" /> Gekoppeld met {email}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Je kunt de sync-opties later fijnafstemmen bij Instellingen → Agenda.</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card p-6 text-center space-y-3">
          <Calendar className="h-10 w-10 text-primary mx-auto" />
          <p className="text-sm">Klik hieronder om je Google-account te verbinden. Je wordt heel even doorgestuurd en daarna terug naar de onboarding gebracht.</p>
          <Button onClick={koppel} disabled={bezig} className="rounded-pill gap-2">
            <ExternalLink className="h-4 w-4" /> {bezig ? "Bezig…" : "Koppel Google Agenda"}
          </Button>
        </div>
      )}

      {!gekoppeld && (
        <div className="border rounded-xl p-3 bg-muted/30 flex items-start gap-2">
          <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0 text-xs">
            <p className="font-medium text-foreground">Krijg je "redirect_uri_mismatch" / "Toegang geblokkeerd"?</p>
            <p className="text-muted-foreground mt-0.5">Vraag de beheerder om deze URI toe te voegen aan de Google Cloud OAuth-client (Authorized redirect URIs):</p>
            <div className="flex items-center gap-2 mt-2">
              <code className="flex-1 bg-background border rounded px-2 py-1 break-all font-mono">{redirectUri}</code>
              <Button type="button" size="sm" variant="outline" onClick={copyRedirect} className="gap-1 shrink-0">
                <Copy className="h-3 w-3" /> Kopieer
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onPrev} className="rounded-pill gap-2"><ArrowLeft className="h-4 w-4" /> Terug</Button>
        <Button onClick={onNext} className="rounded-pill gap-2">
          {gekoppeld ? "Volgende" : "Overslaan"} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default StepAgenda;