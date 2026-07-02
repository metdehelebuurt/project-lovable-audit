import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Link2, Tag, Users, Euro, Copy, Plus, Trash2, TrendingUp, FileText, Eye, Save, Loader2, X } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";
import { AffiliateSubnav } from "@/components/affiliate/AffiliateSubnav";
import { OnboardingChecklist } from "@/components/affiliate/OnboardingChecklist";
import { ActieVandaagKaart } from "@/components/affiliate/ActieVandaagKaart";

interface OfferteRegel {
  omschrijving: string;
  aantal: number;
  prijs_per_stuk: number;
  btw_percentage: number;
  korting_percentage: number;
}

const emptyRegel: OfferteRegel = { omschrijving: "", aantal: 1, prijs_per_stuk: 0, btw_percentage: 21, korting_percentage: 0 };

const generateOfferteNummer = () => {
  const d = new Date();
  const yy = d.getFullYear().toString().slice(2);
  const mm = (d.getMonth() + 1).toString().padStart(2, "0");
  const dd = d.getDate().toString().padStart(2, "0");
  const rand = Math.floor(Math.random() * 9999).toString().padStart(4, "0");
  return `AF-${yy}${mm}${dd}-${rand}`;
};

const formatCurrency = (n: number) => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

const Affiliates = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const [showOfferteDialog, setShowOfferteDialog] = useState(false);
  const [linkCode, setLinkCode] = useState("");
  const [codeForm, setCodeForm] = useState({ code: "", korting_type: "percentage" as string, korting_waarde: "", max_gebruik: "", geldig_tot: "" });

  // Offerte form state
  const [klantNaam, setKlantNaam] = useState("");
  const [klantEmail, setKlantEmail] = useState("");
  const [klantTelefoon, setKlantTelefoon] = useState("");
  const [klantAdres, setKlantAdres] = useState("");
  const [klantPostcode, setKlantPostcode] = useState("");
  const [klantPlaats, setKlantPlaats] = useState("");
  const [betalingsvoorwaarden, setBetalingsvoorwaarden] = useState("30 dagen netto");
  const [notities, setNotities] = useState("");
  const [regels, setRegels] = useState<OfferteRegel[]>([{ ...emptyRegel }]);

  const { data: instellingen } = useQuery({
    queryKey: ["affiliate-instellingen"],
    queryFn: async () => {
      const { data, error } = await supabase.from("affiliate_instellingen").select("*").limit(1).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: links = [] } = useQuery({
    queryKey: ["affiliate-links"],
    queryFn: async () => {
      const { data, error } = await supabase.from("affiliate_links").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: codes = [] } = useQuery({
    queryKey: ["kortingscodes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("kortingscodes").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: referrals = [] } = useQuery({
    queryKey: ["affiliate-referrals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("affiliate_referrals").select("*, partners:partner_id(naam, status, email)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: offertes = [] } = useQuery({
    queryKey: ["affiliate-offertes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("offertes").select("*").eq("adviseur_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Mutations
  const createLink = useMutation({
    mutationFn: async (code: string) => {
      const { error } = await supabase.from("affiliate_links").insert({ user_id: user!.id, code: code.toLowerCase().replace(/[^a-z0-9-]/g, "-") });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["affiliate-links"] }); setShowLinkDialog(false); setLinkCode(""); toast.success("Link aangemaakt"); },
    onError: (e: any) => toast.error(e.message),
  });

  const createCode = useMutation({
    mutationFn: async () => {
      const maxPct = instellingen?.max_korting_percentage ?? 25;
      const maxFixed = instellingen?.max_korting_vast_bedrag ?? 50;
      const waarde = parseFloat(codeForm.korting_waarde);
      if (codeForm.korting_type === "percentage" && waarde > maxPct) throw new Error(`Maximum korting is ${maxPct}%`);
      if (codeForm.korting_type === "vast_bedrag" && waarde > maxFixed) throw new Error(`Maximum korting is €${maxFixed}`);
      const { error } = await supabase.from("kortingscodes").insert({
        affiliate_id: user!.id,
        code: codeForm.code.toUpperCase().replace(/[^A-Z0-9]/g, ""),
        korting_type: codeForm.korting_type,
        korting_waarde: waarde,
        max_gebruik: codeForm.max_gebruik ? parseInt(codeForm.max_gebruik) : null,
        geldig_tot: codeForm.geldig_tot || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["kortingscodes"] }); setShowCodeDialog(false); setCodeForm({ code: "", korting_type: "percentage", korting_waarde: "", max_gebruik: "", geldig_tot: "" }); toast.success("Code aangemaakt"); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteLink = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("affiliate_links").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["affiliate-links"] }); toast.success("Link verwijderd"); },
  });

  const deleteCode = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("kortingscodes").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["kortingscodes"] }); toast.success("Code verwijderd"); },
  });

  // Offerte totals
  const totals = useMemo(() => {
    let subtotaal = 0, btwBedrag = 0;
    regels.forEach(r => { const s = r.aantal * r.prijs_per_stuk * (1 - r.korting_percentage / 100); subtotaal += s; btwBedrag += s * (r.btw_percentage / 100); });
    return { subtotaal, btwBedrag, totaal: subtotaal + btwBedrag };
  }, [regels]);

  const createOfferte = useMutation({
    mutationFn: async () => {
      if (!klantNaam || !klantEmail) throw new Error("Vul klantnaam en email in");
      if (regels.length === 0 || !regels[0].omschrijving) throw new Error("Voeg minimaal één regel toe");
      const geldigTot = new Date(); geldigTot.setDate(geldigTot.getDate() + 30);
      const { error } = await supabase.from("offertes").insert({
        klant_naam: klantNaam, klant_email: klantEmail, klant_telefoon: klantTelefoon || null,
        klant_adres: klantAdres || null, klant_postcode: klantPostcode || null, klant_plaats: klantPlaats || null,
        geldig_tot: geldigTot.toISOString().split("T")[0],
        betalingsvoorwaarden: betalingsvoorwaarden || null, notities: notities || null,
        regels: regels as unknown as Json, subtotaal: totals.subtotaal, btw_bedrag: totals.btwBedrag, totaal_bedrag: totals.totaal,
        partner_id: null, adviseur_id: user!.id, offertenummer: generateOfferteNummer(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliate-offertes"] });
      setShowOfferteDialog(false);
      setKlantNaam(""); setKlantEmail(""); setKlantTelefoon(""); setKlantAdres(""); setKlantPostcode(""); setKlantPlaats("");
      setNotities(""); setRegels([{ ...emptyRegel }]);
      toast.success("Offerte aangemaakt");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const activeReferrals = referrals.filter((r: any) => r.status === "actief");
  const totalCommission = referrals.reduce((sum: number, r: any) => sum + (r.commissie_verdiend || 0), 0);
  const totalClicks = links.reduce((sum: number, l: any) => sum + (l.clicks || 0), 0);
  const baseUrl = window.location.origin;
  const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); toast.success("Gekopieerd"); };

  const addRegel = () => setRegels(p => [...p, { ...emptyRegel }]);
  const removeRegel = (idx: number) => setRegels(p => p.filter((_, i) => i !== idx));
  const updateRegel = (idx: number, field: keyof OfferteRegel, value: string | number) => setRegels(p => p.map((r, i) => i === idx ? { ...r, [field]: value } : r));

  return (
    <div className="space-y-6">
      <AffiliateSubnav />
      <div>
        <h1 className="text-2xl font-bold text-foreground">Affiliate Dashboard</h1>
        <p className="text-muted-foreground">Beheer je links, offertes en volg je commissies</p>
      </div>
      <OnboardingChecklist />

      <ActieVandaagKaart />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Users className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{activeReferrals.length}</p><p className="text-sm text-muted-foreground">Actieve klanten</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Euro className="h-8 w-8 text-green-600" /><div><p className="text-2xl font-bold">€{totalCommission.toFixed(2)}</p><p className="text-sm text-muted-foreground">Totale commissie</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><TrendingUp className="h-8 w-8 text-blue-600" /><div><p className="text-2xl font-bold">{totalClicks}</p><p className="text-sm text-muted-foreground">Link kliks</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><FileText className="h-8 w-8 text-orange-600" /><div><p className="text-2xl font-bold">{offertes.length}</p><p className="text-sm text-muted-foreground">Offertes</p></div></div></CardContent></Card>
      </div>

      <Tabs defaultValue="offertes">
        <TabsList>
          <TabsTrigger value="offertes">Offertes</TabsTrigger>
          <TabsTrigger value="links">Affiliate Links</TabsTrigger>
          <TabsTrigger value="codes">Kortingscodes</TabsTrigger>
          <TabsTrigger value="klanten">Klanten</TabsTrigger>
        </TabsList>

        {/* Offertes Tab */}
        <TabsContent value="offertes" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Jouw offertes</h2>
            <Button onClick={() => setShowOfferteDialog(true)} size="sm"><Plus className="h-4 w-4 mr-1" /> Nieuwe offerte</Button>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nummer</TableHead>
                  <TableHead>Klant</TableHead>
                  <TableHead>Totaal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offertes.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nog geen offertes</TableCell></TableRow>}
                {offertes.map((o: any) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono font-medium">{o.offertenummer}</TableCell>
                    <TableCell>{o.klant_naam}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(o.totaal_bedrag)}</TableCell>
                    <TableCell>
                      <Badge variant={o.status === "geaccepteerd" ? "default" : o.status === "concept" ? "secondary" : o.status === "verzonden" ? "outline" : "destructive"}>
                        {o.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{new Date(o.created_at).toLocaleDateString("nl-NL")}</TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={() => window.open(`/offertes/${o.id}/pdf`, "_blank")}><Eye className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Links Tab */}
        <TabsContent value="links" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Jouw affiliate links</h2>
            <Button onClick={() => setShowLinkDialog(true)} size="sm"><Plus className="h-4 w-4 mr-1" /> Nieuwe link</Button>
          </div>
          <Card>
            <Table>
              <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>URL</TableHead><TableHead>Kliks</TableHead><TableHead>Status</TableHead><TableHead>Acties</TableHead></TableRow></TableHeader>
              <TableBody>
                {links.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nog geen links</TableCell></TableRow>}
                {links.map((link: any) => (
                  <TableRow key={link.id}>
                    <TableCell className="font-mono font-medium">{link.code}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">{baseUrl}/signup?ref={link.code}</TableCell>
                    <TableCell>{link.clicks}</TableCell>
                    <TableCell><Badge variant={link.actief ? "default" : "secondary"}>{link.actief ? "Actief" : "Inactief"}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => copyToClipboard(`${baseUrl}/signup?ref=${link.code}`)}><Copy className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteLink.mutate(link.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Codes Tab */}
        <TabsContent value="codes" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Jouw kortingscodes</h2>
              <p className="text-sm text-muted-foreground">Max: {instellingen?.max_korting_percentage ?? 25}% of €{instellingen?.max_korting_vast_bedrag ?? 50}</p>
            </div>
            <Button onClick={() => setShowCodeDialog(true)} size="sm"><Plus className="h-4 w-4 mr-1" /> Nieuwe code</Button>
          </div>
          <Card>
            <Table>
              <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Korting</TableHead><TableHead>Gebruik</TableHead><TableHead>Geldig tot</TableHead><TableHead>Status</TableHead><TableHead>Acties</TableHead></TableRow></TableHeader>
              <TableBody>
                {codes.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nog geen codes</TableCell></TableRow>}
                {codes.map((code: any) => (
                  <TableRow key={code.id}>
                    <TableCell className="font-mono font-bold">{code.code}</TableCell>
                    <TableCell>{code.korting_type === "percentage" ? `${code.korting_waarde}%` : `€${code.korting_waarde}`}</TableCell>
                    <TableCell>{code.aantal_gebruikt}{code.max_gebruik ? `/${code.max_gebruik}` : ""}</TableCell>
                    <TableCell>{code.geldig_tot || "Onbeperkt"}</TableCell>
                    <TableCell><Badge variant={code.actief ? "default" : "secondary"}>{code.actief ? "Actief" : "Inactief"}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => copyToClipboard(code.code)}><Copy className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteCode.mutate(code.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Klanten Tab */}
        <TabsContent value="klanten" className="space-y-4">
          <h2 className="text-lg font-semibold">Aangebrachte klanten</h2>
          <Card>
            <Table>
              <TableHeader><TableRow><TableHead>Bedrijf</TableHead><TableHead>Status</TableHead><TableHead>Commissie %</TableHead><TableHead>Verdiend</TableHead><TableHead>Aangemeld op</TableHead></TableRow></TableHeader>
              <TableBody>
                {referrals.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nog geen klanten</TableCell></TableRow>}
                {referrals.map((ref: any) => (
                  <TableRow key={ref.id}>
                    <TableCell className="font-medium">{ref.partners?.naam || "—"}</TableCell>
                    <TableCell><Badge variant={ref.status === "actief" ? "default" : "secondary"}>{ref.status}</Badge></TableCell>
                    <TableCell>{ref.commissie_percentage}%</TableCell>
                    <TableCell className="font-medium text-green-600">€{(ref.commissie_verdiend || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(ref.created_at).toLocaleDateString("nl-NL")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Link Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nieuwe affiliate link</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Link code (slug)</Label>
              <Input placeholder="bijv. jan-solar" value={linkCode} onChange={(e) => setLinkCode(e.target.value)} />
              <p className="text-xs text-muted-foreground">URL wordt: {baseUrl}/signup?ref={linkCode.toLowerCase().replace(/[^a-z0-9-]/g, "-") || "..."}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkDialog(false)}>Annuleren</Button>
            <Button onClick={() => createLink.mutate(linkCode)} disabled={!linkCode.trim()}>Aanmaken</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Code Dialog */}
      <Dialog open={showCodeDialog} onOpenChange={setShowCodeDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nieuwe kortingscode</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Code</Label><Input placeholder="bijv. SOLAR20" value={codeForm.code} onChange={(e) => setCodeForm(f => ({ ...f, code: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={codeForm.korting_type} onValueChange={(v) => setCodeForm(f => ({ ...f, korting_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="percentage">Percentage (%)</SelectItem><SelectItem value="vast_bedrag">Vast bedrag (€)</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Waarde</Label><Input type="number" value={codeForm.korting_waarde} onChange={(e) => setCodeForm(f => ({ ...f, korting_waarde: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Max gebruik</Label><Input type="number" placeholder="Onbeperkt" value={codeForm.max_gebruik} onChange={(e) => setCodeForm(f => ({ ...f, max_gebruik: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Geldig tot</Label><Input type="date" value={codeForm.geldig_tot} onChange={(e) => setCodeForm(f => ({ ...f, geldig_tot: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCodeDialog(false)}>Annuleren</Button>
            <Button onClick={() => createCode.mutate()} disabled={!codeForm.code.trim()}>Aanmaken</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Offerte Dialog */}
      <Dialog open={showOfferteDialog} onOpenChange={setShowOfferteDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nieuwe offerte aanmaken</DialogTitle>
            <DialogDescription>Maak een professionele offerte aan in de huisstijl van het platform.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Klant */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Klantgegevens</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Klantnaam *</Label><Input value={klantNaam} onChange={e => setKlantNaam(e.target.value)} /></div>
                <div className="space-y-1"><Label>Email *</Label><Input type="email" value={klantEmail} onChange={e => setKlantEmail(e.target.value)} /></div>
                <div className="space-y-1"><Label>Telefoon</Label><Input value={klantTelefoon} onChange={e => setKlantTelefoon(e.target.value)} /></div>
                <div className="space-y-1"><Label>Adres</Label><Input value={klantAdres} onChange={e => setKlantAdres(e.target.value)} /></div>
                <div className="space-y-1"><Label>Postcode</Label><Input value={klantPostcode} onChange={e => setKlantPostcode(e.target.value)} /></div>
                <div className="space-y-1"><Label>Plaats</Label><Input value={klantPlaats} onChange={e => setKlantPlaats(e.target.value)} /></div>
              </div>
            </div>

            <Separator />

            {/* Regels */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Offerteregels</h3>
                <Button type="button" variant="outline" size="sm" onClick={addRegel}><Plus className="h-3 w-3 mr-1" /> Regel</Button>
              </div>
              {regels.map((regel, idx) => (
                <div key={idx} className="border rounded-lg p-3 space-y-2 mb-3 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Regel {idx + 1}</span>
                    {regels.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => removeRegel(idx)} className="h-6 w-6 text-destructive"><X className="h-3 w-3" /></Button>}
                  </div>
                  <div className="space-y-1"><Label>Omschrijving *</Label><Input value={regel.omschrijving} onChange={e => updateRegel(idx, "omschrijving", e.target.value)} /></div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="space-y-1"><Label>Aantal</Label><Input type="number" min={1} value={regel.aantal} onChange={e => updateRegel(idx, "aantal", Number(e.target.value))} /></div>
                    <div className="space-y-1"><Label>Prijs excl.</Label><Input type="number" step="0.01" min={0} value={regel.prijs_per_stuk} onChange={e => updateRegel(idx, "prijs_per_stuk", Number(e.target.value))} /></div>
                    <div className="space-y-1"><Label>BTW %</Label><Input type="number" min={0} max={100} value={regel.btw_percentage} onChange={e => updateRegel(idx, "btw_percentage", Number(e.target.value))} /></div>
                    <div className="space-y-1"><Label>Korting %</Label><Input type="number" min={0} max={100} value={regel.korting_percentage} onChange={e => updateRegel(idx, "korting_percentage", Number(e.target.value))} /></div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    Subtotaal: {formatCurrency(regel.aantal * regel.prijs_per_stuk * (1 - regel.korting_percentage / 100))}
                  </div>
                </div>
              ))}
              <Separator className="my-3" />
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotaal excl. BTW</span><span>{formatCurrency(totals.subtotaal)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">BTW</span><span>{formatCurrency(totals.btwBedrag)}</span></div>
                <div className="flex justify-between font-semibold text-base border-t pt-2"><span>Totaal incl. BTW</span><span>{formatCurrency(totals.totaal)}</span></div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Betalingsvoorwaarden</Label><Input value={betalingsvoorwaarden} onChange={e => setBetalingsvoorwaarden(e.target.value)} placeholder="bijv. 30 dagen netto" /></div>
            </div>
            <div className="space-y-1"><Label>Notities</Label><Textarea value={notities} onChange={e => setNotities(e.target.value)} rows={2} placeholder="Eventuele opmerkingen..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOfferteDialog(false)}>Annuleren</Button>
            <Button onClick={() => createOfferte.mutate()} disabled={createOfferte.isPending}>
              {createOfferte.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
              Offerte aanmaken
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Affiliates;
