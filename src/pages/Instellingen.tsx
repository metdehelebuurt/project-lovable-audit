import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import SchouwInstellingen from "@/components/instellingen/SchouwInstellingen";
import LeadBronnenConfig from "@/components/instellingen/LeadBronnenConfig";
import BetalingsvoorwaardenConfig from "@/components/instellingen/BetalingsvoorwaardenConfig";
import EmailConfiguratie from "@/components/instellingen/EmailConfiguratie";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  User, Lock, Shield, Download, Trash2, Sparkles, Palette, FileText,
  Building2, Mail, ClipboardList, Eye, ShieldCheck, Globe, Users
} from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

const rolLabels: Record<string, string> = {
  superadmin: "Platformbeheerder", partner_admin: "Organisatiebeheerder",
  partner_staff: "Medewerker", adviseur: "Energieadviseur",
  installateur: "Installateur", consument: "Consument",
};

interface SettingsTab {
  id: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const Instellingen = () => {
  const { profile, user, signOut } = useAuth();
  const isPartnerAdmin = profile?.rol === "partner_admin";
  const isSuperOrPartner = profile?.rol === "partner_admin" || profile?.rol === "superadmin";

  const tabs: SettingsTab[] = [
    { id: "profiel", label: "Profiel", icon: User },
    { id: "beveiliging", label: "Beveiliging", icon: Lock },
    { id: "bedrijf", label: "Bedrijfsgegevens", icon: Building2, adminOnly: true },
    { id: "huisstijl", label: "Huisstijl", icon: Palette, adminOnly: true },
    { id: "email", label: "E-mail", icon: Mail, adminOnly: true },
    { id: "offertes", label: "Offertes", icon: FileText, adminOnly: true },
    { id: "leads", label: "Leads", icon: Users, adminOnly: true },
    { id: "schouwen", label: "Schouwen", icon: ClipboardList, adminOnly: true },
    { id: "privacy", label: "Privacy & Data", icon: Shield },
  ];

  const visibleTabs = tabs.filter(t => !t.adminOnly || isPartnerAdmin);
  const [activeTab, setActiveTab] = useState("profiel");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Instellingen</h1>
        <p className="text-muted-foreground mt-1">Beheer uw profiel, organisatie en voorkeuren</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Side nav — vertical on desktop, horizontal scroll on mobile */}
        <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible md:w-56 md:shrink-0 pb-2 md:pb-0">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm whitespace-nowrap transition-colors",
                activeTab === tab.id
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <tab.icon className="h-4 w-4 shrink-0" />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0 max-w-2xl">
          {activeTab === "profiel" && <ProfielTab />}
          {activeTab === "beveiliging" && <BeveiligingTab />}
          {activeTab === "bedrijf" && isPartnerAdmin && profile?.partner_id && <BedrijfsgegevensTab partnerId={profile.partner_id} />}
          {activeTab === "huisstijl" && isPartnerAdmin && profile?.partner_id && <HuisstijlTab partnerId={profile.partner_id} />}
          {activeTab === "email" && isPartnerAdmin && profile?.partner_id && <EmailConfiguratie partnerId={profile.partner_id} />}
          {activeTab === "offertes" && isPartnerAdmin && profile?.partner_id && (
            <div className="space-y-6">
              <BetalingsvoorwaardenConfig partnerId={profile.partner_id} />
              <OfferteTemplateInstellingen partnerId={profile.partner_id} />
            </div>
          )}
          {activeTab === "leads" && isPartnerAdmin && profile?.partner_id && <LeadBronnenConfig partnerId={profile.partner_id} />}
          {activeTab === "schouwen" && isPartnerAdmin && profile?.partner_id && <SchouwInstellingen partnerId={profile.partner_id} />}
          {activeTab === "privacy" && <PrivacyTab isSuperOrPartner={isSuperOrPartner} />}
        </div>
      </div>
    </div>
  );
};

export default Instellingen;

/* ═══════════════════════════════════════════════════════════
   TAB COMPONENTS
   ═══════════════════════════════════════════════════════════ */

