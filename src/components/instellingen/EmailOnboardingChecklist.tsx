import { useEffect, useState } from "react";
import {
  CheckCircle2, AlertTriangle, XCircle, Loader2,
  ExternalLink, ChevronDown, ChevronRight, Send, RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  partnerId: string;
}

type DiagStatus = "ok" | "warning" | "fail" | "pending";
interface DiagStep {
  id: string;
  titel: string;
  status: DiagStatus;
  reden: string;
  suggestie?: string;
  details?: string;
  fixActie?:
    | { type: "scroll"; target: string }
    | { type: "send_test" }
    | { type: "sync_now" };
}
interface DiagAccount {
  id: string;
  email_adres: string;
  provider: string;
  is_default_voor_partner: boolean;
  user_id: string | null;
  last_sync_at: string | null;
  last_sync_error: string | null;
  last_sync_error_at: string | null;
  needs_reauth: boolean;
  scopes: string[] | null;
}

const scrollTo = (id: string) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

const EmailOnboardingChecklist = ({ partnerId }: Props) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [steps, setSteps] = useState<DiagStep[]>([]);
  const [accounts, setAccounts] = useState<DiagAccount[]>([]);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [bezig, setBezig] = useState<string | null>(null);

  const laad = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("email-config-diagnose", {
        body: { partner_id: partnerId },
      });
      if (error) throw error;
      setSteps((data?.steps as DiagStep[]) || []);
      setAccounts((data?.accounts as DiagAccount[]) || []);
    } catch (err) {
      toast.error("Diagnose mislukt", { description: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (partnerId) laad(); }, [partnerId]);

  const stuurTest = async () => {
    if (!user?.email) { toast.error("Geen e-mailadres van ingelogde gebruiker bekend"); return; }
    setBezig("test");
    try {
      const { data, error } = await supabase.functions.invoke("email-api-send", {
        body: {
          to: user.email,
          subject: "Testbericht – e-mailkoppeling werkt",
          html_body: "<p>Dit is een testbericht vanuit de onboarding-checklist. Als je dit ziet werkt verzenden correct.</p>",
          document_type: "algemeen",
        },
      });
      if (error || (data as any)?.error) {
        toast.error("Testmail mislukt", { description: (data as any)?.error || error?.message });
      } else {
        toast.success(`Testmail verstuurd naar ${user.email}`);
        await laad();
      }
    } catch (err) {
      toast.error("Testmail mislukt", { description: (err as Error).message });
    } finally { setBezig(null); }
  };

  const syncNu = async () => {
    setBezig("sync");
    try {
      const { data, error } = await supabase.functions.invoke("email-api-sync", {});
      if (error) toast.error("Synchronisatie mislukt", { description: error.message });
      else toast.success(`${(data as any)?.synced ?? 0} berichten gesynchroniseerd`);
      await laad();
    } finally { setBezig(null); }
  };

  const doFix = (s: DiagStep) => {
    if (!s.fixActie) return;
    if (s.fixActie.type === "scroll") scrollTo(s.fixActie.target);
    if (s.fixActie.type === "send_test") stuurTest();
    if (s.fixActie.type === "sync_now") syncNu();
  };

  const okCount = steps.filter((s) => s.status === "ok").length;
  const failCount = steps.filter((s) => s.status === "fail").length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Onboarding e-mail koppeling</CardTitle>
            <CardDescription>
              Stap-voor-stap controle. Werk de lijst van boven naar beneden af.
            </CardDescription>
          </div>
          <Badge variant={failCount === 0 && okCount === steps.length ? "default" : "secondary"}>
            {okCount}/{steps.length} ok{failCount > 0 ? ` · ${failCount} fout` : ""}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Status laden…
          </div>
        ) : (
          <ol className="space-y-3">
            {steps.map((stap) => {
              const isOpen = !!open[stap.id];
              const Icon = stap.status === "ok" ? CheckCircle2
                : stap.status === "warning" ? AlertTriangle
                : stap.status === "fail" ? XCircle : Loader2;
              const color = stap.status === "ok" ? "text-emerald-600"
                : stap.status === "warning" ? "text-amber-600"
                : stap.status === "fail" ? "text-destructive"
                : "text-muted-foreground";
              return (
                <li key={stap.id} className="rounded-lg border p-4">
                  <div className="flex gap-3 items-start">
                    <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${color}`} />
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{stap.titel}</p>
                        <Badge
                          variant={stap.status === "ok" ? "default"
                            : stap.status === "fail" ? "destructive" : "secondary"}
                          className="text-[10px] uppercase"
                        >
                          {stap.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{stap.reden}</p>
                      {stap.suggestie && (
                        <p className="text-sm">
                          <span className="font-medium text-foreground">Fix:</span>{" "}
                          <span className="text-muted-foreground">{stap.suggestie}</span>
                        </p>
                      )}
                      {stap.details && (
                        <button
                          type="button"
                          onClick={() => setOpen((o) => ({ ...o, [stap.id]: !o[stap.id] }))}
                          className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-foreground"
                        >
                          {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                          Details
                        </button>
                      )}
                      {isOpen && stap.details && (
                        <pre className="text-xs whitespace-pre-wrap bg-muted/50 rounded p-2 border">
                          {stap.details}
                        </pre>
                      )}
                      {stap.fixActie && (
                        <Button
                          size="sm"
                          variant={stap.status === "ok" ? "outline" : "default"}
                          className="gap-1.5"
                          onClick={() => doFix(stap)}
                          disabled={bezig !== null}
                        >
                          {stap.fixActie.type === "send_test" && <Send className="h-3.5 w-3.5" />}
                          {stap.fixActie.type === "sync_now" && (
                            <RefreshCw className={`h-3.5 w-3.5 ${bezig === "sync" ? "animate-spin" : ""}`} />
                          )}
                          {stap.fixActie.type === "send_test" ? "Stuur testmail naar mezelf"
                            : stap.fixActie.type === "sync_now" ? "Nu synchroniseren"
                            : "Naar betreffende sectie"}
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        {accounts.length > 0 && (
          <div className="rounded-lg border p-3 space-y-2">
            <p className="text-xs font-medium uppercase text-muted-foreground">Gekoppelde accounts</p>
            {accounts.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium">{a.email_adres}</span>
                <Badge variant="outline" className="text-[10px]">{a.provider}</Badge>
                {a.is_default_voor_partner && (
                  <Badge className="text-[10px]">standaard</Badge>
                )}
                {a.needs_reauth && (
                  <Badge variant="destructive" className="text-[10px]">opnieuw koppelen</Badge>
                )}
                {a.last_sync_error && (
                  <span
                    title={a.last_sync_error}
                    className="text-xs text-destructive truncate max-w-[24ch]"
                  >
                    fout: {a.last_sync_error}
                  </span>
                )}
                {a.last_sync_at && !a.last_sync_error && (
                  <span className="text-xs text-muted-foreground">
                    sync: {new Date(a.last_sync_at).toLocaleString("nl-NL")}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Tip: ververs na elke stap om de status opnieuw te laten checken.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={laad} disabled={loading}>
              Status verversen
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
            >
              <a
                href="https://support.google.com/accounts/answer/3466521"
                target="_blank"
                rel="noreferrer"
              >
                Google-hulp <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailOnboardingChecklist;