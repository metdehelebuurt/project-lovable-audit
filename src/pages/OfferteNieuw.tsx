import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ArrowLeft, Plus, X, Save, Loader2 } from "lucide-react";
import { LeadSearchInput } from "@/components/shared/LeadSearchInput";
import DatasheetCheckDialog from "@/components/offertes/DatasheetCheckDialog";
import type { Database, Json } from "@/integrations/supabase/types";

type Product = Database["public"]["Tables"]["producten"]["Row"];

interface OfferteRegel {
  product_id?: string;
  omschrijving: string;
  aantal: number;
  prijs_per_stuk: number;
  btw_percentage: number;
  korting_percentage: number;
}

const emptyRegel: OfferteRegel = {
  omschrijving: "",
  aantal: 1,
  prijs_per_stuk: 0,
  btw_percentage: 21,
  korting_percentage: 0,
};

interface SelectedLead {
  id: string;
  voornaam: string;
  achternaam: string;
  email: string;
  telefoon: string | null;
  adres: string | null;
  postcode: string | null;
  plaats: string | null;
}

const generateOfferteNummer = () => {
  const d = new Date();
  const yy = d.getFullYear().toString().slice(2);
  const mm = (d.getMonth() + 1).toString().padStart(2, "0");
  const dd = d.getDate().toString().padStart(2, "0");
  const rand = Math.floor(Math.random() * 9999).toString().padStart(4, "0");
  return `OF-${yy}${mm}${dd}-${rand}`;
};

const formatCurrency = (n: number) => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