function ProfielTab() {
  const { profile, user } = useAuth();
  const [voornaam, setVoornaam] = useState(profile?.voornaam ?? "");
  const [achternaam, setAchternaam] = useState(profile?.achternaam ?? "");
  const [telefoon, setTelefoon] = useState(profile?.telefoon ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!voornaam.trim() || !achternaam.trim()) { toast.error("Voornaam en achternaam zijn verplicht"); return; }
    setSaving(true);
    const { error } = await supabase.from("users").update({
      voornaam: voornaam.trim(), achternaam: achternaam.trim(), telefoon: telefoon.trim() || null,
    }).eq("id", user!.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profiel bijgewerkt");
  };

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader><CardTitle className="text-lg">Profiel</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><Label>Voornaam</Label><Input value={voornaam} onChange={e => setVoornaam(e.target.value)} /></div>
          <div><Label>Achternaam</Label><Input value={achternaam} onChange={e => setAchternaam(e.target.value)} /></div>
        </div>
        <div><Label>E-mail</Label><Input value={profile?.email ?? ""} disabled className="bg-muted" /></div>
        <div><Label>Telefoon</Label><Input value={telefoon} onChange={e => setTelefoon(e.target.value)} /></div>
        <div><Label>Rol</Label><Input value={rolLabels[profile?.rol ?? ""] ?? profile?.rol ?? ""} disabled className="bg-muted" /></div>
        <Button onClick={handleSave} disabled={saving}>{saving ? "Opslaan..." : "Profiel opslaan"}</Button>
      </CardContent>
    </Card>
  );
}

