import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { DocumentRegelEditor } from "@/components/financieel/DocumentRegelEditor";
import { OfferteRegel, emptyOfferteRegel, regelSubtotaal } from "@/types/offerte";
import { LeadSearchInput } from "@/components/shared/LeadSearchInput";

const OpdrachtNieuw = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [klant, setKlant] = useState({
    naam: "",
    email: "",
    telefoon: "",
    adres: "",
    postcode: "",
    plaats: "",
  });
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [notities, setNotities] = useState("");
  const [regels, setRegels] = useState<OfferteRegel[]>([{ ...emptyOfferteRegel }]);

  const subtotaal = regels.reduce((s, r) => s + regelSubtotaal(r), 0);
  const btwBedrag = regels.reduce((s, r) => s + regelSubtotaal(r) * (r.btw_percentage / 100), 0);
  const totaal = subtotaal + btwBedrag;

  const aanmaken = useMutation({
    mutationFn: async () => {
      if (!profile?.partner_id) throw new Error("Geen partner gekoppeld aan gebruiker");
      if (!klant.naam.trim()) throw new Error("Klantnaam is verplicht");
      if (regels.length === 0 || regels.every(r => !r.omschrijving.trim())) {
        throw new Error("Voeg minimaal één regel toe");
      }

      const payload = {
        partner_id: profile.partner_id,
        offerte_id: null,
        lead_id: selectedLead?.id ?? null,
        klant_naam: klant.naam,
        klant_email: klant.email || null,
        klant_telefoon: klant.telefoon || null,
        klant_adres: klant.adres || null,
        klant_postcode: klant.postcode || null,
        klant_plaats: klant.plaats || null,
        regels: regels.filter(r => r.omschrijving.trim()) as any,
        totaal_bedrag: totaal,
        notities: notities || null,
        status: "nieuw" as const,
      };

      const { data, error } = await (supabase as any)
        .from("opdrachten")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw error;
      return data as { id: string };
    },
    onSuccess: (data) => {
      toast.success("Verkooporder aangemaakt");
      navigate(`/opdrachten/${data.id}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/opdrachten")} aria-label="Terug">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-foreground">Nieuwe verkooporder</h1>
          <p className="text-muted-foreground text-sm">Maak een verkooporder aan zonder voorafgaande offerte</p>
        </div>
        <Button onClick={() => aanmaken.mutate()} disabled={aanmaken.isPending} className="gap-2">
          <Save className="h-4 w-4" /> {aanmaken.isPending ? "Opslaan..." : "Verkooporder aanmaken"}
        </Button>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader><CardTitle className="text-lg">Klant koppelen (optioneel)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <LeadSearchInput
            selectedLead={selectedLead}
            onSelectLead={(lead) => {
              setSelectedLead(lead);
              setKlant({
                naam: `${lead.voornaam ?? ""} ${lead.achternaam ?? ""}`.trim(),
                email: lead.email ?? "",
                telefoon: lead.telefoon ?? "",
                adres: lead.adres ?? "",
                postcode: lead.postcode ?? "",
                plaats: lead.plaats ?? "",
              });
            }}
            onClearLead={() => setSelectedLead(null)}
          />
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader><CardTitle className="text-lg">Klantgegevens</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="naam">Naam *</Label>
            <Input id="naam" value={klant.naam} onChange={e => setKlant({ ...klant, naam: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={klant.email} onChange={e => setKlant({ ...klant, email: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="telefoon">Telefoon</Label>
            <Input id="telefoon" value={klant.telefoon} onChange={e => setKlant({ ...klant, telefoon: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="adres">Adres</Label>
            <Input id="adres" value={klant.adres} onChange={e => setKlant({ ...klant, adres: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="postcode">Postcode</Label>
            <Input id="postcode" value={klant.postcode} onChange={e => setKlant({ ...klant, postcode: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="plaats">Plaats</Label>
            <Input id="plaats" value={klant.plaats} onChange={e => setKlant({ ...klant, plaats: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader><CardTitle className="text-lg">Regels</CardTitle></CardHeader>
        <CardContent>
          <DocumentRegelEditor regels={regels} onChange={setRegels} />
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader><CardTitle className="text-lg">Notities</CardTitle></CardHeader>
        <CardContent>
          <Textarea
            value={notities}
            onChange={e => setNotities(e.target.value)}
            placeholder="Interne notities of werkomschrijving..."
            rows={4}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default OpdrachtNieuw;