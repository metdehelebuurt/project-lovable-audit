import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Mail, CheckCircle2, RefreshCw, Copy, Info,
  AlertTriangle, XCircle, Clock,
} from "lucide-react";
import { toast } from "sonner";
import EmailAccountsLijst from "./EmailAccountsLijst";

interface EmailKoppelingWizardProps {
  userId: string;
  partnerId: string;
}

export const EmailKoppelingWizard = ({ userId, partnerId }: EmailKoppelingWizardProps) => {
  const [heeftAccount, setHeeftAccount] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [oauthConfig, setOauthConfig] = useState<{
    google: { clientId: string; configured: boolean };
    microsoft: { clientId: string; configured: boolean };
  } | null>(null);
  const [aliasEmail, setAliasEmail] = useState("");
  const [attempts, setAttempts] = useState<any[]>([]);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const redirectUri = `${supabaseUrl}/functions/v1/email-oauth-callback`;

  const load = async () => {
    const { count } = await supabase
      .from("email_accounts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("actief", true);
    setHeeftAccount((count ?? 0) > 0);
    setLoading(false);
  };

  const loadAttempts = async () => {
    const { data } = await supabase
      .from("email_oauth_attempts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);
    setAttempts(data || []);
  };

  const loadConfig = async () => {
    try {
      const { data } = await supabase.functions.invoke("email-oauth-config");
      setOauthConfig(data);
    } catch (err) {
      console.error("OAuth config laden mislukt:", err);
    }
  };

  useEffect(() => {
    load();
    loadConfig();
    loadAttempts();
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "email-oauth-result") {
        if (e.data.error) toast.error(e.data.message);
        else { toast.success(e.data.message || "E-mail gekoppeld!"); load(); }
        loadAttempts();
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [userId]);

  const startOAuth = async (provider: "google" | "microsoft") => {
    const cfg = oauthConfig?.[provider];
    if (!cfg?.configured || !cfg.clientId) {
      toast.error(`${provider === "google" ? "Gmail" : "Outlook"}-koppeling nog niet geactiveerd op platform`);
      return;
    }

    const trimmedAlias = aliasEmail.trim();
    if (trimmedAlias && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedAlias)) {
      toast.error("Vul een geldig alias e-mailadres in, of laat het veld leeg");
      return;
    }

    const { data: attempt } = await supabase
      .from("email_oauth_attempts")
      .insert({
        user_id: userId,
        partner_id: partnerId || null,
        provider,
        status: "started",
        alias_request: provider === "google" ? trimmedAlias || null : null,
        user_agent: navigator.userAgent.slice(0, 500),
      })
      .select("id")
      .single();
    const attemptId = attempt?.id || null;

    const state = btoa(JSON.stringify({
      partner_id: partnerId,
      user_id: userId,
      provider,
      redirect_url: window.location.href,
      attempt_id: attemptId,
      alias_email: provider === "google" ? trimmedAlias || undefined : undefined,
    }));
    const scopes = provider === "google"
      ? "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.settings.sharing https://www.googleapis.com/auth/userinfo.email"
      : "https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send offline_access";
    const url = provider === "google"
      ? `https://accounts.google.com/o/oauth2/v2/auth?client_id=${cfg.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&access_type=offline&prompt=${encodeURIComponent("consent select_account")}&state=${state}`
      : `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${cfg.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&prompt=select_account&state=${state}`;
    const popup = window.open(url, "email-oauth", "width=600,height=720");
    if (!popup) {
      toast.error("Popup geblokkeerd — sta popups toe en probeer opnieuw");
      if (attemptId) {
        await supabase.from("email_oauth_attempts").update({
          status: "error",
          error_code: "popup_blocked",
          error_message: "Browser blokkeerde de OAuth-popup",
        }).eq("id", attemptId);
      }
      loadAttempts();
    }
  };

  const sync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("email-api-sync");
      if (error || data?.error) toast.error("Synchronisatie mislukt", { description: data?.error || error?.message });
      else { toast.success(`${data?.synced || 0} berichten gesynchroniseerd`); load(); }
    } finally { setSyncing(false); }
  };

  const copyRedirect = async () => {
    try { await navigator.clipboard.writeText(redirectUri); toast.success("Gekopieerd"); }
    catch { toast.error("Kopiëren mislukt"); }
  };

  if (loading) return null;

  const statusBadge = (a: any) => {
    if (a.status === "success") return <Badge className="bg-green-100 text-green-800 border-green-200 gap-1"><CheckCircle2 className="h-3 w-3"/>Gelukt</Badge>;
    if (a.status === "error") return <Badge className="bg-red-100 text-red-800 border-red-200 gap-1"><XCircle className="h-3 w-3"/>Mislukt</Badge>;
    if (a.status === "started") return <Badge className="bg-amber-100 text-amber-800 border-amber-200 gap-1"><Clock className="h-3 w-3"/>Niet voltooid</Badge>;
    return <Badge variant="outline">{a.status}</Badge>;
  };

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" /> Mijn e-mailkoppeling
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {heeftAccount ? (
          <>
            <EmailAccountsLijst userId={userId} />
            <p className="text-xs text-muted-foreground">
              Meerdere adressen? Het <strong>primaire</strong> adres wordt standaard gebruikt bij verzenden. Je kunt per e-mail nog kiezen vanaf welk adres je verstuurt.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={sync} disabled={syncing} className="gap-2 rounded-pill">
                <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Synchroniseren..." : "Nu synchroniseren"}
              </Button>
            </div>
            <div className="border-t pt-4">
              <p className="text-xs font-medium text-foreground mb-2">Nog een e-mailadres koppelen?</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button onClick={() => startOAuth("google")} className="flex items-center gap-3 p-3 border rounded-xl hover:bg-muted/50 transition-colors text-left">
                  <div className="h-9 w-9 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-foreground">Gmail toevoegen</p>
                    <p className="text-xs text-muted-foreground">Werk- of privé-account</p>
                  </div>
                </button>
                <button onClick={() => startOAuth("microsoft")} className="flex items-center gap-3 p-3 border rounded-xl hover:bg-muted/50 transition-colors text-left">
                  <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-foreground">Outlook toevoegen</p>
                    <p className="text-xs text-muted-foreground">Microsoft 365 of Outlook.com</p>
                  </div>
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-muted/40 rounded-xl p-3 text-sm text-muted-foreground">
              Koppel je eigen Gmail of Outlook zodat klanten e-mails van jouw adres ontvangen.
            </div>
            <div className="rounded-xl p-3 border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <p className="font-medium">Gebruik je persoonlijke Workspace-account.</p>
                <p>Gedeelde aliassen of distributielijsten (zoals <code className="font-mono">info@</code> of <code className="font-mono">support@</code>) kun je niet rechtstreeks via OAuth koppelen — Google staat geen login op een alias toe. Koppel je eigen account en voeg het alias hieronder toe als &quot;Verzenden als&quot;.</p>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="alias-email" className="text-xs font-medium">Verzenden als-adres (optioneel, alleen Gmail)</Label>
              <Input
                id="alias-email"
                type="email"
                placeholder="bv. info@jouwbedrijf.nl"
                value={aliasEmail}
                onChange={(e) => setAliasEmail(e.target.value)}
                className="rounded-xl"
              />
              <p className="text-[11px] text-muted-foreground">Google stuurt een verificatiemail naar dit adres. Je moet die link openen om Verzenden-als te activeren.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button onClick={() => startOAuth("google")} className="flex items-center gap-3 p-4 border rounded-xl hover:bg-muted/50 transition-colors text-left">
                <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Gmail koppelen</p>
                  <p className="text-xs text-muted-foreground">Google Workspace of @gmail.com</p>
                </div>
              </button>
              <button onClick={() => startOAuth("microsoft")} className="flex items-center gap-3 p-4 border rounded-xl hover:bg-muted/50 transition-colors text-left">
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Outlook koppelen</p>
                  <p className="text-xs text-muted-foreground">Microsoft 365 of Outlook.com</p>
                </div>
              </button>
            </div>
            <div className="border rounded-xl p-3 bg-muted/30 flex items-start gap-2">
              <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0 text-xs">
                <p className="font-medium text-foreground">Krijg je een redirect-URI fout?</p>
                <p className="text-muted-foreground mt-0.5">Vraag de beheerder om deze URI te registreren:</p>
                <div className="flex items-center gap-2 mt-2">
                  <code className="flex-1 bg-background border rounded px-2 py-1 break-all font-mono">{redirectUri}</code>
                  <Button type="button" size="sm" variant="outline" onClick={copyRedirect} className="gap-1 shrink-0">
                    <Copy className="h-3 w-3" /> Kopieer
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

        {attempts.length > 0 && (
          <div className="border rounded-xl p-3 bg-background">
            <p className="text-xs font-medium text-foreground mb-2">Recente koppelpogingen</p>
            <ul className="space-y-2">
              {attempts.map((a) => (
                <li key={a.id} className="text-xs flex flex-col gap-1 pb-2 border-b last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {statusBadge(a)}
                    <span className="text-muted-foreground">{a.provider === "google" ? "Gmail" : "Outlook"}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">{new Date(a.created_at).toLocaleString("nl-NL")}</span>
                  </div>
                  {a.email_adres_resultaat && <div className="text-foreground">{a.email_adres_resultaat}</div>}
                  {a.alias_request && (
                    <div className="text-muted-foreground">
                      Verzenden-als: <span className="font-mono">{a.alias_request}</span>
                      {a.alias_status && <> · status: <span className="font-medium">{a.alias_status}</span></>}
                      {a.alias_error && <div className="text-red-600">{a.alias_error}</div>}
                    </div>
                  )}
                  {a.error_message && (
                    <div className="text-red-600">
                      {a.error_code && <span className="font-mono mr-1">[{a.error_code}]</span>}
                      {a.error_message}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmailKoppelingWizard;