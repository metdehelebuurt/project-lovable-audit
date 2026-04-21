import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, CheckCircle2, RefreshCw, Unlink, Copy, Info } from "lucide-react";
import { toast } from "sonner";

interface EmailKoppelingWizardProps {
  userId: string;
  partnerId: string;
}

export const EmailKoppelingWizard = ({ userId, partnerId }: EmailKoppelingWizardProps) => {
  const [account, setAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [oauthConfig, setOauthConfig] = useState<{
    google: { clientId: string; configured: boolean };
    microsoft: { clientId: string; configured: boolean };
  } | null>(null);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const redirectUri = `${supabaseUrl}/functions/v1/email-oauth-callback`;

  const load = async () => {
    const { data } = await supabase
      .from("email_accounts")
      .select("*")
      .eq("user_id", userId)
      .eq("actief", true)
      .maybeSingle();
    setAccount(data);
    setLoading(false);
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
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "email-oauth-result") {
        if (e.data.error) toast.error(e.data.message);
        else { toast.success("E-mail gekoppeld!"); load(); }
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [userId]);

  const startOAuth = (provider: "google" | "microsoft") => {
    const cfg = oauthConfig?.[provider];
    if (!cfg?.configured || !cfg.clientId) {
      toast.error(`${provider === "google" ? "Gmail" : "Outlook"}-koppeling nog niet geactiveerd op platform`);
      return;
    }
    const state = btoa(JSON.stringify({ partner_id: partnerId, user_id: userId, provider, redirect_url: window.location.href }));
    const scopes = provider === "google"
      ? "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/userinfo.email"
      : "https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send offline_access";
    const url = provider === "google"
      ? `https://accounts.google.com/o/oauth2/v2/auth?client_id=${cfg.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&access_type=offline&prompt=consent&state=${state}`
      : `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${cfg.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&state=${state}`;
    window.open(url, "email-oauth", "width=600,height=720");
  };

  const disconnect = async () => {
    if (!account) return;
    await supabase.from("email_accounts").update({ actief: false }).eq("id", account.id);
    toast.success("E-mailaccount ontkoppeld");
    setAccount(null);
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

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" /> Mijn e-mailkoppeling
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {account ? (
          <>
            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{account.email_adres}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {account.provider === "google" ? "Gmail" : "Outlook"}
                  </Badge>
                  {account.last_sync_at && (
                    <span className="text-xs text-muted-foreground">
                      Laatst gesync: {new Date(account.last_sync_at).toLocaleString("nl-NL")}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Vanaf nu worden offertes, facturen en helpdesk-berichten direct vanuit jouw e-mailadres verzonden.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={sync} disabled={syncing} className="gap-2 rounded-pill">
                <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Synchroniseren..." : "Nu synchroniseren"}
              </Button>
              <Button variant="outline" size="sm" onClick={disconnect} className="gap-2 rounded-pill text-destructive hover:text-destructive">
                <Unlink className="h-3.5 w-3.5" /> Ontkoppelen
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="bg-muted/40 rounded-xl p-3 text-sm text-muted-foreground">
              Koppel je eigen Gmail of Outlook zodat klanten e-mails van jouw adres ontvangen.
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
      </CardContent>
    </Card>
  );
};

export default EmailKoppelingWizard;