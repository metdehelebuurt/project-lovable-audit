import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Mail, Send, HelpCircle, Server, CheckCircle2, XCircle, RefreshCw, Unlink } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Info } from "lucide-react";

interface Props {
  partnerId: string;
}

const EmailConfiguratie = ({ partnerId }: Props) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  // OAuth
  const [emailAccount, setEmailAccount] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [oauthConfig, setOauthConfig] = useState<{
    google: { clientId: string; configured: boolean };
    microsoft: { clientId: string; configured: boolean };
  } | null>(null);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const redirectUri = `${supabaseUrl}/functions/v1/email-oauth-callback`;

  const copyRedirectUri = async () => {
    try {
      await navigator.clipboard.writeText(redirectUri);
      toast.success("Redirect-URI gekopieerd");
    } catch {
      toast.error("Kopiëren mislukt");
    }
  };

  // SMTP
  const [afzenderNaam, setAfzenderNaam] = useState("");
  const [afzenderEmail, setAfzenderEmail] = useState("");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");

  // IMAP
  const [imapHost, setImapHost] = useState("");
  const [imapPort, setImapPort] = useState("993");
  const [imapUser, setImapUser] = useState("");
  const [imapPass, setImapPass] = useState("");
  const [imapUseSsl, setImapUseSsl] = useState(true);

  useEffect(() => {
    loadData();
    loadOAuthConfig();
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === "email-oauth-result") {
        if (e.data.error) toast.error(e.data.message);
        else { toast.success("E-mail gekoppeld!"); loadData(); }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [partnerId]);

  const loadOAuthConfig = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("email-oauth-config");
      if (error) {
        console.error("OAuth config laden mislukt:", error);
        return;
      }
      setOauthConfig(data);
    } catch (err) {
      console.error("OAuth config laden mislukt:", err);
    }
  };

  const loadData = async () => {
    const [partnerRes, accountRes] = await Promise.all([
      supabase.from("partners")
        .select("afzender_naam, afzender_email, smtp_host, smtp_port, smtp_user, smtp_pass_encrypted, imap_host, imap_port, imap_user, imap_pass_encrypted, imap_use_ssl, email_provider")
        .eq("id", partnerId).single(),
      supabase.from("email_accounts" as any).select("*").eq("partner_id", partnerId).eq("actief", true).maybeSingle(),
    ]);

    if (partnerRes.data) {
      const d = partnerRes.data as any;
      setAfzenderNaam(d.afzender_naam || "");
      setAfzenderEmail(d.afzender_email || "");
      setSmtpHost(d.smtp_host || "");
      setSmtpPort(String(d.smtp_port || 587));
      setSmtpUser(d.smtp_user || "");
      if (d.smtp_pass_encrypted) setSmtpPass("••••••••");
      setImapHost(d.imap_host || "");
      setImapPort(String(d.imap_port || 993));
      setImapUser(d.imap_user || "");
      if (d.imap_pass_encrypted) setImapPass("••••••••");
      setImapUseSsl(d.imap_use_ssl !== false);
    }

    setEmailAccount(accountRes.data || null);
    setLoading(false);
  };

  const startOAuth = (provider: "google" | "microsoft") => {
    if (!user) {
      toast.error("Je moet ingelogd zijn om een e-mailaccount te koppelen");
      return;
    }
    const providerConfig = oauthConfig?.[provider];
    if (!providerConfig?.configured || !providerConfig.clientId) {
      toast.error(
        provider === "google" ? "Gmail-koppeling is nog niet geactiveerd" : "Outlook-koppeling is nog niet geactiveerd",
        { description: "Configureer eerst de OAuth-credentials in de backend." }
      );
      return;
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const redirectUri = `${supabaseUrl}/functions/v1/email-oauth-callback`;
    const state = btoa(JSON.stringify({
      partner_id: partnerId,
      user_id: user.id,
      provider,
      redirect_url: window.location.href,
    }));

    let authUrl: string;
    if (provider === "google") {
      const clientId = providerConfig.clientId;
      authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent("https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/userinfo.email")}&access_type=offline&prompt=consent&state=${state}`;
    } else {
      const clientId = providerConfig.clientId;
      authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent("https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send offline_access")}&state=${state}`;
    }

    window.open(authUrl, "email-oauth", "width=600,height=700");
  };

  const disconnectOAuth = async () => {
    if (!emailAccount) return;
    await supabase.from("email_accounts" as any).update({ actief: false } as any).eq("id", emailAccount.id);
    await supabase.from("partners").update({ email_provider: null } as any).eq("id", partnerId);
    setEmailAccount(null);
    toast.success("E-mailaccount ontkoppeld");
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("email-api-sync", {});
      if (error || data?.error) {
        toast.error("Synchronisatie mislukt", { description: data?.error || error?.message });
      } else {
        toast.success(`${data?.synced || 0} berichten gesynchroniseerd`);
        loadData();
      }
    } catch { toast.error("Synchronisatie mislukt"); }
    setSyncing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const update: Record<string, unknown> = {
      afzender_naam: afzenderNaam.trim() || null,
      afzender_email: afzenderEmail.trim() || null,
      smtp_host: smtpHost.trim() || null,
      smtp_port: parseInt(smtpPort) || 587,
      smtp_user: smtpUser.trim() || null,
      imap_host: imapHost.trim() || null,
      imap_port: parseInt(imapPort) || 993,
      imap_user: imapUser.trim() || null,
      imap_use_ssl: imapUseSsl,
    };
    if (smtpPass && smtpPass !== "••••••••") update.smtp_pass_encrypted = smtpPass;
    if (imapPass && imapPass !== "••••••••") update.imap_pass_encrypted = imapPass;
    const { error } = await supabase.from("partners").update(update).eq("id", partnerId);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("E-mailinstellingen opgeslagen");
  };

  const handleTest = async () => {
    if (!smtpHost || !afzenderEmail) { toast.error("Vul eerst de SMTP-instellingen in"); return; }
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-offerte-email", {
        body: { action: "test", partner_id: partnerId },
      });
      if (error || data?.error) toast.error("Test mislukt", { description: data?.error || error?.message });
      else toast.success("Test e-mail verzonden", { description: `Verstuurd naar ${afzenderEmail}` });
    } catch { toast.error("Test mislukt"); }
    setTesting(false);
  };

  const copySmtpToImap = () => {
    const map: Record<string, string> = {
      "smtp.gmail.com": "imap.gmail.com",
      "smtp.office365.com": "outlook.office365.com",
      "smtp.mail.yahoo.com": "imap.mail.yahoo.com",
    };
    setImapHost(map[smtpHost] || smtpHost.replace("smtp.", "imap."));
    setImapUser(smtpUser || afzenderEmail);
    if (smtpPass && smtpPass !== "••••••••") setImapPass(smtpPass);
    toast.info("IMAP-velden ingevuld op basis van SMTP");
  };

  if (loading) return null;

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Mail className="h-5 w-5 text-primary" />
        </div>
        <div>
          <CardTitle className="text-lg">E-mail configuratie</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Koppel Gmail of Outlook, of stel handmatig SMTP/IMAP in
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="oauth" className="space-y-5">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="oauth" className="gap-2"><Mail className="h-3.5 w-3.5" />Koppelen</TabsTrigger>
            <TabsTrigger value="smtp" className="gap-2"><Send className="h-3.5 w-3.5" />SMTP</TabsTrigger>
            <TabsTrigger value="imap" className="gap-2"><Server className="h-3.5 w-3.5" />IMAP</TabsTrigger>
          </TabsList>

          {/* ─── OAuth Tab ─── */}
          <TabsContent value="oauth" className="space-y-5">
            {emailAccount ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-200 dark:border-green-800">
                  <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">E-mail gekoppeld</p>
                    <p className="text-sm text-muted-foreground">{emailAccount.email_adres}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {emailAccount.provider === "google" ? "Gmail" : "Outlook"}
                      </Badge>
                      {emailAccount.last_sync_at && (
                        <span className="text-xs text-muted-foreground">
                          Laatst gesynchroniseerd: {new Date(emailAccount.last_sync_at).toLocaleString("nl-NL")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing} className="gap-2">
                    <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
                    {syncing ? "Synchroniseren..." : "Nu synchroniseren"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={disconnectOAuth} className="gap-2 text-destructive hover:text-destructive">
                    <Unlink className="h-3.5 w-3.5" />
                    Ontkoppelen
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground space-y-2">
                  <p className="font-medium text-foreground">Koppel je e-mailaccount</p>
                  <p>Met één klik koppel je je Gmail of Outlook account. Het platform kan dan namens jou e-mails verzenden en ontvangen. SPF, DKIM en DMARC worden automatisch correct afgehandeld.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => startOAuth("google")}
                    className="flex items-center gap-3 p-4 border rounded-xl hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <Mail className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Gmail koppelen</p>
                      <p className="text-xs text-muted-foreground">Google Workspace of Gmail</p>
                    </div>
                  </button>
                  <button
                    onClick={() => startOAuth("microsoft")}
                    className="flex items-center gap-3 p-4 border rounded-xl hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Outlook koppelen</p>
                      <p className="text-xs text-muted-foreground">Microsoft 365 of Outlook.com</p>
                    </div>
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Na het koppelen worden e-mails automatisch gesynchroniseerd en gekoppeld aan leads en klanten.
                </p>
              </div>
            )}
          </TabsContent>

          {/* ─── SMTP Tab ─── */}
          <TabsContent value="smtp" className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Afzendernaam</Label><Input value={afzenderNaam} onChange={(e) => setAfzenderNaam(e.target.value)} placeholder="bijv. Bedrijf X Offertes" className="mt-1" /></div>
              <div><Label>Afzender e-mail</Label><Input type="email" value={afzenderEmail} onChange={(e) => setAfzenderEmail(e.target.value)} placeholder="bijv. info@uwbedrijf.nl" className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>SMTP-server</Label><Input value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} placeholder="bijv. smtp.gmail.com" className="mt-1" /></div>
              <div><Label>Poort</Label><Input value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} placeholder="587" className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Gebruikersnaam</Label><Input value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} placeholder="vaak uw e-mailadres" className="mt-1" /></div>
              <div><Label>Wachtwoord</Label><Input type="password" value={smtpPass} onChange={(e) => setSmtpPass(e.target.value)} placeholder="App-wachtwoord" className="mt-1" onFocus={() => { if (smtpPass === "••••••••") setSmtpPass(""); }} /></div>
            </div>
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground"><HelpCircle className="h-4 w-4" />Hulp bij instellen</Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 space-y-3 text-sm text-muted-foreground border rounded-xl p-4">
                <div><p className="font-medium text-foreground">Gmail</p><p>Server: <code className="bg-muted px-1 rounded">smtp.gmail.com</code> · Poort: <code className="bg-muted px-1 rounded">587</code></p><p>Gebruik een <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener" className="text-primary underline">app-wachtwoord</a></p></div>
                <div><p className="font-medium text-foreground">Outlook / Microsoft 365</p><p>Server: <code className="bg-muted px-1 rounded">smtp.office365.com</code> · Poort: <code className="bg-muted px-1 rounded">587</code></p></div>
              </CollapsibleContent>
            </Collapsible>
          </TabsContent>

          {/* ─── IMAP Tab ─── */}
          <TabsContent value="imap" className="space-y-5">
            <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground space-y-2">
              <p className="font-medium text-foreground">Waarom IMAP?</p>
              <p>Met IMAP worden verzonden offertemails automatisch opgeslagen in uw eigen Verzonden-map.</p>
            </div>
            {smtpHost && (
              <Button variant="outline" size="sm" onClick={copySmtpToImap} className="gap-2">
                <Server className="h-3.5 w-3.5" />IMAP afleiden van SMTP
              </Button>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div><Label>IMAP-server</Label><Input value={imapHost} onChange={(e) => setImapHost(e.target.value)} placeholder="bijv. imap.gmail.com" className="mt-1" /></div>
              <div><Label>Poort</Label><Input value={imapPort} onChange={(e) => setImapPort(e.target.value)} placeholder="993" className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Gebruikersnaam</Label><Input value={imapUser} onChange={(e) => setImapUser(e.target.value)} placeholder="vaak uw e-mailadres" className="mt-1" /></div>
              <div><Label>Wachtwoord</Label><Input type="password" value={imapPass} onChange={(e) => setImapPass(e.target.value)} placeholder="App-wachtwoord" className="mt-1" onFocus={() => { if (imapPass === "••••••••") setImapPass(""); }} /></div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={imapUseSsl} onCheckedChange={setImapUseSsl} />
              <Label>SSL/TLS gebruiken (aanbevolen)</Label>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 mt-6 pt-4 border-t">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Opslaan..." : "SMTP/IMAP opslaan"}
          </Button>
          {smtpHost && afzenderEmail && (
            <Button variant="outline" onClick={handleTest} disabled={testing} className="gap-2">
              <Send className="h-4 w-4" />
              {testing ? "Testen..." : "Test e-mail versturen"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailConfiguratie;
