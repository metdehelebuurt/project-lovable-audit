import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle2, Mail, RefreshCw, Unlink } from "lucide-react";

interface OAuthConfig {
  google: { clientId: string; configured: boolean };
  microsoft: { clientId: string; configured: boolean };
}

interface EmailAccount {
  id: string;
  email_adres: string;
  provider: string;
  last_sync_at: string | null;
}

/**
 * Lichtgewicht persoonlijke e-mailkoppeling voor uitvoerende rollen.
 * Toont alleen Gmail/Outlook OAuth — geen organisatie-SMTP/IMAP, geen
 * default-voor-partner toggle.
 */
const MijnEmailKoppeling = () => {
  const { user, profile } = useAuth();
  const [account, setAccount] = useState<EmailAccount | null>(null);
  const [oauthConfig, setOauthConfig] = useState<OAuthConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const redirectUri = `${supabaseUrl}/functions/v1/email-oauth-callback`;

  useEffect(() => {
    if (!user?.id) return;
    void load();
    void loadConfig();
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === "email-oauth-result") {
        if (e.data.error) toast.error(e.data.message);
        else { toast.success("E-mailaccount gekoppeld"); void load(); }
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [user?.id]);

  const load = async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from("email_accounts")
      .select("id, email_adres, provider, last_sync_at")
      .eq("user_id", user.id)
      .eq("actief", true)
      .maybeSingle();
    setAccount((data as EmailAccount | null) ?? null);
    setLoading(false);
  };

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("email-oauth-config");
      if (!error) setOauthConfig(data as OAuthConfig);
    } catch (err) {
      console.error("OAuth config laden mislukt", err);
    }
  };

  const startOAuth = (provider: "google" | "microsoft") => {
    if (!user || !profile?.partner_id) {
      toast.error("Je moet ingelogd zijn");
      return;
    }
    const cfg = oauthConfig?.[provider];
    if (!cfg?.configured || !cfg.clientId) {
      toast.error(provider === "google" ? "Gmail-koppeling niet beschikbaar" : "Outlook-koppeling niet beschikbaar");
      return;
    }
    const state = btoa(JSON.stringify({
      partner_id: profile.partner_id,
      user_id: user.id,
      provider,
      redirect_url: window.location.href,
      personal: true,
    }));
    const scopes = provider === "google"
      ? "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/userinfo.email"
      : "https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send offline_access";
    const url = provider === "google"
      ? `https://accounts.google.com/o/oauth2/v2/auth?client_id=${cfg.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&access_type=offline&prompt=consent&state=${state}`
      : `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${cfg.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&state=${state}`;
    window.open(url, "email-oauth", "width=600,height=700");
  };

  const disconnect = async () => {
    if (!account) return;
    const { error } = await supabase.from("email_accounts").update({ actief: false }).eq("id", account.id);
    if (error) { toast.error(error.message); return; }
    setAccount(null);
    toast.success("E-mailaccount ontkoppeld");
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("email-api-sync", {});
      if (error || (data as { error?: string })?.error) {
        toast.error("Synchronisatie mislukt");
      } else {
        toast.success(`${(data as { synced?: number })?.synced ?? 0} berichten gesynchroniseerd`);
        void load();
      }
    } catch {
      toast.error("Synchronisatie mislukt");
    }
    setSyncing(false);
  };

  if (loading) return null;

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Mail className="h-5 w-5 text-primary" />
        </div>
        <div>
          <CardTitle className="text-lg">Mijn e-mailkoppeling</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Koppel je persoonlijke Gmail of Outlook aan dit account
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {account ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl border">
              <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{account.email_adres}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {account.provider === "google" ? "Gmail" : "Outlook"}
                  </Badge>
                  {account.last_sync_at && (
                    <span className="text-xs text-muted-foreground">
                      Gesynchroniseerd: {new Date(account.last_sync_at).toLocaleString("nl-NL")}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing} className="gap-2">
                <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Synchroniseren..." : "Nu synchroniseren"}
              </Button>
              <Button variant="outline" size="sm" onClick={disconnect} className="gap-2 text-destructive hover:text-destructive">
                <Unlink className="h-3.5 w-3.5" />
                Ontkoppelen
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Koppel je e-mailaccount</p>
              <p className="mt-1">
                Koppel je persoonlijke Gmail of Outlook zodat het platform namens jou e-mails kan
                versturen en ontvangen. Berichten worden automatisch aan leads en klanten gekoppeld.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => startOAuth("google")}
                className="flex items-center gap-3 p-4 border rounded-xl hover:bg-muted/50 transition-colors text-left"
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Gmail koppelen</p>
                  <p className="text-xs text-muted-foreground">Google Workspace of Gmail</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => startOAuth("microsoft")}
                className="flex items-center gap-3 p-4 border rounded-xl hover:bg-muted/50 transition-colors text-left"
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Outlook koppelen</p>
                  <p className="text-xs text-muted-foreground">Microsoft 365 of Outlook.com</p>
                </div>
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MijnEmailKoppeling;