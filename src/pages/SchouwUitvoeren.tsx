import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, ChevronLeft, ChevronRight, Save, Loader2, CheckCircle2, Sun, Heart, Home, Wrench, Camera, ClipboardCheck, FileSignature } from "lucide-react";
import { categoryFields, getSections, isFieldVisible, type WizardStep, type CategoryField } from "@/components/schouwen/SchouwCategoryFields";
import { categoryChecklists } from "@/components/schouwen/SchouwChecklists";
import SchouwMediaUpload, { type SchouwFoto } from "@/components/schouwen/SchouwMediaUpload";
import SignaturePad from "@/components/schouwen/SignaturePad";
import PaneelClusterEditor, { type PaneelCluster } from "@/components/schouwen/PaneelClusterEditor";
import SchouwSatellietKaart, { type SolarResult, type SolarScore } from "@/components/schouwen/SchouwSatellietKaart";
import type { Database } from "@/integrations/supabase/types";

type SchouwCategorie = Database["public"]["Enums"]["schouw_categorie"];

interface StepDef {
  key: string;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  wizardStep?: WizardStep;
}

const STEPS: StepDef[] = [
  { key: "wensen", label: "Wensen & Verwachtingen", shortLabel: "Wensen", icon: Heart, wizardStep: "wensen" },
  { key: "situatie", label: "Situatie & Woning", shortLabel: "Situatie", icon: Home, wizardStep: "situatie" },
  { key: "technisch", label: "Technische inspectie", shortLabel: "Technisch", icon: Wrench, wizardStep: "technisch" },
  { key: "fotos", label: "Foto's & Media", shortLabel: "Foto's", icon: Camera },
  { key: "checklist", label: "Checklist & Aandachtspunten", shortLabel: "Checklist", icon: ClipboardCheck },
  { key: "akkoord", label: "Klant akkoord & Samenvatting", shortLabel: "Akkoord", icon: FileSignature },
];

const showClusters = (cat: SchouwCategorie) => cat === "zonnepanelen" || cat === "thuisbatterij";
const showSatellite = (cat: SchouwCategorie) => cat === "zonnepanelen" || cat === "thuisbatterij";

const scoreColors: Record<string, string> = {
  "Uitstekend": "bg-green-100 text-green-800",
  "Goed": "bg-emerald-100 text-emerald-700",
  "Matig": "bg-amber-100 text-amber-700",
  "Beperkt": "bg-red-100 text-red-700",
};

const SchouwUitvoeren = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [savingDraft, setSavingDraft] = useState(false);

  const { data: schouw, isLoading } = useQuery({
    queryKey: ["schouw", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("schouwen").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const [gegevens, setGegevens] = useState<Record<string, any>>({});
  const [fotos, setFotos] = useState<SchouwFoto[]>([]);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [aandachtspunten, setAandachtspunten] = useState("");
  const [handtekeningData, setHandtekeningData] = useState<string | null>(null);
  const [ondertekenaarNaam, setOndertekenaarNaam] = useState("");
  const [initialized, setInitialized] = useState(false);

  if (schouw && !initialized) {
    setGegevens((schouw.gegevens as Record<string, any>) || {});
    setFotos((schouw.fotos as unknown as SchouwFoto[]) || []);
    setChecklist((schouw.checklist as Record<string, boolean>) || {});
    setAandachtspunten(schouw.aandachtspunten || "");
    if (schouw.handtekening_data) setHandtekeningData(schouw.handtekening_data);
    setInitialized(true);
  }

  const clusters: PaneelCluster[] = gegevens.paneel_clusters || [];
  const setClusters = (c: PaneelCluster[]) => setGegevens(p => ({ ...p, paneel_clusters: c }));

  const [solarSuggestions, setSolarSuggestions] = useState<PaneelCluster[] | null>(null);
  const [solarScore, setSolarScore] = useState<SolarScore | null>(gegevens.solar_score || null);

  const handleSolarData = (data: SolarResult) => {
    setSolarSuggestions(data.clusters);
    setSolarScore(data.score);
    setGegevens(p => ({ ...p, solar_score: data.score }));
    toast.success(`${data.clusters.length} dakvlakken gevonden via Solar API`);
  };

  const acceptSuggestions = () => {
    if (solarSuggestions) {
      setClusters(solarSuggestions);
      setSolarSuggestions(null);
      toast.success("Dakgegevens overgenomen");
    }
  };

  const dismissSuggestions = () => setSolarSuggestions(null);

  const getUpdatePayload = () => ({
    gegevens: Object.keys(gegevens).length > 0 ? gegevens : null,
    fotos: fotos.length > 0 ? fotos as any : [],
    checklist: Object.keys(checklist).length > 0 ? checklist : {},
    aandachtspunten: aandachtspunten || null,
  });

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      const { error } = await supabase.from("schouwen").update(getUpdatePayload()).eq("id", id!);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["schouw", id] });
      toast.success("Schouw tussentijds opgeslagen");
    } catch (err: any) {
      toast.error("Opslaan mislukt", { description: err.message });
    }
    setSavingDraft(false);
  };

  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!handtekeningData) throw new Error("Handtekening is verplicht om de schouw af te ronden");
      const { error } = await supabase.from("schouwen").update({
        ...getUpdatePayload(),
        handtekening_data: handtekeningData,
        handtekening_akkoord_op: new Date().toISOString(),
        status: "uitgevoerd",
      }).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schouwen"] });
      toast.success("Schouw afgerond");
      navigate(`/schouwen/${id}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading || !schouw) return <div className="p-6 text-muted-foreground">Laden...</div>;

  const allFields = categoryFields[schouw.categorie] || [];
  const checklistItems = categoryChecklists[schouw.categorie] || [];
  const progress = ((step + 1) / STEPS.length) * 100;
  const currentStep = STEPS[step];

  const updateGegevens = (key: string, value: string) => setGegevens(p => ({ ...p, [key]: value }));
  const toggleChecklist = (key: string) => setChecklist(p => ({ ...p, [key]: !p[key] }));

  // Get visible fields for current wizard step
  const getVisibleSections = (wizardStep: WizardStep) => {
    const stepFields = allFields.filter(f => f.wizardStep === wizardStep);
    const visibleFields = stepFields.filter(f => isFieldVisible(f, gegevens));
    const sections = getSections(schouw.categorie, wizardStep);
    return sections.filter(section => {
      const sectionFields = visibleFields.filter(f => (f.section || "Algemeen") === section);
      return sectionFields.length > 0;
    });
  };

  const getVisibleFieldsInSection = (wizardStep: WizardStep, section: string) => {
    return allFields
      .filter(f => f.wizardStep === wizardStep && (f.section || "Algemeen") === section)
      .filter(f => isFieldVisible(f, gegevens));
  };

  const renderFieldInput = (f: CategoryField) => (
    <div key={f.key}>
      <Label className="text-sm">{f.label}</Label>
      {f.type === "select" ? (
        <Select value={gegevens[f.key] || ""} onValueChange={v => updateGegevens(f.key, v)}>
          <SelectTrigger><SelectValue placeholder="Selecteer..." /></SelectTrigger>
          <SelectContent>
            {f.options?.map(o => <SelectItem key={o} value={o}>{o.replace(/_/g, " ")}</SelectItem>)}
          </SelectContent>
        </Select>
      ) : (
        <Input
          type={f.type === "number" ? "number" : "text"}
          value={gegevens[f.key] || ""}
          onChange={e => updateGegevens(f.key, e.target.value)}
        />
      )}
    </div>
  );

  const renderFormStep = (wizardStep: WizardStep) => {
    const sections = getVisibleSections(wizardStep);
    if (sections.length === 0) {
      return (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="py-8 text-center text-muted-foreground">
            Geen velden beschikbaar voor deze categorie in deze stap.
          </CardContent>
        </Card>
      );
    }
    return (
      <div className="space-y-6">
        {sections.map(section => {
          const sectionFields = getVisibleFieldsInSection(wizardStep, section);
          return (
            <Card key={section} className="rounded-2xl border-0 shadow-sm">
              <CardHeader><CardTitle className="text-lg">{section}</CardTitle></CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  {sectionFields.map(renderFieldInput)}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/schouwen/${id}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-2xl font-semibold text-foreground">Schouw uitvoeren: {schouw.schouw_nummer}</h1>
          <p className="text-muted-foreground text-sm truncate">{schouw.consument_naam}</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 shrink-0" onClick={handleSaveDraft} disabled={savingDraft}>
          {savingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span className="hidden sm:inline">Opslaan</span>
        </Button>
      </div>

      {/* Step indicator */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span className="hidden sm:inline">Stap {step + 1} van {STEPS.length}: {currentStep.label}</span>
          <span className="sm:hidden">Stap {step + 1}/{STEPS.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} />
        {/* Mobile dot indicators */}
        <div className="flex justify-center gap-2 sm:hidden">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <button
                key={s.key}
                onClick={() => setStep(i)}
                className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                  i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 0: Wensen & Verwachtingen */}
      {step === 0 && renderFormStep("wensen")}

      {/* Step 1: Situatie & Woning */}
      {step === 1 && renderFormStep("situatie")}

      {/* Step 2: Technische inspectie */}
      {step === 2 && (
        <div className="space-y-6">
          {showSatellite(schouw.categorie) && (
            <>
              <SchouwSatellietKaart
                adres={(schouw as any).adres}
                plaats={(schouw as any).plaats}
                postcode={(schouw as any).postcode}
                onSolarData={handleSolarData}
              />
              {solarScore && (
                <div className="flex items-center gap-2">
                  <Badge className={scoreColors[solarScore.label] || ""}>
                    <Sun className="h-3 w-3 mr-1" /> Zonnepotentie: {solarScore.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    ~{solarScore.yearlyEnergyAcKwh.toLocaleString("nl-NL")} kWh/jaar • max {solarScore.maxPanels} panelen
                  </span>
                </div>
              )}
            </>
          )}

          {showClusters(schouw.categorie) && (
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader><CardTitle className="text-lg">Paneel clusters (dakvlakken)</CardTitle></CardHeader>
              <CardContent>
                <PaneelClusterEditor
                  clusters={clusters}
                  onChange={setClusters}
                  solarSuggestions={solarSuggestions || undefined}
                  onAcceptSuggestions={acceptSuggestions}
                  onDismissSuggestions={dismissSuggestions}
                />
              </CardContent>
            </Card>
          )}

          {renderFormStep("technisch")}
        </div>
      )}

      {/* Step 3: Foto's */}
      {step === 3 && (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader><CardTitle className="text-lg">Foto's & Media</CardTitle></CardHeader>
          <CardContent>
            <SchouwMediaUpload schouwId={id!} fotos={fotos} onFotosChange={setFotos} />
          </CardContent>
        </Card>
      )}

      {/* Step 4: Checklist */}
      {step === 4 && (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader><CardTitle className="text-lg">Checklist</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {checklistItems.map(item => (
              <div key={item.key} className="flex items-center gap-3 min-h-[44px]">
                <Checkbox checked={!!checklist[item.key]} onCheckedChange={() => toggleChecklist(item.key)} />
                <span className="text-sm">{item.label}</span>
                {item.required && <span className="text-xs text-destructive">verplicht</span>}
              </div>
            ))}
            <div className="mt-4">
              <Label>Aandachtspunten</Label>
              <Textarea value={aandachtspunten} onChange={e => setAandachtspunten(e.target.value)} placeholder="Opmerkingen voor de monteur..." />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Klant akkoord & Samenvatting */}
      {step === 5 && (
        <div className="space-y-6">
          {/* Samenvatting */}
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader><CardTitle className="text-lg">Samenvatting</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p><strong>Ingevulde velden:</strong> {Object.keys(gegevens).filter(k => k !== "paneel_clusters" && k !== "solar_score" && gegevens[k]).length} van {allFields.length}</p>
              {showClusters(schouw.categorie) && <p><strong>Paneel clusters:</strong> {clusters.length}</p>}
              <p><strong>Foto's:</strong> {fotos.length}</p>
              <p><strong>Checklist:</strong> {Object.values(checklist).filter(Boolean).length} / {checklistItems.length} afgevinkt</p>
              {aandachtspunten && <p><strong>Aandachtspunten:</strong> {aandachtspunten}</p>}
            </CardContent>
          </Card>

          {/* Handtekening */}
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader><CardTitle className="text-lg">Klant akkoord & Handtekening</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-xl p-4 text-sm space-y-1">
                <p><strong>Schouw:</strong> {schouw.schouw_nummer}</p>
                <p><strong>Klant:</strong> {schouw.consument_naam}</p>
                <p><strong>Datum:</strong> {new Date().toLocaleDateString("nl-NL")}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Hierbij verklaart de klant akkoord te gaan met de uitgevoerde schouw en de vastgelegde bevindingen.
              </p>
              <div>
                <Label className="text-sm">Naam ondertekenaar</Label>
                <Input value={ondertekenaarNaam} onChange={e => setOndertekenaarNaam(e.target.value)} placeholder="Volledige naam" />
              </div>
              <div>
                <Label className="text-sm mb-2 block">Handtekening</Label>
                <SignaturePad value={handtekeningData} onChange={setHandtekeningData} />
              </div>
              {!handtekeningData && (
                <p className="text-xs text-destructive">* Een handtekening is verplicht om de schouw af te ronden</p>
              )}

              {!handtekeningData && (
                <div className="bg-muted/50 border border-border rounded-xl p-3 text-sm text-muted-foreground">
                  💡 Je kunt de schouw tussentijds opslaan en later afronden. Een handtekening is pas nodig bij het afronden.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation — sticky on mobile */}
      <div className="flex flex-col sm:flex-row justify-between gap-2 sticky bottom-0 bg-background py-3 sm:static sm:py-0 border-t sm:border-t-0 -mx-3 px-3 sm:mx-0 sm:px-0">
        <Button variant="outline" onClick={() => step > 0 ? setStep(step - 1) : navigate(`/schouwen/${id}`)} className="gap-2 w-full sm:w-auto min-h-[44px]">
          <ChevronLeft className="h-4 w-4" /> {step === 0 ? "Terug" : "Vorige"}
        </Button>
        <div className="flex gap-2 w-full sm:w-auto">
          {step === STEPS.length - 1 && (
            <>
              <Button variant="outline" onClick={handleSaveDraft} disabled={savingDraft} className="gap-2 flex-1 sm:flex-initial min-h-[44px]">
                {savingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span className="hidden sm:inline">Opslaan & later verder</span>
                <span className="sm:hidden">Opslaan</span>
              </Button>
              <Button onClick={() => completeMutation.mutate()} disabled={completeMutation.isPending || !handtekeningData} className="gap-2 flex-1 sm:flex-initial min-h-[44px]">
                {completeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Afronden
              </Button>
            </>
          )}
          {step < STEPS.length - 1 && (
            <Button onClick={() => setStep(step + 1)} className="gap-2 w-full sm:w-auto min-h-[44px]">
              Volgende <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchouwUitvoeren;
