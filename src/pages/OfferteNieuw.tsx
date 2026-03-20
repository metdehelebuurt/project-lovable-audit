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
import { ArrowLeft, Plus, X, Save, Loader2, Sparkles, Palette } from "lucide-react";
import { LeadSearchInput } from "@/components/shared/LeadSearchInput";
import DatasheetCheckDialog from "@/components/offertes/DatasheetCheckDialog";
import BetalingsvoorwaardenSelect from "@/components/shared/BetalingsvoorwaardenSelect";
import { defaultTemplateConfig, type TemplateConfig } from "@/components/offertes/templates/templateRegistry";
import type { Database, Json } from "@/integrations/supabase/types";

type Product = Database["public"]["Tables"]["producten"]["Row"];

interface OfferteRegel {
  product_id?: string;
  omschrijving: string;
  offerte_tekst?: string;
  aantal: number;
  prijs_per_stuk: number;
  btw_percentage: number;
  korting_percentage: number;
  korting_bedrag: number;
  korting_type: "percentage" | "bedrag";
}

const emptyRegel: OfferteRegel = {
  omschrijving: "",
  aantal: 1,
  prijs_per_stuk: 0,
  btw_percentage: 21,
  korting_percentage: 0,
  korting_bedrag: 0,
  korting_type: "percentage",
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
  const [betalingsvoorwaarden, setBetalingsvoorwaarden] = useState("");
  const [customBetalingsvoorwaarden, setCustomBetalingsvoorwaarden] = useState("");
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
  const [templateConfig, setTemplateConfig] = useState<TemplateConfig>(() => {
    const raw = sessionStorage.getItem("offerte-template-config");
    if (raw) {
      try { return { ...defaultTemplateConfig, ...JSON.parse(raw) }; } catch {}
    }
    return defaultTemplateConfig;
  });
  const [generatingIntro, setGeneratingIntro] = useState(false);
  const [offerteKortingType, setOfferteKortingType] = useState<"percentage" | "bedrag">("percentage");
  const [offerteKortingWaarde, setOfferteKortingWaarde] = useState(0);

  // Reload template config when returning from template page
  useEffect(() => {
    const handleFocus = () => {
      const raw = sessionStorage.getItem("offerte-template-config");
      if (raw) {
        try { setTemplateConfig({ ...defaultTemplateConfig, ...JSON.parse(raw) }); } catch {}
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

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

  const { data: partnerTeksten = [] } = useQuery({
    queryKey: ["partner-product-teksten", profile?.partner_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("partner_product_teksten" as any)
        .select("product_id, offerte_tekst")
        .eq("partner_id", profile!.partner_id!);
      return ((data || []) as unknown) as Array<{ product_id: string; offerte_tekst: string }>;
    },
    enabled: !!profile?.partner_id,
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

  const regelSubtotaal = (r: OfferteRegel) => {
    const bruto = r.aantal * r.prijs_per_stuk;
    if (r.korting_type === "bedrag") return bruto - (r.korting_bedrag || 0);
    return bruto * (1 - (r.korting_percentage || 0) / 100);
  };

  const totals = useMemo(() => {
    let subtotaal = 0;
    let btwBedrag = 0;
    regels.forEach(r => {
      const s = regelSubtotaal(r);
      subtotaal += s;
      btwBedrag += s * (r.btw_percentage / 100);
    });
    // Offerte-level korting
    let offerteKorting = 0;
    if (offerteKortingWaarde > 0) {
      if (offerteKortingType === "percentage") {
        offerteKorting = subtotaal * (offerteKortingWaarde / 100);
      } else {
        offerteKorting = offerteKortingWaarde;
      }
    }
    const subtotaalNaKorting = subtotaal - offerteKorting;
    // Herbereken BTW over subtotaal na korting (proportioneel)
    const btwFactor = subtotaal > 0 ? btwBedrag / subtotaal : 0;
    const btwNaKorting = subtotaalNaKorting * btwFactor;
    return {
      subtotaal,
      offerteKorting,
      subtotaalNaKorting,
      btwBedrag: btwNaKorting,
      totaal: subtotaalNaKorting + btwNaKorting,
    };
  }, [regels, offerteKortingType, offerteKortingWaarde]);

  const addRegel = () => setRegels(p => [...p, { ...emptyRegel }]);
  const removeRegel = (idx: number) => setRegels(p => p.filter((_, i) => i !== idx));
  const updateRegel = (idx: number, field: keyof OfferteRegel, value: string | number) => {
    setRegels(p => p.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const selectProduct = (idx: number, productId: string) => {
    const product = producten.find(p => p.id === productId);
    if (product) {
      const partnerTekst = partnerTeksten.find(pt => pt.product_id === productId);
      const offerteTekst = partnerTekst?.offerte_tekst || (product as any).offerte_tekst || "";
      setRegels(p => p.map((r, i) => i === idx ? {
        ...r,
        product_id: product.id,
        omschrijving: `${product.naam}${product.merk ? ` — ${product.merk}` : ""}${product.model ? ` ${product.model}` : ""}`,
        offerte_tekst: offerteTekst,
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
        betalingsvoorwaarden: (betalingsvoorwaarden === "__custom__" ? customBetalingsvoorwaarden : betalingsvoorwaarden) || null,
        notities: notities || null,
        introductie_tekst: introductieTekst || null,
        garantie_voorwaarden: garantieVoorwaarden || null,
        installatie_termijn: installatieTermijn || null,
        lead_id: selectedLead?.id || null,
        schouw_id: schouwId || null,
        regels: regels as unknown as Json,
        template_config: {
          ...templateConfig,
          offerte_korting_type: offerteKortingType,
          offerte_korting_waarde: offerteKortingWaarde,
        } as unknown as Json,
        subtotaal: totals.subtotaalNaKorting,
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

    // Check which product-linked rows are missing a datasheet
    const productIds = regels.map(r => r.product_id).filter(Boolean) as string[];
    if (productIds.length > 0) {
      const missing = producten.filter(
        p => productIds.includes(p.id) && !p.datasheet_type
      ).map(p => ({ id: p.id, naam: p.naam, merk: p.merk, model: p.model }));

      if (missing.length > 0) {
        setProductsMissingDatasheet(missing);
        setDatasheetDialogOpen(true);
        return;
      }
    }

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
              <div>
                <Label>Betalingsvoorwaarden</Label>
                <BetalingsvoorwaardenSelect
                  partnerId={profile?.partner_id}
                  value={betalingsvoorwaarden}
                  onChange={setBetalingsvoorwaarden}
                  customValue={customBetalingsvoorwaarden}
                  onCustomChange={setCustomBetalingsvoorwaarden}
                />
              </div>
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
                <div className="grid grid-cols-5 gap-3">
                  <div><Label>Aantal</Label><Input type="number" min={1} value={regel.aantal} onChange={e => updateRegel(idx, "aantal", Number(e.target.value))} className="rounded-xl" /></div>
                  <div><Label>Prijs excl. BTW</Label><Input type="number" step="0.01" min={0} value={regel.prijs_per_stuk} onChange={e => updateRegel(idx, "prijs_per_stuk", Number(e.target.value))} className="rounded-xl" /></div>
                  <div><Label>BTW %</Label><Input type="number" min={0} max={100} value={regel.btw_percentage} onChange={e => updateRegel(idx, "btw_percentage", Number(e.target.value))} className="rounded-xl" /></div>
                  <div>
                    <Label>Korting type</Label>
                    <Select value={regel.korting_type || "percentage"} onValueChange={v => {
                      setRegels(p => p.map((r, i) => i === idx ? { ...r, korting_type: v as "percentage" | "bedrag", korting_percentage: 0, korting_bedrag: 0 } : r));
                    }}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="bedrag">Bedrag (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{regel.korting_type === "bedrag" ? "Korting €" : "Korting %"}</Label>
                    {regel.korting_type === "bedrag" ? (
                      <Input type="number" step="0.01" min={0} value={regel.korting_bedrag || 0} onChange={e => updateRegel(idx, "korting_bedrag", Number(e.target.value))} className="rounded-xl" />
                    ) : (
                      <Input type="number" min={0} max={100} value={regel.korting_percentage || 0} onChange={e => updateRegel(idx, "korting_percentage", Number(e.target.value))} className="rounded-xl" />
                    )}
                  </div>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  Subtotaal: {formatCurrency(regelSubtotaal(regel))}
                </div>
              </div>
            ))}

            <Separator />

            {/* Offerte-level korting */}
            <div className="border rounded-xl p-4 bg-muted/20">
              <Label className="text-sm font-medium">Korting over hele offerte</Label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                <Select value={offerteKortingType} onValueChange={v => { setOfferteKortingType(v as "percentage" | "bedrag"); setOfferteKortingWaarde(0); }}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="bedrag">Vast bedrag (€)</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={offerteKortingWaarde}
                  onChange={e => setOfferteKortingWaarde(Number(e.target.value))}
                  placeholder={offerteKortingType === "percentage" ? "bijv. 5" : "bijv. 250"}
                  className="rounded-xl"
                />
                <div className="flex items-center text-sm text-muted-foreground">
                  {offerteKortingWaarde > 0 && <>Korting: -{formatCurrency(totals.offerteKorting)}</>}
                </div>
              </div>
            </div>

            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotaal excl. BTW</span>
                <span>{formatCurrency(totals.subtotaal)}</span>
              </div>
              {totals.offerteKorting > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Korting ({offerteKortingType === "percentage" ? `${offerteKortingWaarde}%` : "vast bedrag"})</span>
                  <span>-{formatCurrency(totals.offerteKorting)}</span>
                </div>
              )}
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
              <div className="flex items-center justify-between mb-1">
                <Label>Introductietekst (optioneel)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-pill gap-1 text-xs"
                  disabled={generatingIntro || !klantNaam}
                  onClick={async () => {
                    setGeneratingIntro(true);
                    try {
                      const productContext = regels
                        .filter(r => r.product_id)
                        .map(r => {
                          const p = producten.find(pr => pr.id === r.product_id);
                          return p ? { naam: p.naam, merk: p.merk } : null;
                        })
                        .filter(Boolean);
                      const { data, error } = await supabase.functions.invoke("ai-offerte-intro", {
                        body: {
                          klant_naam: klantNaam,
                          klant_plaats: klantPlaats,
                          producten: productContext,
                          notities: notities,
                        },
                      });
                      if (error || data?.error) {
                        toast.error(data?.error || "AI intro genereren mislukt");
                      } else if (data?.intro) {
                        setIntroductieTekst(data.intro);
                        toast.success("Introductietekst gegenereerd");
                      }
                    } catch {
                      toast.error("AI intro genereren mislukt");
                    }
                    setGeneratingIntro(false);
                  }}
                >
                  {generatingIntro ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  AI Intro genereren
                </Button>
              </div>
              <Textarea value={introductieTekst} onChange={e => setIntroductieTekst(e.target.value)} className="rounded-xl" rows={3} placeholder="Persoonlijke begeleidende tekst voor de klant..." />
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
        <div className="flex items-center justify-between gap-3">
          <Button type="button" variant="outline" onClick={() => {
            sessionStorage.setItem("offerte-template-config", JSON.stringify(templateConfig));
            navigate("/offertes/template?return=/offertes/nieuw");
          }} className="rounded-pill gap-2">
            <Palette className="h-4 w-4" /> Template kiezen
          </Button>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => navigate("/offertes")} className="rounded-pill">Annuleren</Button>
            <Button type="submit" className="rounded-pill gap-2" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Offerte aanmaken
            </Button>
          </div>
        </div>
      </form>

      <DatasheetCheckDialog
        open={datasheetDialogOpen}
        onOpenChange={setDatasheetDialogOpen}
        products={productsMissingDatasheet}
        onComplete={() => {
          setDatasheetDialogOpen(false);
          saveMutation.mutate();
        }}
        onNavigateToProduct={(productId) => {
          navigate(`/producten/${productId}/datasheet`);
        }}
      />

    </div>
  );
};

export default OfferteNieuw;
