import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, RotateCcw, UserPlus, Search } from "lucide-react";
import { toast } from "sonner";
import { initialWizardData } from "@/components/energieadvies/types";
import type { WizardData } from "@/components/energieadvies/types";
import { berekenAdviezen, matchProducten } from "@/components/energieadvies/adviesLogic";
import WizardStepWoning from "@/components/energieadvies/WizardStepWoning";
import WizardStepInstallatie from "@/components/energieadvies/WizardStepInstallatie";
import WizardStepVerbruik from "@/components/energieadvies/WizardStepVerbruik";
import WizardStepWensen from "@/components/energieadvies/WizardStepWensen";
import WizardStepResultaat from "@/components/energieadvies/WizardStepResultaat";

const STAPPEN = [
  { label: "Woning", beschrijving: "Woningsituatie" },
  { label: "Installatie", beschrijving: "Huidige installatie" },
  { label: "Verbruik", beschrijving: "Verbruik & contract" },
  { label: "Wensen", beschrijving: "Wensen & budget" },
  { label: "Resultaat", beschrijving: "Advies & producten" },
];

const Energieadvies = () => {
  const { profile } = useAuth();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>({ ...initialWizardData });
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [leadZoek, setLeadZoek] = useState("");
  const [gekoppeldeLead, setGekoppeldeLead] = useState<{ id: string; naam: string } | null>(null);

  // Nieuwe lead velden
  const [nieuwLeadVoornaam, setNieuwLeadVoornaam] = useState("");
  const [nieuwLeadAchternaam, setNieuwLeadAchternaam] = useState("");
  const [nieuwLeadEmail, setNieuwLeadEmail] = useState("");
  const [nieuwLeadTelefoon, setNieuwLeadTelefoon] = useState("");

  const isAdviseur = ["superadmin", "partner_admin", "partner_staff", "adviseur"].includes(profile?.rol || "");

  const { data: alleProducten = [] } = useQuery({
    queryKey: ["producten-energieadvies"],
    queryFn: async () => {
      const { data, error } = await supabase.from("producten").select("*").eq("status", "actief").order("naam");
      if (error) throw error;
      return data;
    },
  });

  // Zoek leads voor koppeling
  const { data: gevondenLeads = [] } = useQuery({
    queryKey: ["leads-zoek", leadZoek],
    queryFn: async () => {
      if (leadZoek.length < 2) return [];
      const { data, error } = await supabase
        .from("leads")
        .select("id, voornaam, achternaam, email")
        .or(`voornaam.ilike.%${leadZoek}%,achternaam.ilike.%${leadZoek}%,email.ilike.%${leadZoek}%`)
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: leadZoek.length >= 2,
  });

  const updateData = (updates: Partial<WizardData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const adviezen = useMemo(() => berekenAdviezen(data), [data]);
  const productMatches = useMemo(
    () => matchProducten(alleProducten, data, adviezen),
    [alleProducten, data, adviezen]
  );

  // Lead koppelen
  const koppelLeadMutation = useMutation({
    mutationFn: async (leadId: string) => {
      // Sla adviesdata op in lead_eigenschappen
      const adviesPayload = {
        wizardInput: data,
        adviezen: adviezen.map(a => ({ categorie: a.categorie, titel: a.titel, besparing: a.geschatteBesparing, co2: a.co2BesparingKg })),
        datum: new Date().toISOString(),
      };
      const { error } = await supabase.from("lead_eigenschappen").upsert({
        lead_id: leadId,
        partner_id: profile!.partner_id!,
        woningtype: data.woningType || null,
        bouwjaar: data.bouwjaar,
        dakrichting: data.dakOrientatie || null,
        huidig_verbruik_kwh: data.jaarverbruikKwh,
        warmtepomp_interesse: data.interesseCategorieen.includes("warmtepomp"),
        batterij_interesse: data.interesseCategorieen.includes("thuisbatterij"),
        laadpaal_interesse: data.interesseCategorieen.includes("laadpaal"),
        extra_json: adviesPayload as any,
      } as any, { onConflict: "lead_id" });
      if (error) throw error;
      return leadId;
    },
    onSuccess: () => {
      toast.success("Advies gekoppeld aan lead");
      setLeadDialogOpen(false);
    },
    onError: () => toast.error("Fout bij koppelen"),
  });

  // Nieuwe lead aanmaken
  const maakLeadMutation = useMutation({
    mutationFn: async () => {
      const { data: newLead, error } = await supabase.from("leads").insert({
        voornaam: nieuwLeadVoornaam,
        achternaam: nieuwLeadAchternaam,
        email: nieuwLeadEmail,
        telefoon: nieuwLeadTelefoon || null,
        partner_id: profile!.partner_id!,
        owner_user_id: profile!.id,
        bron: "energieadvies",
      }).select("id, voornaam, achternaam").single();
      if (error) throw error;
      // Koppel advies
      await koppelLeadMutation.mutateAsync(newLead.id);
      setGekoppeldeLead({ id: newLead.id, naam: `${newLead.voornaam} ${newLead.achternaam}` });
      return newLead;
    },
    onSuccess: () => {
      toast.success("Lead aangemaakt en advies gekoppeld");
      setLeadDialogOpen(false);
    },
    onError: () => toast.error("Fout bij aanmaken lead"),
  });

  const handlePDFDownload = useCallback(() => {
    toast.info("PDF-rapport wordt gegenereerd... (binnenkort beschikbaar)");
  }, []);

  const progress = ((step + 1) / STAPPEN.length) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Energieadvies</h1>
          <p className="text-muted-foreground mt-1">
            Persoonlijk advies op maat in {STAPPEN.length} stappen
            {gekoppeldeLead && (
              <span className="ml-2 text-primary font-medium">• Gekoppeld aan: {gekoppeldeLead.naam}</span>
            )}
          </p>
        </div>
        {step > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-full gap-1"
            onClick={() => { setStep(0); setData({ ...initialWizardData }); setGekoppeldeLead(null); }}
          >
            <RotateCcw className="h-3.5 w-3.5" /> Opnieuw
          </Button>
        )}
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between">
          {STAPPEN.map((s, i) => (
            <button
              key={i}
              onClick={() => i <= step && setStep(i)}
              className={`text-xs font-medium transition-colors ${
                i === step ? "text-primary" : i < step ? "text-foreground cursor-pointer" : "text-muted-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Stappen */}
      {step === 0 && <WizardStepWoning data={data} onChange={updateData} />}
      {step === 1 && <WizardStepInstallatie data={data} onChange={updateData} />}
      {step === 2 && <WizardStepVerbruik data={data} onChange={updateData} />}
      {step === 3 && <WizardStepWensen data={data} onChange={updateData} />}
      {step === 4 && (
        <WizardStepResultaat
          adviezen={adviezen}
          producten={productMatches}
          isAdviseur={isAdviseur}
          onLeadKoppelen={() => setLeadDialogOpen(true)}
          onPDFDownload={handlePDFDownload}
        />
      )}

      {/* Navigatie */}
      <div className="flex justify-between pt-2">
        <Button
          variant="outline"
          onClick={() => setStep(s => s - 1)}
          disabled={step === 0}
          className="rounded-full gap-1"
        >
          <ChevronLeft className="h-4 w-4" /> Vorige
        </Button>
        {step < STAPPEN.length - 1 ? (
          <Button
            onClick={() => setStep(s => s + 1)}
            className="rounded-full gap-1"
          >
            Volgende <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <div />
        )}
      </div>

      {/* Lead koppelen dialog */}
      <Dialog open={leadDialogOpen} onOpenChange={setLeadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Lead koppelen of aanmaken
            </DialogTitle>
            <DialogDescription>
              Koppel dit advies aan een bestaande lead of maak een nieuwe aan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Zoek bestaande lead */}
            <div>
              <Label className="text-sm font-medium">Bestaande lead zoeken</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Zoek op naam of email..."
                  value={leadZoek}
                  onChange={e => setLeadZoek(e.target.value)}
                  className="pl-9 rounded-xl"
                />
              </div>
              {gevondenLeads.length > 0 && (
                <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                  {gevondenLeads.map(l => (
                    <button
                      key={l.id}
                      onClick={() => {
                        koppelLeadMutation.mutate(l.id);
                        setGekoppeldeLead({ id: l.id, naam: `${l.voornaam} ${l.achternaam}` });
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm"
                    >
                      <span className="font-medium">{l.voornaam} {l.achternaam}</span>
                      <span className="text-muted-foreground ml-2">{l.email}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">of maak nieuw aan</span>
              </div>
            </div>

            {/* Nieuwe lead */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Voornaam *</Label>
                <Input value={nieuwLeadVoornaam} onChange={e => setNieuwLeadVoornaam(e.target.value)} className="rounded-xl" />
              </div>
              <div>
                <Label className="text-xs">Achternaam *</Label>
                <Input value={nieuwLeadAchternaam} onChange={e => setNieuwLeadAchternaam(e.target.value)} className="rounded-xl" />
              </div>
              <div>
                <Label className="text-xs">Email *</Label>
                <Input type="email" value={nieuwLeadEmail} onChange={e => setNieuwLeadEmail(e.target.value)} className="rounded-xl" />
              </div>
              <div>
                <Label className="text-xs">Telefoon</Label>
                <Input value={nieuwLeadTelefoon} onChange={e => setNieuwLeadTelefoon(e.target.value)} className="rounded-xl" />
              </div>
            </div>
            <Button
              onClick={() => maakLeadMutation.mutate()}
              disabled={!nieuwLeadVoornaam || !nieuwLeadAchternaam || !nieuwLeadEmail || maakLeadMutation.isPending}
              className="w-full rounded-full"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Lead aanmaken & advies koppelen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Energieadvies;
