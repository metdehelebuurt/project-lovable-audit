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
          partner_id: partnerId,
          to: user.email,
          subject: "Testbericht – e-mailkoppeling werkt",
          html: "<p>Dit is een testbericht vanuit de onboarding-checklist. Als je dit ziet werkt verzenden correct.</p>",
          type: "test",
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
          <Badge variant={gereed === stappen.length ? "default" : "secondary"}>
            {gereed}/{stappen.length} gereed
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {status.loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Status laden…
          </div>
        ) : (
          <ol className="space-y-4">
            {stappen.map((stap) => (
              <li
                key={stap.titel}
                className="rounded-lg border p-4 flex gap-3 items-start"
              >
                {stap.gereed ? (
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                )}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">{stap.titel}</p>
                    {stap.gereed && (
                      <Badge variant="secondary" className="text-xs">
                        Gereed
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{stap.beschrijving}</p>
                  <ul className="text-sm list-disc pl-5 space-y-1 text-muted-foreground">
                    {stap.hulp.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        )}
        <div className="flex justify-between items-center pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Tip: ververs na elke stap om de status opnieuw te laten checken.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={laad} disabled={status.loading}>
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