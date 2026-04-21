import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DocumentRegelEditor } from "@/components/financieel/DocumentRegelEditor";
import { OfferteRegel, emptyOfferteRegel, regelSubtotaal } from "@/types/offerte";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Send, UserPlus } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import FactuurContextCard from "@/components/financieel/FactuurContextCard";
import TermijnFactuurSelector, { type TermijnModus } from "@/components/financieel/TermijnFactuurDialog";
import BetalingsvoorwaardenSelect from "@/components/shared/BetalingsvoorwaardenSelect";
import { buildFactuurFromOfferte, buildTermijnRegels, type OfferteConversieResult } from "@/lib/factuurFromOfferte";

type DocType = "verkoopfactuur" | "creditnota" | "inkoopfactuur" | "inkooporder" | "pakbon";

const typeLabels: Record<DocType, string> = {
  verkoopfactuur: "Verkoopfactuur",
  creditnota: "Creditnota",
  inkoopfactuur: "Inkoopfactuur",
  inkooporder: "Inkooporder",
  pakbon: "Pakbon",
};

const isInkoop = (t: DocType) => t === "inkoopfactuur" || t === "inkooporder";

export default function FactuurNieuw() {
  const { type, id: editId } = useParams<{ type: string; id: string }>();
  const [searchParams] = useSearchParams();
  const docType = (type as DocType) || "verkoopfactuur";
  const isEdit = !!editId;
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { toast } = useToast();

  const [klanten, setKlanten] = useState<any[]>([]);
  const [leveranciers, setLeveranciers] = useState<any[]>([]);
  const [installaties, setInstallaties] = useState<any[]>([]);
  const [regels, setRegels] = useState<OfferteRegel[]>([{ ...emptyOfferteRegel }]);
  const [klantId, setKlantId] = useState("");
  const [leverancierId, setLeverancierId] = useState("");
  const [installatieId, setInstallatieId] = useState("");
  const [betalingstermijn, setBetalingstermijn] = useState(30);
  const [notities, setNotities] = useState("");
  const [saving, setSaving] = useState(false);
  const [bronOfferteId, setBronOfferteId] = useState<string | null>(null);
  const [bronDocId, setBronDocId] = useState<string | null>(null);
  const [prefilled, setPrefilled] = useState(false);

  // Eenmalige relatie state
  const [useEenmalig, setUseEenmalig] = useState(false);
  const [eenmaligNaam, setEenmaligNaam] = useState("");
  const [eenmaligEmail, setEenmaligEmail] = useState("");
  const [eenmaligAdres, setEenmaligAdres] = useState("");
  const [eenmaligPostcode, setEenmaligPostcode] = useState("");
  const [eenmaligPlaats, setEenmaligPlaats] = useState("");
  const [eenmaligTelefoon, setEenmaligTelefoon] = useState("");

  // Existing documentnummer for editing
  const [existingDocNummer, setExistingDocNummer] = useState("");

  // Offerte-context (voor context-card, dubbel-check, termijn)
  const [offerteContext, setOfferteContext] = useState<OfferteConversieResult | null>(null);
  const [resyncing, setResyncing] = useState(false);
  const [termijnModus, setTermijnModus] = useState<TermijnModus>("volledig");
  const [termijnPercentage, setTermijnPercentage] = useState(30);
  const [betalingsvoorwaardenTekst, setBetalingsvoorwaardenTekst] = useState("");
  const [bvCustom, setBvCustom] = useState("");

  const isVerkoopfactuur = docType === "verkoopfactuur";

  const applyOfferteContext = (ctx: OfferteConversieResult) => {
    setOfferteContext(ctx);
    setBronOfferteId(ctx.offerte.id);
    const regelsToUse = buildTermijnRegels(ctx, termijnModus, termijnPercentage);
    setRegels(regelsToUse.length > 0 ? regelsToUse : [{ ...emptyOfferteRegel }]);
    setBetalingstermijn(ctx.betalingstermijn);
    if (ctx.betalingsvoorwaardenTekst) setBetalingsvoorwaardenTekst(ctx.betalingsvoorwaardenTekst);
    setNotities(ctx.notities);
    if (ctx.installatieId) setInstallatieId(ctx.installatieId);
    if (ctx.klantId) {
      setKlantId(ctx.klantId);
      setUseEenmalig(false);
    } else if (ctx.eenmalig) {
      setUseEenmalig(true);
      setKlantId("");
      setEenmaligNaam(ctx.eenmalig.naam);
      setEenmaligEmail(ctx.eenmalig.email || "");
      setEenmaligAdres(ctx.eenmalig.adres || "");
      setEenmaligPostcode(ctx.eenmalig.postcode || "");
      setEenmaligPlaats(ctx.eenmalig.plaats || "");
      setEenmaligTelefoon(ctx.eenmalig.telefoon || "");
    }
  };

  const handleResync = async () => {
    if (!offerteContext || !profile?.partner_id) return;
    setResyncing(true);
    try {
      const ctx = await buildFactuurFromOfferte(offerteContext.offerte.id, profile.partner_id);
      applyOfferteContext(ctx);
      toast({ title: "Gesynchroniseerd", description: "Gegevens opnieuw opgehaald uit de offerte" });
    } catch (e: any) {
      toast({ title: "Sync mislukt", description: e.message, variant: "destructive" });
    } finally {
      setResyncing(false);
    }
  };

  // Load klanten/leveranciers/installaties
  useEffect(() => {
    if (!profile?.partner_id) return;
    if (isInkoop(docType)) {
      supabase.from("leveranciers").select("id, naam, email").eq("partner_id", profile.partner_id).then(({ data }) => setLeveranciers(data || []));
    } else {
      supabase.from("klanten").select("id, voornaam, achternaam, bedrijfsnaam").eq("partner_id", profile.partner_id).then(({ data }) => setKlanten(data || []));
    }
    if (docType === "pakbon") {
      supabase
        .from("installaties")
        .select("id, consument_naam, geplande_startdatum, status")
        .eq("partner_id", profile.partner_id)
        .in("status", ["gepland", "in_uitvoering"])
        .order("geplande_startdatum", { ascending: true })
        .then(({ data }) => setInstallaties(data || []));
    }
  }, [profile?.partner_id, docType]);

  // Load existing document for editing
  useEffect(() => {
    if (!editId || prefilled) return;
    supabase
      .from("financiele_documenten")
      .select("*")
      .eq("id", editId)
      .single()
      .then(({ data }) => {
        if (!data) return;
        const docRegels = (Array.isArray(data.regels) ? data.regels : []) as unknown as OfferteRegel[];
        setRegels(docRegels.length > 0 ? docRegels : [{ ...emptyOfferteRegel }]);
        if (data.klant_id) setKlantId(data.klant_id);
        if (data.leverancier_id) setLeverancierId(data.leverancier_id);
        if (data.installatie_id) setInstallatieId(data.installatie_id);
        setBetalingstermijn(data.betalingstermijn_dagen || 30);
        setNotities(data.notities || "");
        setExistingDocNummer(data.documentnummer);
        if (data.offerte_id) setBronOfferteId(data.offerte_id);
        // Eenmalige relatie
        const er = data.eenmalige_relatie as any;
        if (er && typeof er === "object" && er.naam) {
          setUseEenmalig(true);
          setEenmaligNaam(er.naam || "");
          setEenmaligEmail(er.email || "");
          setEenmaligAdres(er.adres || "");
          setEenmaligPostcode(er.postcode || "");
          setEenmaligPlaats(er.plaats || "");
          setEenmaligTelefoon(er.telefoon || "");
        }
        setPrefilled(true);
      });
  }, [editId, prefilled]);

  // Pre-fill from source document (creditnota) or offerte
  useEffect(() => {
    if (prefilled || isEdit) return;
    const bronId = searchParams.get("bron");
    const offerteId = searchParams.get("offerte");

    if (bronId) {
      setBronDocId(bronId);
      supabase
        .from("financiele_documenten")
        .select("*")
        .eq("id", bronId)
        .single()
        .then(({ data }) => {
          if (!data) return;
          const bronRegels = (Array.isArray(data.regels) ? data.regels : []) as unknown as OfferteRegel[];
          setRegels(bronRegels.length > 0 ? bronRegels : [{ ...emptyOfferteRegel }]);
          if (data.klant_id) setKlantId(data.klant_id);
          if (data.leverancier_id) setLeverancierId(data.leverancier_id);
          setBetalingstermijn(data.betalingstermijn_dagen || 30);
          setNotities(`Creditnota bij ${data.documentnummer}`);
          setPrefilled(true);
        });
    } else if (offerteId) {
      setBronOfferteId(offerteId);
      supabase
        .from("offertes")
        .select("*")
        .eq("id", offerteId)
        .single()
        .then(({ data: offerte }) => {
          if (!offerte) return;
          const offerteRegels = (offerte.regels || []) as any[];
          const mapped: OfferteRegel[] = offerteRegels.map((r: any) => ({
            omschrijving: r.omschrijving || "",
            offerte_tekst: r.offerte_tekst || "",
            aantal: r.aantal || 1,
            prijs_per_stuk: r.prijs_per_stuk || 0,
            btw_percentage: r.btw_percentage ?? 21,
            korting_percentage: r.korting_percentage || 0,
            korting_bedrag: r.korting_bedrag || 0,
            korting_type: r.korting_type || "percentage",
          }));
          setRegels(mapped.length > 0 ? mapped : [{ ...emptyOfferteRegel }]);
          setNotities(`Factuur bij offerte ${offerte.offertenummer}`);
          if (profile?.partner_id && offerte.klant_email) {
            supabase
              .from("klanten")
              .select("id")
              .eq("partner_id", profile.partner_id)
              .eq("email", offerte.klant_email)
              .limit(1)
              .then(({ data: klantData }) => {
                if (klantData && klantData.length > 0) setKlantId(klantData[0].id);
              });
          }
          setPrefilled(true);
        });
    }
  }, [searchParams, prefilled, profile?.partner_id, isEdit]);

  const handleSave = async (status: "concept" | "verzonden") => {
    if (!profile?.partner_id || !user?.id) return;

    // Validation
    if (isInkoop(docType) && !leverancierId) {
      toast({ title: "Selecteer een leverancier", variant: "destructive" });
      return;
    }
    if (!isInkoop(docType) && docType !== "pakbon" && !klantId && !useEenmalig) {
      toast({ title: "Selecteer een klant of vul eenmalige gegevens in", variant: "destructive" });
      return;
    }
    if (useEenmalig && !eenmaligNaam.trim()) {
      toast({ title: "Vul minimaal een naam in voor de eenmalige relatie", variant: "destructive" });
      return;
    }

    setSaving(true);

    const brutoTotaal = regels.reduce((s, r) => s + r.aantal * r.prijs_per_stuk, 0);
    const subtotaal = regels.reduce((s, r) => s + regelSubtotaal(r), 0);
    const kortingTotaal = brutoTotaal - subtotaal;
    const btwBedrag = regels.reduce((s, r) => s + regelSubtotaal(r) * (r.btw_percentage / 100), 0);

    const eenmaligData = useEenmalig
      ? {
          naam: eenmaligNaam.trim(),
          email: eenmaligEmail.trim() || null,
          adres: eenmaligAdres.trim() || null,
          postcode: eenmaligPostcode.trim() || null,
          plaats: eenmaligPlaats.trim() || null,
          telefoon: eenmaligTelefoon.trim() || null,
        }
      : null;

    if (isEdit) {
      // UPDATE bestaand document
      const updates: any = {
        klant_id: !isInkoop(docType) && klantId && !useEenmalig ? klantId : null,
        leverancier_id: isInkoop(docType) && leverancierId ? leverancierId : null,
        installatie_id: docType === "pakbon" && installatieId ? installatieId : null,
        regels: regels as any,
        subtotaal,
        btw_bedrag: btwBedrag,
        totaal_bedrag: subtotaal + btwBedrag,
        korting_totaal: kortingTotaal,
        betalingstermijn_dagen: betalingstermijn,
        vervaldatum: new Date(Date.now() + betalingstermijn * 86400000).toISOString().split("T")[0],
        notities,
        eenmalige_relatie: eenmaligData,
        status,
      };

      const { error } = await supabase.from("financiele_documenten").update(updates).eq("id", editId);
      setSaving(false);
      if (error) {
        toast({ title: "Fout", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Opgeslagen", description: `${typeLabels[docType]} ${existingDocNummer} bijgewerkt` });
        navigate(`/financieel/${editId}`);
      }
    } else {
      // INSERT nieuw document
      const { data: numData } = await supabase.rpc("generate_financieel_documentnummer", {
        _partner_id: profile.partner_id,
        _type: docType,
      });

      const doc: any = {
        partner_id: profile.partner_id,
        type: docType,
        documentnummer: numData || `${docType.substring(0, 2).toUpperCase()}-${Date.now()}`,
        status,
        klant_id: !isInkoop(docType) && klantId && !useEenmalig ? klantId : null,
        leverancier_id: isInkoop(docType) && leverancierId ? leverancierId : null,
        offerte_id: bronOfferteId || null,
        installatie_id: docType === "pakbon" && installatieId ? installatieId : null,
        regels: regels as any,
        subtotaal,
        btw_bedrag: btwBedrag,
        totaal_bedrag: subtotaal + btwBedrag,
        korting_totaal: kortingTotaal,
        betalingstermijn_dagen: betalingstermijn,
        factuurdatum: new Date().toISOString().split("T")[0],
        vervaldatum: new Date(Date.now() + betalingstermijn * 86400000).toISOString().split("T")[0],
        notities,
        created_by: user.id,
        eenmalige_relatie: eenmaligData,
      };

      const { data, error } = await supabase.from("financiele_documenten").insert(doc).select().single();
      setSaving(false);

      if (error) {
        toast({ title: "Fout", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Opgeslagen", description: `${typeLabels[docType]} ${data.documentnummer} aangemaakt` });
        navigate(`/financieel/${data.id}`);
      }
    }
  };

  const saveLabel = docType === "inkooporder" ? "Opslaan & Bestelling verzenden" : "Opslaan & Verzenden";
  const showKlantSection = !isInkoop(docType) && docType !== "pakbon";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(isEdit ? `/financieel/${editId}` : "/financieel")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isEdit ? `${typeLabels[docType]} bewerken` : `Nieuwe ${typeLabels[docType]}`}
          </h1>
          {isEdit && existingDocNummer && (
            <p className="text-muted-foreground">{existingDocNummer}</p>
          )}
          {!isEdit && (
            <p className="text-muted-foreground">
              {docType === "inkooporder"
                ? "Stel een bestelling samen voor je leverancier"
                : docType === "pakbon"
                ? "Maak een pakbon/afleverbon aan voor een installatie"
                : "Vul de gegevens in en voeg regels toe"}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Gegevens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isInkoop(docType) ? (
              <div className="space-y-2">
                <Label>Leverancier</Label>
                <Select value={leverancierId} onValueChange={setLeverancierId}>
                  <SelectTrigger><SelectValue placeholder="Selecteer leverancier" /></SelectTrigger>
                  <SelectContent>
                    {leveranciers.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.naam}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {leveranciers.length === 0 && (
                  <Button variant="link" className="p-0 h-auto text-xs" onClick={() => navigate("/leveranciers")}>
                    + Leverancier toevoegen
                  </Button>
                )}
              </div>
            ) : docType === "pakbon" ? (
              <div className="space-y-2">
                <Label>Klant (optioneel)</Label>
                <Select value={klantId} onValueChange={setKlantId}>
                  <SelectTrigger><SelectValue placeholder="Selecteer klant" /></SelectTrigger>
                  <SelectContent>
                    {klanten.map((k) => (
                      <SelectItem key={k.id} value={k.id}>
                        {k.bedrijfsnaam || `${k.voornaam} ${k.achternaam}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <>
                {/* Toggle: bestaande klant of eenmalige relatie */}
                <div className="flex items-center justify-between">
                  <Label>Eenmalige relatie</Label>
                  <Switch
                    checked={useEenmalig}
                    onCheckedChange={(v) => {
                      setUseEenmalig(v);
                      if (v) setKlantId("");
                    }}
                  />
                </div>

                {!useEenmalig ? (
                  <div className="space-y-2">
                    <Label>Klant</Label>
                    <Select value={klantId} onValueChange={setKlantId}>
                      <SelectTrigger><SelectValue placeholder="Selecteer klant" /></SelectTrigger>
                      <SelectContent>
                        {klanten.map((k) => (
                          <SelectItem key={k.id} value={k.id}>
                            {k.bedrijfsnaam || `${k.voornaam} ${k.achternaam}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-3 p-3 rounded-lg border border-dashed bg-muted/30">
                    <div className="space-y-1">
                      <Label className="text-xs">Naam *</Label>
                      <Input value={eenmaligNaam} onChange={(e) => setEenmaligNaam(e.target.value)} placeholder="Naam of bedrijfsnaam" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">E-mail</Label>
                      <Input value={eenmaligEmail} onChange={(e) => setEenmaligEmail(e.target.value)} placeholder="email@voorbeeld.nl" type="email" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Adres</Label>
                      <Input value={eenmaligAdres} onChange={(e) => setEenmaligAdres(e.target.value)} placeholder="Straat + nummer" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Postcode</Label>
                        <Input value={eenmaligPostcode} onChange={(e) => setEenmaligPostcode(e.target.value)} placeholder="1234 AB" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Plaats</Label>
                        <Input value={eenmaligPlaats} onChange={(e) => setEenmaligPlaats(e.target.value)} placeholder="Plaats" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Telefoon</Label>
                      <Input value={eenmaligTelefoon} onChange={(e) => setEenmaligTelefoon(e.target.value)} placeholder="06-12345678" />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Installatie koppeling voor pakbonnen */}
            {docType === "pakbon" && (
              <div className="space-y-2">
                <Label>Gekoppelde installatie</Label>
                <Select value={installatieId} onValueChange={setInstallatieId}>
                  <SelectTrigger><SelectValue placeholder="Selecteer installatie" /></SelectTrigger>
                  <SelectContent>
                    {installaties.map((inst) => (
                      <SelectItem key={inst.id} value={inst.id}>
                        {inst.consument_naam || "Installatie"} — {inst.geplande_startdatum
                          ? new Date(inst.geplande_startdatum).toLocaleDateString("nl-NL")
                          : "Geen datum"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {installaties.length === 0 && (
                  <p className="text-xs text-muted-foreground">Geen geplande installaties gevonden</p>
                )}
              </div>
            )}

            {docType !== "pakbon" && (
              <div className="space-y-2">
                <Label>Betalingstermijn (dagen)</Label>
                <Select value={String(betalingstermijn)} onValueChange={(v) => setBetalingstermijn(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="14">14 dagen</SelectItem>
                    <SelectItem value="30">30 dagen</SelectItem>
                    <SelectItem value="60">60 dagen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Notities</Label>
              <Textarea value={notities} onChange={(e) => setNotities(e.target.value)} placeholder="Interne notities..." rows={3} />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">
              {docType === "pakbon" ? "Artikelen" : docType === "inkooporder" ? "Bestelregels" : "Regels"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentRegelEditor regels={regels} onChange={setRegels} hidePricing={docType === "pakbon"} />
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => handleSave("concept")} disabled={saving}>
          <Save className="h-4 w-4 mr-2" /> Opslaan als concept
        </Button>
        <Button onClick={() => handleSave("verzonden")} disabled={saving}>
          <Send className="h-4 w-4 mr-2" /> {saveLabel}
        </Button>
      </div>
    </div>
  );
}