function BeveiligingTab() {
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [changingPw, setChangingPw] = useState(false);

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

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader><CardTitle className="text-lg">Wachtwoord wijzigen</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Nieuw wachtwoord</Label><Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} /></div>
          <div><Label>Bevestig wachtwoord</Label><Input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} /></div>
          <Button onClick={handlePasswordChange} disabled={changingPw}>{changingPw ? "Wijzigen..." : "Wachtwoord wijzigen"}</Button>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" />Tweefactorauthenticatie</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-xl bg-muted/50 p-4">
            <p className="text-sm font-medium text-foreground">Binnenkort beschikbaar</p>
            <p className="text-xs text-muted-foreground mt-1">
              Tweefactorauthenticatie (2FA) voegt een extra beveiligingslaag toe aan uw account.
              Deze functie wordt binnenkort uitgerold.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Globe className="h-5 w-5 text-primary" />AVG / GDPR Compliance</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-xl bg-muted/50 p-4 space-y-2">
            <p className="text-sm text-foreground">
              Dit platform voldoet aan de Algemene Verordening Gegevensbescherming (AVG/GDPR):
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Uw data wordt opgeslagen binnen de EU</li>
              <li>U kunt al uw gegevens exporteren via Privacy & Data</li>
              <li>U kunt uw account en alle gegevens verwijderen</li>
              <li>Cookies worden pas geplaatst na uw toestemming</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BedrijfsgegevensTab({ partnerId }: { partnerId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    naam: "", email: "", telefoonnummer: "", website: "",
    adres: "", postcode: "", plaats: "", kvk: "", btw: "",
    contactpersoon_voornaam: "", contactpersoon_achternaam: "",
    contactpersoon_functie: "", contactpersoon_email: "", contactpersoon_telefoon: "",
  });

  useEffect(() => {
    supabase.from("partners")
      .select("naam, email, telefoonnummer, website, adres, postcode, plaats, kvk, btw, contactpersoon_voornaam, contactpersoon_achternaam, contactpersoon_functie, contactpersoon_email, contactpersoon_telefoon")
      .eq("id", partnerId).single()
      .then(({ data }) => {
        if (data) setForm({
          naam: data.naam ?? "", email: data.email ?? "", telefoonnummer: data.telefoonnummer ?? "",
          website: data.website ?? "", adres: data.adres ?? "", postcode: data.postcode ?? "",
          plaats: data.plaats ?? "", kvk: data.kvk ?? "", btw: data.btw ?? "",
          contactpersoon_voornaam: data.contactpersoon_voornaam ?? "",
          contactpersoon_achternaam: data.contactpersoon_achternaam ?? "",
          contactpersoon_functie: data.contactpersoon_functie ?? "",
          contactpersoon_email: data.contactpersoon_email ?? "",
          contactpersoon_telefoon: data.contactpersoon_telefoon ?? "",
        });
        setLoading(false);
      });
  }, [partnerId]);

  const update = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("partners").update({
      naam: form.naam, email: form.email || null, telefoonnummer: form.telefoonnummer || null,
      website: form.website || null, adres: form.adres || null, postcode: form.postcode || null,
      plaats: form.plaats || null, kvk: form.kvk || null, btw: form.btw || null,
      contactpersoon_voornaam: form.contactpersoon_voornaam || null,
      contactpersoon_achternaam: form.contactpersoon_achternaam || null,
      contactpersoon_functie: form.contactpersoon_functie || null,
      contactpersoon_email: form.contactpersoon_email || null,
      contactpersoon_telefoon: form.contactpersoon_telefoon || null,
    }).eq("id", partnerId);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Bedrijfsgegevens opgeslagen");
  };

  if (loading) return <p className="text-sm text-muted-foreground">Laden...</p>;

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader><CardTitle className="text-lg">Bedrijfsgegevens</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Bedrijfsnaam</Label><Input value={form.naam} onChange={e => update("naam", e.target.value)} /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><Label>E-mail</Label><Input value={form.email} onChange={e => update("email", e.target.value)} /></div>
            <div><Label>Telefoon</Label><Input value={form.telefoonnummer} onChange={e => update("telefoonnummer", e.target.value)} /></div>
          </div>
          <div><Label>Website</Label><Input value={form.website} onChange={e => update("website", e.target.value)} /></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><Label>Adres</Label><Input value={form.adres} onChange={e => update("adres", e.target.value)} /></div>
            <div><Label>Postcode</Label><Input value={form.postcode} onChange={e => update("postcode", e.target.value)} /></div>
            <div><Label>Plaats</Label><Input value={form.plaats} onChange={e => update("plaats", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><Label>KVK-nummer</Label><Input value={form.kvk} onChange={e => update("kvk", e.target.value)} /></div>
            <div><Label>BTW-nummer</Label><Input value={form.btw} onChange={e => update("btw", e.target.value)} /></div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader><CardTitle className="text-lg">Contactpersoon</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><Label>Voornaam</Label><Input value={form.contactpersoon_voornaam} onChange={e => update("contactpersoon_voornaam", e.target.value)} /></div>
            <div><Label>Achternaam</Label><Input value={form.contactpersoon_achternaam} onChange={e => update("contactpersoon_achternaam", e.target.value)} /></div>
          </div>
          <div><Label>Functie</Label><Input value={form.contactpersoon_functie} onChange={e => update("contactpersoon_functie", e.target.value)} /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><Label>E-mail</Label><Input value={form.contactpersoon_email} onChange={e => update("contactpersoon_email", e.target.value)} /></div>
            <div><Label>Telefoon</Label><Input value={form.contactpersoon_telefoon} onChange={e => update("contactpersoon_telefoon", e.target.value)} /></div>
          </div>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Opslaan..." : "Opslaan"}</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function HuisstijlTab({ partnerId }: { partnerId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingDark, setUploadingDark] = useState(false);
  const [primaireKleur, setPrimaireKleur] = useState("#5B58E1");
  const [secundaireKleur, setSecundaireKleur] = useState("#1a1a2e");
  const [bedrijfsslogan, setBedrijfsslogan] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoUrlDonker, setLogoUrlDonker] = useState<string | null>(null);
  const [partnerNaam, setPartnerNaam] = useState("");

  useEffect(() => {
    supabase.from("partners")
      .select("naam, logo_url, logo_url_donker, primaire_kleur, secundaire_kleur, bedrijfsslogan")
      .eq("id", partnerId).single()
      .then(({ data }) => {
        if (data) {
          setPartnerNaam(data.naam);
          setPrimaireKleur(data.primaire_kleur || "#5B58E1");
          setSecundaireKleur(data.secundaire_kleur || "#1a1a2e");
          setBedrijfsslogan(data.bedrijfsslogan || "");
          setLogoUrl(data.logo_url);
          setLogoUrlDonker((data as any).logo_url_donker || null);
        }
        setLoading(false);
      });
  }, [partnerId]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Selecteer een afbeelding"); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("Maximaal 2MB"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${partnerId}/logo_${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("partner-assets").upload(path, file, { upsert: true });
      if (error) { toast.error("Upload mislukt: " + error.message); setUploading(false); return; }
      const { data: { publicUrl } } = supabase.storage.from("partner-assets").getPublicUrl(path);
      const urlWithCacheBust = publicUrl + "?t=" + Date.now();
      const { error: updateError } = await supabase.from("partners").update({ logo_url: urlWithCacheBust }).eq("id", partnerId);
      if (updateError) { toast.error("Fout bij opslaan: " + updateError.message); } else {
        setLogoUrl(urlWithCacheBust);
        toast.success("Logo geüpload");
      }
    } catch (err: any) {
      console.error("Logo upload error:", err);
      toast.error("Onverwachte fout bij uploaden");
    }
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("partners").update({
      primaire_kleur: primaireKleur, secundaire_kleur: secundaireKleur,
      bedrijfsslogan: bedrijfsslogan.trim() || null,
    }).eq("id", partnerId);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Huisstijl opgeslagen");
  };

  if (loading) return <p className="text-sm text-muted-foreground">Laden...</p>;

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader><CardTitle className="text-lg">Huisstijl organisatie</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        <div>
          <Label>Logo</Label>
          <div className="flex items-center gap-4 mt-1">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className={`h-12 w-auto object-contain rounded-lg border p-1 ${uploading ? "opacity-50" : ""}`} />
            ) : (
              <div className="h-12 w-12 rounded-lg border border-dashed flex items-center justify-center bg-muted/30">
                <Palette className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div>
              <Input type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploading} className="text-sm" />
              <p className="text-xs text-muted-foreground mt-1">Max 2MB, wordt getoond op offertes</p>
            </div>
          </div>
        </div>
        <div>
          <Label>Logo voor donkere achtergrond <span className="text-xs text-muted-foreground">(optioneel)</span></Label>
          <p className="text-xs text-muted-foreground mb-1">Wordt gebruikt op donkere PDF-voorbladen (bijv. witte versie van uw logo)</p>
          <div className="flex items-center gap-4 mt-1">
            {logoUrlDonker ? (
              <div className="relative">
                <img src={logoUrlDonker} alt="Logo donker" className={`h-12 w-auto object-contain rounded-lg border p-1 bg-gray-800 ${uploadingDark ? "opacity-50" : ""}`} />
              </div>
            ) : (
              <div className="h-12 w-12 rounded-lg border border-dashed flex items-center justify-center bg-gray-800">
                <Palette className="h-5 w-5 text-gray-400" />
              </div>
            )}
            <div>
              <Input type="file" accept="image/*" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (!file.type.startsWith("image/")) { toast.error("Selecteer een afbeelding"); return; }
                if (file.size > 2 * 1024 * 1024) { toast.error("Maximaal 2MB"); return; }
                setUploadingDark(true);
                try {
                  const ext = file.name.split(".").pop();
                  const path = `${partnerId}/logo_donker_${Date.now()}.${ext}`;
                  const { error } = await supabase.storage.from("partner-assets").upload(path, file, { upsert: true });
                  if (error) { toast.error("Upload mislukt: " + error.message); setUploadingDark(false); return; }
                  const { data: { publicUrl } } = supabase.storage.from("partner-assets").getPublicUrl(path);
                  const urlWithCacheBust = publicUrl + "?t=" + Date.now();
                  const { error: updateError } = await supabase.from("partners").update({ logo_url_donker: urlWithCacheBust } as any).eq("id", partnerId);
                  if (updateError) { toast.error("Fout bij opslaan: " + updateError.message); } else {
                    setLogoUrlDonker(urlWithCacheBust);
                    toast.success("Donker logo geüpload");
                  }
                } catch (err: any) {
                  toast.error("Onverwachte fout bij uploaden");
                }
                setUploadingDark(false);
              }} disabled={uploadingDark} className="text-sm" />
              <p className="text-xs text-muted-foreground mt-1">Max 2MB, voor donkere/gekleurde achtergronden op offertes</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Primaire kleur</Label>
            <div className="flex items-center gap-2 mt-1">
              <input type="color" value={primaireKleur} onChange={e => setPrimaireKleur(e.target.value)} className="h-10 w-10 rounded-lg border cursor-pointer" />
              <Input value={primaireKleur} onChange={e => setPrimaireKleur(e.target.value)} className="font-mono text-sm" maxLength={7} />
            </div>
          </div>
          <div>
            <Label>Secundaire kleur</Label>
            <div className="flex items-center gap-2 mt-1">
              <input type="color" value={secundaireKleur} onChange={e => setSecundaireKleur(e.target.value)} className="h-10 w-10 rounded-lg border cursor-pointer" />
              <Input value={secundaireKleur} onChange={e => setSecundaireKleur(e.target.value)} className="font-mono text-sm" maxLength={7} />
            </div>
          </div>
        </div>
        <div>
          <Label>Bedrijfsslogan</Label>
          <Input value={bedrijfsslogan} onChange={e => setBedrijfsslogan(e.target.value)} placeholder="bijv. Duurzame energie, dichtbij huis" className="mt-1" />
        </div>
        <div>
          <Label className="text-muted-foreground text-xs">Preview offerte-header</Label>
          <div className="mt-2 rounded-xl border p-4" style={{ borderBottom: `3px solid ${primaireKleur}` }}>
            <div className="flex justify-between items-start">
              <div>
                {logoUrl ? <img src={logoUrl} alt="Logo" className="h-8 mb-1 object-contain" /> : <div className="h-8 w-8 rounded bg-muted mb-1" />}
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
        <Button onClick={handleSave} disabled={saving}>{saving ? "Opslaan..." : "Huisstijl opslaan"}</Button>
      </CardContent>
    </Card>
  );
}

