import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import EmailKoppelingWizard from "@/components/gebruikers/EmailKoppelingWizard";
import HandtekeningEditor from "@/components/gebruikers/HandtekeningEditor";
import OnboardingChecklist from "@/components/gebruikers/OnboardingChecklist";
import { User as UserIcon, Save } from "lucide-react";

const Profiel = () => {
  const { profile, user } = useAuth();
  const [voornaam, setVoornaam] = useState("");
  const [achternaam, setAchternaam] = useState("");
  const [telefoon, setTelefoon] = useState("");
  const [functie, setFunctie] = useState("");
  const [opmerking, setOpmerking] = useState("");
  const [hasEmail, setHasEmail] = useState(false);
  const [extra, setExtra] = useState<any>(null);

  useEffect(() => {
    if (!profile) return;
    setVoornaam(profile.voornaam || "");
    setAchternaam(profile.achternaam || "");
    setTelefoon(profile.telefoon || "");
    (async () => {
      const { data } = await supabase
        .from("users").select("functie, opmerking, avatar_url, mfa_enabled, handtekening_html").eq("id", profile.id).maybeSingle();
      if (data) {
        setFunctie((data as any).functie || "");
        setOpmerking((data as any).opmerking || "");
        setExtra(data);
      }
      const { data: acc } = await supabase.from("email_accounts").select("id").eq("user_id", profile.id).eq("actief", true).maybeSingle();
      setHasEmail(!!acc);
    })();
  }, [profile]);

  if (!profile || !user) return null;

  const save = async () => {
    const { error } = await supabase.from("users").update({
      voornaam, achternaam, telefoon: telefoon || null, functie: functie || null, opmerking: opmerking || null,
    }).eq("id", profile.id);
    if (error) toast.error("Opslaan mislukt", { description: error.message });
    else toast.success("Profiel opgeslagen");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Mijn profiel</h1>
        <p className="text-muted-foreground mt-1">Beheer je persoonlijke gegevens, e-mailkoppeling en handtekening</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><UserIcon className="h-4 w-4 text-primary" /> Persoonlijke gegevens</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Voornaam</Label><Input value={voornaam} onChange={e => setVoornaam(e.target.value)} className="rounded-xl mt-1" /></div>
                <div><Label>Achternaam</Label><Input value={achternaam} onChange={e => setAchternaam(e.target.value)} className="rounded-xl mt-1" /></div>
              </div>
              <div><Label>E-mailadres</Label><Input value={profile.email} disabled className="rounded-xl mt-1 bg-muted/30" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Telefoon</Label><Input value={telefoon} onChange={e => setTelefoon(e.target.value)} className="rounded-xl mt-1" /></div>
                <div><Label>Functie</Label><Input value={functie} onChange={e => setFunctie(e.target.value)} placeholder="bv. Senior adviseur" className="rounded-xl mt-1" /></div>
              </div>
              <div><Label>Opmerking (intern)</Label><Input value={opmerking} onChange={e => setOpmerking(e.target.value)} className="rounded-xl mt-1" /></div>
              <Button onClick={save} className="rounded-pill gap-2"><Save className="h-4 w-4" /> Opslaan</Button>
            </CardContent>
          </Card>

          <EmailKoppelingWizard userId={profile.id} partnerId={profile.partner_id || ""} />

          <HandtekeningEditor
            userId={profile.id}
            initialHtml={extra?.handtekening_html}
            voornaam={voornaam} achternaam={achternaam} functie={functie}
            telefoon={telefoon} email={profile.email}
          />
        </div>

        <div className="space-y-6">
          <OnboardingChecklist
            user={{ id: profile.id, avatar_url: extra?.avatar_url, telefoon, mfa_enabled: extra?.mfa_enabled, handtekening_html: extra?.handtekening_html }}
            hasEmailAccount={hasEmail}
          />
        </div>
      </div>
    </div>
  );
};

export default Profiel;