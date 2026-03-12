import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import SchouwInstellingen from "@/components/instellingen/SchouwInstellingen";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, Lock, Shield, Download, Trash2, Sparkles, Palette } from "lucide-react";
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

  // Branding state
  const isPartnerAdmin = profile?.rol === "partner_admin";
  const [brandLoading, setBrandLoading] = useState(false);
  const [brandSaving, setBrandSaving] = useState(false);
  const [primaireKleur, setPrimaireKleur] = useState("#5B58E1");
  const [secundaireKleur, setSecundaireKleur] = useState("#1a1a2e");
  const [bedrijfsslogan, setBedrijfsslogan] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [partnerNaam, setPartnerNaam] = useState("");
  const [uploading, setUploading] = useState(false);

  // Fetch partner branding
  useEffect(() => {
    if (!isPartnerAdmin || !profile?.partner_id) return;
    setBrandLoading(true);
    supabase
      .from("partners")
      .select("naam, logo_url, primaire_kleur, secundaire_kleur, bedrijfsslogan")
      .eq("id", profile.partner_id)
      .single()
      .then(({ data }) => {
        if (data) {
          setPartnerNaam(data.naam);
          setPrimaireKleur(data.primaire_kleur || "#5B58E1");
          setSecundaireKleur(data.secundaire_kleur || "#1a1a2e");
          setBedrijfsslogan(data.bedrijfsslogan || "");
          setLogoUrl(data.logo_url);
        }
        setBrandLoading(false);
      });
  }, [isPartnerAdmin, profile?.partner_id]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.partner_id) return;
    if (!file.type.startsWith("image/")) { toast.error("Selecteer een afbeelding"); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("Maximaal 2MB"); return; }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${profile.partner_id}/logo.${ext}`;

    const { error } = await supabase.storage.from("partner-assets").upload(path, file, { upsert: true });
    if (error) { toast.error("Upload mislukt: " + error.message); setUploading(false); return; }

    const { data: { publicUrl } } = supabase.storage.from("partner-assets").getPublicUrl(path);
    
    const { error: updateError } = await supabase.from("partners").update({ logo_url: publicUrl }).eq("id", profile.partner_id);
    if (updateError) { toast.error(updateError.message); } else {
      setLogoUrl(publicUrl);
      toast.success("Logo geüpload");
    }
    setUploading(false);
  };

  const handleBrandingSave = async () => {
    if (!profile?.partner_id) return;
    setBrandSaving(true);
    const { error } = await supabase.from("partners").update({
      primaire_kleur: primaireKleur,
      secundaire_kleur: secundaireKleur,
      bedrijfsslogan: bedrijfsslogan.trim() || null,
    }).eq("id", profile.partner_id);
    setBrandSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Huisstijl opgeslagen");
  };

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

      {/* Huisstijl / Branding — alleen partner_admin */}
      {isPartnerAdmin && (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Palette className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg">Huisstijl organisatie</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {brandLoading ? (
              <p className="text-sm text-muted-foreground">Laden...</p>
            ) : (
              <>
                {/* Logo */}
                <div>
                  <Label>Logo</Label>
                  <div className="flex items-center gap-4 mt-1">
                    {logoUrl && (
                      <img src={logoUrl} alt="Logo" className="h-12 w-auto object-contain rounded-lg border p-1" />
                    )}
                    <div>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={uploading}
                        className="text-sm"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Max 2MB, wordt getoond op offertes</p>
                    </div>
                  </div>
                </div>

                {/* Kleuren */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Primaire kleur</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={primaireKleur}
                        onChange={e => setPrimaireKleur(e.target.value)}
                        className="h-10 w-10 rounded-lg border cursor-pointer"
                      />
                      <Input
                        value={primaireKleur}
                        onChange={e => setPrimaireKleur(e.target.value)}
                        className="font-mono text-sm"
                        maxLength={7}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Secundaire kleur</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={secundaireKleur}
                        onChange={e => setSecundaireKleur(e.target.value)}
                        className="h-10 w-10 rounded-lg border cursor-pointer"
                      />
                      <Input
                        value={secundaireKleur}
                        onChange={e => setSecundaireKleur(e.target.value)}
                        className="font-mono text-sm"
                        maxLength={7}
                      />
                    </div>
                  </div>
                </div>

                {/* Slogan */}
                <div>
                  <Label>Bedrijfsslogan</Label>
                  <Input
                    value={bedrijfsslogan}
                    onChange={e => setBedrijfsslogan(e.target.value)}
                    placeholder="bijv. Duurzame energie, dichtbij huis"
                    className="mt-1"
                  />
                </div>

                {/* Live preview */}
                <div>
                  <Label className="text-muted-foreground text-xs">Preview offerte-header</Label>
                  <div className="mt-2 rounded-xl border p-4" style={{ borderBottom: `3px solid ${primaireKleur}` }}>
                    <div className="flex justify-between items-start">
                      <div>
                        {logoUrl && <img src={logoUrl} alt="Logo" className="h-8 mb-1 object-contain" />}
                        <p className="font-bold" style={{ color: secundaireKleur }}>{partnerNaam}</p>
                        {bedrijfsslogan && <p className="text-xs" style={{ color: primaireKleur }}>{bedrijfsslogan}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold" style={{ color: secundaireKleur }}>OFFERTE</p>
                        <p className="text-xs text-muted-foreground">OF-250312-0001</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Button onClick={handleBrandingSave} disabled={brandSaving}>
                  {brandSaving ? "Opslaan..." : "Huisstijl opslaan"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

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