function PrivacyTab({ isSuperOrPartner }: { isSuperOrPartner: boolean }) {
  const { user, signOut } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [clearingDemo, setClearingDemo] = useState(false);

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
        profile: profileData.data, leads: leadsData.data,
        offertes: offertesData.data, schouwen: schouwenData.data,
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url;
      a.download = `mijnhuis-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click(); URL.revokeObjectURL(url);
      toast.success("Data geëxporteerd");
    } catch { toast.error("Fout bij het exporteren van data"); }
    setExporting(false);
  };

  const handleClearDemoData = async () => {
    setClearingDemo(true);
    try {
      const { data, error } = await supabase.functions.invoke("clear-demo-data");
      if (error || data?.error) toast.error("Fout bij verwijderen demogegevens", { description: data?.error || error?.message });
      else toast.success("Demogegevens verwijderd");
    } catch { toast.error("Fout bij verwijderen demogegevens"); }
    setClearingDemo(false);
  };

  const handleDeleteAccount = async () => {
    const { error } = await supabase.from("users").delete().eq("id", user!.id);
    if (error) { toast.error("Fout bij verwijderen: " + error.message); return; }
    await signOut(); toast.success("Account verwijderd");
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader><CardTitle className="text-lg">Privacy & Gegevensbeheer</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            U kunt al uw gegevens exporteren als JSON-bestand of uw account volledig verwijderen.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleDataExport} disabled={exporting} className="gap-2">
              <Download className="h-4 w-4" />{exporting ? "Exporteren..." : "Data exporteren"}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2"><Trash2 className="h-4 w-4" /> Account verwijderen</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Account verwijderen</AlertDialogTitle>
                  <AlertDialogDescription>Weet u zeker dat u uw account en alle gekoppelde gegevens wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuleren</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground">Definitief verwijderen</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {isSuperOrPartner && (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Sparkles className="h-5 w-5 text-accent-foreground" />Demogegevens</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Uw account bevat voorbeelddata (gemarkeerd met ⚡ Demo). U kunt deze verwijderen zodra u klaar bent met verkennen.</p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="gap-2" disabled={clearingDemo}>
                  <Trash2 className="h-4 w-4" />{clearingDemo ? "Verwijderen..." : "Demogegevens verwijderen"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Demogegevens verwijderen</AlertDialogTitle>
                  <AlertDialogDescription>Alle voorbeelddata wordt permanent verwijderd.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuleren</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearDemoData}>Verwijderen</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   OFFERTE TEMPLATE INSTELLINGEN (existing, moved inline)
   ═══════════════════════════════════════════════════════════ */

interface OfferteTemplate {
  voorblad: boolean; productpagina: boolean; energieadvies: boolean; schouwrapport: boolean;
  standaard_garantievoorwaarden: string; standaard_betalingsvoorwaarden: string;
  standaard_installatietermijn: string; badge_1: string; badge_2: string; badge_3: string; akkoord_tekst: string;
  voorwaarden_standaard_bijvoegen: boolean;
}

const defaultTemplate: OfferteTemplate = {
  voorblad: true, productpagina: true, energieadvies: true, schouwrapport: true,
  standaard_garantievoorwaarden: "Productgarantie conform fabrikant. Installatiegarantie: 2 jaar.",
  standaard_betalingsvoorwaarden: "30 dagen netto",
  standaard_installatietermijn: "Binnen 4 weken na akkoord",
  badge_1: "Gecertificeerd installateur", badge_2: "Persoonlijk advies", badge_3: "Professionele installatie",
  akkoord_tekst: "",
  voorwaarden_standaard_bijvoegen: true,
};

function OfferteTemplateInstellingen({ partnerId }: { partnerId: string }) {
  const [template, setTemplate] = useState<OfferteTemplate>(defaultTemplate);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [voorwaardenUrl, setVoorwaardenUrl] = useState<string | null>(null);
  const [uploadingVoorwaarden, setUploadingVoorwaarden] = useState(false);

  useEffect(() => {
    supabase.from("partners").select("feature_flags_json, voorwaarden_pdf_url").eq("id", partnerId).single()
      .then(({ data }) => {
        if (data) {
          if (data.feature_flags_json && typeof data.feature_flags_json === "object") {
            const flags = data.feature_flags_json as Record<string, any>;
            if (flags.offerte_template) setTemplate({ ...defaultTemplate, ...flags.offerte_template });
          }
          setVoorwaardenUrl((data as any).voorwaarden_pdf_url || null);
        }
        setLoading(false);
      });
  }, [partnerId]);

  const handleVoorwaardenUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") { toast.error("Selecteer een PDF-bestand"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Maximaal 10MB"); return; }
    setUploadingVoorwaarden(true);
    try {
      const path = `${partnerId}/voorwaarden_${Date.now()}.pdf`;
      const { error } = await supabase.storage.from("partner-assets").upload(path, file, { upsert: true });
      if (error) { toast.error("Upload mislukt: " + error.message); setUploadingVoorwaarden(false); return; }
      const { data: { publicUrl } } = supabase.storage.from("partner-assets").getPublicUrl(path);
      const { error: updateError } = await supabase.from("partners").update({ voorwaarden_pdf_url: publicUrl } as any).eq("id", partnerId);
      if (updateError) { toast.error("Fout bij opslaan: " + updateError.message); } else {
        setVoorwaardenUrl(publicUrl);
        toast.success("Algemene voorwaarden geüpload");
      }
    } catch {
      toast.error("Onverwachte fout bij uploaden");
    }
    setUploadingVoorwaarden(false);
  };

  const handleRemoveVoorwaarden = async () => {
    const { error } = await supabase.from("partners").update({ voorwaarden_pdf_url: null } as any).eq("id", partnerId);
    if (error) { toast.error(error.message); return; }
    setVoorwaardenUrl(null);
    toast.success("Algemene voorwaarden verwijderd");
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: current } = await supabase.from("partners").select("feature_flags_json").eq("id", partnerId).single();
    const existingFlags = (current?.feature_flags_json && typeof current.feature_flags_json === "object") ? current.feature_flags_json as Record<string, any> : {};
    const { error } = await supabase.from("partners").update({ feature_flags_json: { ...existingFlags, offerte_template: template } as any }).eq("id", partnerId);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Offerte template opgeslagen");
  };

  const update = <K extends keyof OfferteTemplate>(key: K, val: OfferteTemplate[K]) => setTemplate(prev => ({ ...prev, [key]: val }));

  if (loading) return null;

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Offerte template</CardTitle>
        <p className="text-sm text-muted-foreground">Bepaal welke pagina's en standaardteksten in offertes verschijnen</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <p className="text-sm font-medium text-foreground">Pagina's</p>
          {([
            { key: "voorblad" as const, label: "Voorblad (coverpagina)", desc: "Hero-sectie met branding en klantgegevens" },
            { key: "productpagina" as const, label: "Productinformatie", desc: "Afbeeldingen, specs en garantie per product" },
            { key: "energieadvies" as const, label: "Besparingen & energieadvies", desc: "ROI-berekening en besparingscijfers" },
            { key: "schouwrapport" as const, label: "Schouwrapport", desc: "Technische gegevens uit de schouw" },
          ]).map(item => (
            <div key={item.key} className="flex items-center justify-between py-2">
              <div><p className="text-sm font-medium">{item.label}</p><p className="text-xs text-muted-foreground">{item.desc}</p></div>
              <Switch checked={template[item.key]} onCheckedChange={v => update(item.key, v)} />
            </div>
          ))}
        </div>
        <div className="border-t pt-4 space-y-4">
          <p className="text-sm font-medium text-foreground">Standaardteksten</p>
          <div><Label>Standaard garantievoorwaarden</Label><Textarea value={template.standaard_garantievoorwaarden} onChange={e => update("standaard_garantievoorwaarden", e.target.value)} className="rounded-xl mt-1" rows={2} /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><Label>Standaard betalingsvoorwaarden</Label><Input value={template.standaard_betalingsvoorwaarden} onChange={e => update("standaard_betalingsvoorwaarden", e.target.value)} /></div>
            <div><Label>Standaard installatietermijn</Label><Input value={template.standaard_installatietermijn} onChange={e => update("standaard_installatietermijn", e.target.value)} /></div>
          </div>
        </div>
        <div className="border-t pt-4 space-y-4">
          <p className="text-sm font-medium text-foreground">Voorblad badges</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div><Label>Badge 1</Label><Input value={template.badge_1} onChange={e => update("badge_1", e.target.value)} /></div>
            <div><Label>Badge 2</Label><Input value={template.badge_2} onChange={e => update("badge_2", e.target.value)} /></div>
            <div><Label>Badge 3</Label><Input value={template.badge_3} onChange={e => update("badge_3", e.target.value)} /></div>
          </div>
        </div>
        <div className="border-t pt-4">
          <Label>Akkoordsectie tekst (optioneel)</Label>
          <Textarea value={template.akkoord_tekst} onChange={e => update("akkoord_tekst", e.target.value)} className="rounded-xl mt-1" rows={2} placeholder="Extra tekst boven de handtekeningsectie..." />
        </div>
        <div className="border-t pt-4 space-y-4">
          <p className="text-sm font-medium text-foreground">Algemene voorwaarden</p>
          <p className="text-xs text-muted-foreground">Upload uw algemene voorwaarden als PDF. Deze kunnen bij het versturen van offertes automatisch worden bijgevoegd als downloadlink.</p>
          <div className="flex items-center gap-4">
            {voorwaardenUrl ? (
              <div className="flex items-center gap-3 rounded-xl border p-3 flex-1">
                <FileText className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Algemene voorwaarden.pdf</p>
                  <a href={voorwaardenUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Bekijken →</a>
                </div>
                <Button variant="ghost" size="sm" onClick={handleRemoveVoorwaarden} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex-1">
                <Input type="file" accept="application/pdf" onChange={handleVoorwaardenUpload} disabled={uploadingVoorwaarden} className="text-sm" />
                <p className="text-xs text-muted-foreground mt-1">Max 10MB, alleen PDF</p>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">Standaard bijvoegen bij offertes</p>
              <p className="text-xs text-muted-foreground">Automatisch een link naar de voorwaarden toevoegen bij het versturen</p>
            </div>
            <Switch checked={template.voorwaarden_standaard_bijvoegen} onCheckedChange={v => update("voorwaarden_standaard_bijvoegen", v)} disabled={!voorwaardenUrl} />
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>{saving ? "Opslaan..." : "Template opslaan"}</Button>
      </CardContent>
    </Card>
  );
}
