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
import { ArrowLeft, Save, Send } from "lucide-react";

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
  const { type } = useParams<{ type: string }>();
  const [searchParams] = useSearchParams();
  const docType = (type as DocType) || "verkoopfactuur";
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

  // Pre-fill from source document (creditnota) or offerte
  useEffect(() => {
    if (prefilled) return;
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
  }, [searchParams, prefilled, profile?.partner_id]);

  const handleSave = async (status: "concept" | "verzonden") => {
    if (!profile?.partner_id || !user?.id) return;

    // Validation
    if (isInkoop(docType) && !leverancierId) {
      toast({ title: "Selecteer een leverancier", variant: "destructive" });
      return;
    }
    if (!isInkoop(docType) && docType !== "pakbon" && !klantId) {
      toast({ title: "Selecteer een klant", variant: "destructive" });
      return;
    }

    setSaving(true);

    const brutoTotaal = regels.reduce((s, r) => s + r.aantal * r.prijs_per_stuk, 0);
    const subtotaal = regels.reduce((s, r) => s + regelSubtotaal(r), 0);
    const kortingTotaal = brutoTotaal - subtotaal;
    const btwBedrag = regels.reduce((s, r) => s + regelSubtotaal(r) * (r.btw_percentage / 100), 0);

    const { data: numData } = await supabase.rpc("generate_financieel_documentnummer", {
      _partner_id: profile.partner_id,
      _type: docType,
    });

    const doc: any = {
      partner_id: profile.partner_id,
      type: docType,
      documentnummer: numData || `${docType.substring(0, 2).toUpperCase()}-${Date.now()}`,
      status,
      klant_id: !isInkoop(docType) && klantId ? klantId : null,
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
    };

    const { data, error } = await supabase.from("financiele_documenten").insert(doc).select().single();
    setSaving(false);

    if (error) {
      toast({ title: "Fout", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Opgeslagen", description: `${typeLabels[docType]} ${data.documentnummer} aangemaakt` });
      navigate(`/financieel/${data.id}`);
    }
  };

  const saveLabel = docType === "inkooporder" ? "Opslaan & Bestelling verzenden" : "Opslaan & Verzenden";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/financieel")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nieuwe {typeLabels[docType]}</h1>
          <p className="text-muted-foreground">
            {docType === "inkooporder"
              ? "Stel een bestelling samen voor je leverancier"
              : docType === "pakbon"
              ? "Maak een pakbon/afleverbon aan voor een installatie"
              : "Vul de gegevens in en voeg regels toe"}
          </p>
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
