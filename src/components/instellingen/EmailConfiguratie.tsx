import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Mail, Send, HelpCircle, Server } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Props {
  partnerId: string;
}

const EmailConfiguratie = ({ partnerId }: Props) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

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
    supabase
      .from("partners")
      .select("afzender_naam, afzender_email, smtp_host, smtp_port, smtp_user, smtp_pass_encrypted, imap_host, imap_port, imap_user, imap_pass_encrypted, imap_use_ssl")
      .eq("id", partnerId)
      .single()
      .then(({ data }) => {
        if (data) {
          setAfzenderNaam((data as any).afzender_naam || "");
          setAfzenderEmail((data as any).afzender_email || "");
          setSmtpHost((data as any).smtp_host || "");
          setSmtpPort(String((data as any).smtp_port || 587));
          setSmtpUser((data as any).smtp_user || "");
          if ((data as any).smtp_pass_encrypted) setSmtpPass("••••••••");
          setImapHost((data as any).imap_host || "");
          setImapPort(String((data as any).imap_port || 993));
          setImapUser((data as any).imap_user || "");
          if ((data as any).imap_pass_encrypted) setImapPass("••••••••");
          setImapUseSsl((data as any).imap_use_ssl !== false);
        }
        setLoading(false);
      });
  }, [partnerId]);

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
    if (smtpPass && smtpPass !== "••••••••") {
      update.smtp_pass_encrypted = smtpPass;
    }
    if (imapPass && imapPass !== "••••••••") {
      update.imap_pass_encrypted = imapPass;
    }
    const { error } = await supabase.from("partners").update(update).eq("id", partnerId);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("E-mailinstellingen opgeslagen");
  };

  const handleTest = async () => {
    if (!smtpHost || !afzenderEmail) {
      toast.error("Vul eerst de SMTP-instellingen in");
      return;
    }
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-offerte-email", {
        body: { action: "test", partner_id: partnerId },
      });
      if (error || data?.error) {
        toast.error("Test mislukt", { description: data?.error || error?.message });
      } else {
        toast.success("Test e-mail verzonden", { description: `Verstuurd naar ${afzenderEmail}` });
      }
    } catch {
      toast.error("Test mislukt");
    }
    setTesting(false);
  };

  const copySmtpToImap = () => {
    const smtpToImap: Record<string, string> = {
      "smtp.gmail.com": "imap.gmail.com",
      "smtp.office365.com": "outlook.office365.com",
      "smtp.mail.yahoo.com": "imap.mail.yahoo.com",
    };
    setImapHost(smtpToImap[smtpHost] || smtpHost.replace("smtp.", "imap."));
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
            Stel SMTP en IMAP in voor het verzenden en ontvangen van e-mails
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="smtp" className="space-y-5">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="smtp" className="gap-2"><Send className="h-3.5 w-3.5" />Verzenden (SMTP)</TabsTrigger>
            <TabsTrigger value="imap" className="gap-2"><Server className="h-3.5 w-3.5" />Ontvangen (IMAP)</TabsTrigger>
          </TabsList>

          {/* ─── SMTP Tab ─── */}
          <TabsContent value="smtp" className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Afzendernaam</Label>
                <Input value={afzenderNaam} onChange={(e) => setAfzenderNaam(e.target.value)} placeholder="bijv. Bedrijf X Offertes" className="mt-1" />
              </div>
              <div>
                <Label>Afzender e-mail</Label>
                <Input type="email" value={afzenderEmail} onChange={(e) => setAfzenderEmail(e.target.value)} placeholder="bijv. info@uwbedrijf.nl" className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>SMTP-server</Label>
                <Input value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} placeholder="bijv. smtp.gmail.com" className="mt-1" />
              </div>
              <div>
                <Label>Poort</Label>
                <Input value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} placeholder="587" className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Gebruikersnaam</Label>
                <Input value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} placeholder="vaak uw e-mailadres" className="mt-1" />
              </div>
              <div>
                <Label>Wachtwoord</Label>
                <Input type="password" value={smtpPass} onChange={(e) => setSmtpPass(e.target.value)} placeholder="App-wachtwoord" className="mt-1"
                  onFocus={() => { if (smtpPass === "••••••••") setSmtpPass(""); }} />
              </div>
            </div>

            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                  <HelpCircle className="h-4 w-4" />Hulp bij instellen
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 space-y-3 text-sm text-muted-foreground border rounded-xl p-4">
                <div>
                  <p className="font-medium text-foreground">Gmail</p>
                  <p>Server: <code className="bg-muted px-1 rounded">smtp.gmail.com</code> · Poort: <code className="bg-muted px-1 rounded">587</code></p>
                  <p>Gebruik een <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener" className="text-primary underline">app-wachtwoord</a></p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Outlook / Microsoft 365</p>
                  <p>Server: <code className="bg-muted px-1 rounded">smtp.office365.com</code> · Poort: <code className="bg-muted px-1 rounded">587</code></p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Andere provider</p>
                  <p>Vraag uw e-mailprovider om de SMTP-instellingen. Gebruik altijd poort 587 met TLS.</p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </TabsContent>

          {/* ─── IMAP Tab ─── */}
          <TabsContent value="imap" className="space-y-5">
            <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground space-y-2">
              <p className="font-medium text-foreground">Waarom IMAP?</p>
              <p>Met IMAP worden verzonden offertemails automatisch opgeslagen in uw eigen Verzonden-map, zodat u deze ook in Outlook, Gmail of andere e-mailclients terugvindt. Daarnaast kunt u uw inbox bekijken vanuit het platform.</p>
            </div>

            {smtpHost && (
              <Button variant="outline" size="sm" onClick={copySmtpToImap} className="gap-2">
                <Server className="h-3.5 w-3.5" />IMAP afleiden van SMTP-instellingen
              </Button>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>IMAP-server</Label>
                <Input value={imapHost} onChange={(e) => setImapHost(e.target.value)} placeholder="bijv. imap.gmail.com" className="mt-1" />
              </div>
              <div>
                <Label>Poort</Label>
                <Input value={imapPort} onChange={(e) => setImapPort(e.target.value)} placeholder="993" className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Gebruikersnaam</Label>
                <Input value={imapUser} onChange={(e) => setImapUser(e.target.value)} placeholder="vaak uw e-mailadres" className="mt-1" />
              </div>
              <div>
                <Label>Wachtwoord</Label>
                <Input type="password" value={imapPass} onChange={(e) => setImapPass(e.target.value)} placeholder="App-wachtwoord" className="mt-1"
                  onFocus={() => { if (imapPass === "••••••••") setImapPass(""); }} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={imapUseSsl} onCheckedChange={setImapUseSsl} />
              <Label>SSL/TLS gebruiken (aanbevolen)</Label>
            </div>

            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                  <HelpCircle className="h-4 w-4" />IMAP-instellingen per provider
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 space-y-3 text-sm text-muted-foreground border rounded-xl p-4">
                <div>
                  <p className="font-medium text-foreground">Gmail</p>
                  <p>Server: <code className="bg-muted px-1 rounded">imap.gmail.com</code> · Poort: <code className="bg-muted px-1 rounded">993</code> · SSL: Ja</p>
                  <p>Schakel IMAP in via Gmail → Instellingen → Doorsturen en POP/IMAP</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Outlook / Microsoft 365</p>
                  <p>Server: <code className="bg-muted px-1 rounded">outlook.office365.com</code> · Poort: <code className="bg-muted px-1 rounded">993</code> · SSL: Ja</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Andere provider</p>
                  <p>Vraag uw e-mailprovider om IMAP-servergegevens. Standaard poort is 993 met SSL.</p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 mt-6 pt-4 border-t">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Opslaan..." : "Alle instellingen opslaan"}
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
