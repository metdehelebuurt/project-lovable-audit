import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Settings, Users, Euro, TrendingUp, Save, Plus, Trash2, UserPlus, ToggleLeft, ToggleRight, Eye, Upload, Snowflake } from "lucide-react";
import KoudeLeadsImportDialog from "@/components/affiliate/KoudeLeadsImportDialog";

const AffiliateBeheer = () => {
  const queryClient = useQueryClient();
  const [showCreateAffiliate, setShowCreateAffiliate] = useState(false);
  const [showCreateCode, setShowCreateCode] = useState(false);
  const [affiliateForm, setAffiliateForm] = useState({ voornaam: "", achternaam: "", email: "", telefoon: "" });
  const [codeForm, setCodeForm] = useState({ affiliate_id: "", code: "", korting_type: "percentage", korting_waarde: "", max_gebruik: "", geldig_tot: "" });
  const [detailAffiliate, setDetailAffiliate] = useState<any | null>(null);
  const [showImportKoudeLeads, setShowImportKoudeLeads] = useState(false);

  // Fetch instellingen
  const { data: instellingen } = useQuery({
    queryKey: ["affiliate-instellingen"],
    queryFn: async () => {
      const { data, error } = await supabase.from("affiliate_instellingen").select("*").limit(1).single();
      if (error) throw error;
      return data;
    },
  });

  const [settings, setSettings] = useState<any>(null);
  if (instellingen && !settings) setSettings({ ...instellingen });

  // Fetch all affiliates
  const { data: affiliates = [] } = useQuery({
    queryKey: ["all-affiliates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("users").select("*").eq("rol", "affiliate").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch all referrals
  const { data: allReferrals = [] } = useQuery({
    queryKey: ["all-referrals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("affiliate_referrals").select("*, partners:partner_id(naam, status), users:affiliate_id(voornaam, achternaam, email)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch all kortingscodes
  const { data: allCodes = [] } = useQuery({
    queryKey: ["all-kortingscodes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("kortingscodes").select("*, users:affiliate_id(voornaam, achternaam)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Save instellingen
  const saveSettings = useMutation({
    mutationFn: async () => {
      if (!settings || !instellingen) return;
      const { error } = await supabase.from("affiliate_instellingen").update({
        max_korting_percentage: settings.max_korting_percentage,
        max_korting_vast_bedrag: settings.max_korting_vast_bedrag,
        standaard_commissie_percentage: settings.standaard_commissie_percentage,
        max_commissie_percentage: settings.max_commissie_percentage,
        min_abonnement_maanden: settings.min_abonnement_maanden,
        cookie_dagen: settings.cookie_dagen,
      }).eq("id", instellingen.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliate-instellingen"] });
      toast.success("Instellingen opgeslagen");
    },
    onError: (e: any) => toast.error("Fout: " + e.message),
  });

  // Create affiliate
  const createAffiliate = useMutation({
    mutationFn: async () => {
      const { voornaam, achternaam, email, telefoon } = affiliateForm;
      if (!voornaam || !achternaam || !email) throw new Error("Vul alle verplichte velden in");
      // Wachtwoord wordt server-side veilig gegenereerd via user-management (crypto.getRandomValues)
      const res = await supabase.functions.invoke("user-management", {
        body: { action: "create_user", email, voornaam, achternaam, telefoon: telefoon || null, rol: "affiliate", partner_id: null },
      });
      if (res.error) throw new Error(res.error.message || "Fout bij aanmaken");
      if (res.data?.error) throw new Error(res.data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-affiliates"] });
      setShowCreateAffiliate(false);
      setAffiliateForm({ voornaam: "", achternaam: "", email: "", telefoon: "" });
      toast.success("Affiliate aangemaakt. Een tijdelijk wachtwoord is ingesteld.");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Toggle affiliate status
  const toggleStatus = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: string }) => {
      const newStatus = currentStatus === "actief" ? "inactief" : "actief";
      const { error } = await supabase.from("users").update({ status: newStatus }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-affiliates"] });
      toast.success("Status gewijzigd");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Create kortingscode by superadmin
  const createCode = useMutation({
    mutationFn: async () => {
      if (!codeForm.affiliate_id || !codeForm.code || !codeForm.korting_waarde) throw new Error("Vul alle verplichte velden in");
      const { error } = await supabase.from("kortingscodes").insert({
        affiliate_id: codeForm.affiliate_id,
        code: codeForm.code.toUpperCase().replace(/[^A-Z0-9]/g, ""),
        korting_type: codeForm.korting_type,
        korting_waarde: parseFloat(codeForm.korting_waarde),
        max_gebruik: codeForm.max_gebruik ? parseInt(codeForm.max_gebruik) : null,
        geldig_tot: codeForm.geldig_tot || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-kortingscodes"] });
      setShowCreateCode(false);
      setCodeForm({ affiliate_id: "", code: "", korting_type: "percentage", korting_waarde: "", max_gebruik: "", geldig_tot: "" });
      toast.success("Kortingscode aangemaakt");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Delete kortingscode
  const deleteCode = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("kortingscodes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-kortingscodes"] });
      toast.success("Code verwijderd");
    },
  });

  // Update referral commissie
  const updateCommissie = useMutation({
    mutationFn: async ({ id, commissie }: { id: string; commissie: number }) => {
      const { error } = await supabase.from("affiliate_referrals").update({ commissie_percentage: commissie }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-referrals"] });
      toast.success("Commissie aangepast");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Toggle code active status
  const toggleCodeStatus = useMutation({
    mutationFn: async ({ id, actief }: { id: string; actief: boolean }) => {
      const { error } = await supabase.from("kortingscodes").update({ actief: !actief }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-kortingscodes"] });
      toast.success("Status gewijzigd");
    },
  });

  const totalCommission = allReferrals.reduce((sum: number, r: any) => sum + (r.commissie_verdiend || 0), 0);
  const activePartners = allReferrals.filter((r: any) => r.status === "actief").length;

  // Uitbetalingen per affiliate
  const payoutsByAffiliate = affiliates.map((a: any) => {
    const refs = allReferrals.filter((r: any) => r.affiliate_id === a.id);
    const totaal = refs.reduce((s: number, r: any) => s + (r.commissie_verdiend || 0), 0);
    return { ...a, referrals: refs.length, totaal_commissie: totaal };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Affiliate Beheer</h1>
        <p className="text-muted-foreground">Beheer affiliates, instellingen en commissies</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Users className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{affiliates.length}</p><p className="text-sm text-muted-foreground">Affiliates</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><TrendingUp className="h-8 w-8 text-blue-600" /><div><p className="text-2xl font-bold">{activePartners}</p><p className="text-sm text-muted-foreground">Aangebrachte partners</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Euro className="h-8 w-8 text-green-600" /><div><p className="text-2xl font-bold">€{totalCommission.toFixed(2)}</p><p className="text-sm text-muted-foreground">Totale commissie</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Settings className="h-8 w-8 text-muted-foreground" /><div><p className="text-2xl font-bold">{allCodes.length}</p><p className="text-sm text-muted-foreground">Kortingscodes</p></div></div></CardContent></Card>
      </div>

      <Tabs defaultValue="affiliates">
        <TabsList>
          <TabsTrigger value="affiliates">Affiliates</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
          <TabsTrigger value="codes">Kortingscodes</TabsTrigger>
          <TabsTrigger value="koude-leads">Koude leads</TabsTrigger>
          <TabsTrigger value="uitbetalingen">Uitbetalingen</TabsTrigger>
          <TabsTrigger value="instellingen">Instellingen</TabsTrigger>
        </TabsList>

        {/* Affiliates Tab */}
        <TabsContent value="affiliates" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Alle affiliates</h2>
            <Button onClick={() => setShowCreateAffiliate(true)} size="sm"><UserPlus className="h-4 w-4 mr-1" /> Nieuwe affiliate</Button>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Naam</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefoon</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aangemeld</TableHead>
                  <TableHead>Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {affiliates.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nog geen affiliates</TableCell></TableRow>}
                {affiliates.map((a: any) => (
                  <TableRow key={a.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setDetailAffiliate(a)}>
                    <TableCell className="font-medium">{a.voornaam} {a.achternaam}</TableCell>
                    <TableCell>{a.email}</TableCell>
                    <TableCell>{a.telefoon || "—"}</TableCell>
                    <TableCell><Badge variant={a.status === "actief" ? "default" : "secondary"}>{a.status}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{new Date(a.created_at).toLocaleDateString("nl-NL")}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setDetailAffiliate(a)} title="Statistieken bekijken">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => toggleStatus.mutate({ id: a.id, currentStatus: a.status })} title={a.status === "actief" ? "Deactiveren" : "Activeren"}>
                          {a.status === "actief" ? <ToggleRight className="h-4 w-4 text-green-600" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Referrals Tab */}
        <TabsContent value="referrals">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Affiliate</TableHead>
                  <TableHead>Partner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Commissie %</TableHead>
                  <TableHead>Verdiend</TableHead>
                  <TableHead>Datum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allReferrals.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nog geen referrals</TableCell></TableRow>}
                {allReferrals.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.users?.voornaam} {r.users?.achternaam}</TableCell>
                    <TableCell className="font-medium">{r.partners?.naam || "—"}</TableCell>
                    <TableCell><Badge variant={r.status === "actief" ? "default" : "secondary"}>{r.status}</Badge></TableCell>
                    <TableCell>
                      <Input type="number" min={0} max={100} className="w-20 h-8 text-sm" defaultValue={r.commissie_percentage}
                        onBlur={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val) && val !== r.commissie_percentage) updateCommissie.mutate({ id: r.id, commissie: val });
                        }}
                      />
                    </TableCell>
                    <TableCell className="text-green-600 font-medium">€{(r.commissie_verdiend || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(r.created_at).toLocaleDateString("nl-NL")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Codes Tab */}
        <TabsContent value="codes" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Alle kortingscodes</h2>
            <Button onClick={() => setShowCreateCode(true)} size="sm"><Plus className="h-4 w-4 mr-1" /> Nieuwe code</Button>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Affiliate</TableHead>
                  <TableHead>Korting</TableHead>
                  <TableHead>Gebruik</TableHead>
                  <TableHead>Geldig tot</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allCodes.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nog geen kortingscodes</TableCell></TableRow>}
                {allCodes.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono font-bold">{c.code}</TableCell>
                    <TableCell>{c.users?.voornaam} {c.users?.achternaam}</TableCell>
                    <TableCell>{c.korting_type === "percentage" ? `${c.korting_waarde}%` : `€${c.korting_waarde}`}</TableCell>
                    <TableCell>{c.aantal_gebruikt}{c.max_gebruik ? `/${c.max_gebruik}` : ""}</TableCell>
                    <TableCell>{c.geldig_tot ? new Date(c.geldig_tot).toLocaleDateString("nl-NL") : "Onbeperkt"}</TableCell>
                    <TableCell>
                      <Badge variant={c.actief ? "default" : "secondary"} className="cursor-pointer" onClick={() => toggleCodeStatus.mutate({ id: c.id, actief: c.actief })}>
                        {c.actief ? "Actief" : "Inactief"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteCode.mutate(c.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Uitbetalingen Tab */}
        <TabsContent value="uitbetalingen">
          <Card>
            <CardHeader><CardTitle>Commissie overzicht per affiliate</CardTitle></CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Affiliate</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Referrals</TableHead>
                  <TableHead>Totale commissie</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payoutsByAffiliate.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nog geen affiliates</TableCell></TableRow>}
                {payoutsByAffiliate.map((a: any) => (
                  <TableRow key={a.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setDetailAffiliate(a)}>
                    <TableCell className="font-medium">{a.voornaam} {a.achternaam}</TableCell>
                    <TableCell>{a.email}</TableCell>
                    <TableCell>{a.referrals}</TableCell>
                    <TableCell className="font-bold text-green-600">€{a.totaal_commissie.toFixed(2)}</TableCell>
                    <TableCell><Badge variant={a.status === "actief" ? "default" : "secondary"}>{a.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Koude leads Tab */}
        <TabsContent value="koude-leads" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2"><Snowflake className="h-5 w-5 text-primary" /> Koude leads-pool</span>
                <Button size="sm" onClick={() => setShowImportKoudeLeads(true)} className="gap-2">
                  <Upload className="h-4 w-4" /> CSV importeren
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Importeer een CSV met naam, bedrijf, contact, bron en trial-startdatum. Niet-toegewezen leads
                komen direct in de gedeelde pool en kunnen door affiliates worden geclaimd.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Instellingen Tab */}
        <TabsContent value="instellingen" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Globale affiliate instellingen</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {settings && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2"><Label>Max korting percentage (%)</Label><Input type="number" value={settings.max_korting_percentage} onChange={(e) => setSettings((s: any) => ({ ...s, max_korting_percentage: parseFloat(e.target.value) || 0 }))} /><p className="text-xs text-muted-foreground">Maximale procentuele korting die een affiliate mag instellen</p></div>
                    <div className="space-y-2"><Label>Max korting vast bedrag (€)</Label><Input type="number" value={settings.max_korting_vast_bedrag} onChange={(e) => setSettings((s: any) => ({ ...s, max_korting_vast_bedrag: parseFloat(e.target.value) || 0 }))} /><p className="text-xs text-muted-foreground">Maximaal vast bedrag korting per code</p></div>
                    <div className="space-y-2"><Label>Standaard commissie (%)</Label><Input type="number" value={settings.standaard_commissie_percentage} onChange={(e) => setSettings((s: any) => ({ ...s, standaard_commissie_percentage: parseFloat(e.target.value) || 0 }))} /><p className="text-xs text-muted-foreground">Commissie voor nieuwe affiliates</p></div>
                    <div className="space-y-2"><Label>Max commissie (%)</Label><Input type="number" value={settings.max_commissie_percentage} onChange={(e) => setSettings((s: any) => ({ ...s, max_commissie_percentage: parseFloat(e.target.value) || 0 }))} /><p className="text-xs text-muted-foreground">Plafond commissiepercentage</p></div>
                    <div className="space-y-2"><Label>Min abonnement maanden</Label><Input type="number" value={settings.min_abonnement_maanden} onChange={(e) => setSettings((s: any) => ({ ...s, min_abonnement_maanden: parseInt(e.target.value) || 0 }))} /><p className="text-xs text-muted-foreground">Minimale looptijd voor commissie-uitkering</p></div>
                    <div className="space-y-2"><Label>Cookie tracking (dagen)</Label><Input type="number" value={settings.cookie_dagen} onChange={(e) => setSettings((s: any) => ({ ...s, cookie_dagen: parseInt(e.target.value) || 0 }))} /><p className="text-xs text-muted-foreground">Hoe lang een affiliate cookie geldig blijft</p></div>
                  </div>
                  <Button onClick={() => saveSettings.mutate()} disabled={saveSettings.isPending}><Save className="h-4 w-4 mr-1" /> Opslaan</Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <KoudeLeadsImportDialog open={showImportKoudeLeads} onOpenChange={setShowImportKoudeLeads} />


      {/* Create Affiliate Dialog */}
      <Dialog open={showCreateAffiliate} onOpenChange={setShowCreateAffiliate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nieuwe affiliate aanmaken</DialogTitle>
            <DialogDescription>Maak een nieuw affiliate account aan. Een tijdelijk wachtwoord wordt automatisch gegenereerd.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Voornaam *</Label><Input value={affiliateForm.voornaam} onChange={(e) => setAffiliateForm(f => ({ ...f, voornaam: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Achternaam *</Label><Input value={affiliateForm.achternaam} onChange={(e) => setAffiliateForm(f => ({ ...f, achternaam: e.target.value }))} /></div>
            </div>
            <div className="space-y-2"><Label>Email *</Label><Input type="email" value={affiliateForm.email} onChange={(e) => setAffiliateForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Telefoon</Label><Input value={affiliateForm.telefoon} onChange={(e) => setAffiliateForm(f => ({ ...f, telefoon: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateAffiliate(false)}>Annuleren</Button>
            <Button onClick={() => createAffiliate.mutate()} disabled={createAffiliate.isPending}>{createAffiliate.isPending ? "Bezig..." : "Aanmaken"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Code Dialog */}
      <Dialog open={showCreateCode} onOpenChange={setShowCreateCode}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kortingscode aanmaken</DialogTitle>
            <DialogDescription>Maak een kortingscode aan voor een affiliate.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Affiliate *</Label>
              <Select value={codeForm.affiliate_id} onValueChange={(v) => setCodeForm(f => ({ ...f, affiliate_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecteer affiliate" /></SelectTrigger>
                <SelectContent>
                  {affiliates.map((a: any) => (
                    <SelectItem key={a.id} value={a.id}>{a.voornaam} {a.achternaam}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Code *</Label><Input placeholder="bijv. SOLAR20" value={codeForm.code} onChange={(e) => setCodeForm(f => ({ ...f, code: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Type korting</Label>
                <Select value={codeForm.korting_type} onValueChange={(v) => setCodeForm(f => ({ ...f, korting_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="vast_bedrag">Vast bedrag (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Waarde *</Label><Input type="number" value={codeForm.korting_waarde} onChange={(e) => setCodeForm(f => ({ ...f, korting_waarde: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Max gebruik</Label><Input type="number" placeholder="Onbeperkt" value={codeForm.max_gebruik} onChange={(e) => setCodeForm(f => ({ ...f, max_gebruik: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Geldig tot</Label><Input type="date" value={codeForm.geldig_tot} onChange={(e) => setCodeForm(f => ({ ...f, geldig_tot: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateCode(false)}>Annuleren</Button>
            <Button onClick={() => createCode.mutate()} disabled={createCode.isPending}>{createCode.isPending ? "Bezig..." : "Aanmaken"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Affiliate detail / statistieken */}
      <Dialog open={!!detailAffiliate} onOpenChange={(o) => !o && setDetailAffiliate(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {detailAffiliate && (() => {
            const refs = allReferrals.filter((r: any) => r.affiliate_id === detailAffiliate.id);
            const codes = allCodes.filter((c: any) => c.affiliate_id === detailAffiliate.id);
            const totaal = refs.reduce((s: number, r: any) => s + (r.commissie_verdiend || 0), 0);
            const actief = refs.filter((r: any) => r.status === "actief").length;
            const codeGebruik = codes.reduce((s: number, c: any) => s + (c.aantal_gebruikt || 0), 0);
            return (
              <>
                <DialogHeader>
                  <DialogTitle>{detailAffiliate.voornaam} {detailAffiliate.achternaam}</DialogTitle>
                  <DialogDescription>{detailAffiliate.email} {detailAffiliate.telefoon ? `· ${detailAffiliate.telefoon}` : ""}</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Card><CardContent className="pt-4"><p className="text-2xl font-bold">{refs.length}</p><p className="text-xs text-muted-foreground">Referrals</p></CardContent></Card>
                  <Card><CardContent className="pt-4"><p className="text-2xl font-bold">{actief}</p><p className="text-xs text-muted-foreground">Actief</p></CardContent></Card>
                  <Card><CardContent className="pt-4"><p className="text-2xl font-bold text-green-600">€{totaal.toFixed(2)}</p><p className="text-xs text-muted-foreground">Commissie</p></CardContent></Card>
                  <Card><CardContent className="pt-4"><p className="text-2xl font-bold">{codes.length}</p><p className="text-xs text-muted-foreground">Codes ({codeGebruik}×)</p></CardContent></Card>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold mt-4">Referrals</h3>
                  {refs.length === 0 ? <p className="text-sm text-muted-foreground">Nog geen referrals</p> : (
                    <Table>
                      <TableHeader><TableRow><TableHead>Partner</TableHead><TableHead>Status</TableHead><TableHead>Commissie %</TableHead><TableHead>Verdiend</TableHead><TableHead>Datum</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {refs.map((r: any) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium">{r.partners?.naam || "—"}</TableCell>
                            <TableCell><Badge variant={r.status === "actief" ? "default" : "secondary"}>{r.status}</Badge></TableCell>
                            <TableCell>{r.commissie_percentage}%</TableCell>
                            <TableCell className="text-green-600 font-medium">€{(r.commissie_verdiend || 0).toFixed(2)}</TableCell>
                            <TableCell className="text-muted-foreground">{new Date(r.created_at).toLocaleDateString("nl-NL")}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold mt-4">Kortingscodes</h3>
                  {codes.length === 0 ? <p className="text-sm text-muted-foreground">Nog geen kortingscodes</p> : (
                    <Table>
                      <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Korting</TableHead><TableHead>Gebruik</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {codes.map((c: any) => (
                          <TableRow key={c.id}>
                            <TableCell className="font-mono font-bold">{c.code}</TableCell>
                            <TableCell>{c.korting_type === "percentage" ? `${c.korting_waarde}%` : `€${c.korting_waarde}`}</TableCell>
                            <TableCell>{c.aantal_gebruikt}{c.max_gebruik ? `/${c.max_gebruik}` : ""}</TableCell>
                            <TableCell><Badge variant={c.actief ? "default" : "secondary"}>{c.actief ? "Actief" : "Inactief"}</Badge></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AffiliateBeheer;
