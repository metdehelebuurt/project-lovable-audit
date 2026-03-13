import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Send, HelpCircle } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Props {
  partnerId: string;
}

const EmailConfiguratie = ({ partnerId }: Props) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [afzenderNaam, setAfzenderNaam] = useState("");
  const [afzenderEmail, setAfzenderEmail] = useState("");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");

  useEffect(() => {
    supabase
      .from("partners")
      .select("afzender_naam, afzender_email, smtp_host, smtp_port, smtp_user, smtp_pass_encrypted")
      .eq("id", partnerId)
      .single()
      .then(({ data }) => {
        if (data) {
          setAfzenderNaam(data.afzender_naam || "");
          setAfzenderEmail(data.afzender_email || "");
          setSmtpHost(data.smtp_host || "");
          setSmtpPort(String(data.smtp_port || 587));
          setSmtpUser(data.smtp_user || "");
          // password is encrypted, show placeholder if set
          if (data.smtp_pass_encrypted) setSmtpPass("••••••••");
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
    };
    // Only update password if changed from placeholder
    if (smtpPass && smtpPass !== "••••••••") {
      update.smtp_pass_encrypted = smtpPass;
    }
    const { error } = await supabase.from("partners").update(update).eq("id", partnerId);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
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
            Stel in vanuit welk e-mailadres offertes worden verstuurd
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Afzendernaam</Label>
            <Input
              value={afzenderNaam}
              onChange={(e) => setAfzenderNaam(e.target.value)}
              placeholder="bijv. Bedrijf X Offertes"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Afzender e-mail</Label>
            <Input
              type="email"
              value={afzenderEmail}
              onChange={(e) => setAfzenderEmail(e.target.value)}
              placeholder="bijv. info@uwbedrijf.nl"
              className="mt-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>SMTP-server</Label>
            <Input
              value={smtpHost}
              onChange={(e) => setSmtpHost(e.target.value)}
              placeholder="bijv. smtp.gmail.com"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Poort</Label>
            <Input
              value={smtpPort}
              onChange={(e) => setSmtpPort(e.target.value)}
              placeholder="587"
              className="mt-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Gebruikersnaam</Label>
            <Input
              value={smtpUser}
              onChange={(e) => setSmtpUser(e.target.value)}
              placeholder="vaak uw e-mailadres"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Wachtwoord</Label>
            <Input
              type="password"
              value={smtpPass}
              onChange={(e) => setSmtpPass(e.target.value)}
              placeholder="App-wachtwoord"
              className="mt-1"
              onFocus={() => { if (smtpPass === "••••••••") setSmtpPass(""); }}
            />
          </div>
        </div>

        {/* Help section */}
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
              <HelpCircle className="h-4 w-4" />
              Hulp bij instellen
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-3 text-sm text-muted-foreground border rounded-xl p-4">
            <div>
              <p className="font-medium text-foreground">Gmail</p>
              <p>Server: <code className="bg-muted px-1 rounded">smtp.gmail.com</code> · Poort: <code className="bg-muted px-1 rounded">587</code></p>
              <p>Gebruik een <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener" className="text-primary underline">app-wachtwoord</a> (niet uw gewone wachtwoord)</p>
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

        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Opslaan..." : "E-mailinstellingen opslaan"}
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