const OfferteNieuw = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedLead, setSelectedLead] = useState<SelectedLead | null>(null);
  const [klantNaam, setKlantNaam] = useState("");
  const [klantEmail, setKlantEmail] = useState("");
  const [klantTelefoon, setKlantTelefoon] = useState("");
  const [klantAdres, setKlantAdres] = useState("");
  const [klantPostcode, setKlantPostcode] = useState("");
  const [klantPlaats, setKlantPlaats] = useState("");
  const [geldigTot, setGeldigTot] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [betalingsvoorwaarden, setBetalingsvoorwaarden] = useState("30 dagen netto");
  const [notities, setNotities] = useState("");
  const [introductieTekst, setIntroductieTekst] = useState("");
  const [garantieVoorwaarden, setGarantieVoorwaarden] = useState("Productgarantie conform fabrikant. Installatiegarantie: 2 jaar.");
  const [installatieTermijn, setInstallatieTermijn] = useState("Binnen 4 weken na akkoord");
  const [regels, setRegels] = useState<OfferteRegel[]>([{ ...emptyRegel }]);
  const [includeSchouw, setIncludeSchouw] = useState(false);
  const [includeEnergieadvies, setIncludeEnergieadvies] = useState(false);
  const [schouwId, setSchouwId] = useState("");
  const [datasheetDialogOpen, setDatasheetDialogOpen] = useState(false);
  const [productsMissingDatasheet, setProductsMissingDatasheet] = useState<Array<{ id: string; naam: string; merk: string | null; model: string | null }>>([]);

  // Prefill from sessionStorage
  useEffect(() => {
    const raw = sessionStorage.getItem("offerte-prefill");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.regels) && parsed.regels.length > 0) {
          setRegels(parsed.regels);
        }
        if (parsed.lead) {
          setSelectedLead(parsed.lead);
          setKlantNaam(`${parsed.lead.voornaam} ${parsed.lead.achternaam}`);
          setKlantEmail(parsed.lead.email);
          setKlantTelefoon(parsed.lead.telefoon || "");
          setKlantAdres(parsed.lead.adres || "");
          setKlantPostcode(parsed.lead.postcode || "");
          setKlantPlaats(parsed.lead.plaats || "");
        }
      } catch {}
      sessionStorage.removeItem("offerte-prefill");
    }
  }, []);

  const { data: producten = [] } = useQuery({
    queryKey: ["producten-for-offertes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("producten").select("*").eq("status", "actief").order("naam");
      if (error) throw error;
      return data as Product[];
    },
  });

  const { data: schouwen = [] } = useQuery({
    queryKey: ["schouwen-for-offertes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("schouwen").select("id, schouw_nummer, categorie, consument_naam");
      if (error) throw error;
      return data;
    },
  });

  const handleLeadSelect = (lead: SelectedLead) => {
    setSelectedLead(lead);
    setKlantNaam(`${lead.voornaam} ${lead.achternaam}`);
    setKlantEmail(lead.email);
    setKlantTelefoon(lead.telefoon || "");
    setKlantAdres(lead.adres || "");
    setKlantPostcode(lead.postcode || "");
    setKlantPlaats(lead.plaats || "");
  };

  const handleClearLead = () => {
    setSelectedLead(null);
  };

  const totals = useMemo(() => {
    let subtotaal = 0;
    let btwBedrag = 0;
    regels.forEach(r => {
      const s = r.aantal * r.prijs_per_stuk * (1 - r.korting_percentage / 100);
      subtotaal += s;
      btwBedrag += s * (r.btw_percentage / 100);
    });
    return { subtotaal, btwBedrag, totaal: subtotaal + btwBedrag };
  }, [regels]);

  const addRegel = () => setRegels(p => [...p, { ...emptyRegel }]);
  const removeRegel = (idx: number) => setRegels(p => p.filter((_, i) => i !== idx));
  const updateRegel = (idx: number, field: keyof OfferteRegel, value: string | number) => {
    setRegels(p => p.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const selectProduct = (idx: number, productId: string) => {
    const product = producten.find(p => p.id === productId);
    if (product) {
      setRegels(p => p.map((r, i) => i === idx ? {
        ...r,
        product_id: product.id,
        omschrijving: `${product.naam}${product.merk ? ` — ${product.merk}` : ""}${product.model ? ` ${product.model}` : ""}`,
        prijs_per_stuk: product.prijs_excl_btw,
        btw_percentage: product.btw_percentage ?? 21,
      } : r));
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const record: any = {
        klant_naam: klantNaam,
        klant_email: klantEmail,
        klant_telefoon: klantTelefoon || null,
        klant_adres: klantAdres || null,
        klant_postcode: klantPostcode || null,
        klant_plaats: klantPlaats || null,
        geldig_tot: geldigTot,
        betalingsvoorwaarden: betalingsvoorwaarden || null,
        notities: notities || null,
        introductie_tekst: introductieTekst || null,
        garantie_voorwaarden: garantieVoorwaarden || null,
        installatie_termijn: installatieTermijn || null,
        lead_id: selectedLead?.id || null,
        schouw_id: schouwId || null,
        regels: regels as unknown as Json,
        subtotaal: totals.subtotaal,
        btw_bedrag: totals.btwBedrag,
        totaal_bedrag: totals.totaal,
        include_schouw: includeSchouw,
        include_energieadvies: includeEnergieadvies,
        partner_id: profile?.partner_id,
        adviseur_id: profile?.id,
        offertenummer: generateOfferteNummer(),
      };
      const { error } = await supabase.from("offertes").insert(record);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offertes"] });
      toast.success("Offerte aangemaakt");
      navigate("/offertes");
    },
    onError: (err: Error) => toast.error("Fout", { description: err.message }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!klantNaam || !klantEmail) { toast.error("Vul klantnaam en e-mail in"); return; }
    if (regels.length === 0) { toast.error("Voeg minimaal één regel toe"); return; }
    saveMutation.mutate();
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/offertes")} className="rounded-xl">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Nieuwe offerte</h1>
          <p className="text-muted-foreground text-sm">Maak een offerte aan en koppel optioneel aan een lead</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Lead koppeling */}
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Lead koppelen</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <LeadSearchInput
              selectedLead={selectedLead}
              onSelectLead={handleLeadSelect}
              onClearLead={handleClearLead}
            />
          </CardContent>
        </Card>

        {/* Klantgegevens */}
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Klantgegevens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Klantnaam *</Label><Input value={klantNaam} onChange={e => setKlantNaam(e.target.value)} required className="rounded-xl" /></div>
              <div><Label>E-mail *</Label><Input type="email" value={klantEmail} onChange={e => setKlantEmail(e.target.value)} required className="rounded-xl" /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Telefoon</Label><Input value={klantTelefoon} onChange={e => setKlantTelefoon(e.target.value)} className="rounded-xl" /></div>
              <div><Label>Adres</Label><Input value={klantAdres} onChange={e => setKlantAdres(e.target.value)} className="rounded-xl" /></div>
              <div><Label>Postcode</Label><Input value={klantPostcode} onChange={e => setKlantPostcode(e.target.value)} className="rounded-xl" /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Plaats</Label><Input value={klantPlaats} onChange={e => setKlantPlaats(e.target.value)} className="rounded-xl" /></div>
              <div><Label>Geldig tot *</Label><Input type="date" value={geldigTot} onChange={e => setGeldigTot(e.target.value)} required className="rounded-xl" /></div>
              <div><Label>Betalingsvoorwaarden</Label><Input value={betalingsvoorwaarden} onChange={e => setBetalingsvoorwaarden(e.target.value)} className="rounded-xl" /></div>
            </div>
          </CardContent>
        </Card>

        {/* Schouw koppeling */}
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Schouw & opties</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Koppel aan schouw</Label>
              <Select value={schouwId || "none"} onValueChange={v => setSchouwId(v === "none" ? "" : v)}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecteer schouw (optioneel)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Geen schouw</SelectItem>
                  {schouwen.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.schouw_nummer} — {s.consument_naam}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {schouwId && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox id="inc_schouw" checked={includeSchouw} onCheckedChange={c => setIncludeSchouw(!!c)} />
                  <Label htmlFor="inc_schouw" className="cursor-pointer text-sm">Schouwgegevens opnemen in PDF</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="inc_energie" checked={includeEnergieadvies} onCheckedChange={c => setIncludeEnergieadvies(!!c)} />
                  <Label htmlFor="inc_energie" className="cursor-pointer text-sm">Energieadvies opnemen in PDF</Label>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Offerteregels */}
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Offerteregels</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addRegel} className="rounded-pill gap-1">
                <Plus className="h-3 w-3" /> Regel
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {regels.map((regel, idx) => (
              <div key={idx} className="border rounded-xl p-4 space-y-3 bg-muted/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Regel {idx + 1}</span>
                  {regels.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeRegel(idx)} className="h-6 w-6 text-destructive">
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div>
                  <Label>Product</Label>
                  <Select value={regel.product_id || "none"} onValueChange={v => v !== "none" && selectProduct(idx, v)}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecteer product (optioneel)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Handmatig invoeren</SelectItem>
                      {producten.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.naam} — {formatCurrency(p.prijs_excl_btw)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Omschrijving *</Label><Input value={regel.omschrijving} onChange={e => updateRegel(idx, "omschrijving", e.target.value)} required className="rounded-xl" /></div>
                <div className="grid grid-cols-4 gap-3">
                  <div><Label>Aantal</Label><Input type="number" min={1} value={regel.aantal} onChange={e => updateRegel(idx, "aantal", Number(e.target.value))} className="rounded-xl" /></div>
                  <div><Label>Prijs excl. BTW</Label><Input type="number" step="0.01" min={0} value={regel.prijs_per_stuk} onChange={e => updateRegel(idx, "prijs_per_stuk", Number(e.target.value))} className="rounded-xl" /></div>
                  <div><Label>BTW %</Label><Input type="number" min={0} max={100} value={regel.btw_percentage} onChange={e => updateRegel(idx, "btw_percentage", Number(e.target.value))} className="rounded-xl" /></div>
                  <div><Label>Korting %</Label><Input type="number" min={0} max={100} value={regel.korting_percentage} onChange={e => updateRegel(idx, "korting_percentage", Number(e.target.value))} className="rounded-xl" /></div>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  Subtotaal: {formatCurrency(regel.aantal * regel.prijs_per_stuk * (1 - regel.korting_percentage / 100))}
                </div>
              </div>
            ))}

            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotaal excl. BTW</span>
                <span>{formatCurrency(totals.subtotaal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">BTW</span>
                <span>{formatCurrency(totals.btwBedrag)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg border-t pt-2">
                <span>Totaal incl. BTW</span>
                <span>{formatCurrency(totals.totaal)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Extra velden */}
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Offerte inhoud</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Introductietekst (optioneel)</Label>
              <Textarea value={introductieTekst} onChange={e => setIntroductieTekst(e.target.value)} className="rounded-xl mt-1" rows={3} placeholder="Persoonlijke begeleidende tekst voor de klant..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Garantievoorwaarden</Label>
                <Textarea value={garantieVoorwaarden} onChange={e => setGarantieVoorwaarden(e.target.value)} className="rounded-xl mt-1" rows={2} placeholder="Garantievoorwaarden..." />
              </div>
              <div>
                <Label>Installatietermijn</Label>
                <Input value={installatieTermijn} onChange={e => setInstallatieTermijn(e.target.value)} className="rounded-xl" placeholder="Bijv. Binnen 4 weken na akkoord" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notities */}
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="pt-6">
            <Label>Notities</Label>
            <Textarea value={notities} onChange={e => setNotities(e.target.value)} className="rounded-xl mt-1" rows={3} placeholder="Eventuele opmerkingen..." />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/offertes")} className="rounded-pill">Annuleren</Button>
          <Button type="submit" className="rounded-pill gap-2" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Offerte aanmaken
          </Button>
        </div>
      </form>
    </div>
  );
};

export default OfferteNieuw;
