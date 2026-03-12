import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, Lock, Shield, Download, Trash2, Sparkles } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const rolLabels: Record<string, string> = {
  superadmin: "Platformbeheerder", partner_admin: "Organisatiebeheerder",
  partner_staff: "Medewerker", adviseur: "Energieadviseur",
  installateur: "Installateur", consument: "Consument",
};

const Instellingen = () => {
  const { profile, user, signOut } = useAuth();
  const [voornaam, setVoornaam] = useState(profile?.voornaam ?? "");
  const [achternaam, setAchternaam] = useState(profile?.achternaam ?? "");
  const [telefoon, setTelefoon] = useState(profile?.telefoon ?? "");
  const [saving, setSaving] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [changingPw, setChangingPw] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [clearingDemo, setClearingDemo] = useState(false);

  const handleClearDemoData = async () => {
    setClearingDemo(true);
    try {
      const { data, error } = await supabase.functions.invoke("clear-demo-data");
      if (error || data?.error) {
        toast.error("Fout bij verwijderen demogegevens", { description: data?.error || error?.message });
      } else {
        toast.success("Demogegevens verwijderd", { description: "Alle voorbeelddata is succesvol verwijderd." });
      }
    } catch {
      toast.error("Fout bij verwijderen demogegevens");
    }
    setClearingDemo(false);
  };

  const handleProfileSave = async () => {
    if (!voornaam.trim() || !achternaam.trim()) {
      toast.error("Voornaam en achternaam zijn verplicht");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("users").update({
      voornaam: voornaam.trim(), achternaam: achternaam.trim(), telefoon: telefoon.trim() || null,
    }).eq("id", user!.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profiel bijgewerkt");
  };

  const handlePasswordChange = async () => {
    if (newPw.length < 8) { toast.error("Wachtwoord moet minimaal 8 tekens zijn"); return; }
    if (newPw !== confirmPw) { toast.error("Wachtwoorden komen niet overeen"); return; }
    setChangingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setChangingPw(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Wachtwoord gewijzigd");
    setNewPw(""); setConfirmPw("");
  };

  const handleDataExport = async () => {
    setExporting(true);
    try {
      const [profileData, leadsData, offertesData, schouwenData] = await Promise.all([
        supabase.from("users").select("*").eq("id", user!.id).single(),
        supabase.from("leads").select("*"),
        supabase.from("offertes").select("*"),
        supabase.from("schouwen").select("*"),
      ]);
      const exportData = {
        exported_at: new Date().toISOString(),
        profile: profileData.data,
        leads: leadsData.data,
        offertes: offertesData.data,
        schouwen: schouwenData.data,
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mijnhuis-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Data geëxporteerd");
    } catch {
      toast.error("Fout bij het exporteren van data");
    }
    setExporting(false);
  };

  const handleDeleteAccount = async () => {
    // Delete user profile (cascade will handle related data via RLS)
    const { error } = await supabase.from("users").delete().eq("id", user!.id);
    if (error) { toast.error("Fout bij verwijderen: " + error.message); return; }
    await signOut();
    toast.success("Account verwijderd");
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
            <div><Label>Voornaam</Label><Input value={voornaam} onChange={e => setVoornaam(e.target.value)} /></div>
            <div><Label>Achternaam</Label><Input value={achternaam} onChange={e => setAchternaam(e.target.value)} /></div>
          </div>
          <div><Label>E-mail</Label><Input value={profile?.email ?? ""} disabled className="bg-muted" /></div>
          <div><Label>Telefoon</Label><Input value={telefoon} onChange={e => setTelefoon(e.target.value)} /></div>
          <div><Label>Rol</Label><Input value={rolLabels[profile?.rol ?? ""] ?? profile?.rol ?? ""} disabled className="bg-muted" /></div>
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
          <div><Label>Nieuw wachtwoord</Label><Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} /></div>
          <div><Label>Bevestig wachtwoord</Label><Input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} /></div>
          <Button onClick={handlePasswordChange} disabled={changingPw}>
            {changingPw ? "Wijzigen..." : "Wachtwoord wijzigen"}
          </Button>
        </CardContent>
      </Card>

      {(profile?.rol === "partner_admin" || profile?.rol === "superadmin") && (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-accent-foreground" />
            </div>
            <CardTitle className="text-lg">Demogegevens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Uw account bevat voorbeelddata (gemarkeerd met ⚡ Demo). U kunt deze verwijderen zodra u klaar bent met verkennen.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="gap-2 rounded-pill" disabled={clearingDemo}>
                  <Trash2 className="h-4 w-4" />
                  {clearingDemo ? "Verwijderen..." : "Demogegevens verwijderen"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Demogegevens verwijderen</AlertDialogTitle>
                  <AlertDialogDescription>
                    Alle voorbeelddata (leads, schouwen, offertes, installaties en producten gemarkeerd met ⚡ Demo) wordt permanent verwijderd.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuleren</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearDemoData}>
                    Verwijderen
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-lg">Privacy & Gegevensbeheer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            U kunt al uw gegevens exporteren als JSON-bestand of uw account volledig verwijderen.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleDataExport} disabled={exporting} className="gap-2 rounded-pill">
              <Download className="h-4 w-4" />
              {exporting ? "Exporteren..." : "Data exporteren"}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2 rounded-pill">
                  <Trash2 className="h-4 w-4" /> Account verwijderen
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Account verwijderen</AlertDialogTitle>
                  <AlertDialogDescription>
                    Weet u zeker dat u uw account en alle gekoppelde gegevens wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuleren</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground">
                    Definitief verwijderen
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Instellingen;
