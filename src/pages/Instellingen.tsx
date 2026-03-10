import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { User, Lock, Building2 } from "lucide-react";

const rolLabels: Record<string, string> = {
  superadmin: "Platformbeheerder",
  partner_admin: "Organisatiebeheerder",
  partner_staff: "Medewerker",
  adviseur: "Energieadviseur",
  installateur: "Installateur",
  consument: "Consument",
};

const Instellingen = () => {
  const { profile, user } = useAuth();
  const [voornaam, setVoornaam] = useState(profile?.voornaam ?? "");
  const [achternaam, setAchternaam] = useState(profile?.achternaam ?? "");
  const [telefoon, setTelefoon] = useState(profile?.telefoon ?? "");
  const [saving, setSaving] = useState(false);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  const handleProfileSave = async () => {
    if (!voornaam.trim() || !achternaam.trim()) {
      toast.error("Voornaam en achternaam zijn verplicht");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("users").update({
      voornaam: voornaam.trim(),
      achternaam: achternaam.trim(),
      telefoon: telefoon.trim() || null,
    }).eq("id", user!.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profiel bijgewerkt");
  };

  const handlePasswordChange = async () => {
    if (newPw.length < 8) {
      toast.error("Wachtwoord moet minimaal 8 tekens zijn");
      return;
    }
    if (newPw !== confirmPw) {
      toast.error("Wachtwoorden komen niet overeen");
      return;
    }
    setChangingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setChangingPw(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Wachtwoord gewijzigd");
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Instellingen</h1>
        <p className="text-muted-foreground mt-1">Beheer uw profiel en voorkeuren</p>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-lg">Profiel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Voornaam</Label>
              <Input value={voornaam} onChange={(e) => setVoornaam(e.target.value)} />
            </div>
            <div>
              <Label>Achternaam</Label>
              <Input value={achternaam} onChange={(e) => setAchternaam(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>E-mail</Label>
            <Input value={profile?.email ?? ""} disabled className="bg-muted" />
          </div>
          <div>
            <Label>Telefoon</Label>
            <Input value={telefoon} onChange={(e) => setTelefoon(e.target.value)} />
          </div>
          <div>
            <Label>Rol</Label>
            <Input value={rolLabels[profile?.rol ?? ""] ?? profile?.rol ?? ""} disabled className="bg-muted" />
          </div>
          <Button onClick={handleProfileSave} disabled={saving}>
            {saving ? "Opslaan..." : "Profiel opslaan"}
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-lg">Wachtwoord wijzigen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Nieuw wachtwoord</Label>
            <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
          </div>
          <div>
            <Label>Bevestig wachtwoord</Label>
            <Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
          </div>
          <Button onClick={handlePasswordChange} disabled={changingPw}>
            {changingPw ? "Wijzigen..." : "Wachtwoord wijzigen"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Instellingen;
