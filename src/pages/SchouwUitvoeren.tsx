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
import { toast } from "sonner";
import { ArrowLeft, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { categoryFields, getSections } from "@/components/schouwen/SchouwCategoryFields";
import { categoryChecklists } from "@/components/schouwen/SchouwChecklists";
import SchouwMediaUpload, { type SchouwFoto } from "@/components/schouwen/SchouwMediaUpload";
import SignaturePad from "@/components/schouwen/SignaturePad";
import type { Database } from "@/integrations/supabase/types";

type SchouwCategorie = Database["public"]["Enums"]["schouw_categorie"];

const STEPS = ["Technische inspectie", "Foto's & Media", "Checklist", "Klant akkoord", "Samenvatting"];

const SchouwUitvoeren = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);

  const { data: schouw, isLoading } = useQuery({
    queryKey: ["schouw", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("schouwen").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const [gegevens, setGegevens] = useState<Record<string, string>>({});
  const [fotos, setFotos] = useState<SchouwFoto[]>([]);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [aandachtspunten, setAandachtspunten] = useState("");
  const [handtekeningData, setHandtekeningData] = useState<string | null>(null);
  const [ondertekenaarNaam, setOndertekenaarNaam] = useState("");
  const [initialized, setInitialized] = useState(false);

  // Initialize from schouw data once loaded
  if (schouw && !initialized) {
    setGegevens((schouw.gegevens as Record<string, string>) || {});
    setFotos((schouw.fotos as unknown as SchouwFoto[]) || []);
    setChecklist((schouw.checklist as Record<string, boolean>) || {});
    setAandachtspunten(schouw.aandachtspunten || "");
    setInitialized(true);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!handtekeningData) {
        throw new Error("Handtekening is verplicht om de schouw af te ronden");
      }
      const { error } = await supabase.from("schouwen").update({
        gegevens: Object.keys(gegevens).length > 0 ? gegevens : null,
        fotos: fotos.length > 0 ? fotos as any : [],
        checklist: Object.keys(checklist).length > 0 ? checklist : {},
        aandachtspunten: aandachtspunten || null,
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

  const fields = categoryFields[schouw.categorie] || [];
  const sections = getSections(schouw.categorie);
  const checklistItems = categoryChecklists[schouw.categorie] || [];
  const progress = ((step + 1) / STEPS.length) * 100;

  const updateGegevens = (key: string, value: string) => setGegevens(p => ({ ...p, [key]: value }));
  const toggleChecklist = (key: string) => setChecklist(p => ({ ...p, [key]: !p[key] }));

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/schouwen/${id}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-foreground">Schouw uitvoeren: {schouw.schouw_nummer}</h1>
          <p className="text-muted-foreground text-sm">{schouw.consument_naam}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Stap {step + 1} van {STEPS.length}: {STEPS[step]}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} />
      </div>

      {/* Step 0: Technische inspectie */}
      {step === 0 && (
        <div className="space-y-6">
          {sections.map(section => {
            const sectionFields = fields.filter(f => (f.section || "Algemeen") === section);
            return (
              <Card key={section} className="rounded-2xl border-0 shadow-sm">
                <CardHeader><CardTitle className="text-lg">{section}</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {sectionFields.map(f => (
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
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Step 1: Foto's */}
      {step === 1 && (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader><CardTitle className="text-lg">Foto's & Media</CardTitle></CardHeader>
          <CardContent>
            <SchouwMediaUpload schouwId={id!} fotos={fotos} onFotosChange={setFotos} />
          </CardContent>
        </Card>
      )}

      {/* Step 2: Checklist */}
      {step === 2 && (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader><CardTitle className="text-lg">Checklist</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {checklistItems.map(item => (
              <div key={item.key} className="flex items-center gap-3">
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

      {/* Step 3: Samenvatting */}
      {step === 3 && (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader><CardTitle className="text-lg">Samenvatting</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p><strong>Ingevulde velden:</strong> {Object.keys(gegevens).filter(k => gegevens[k]).length} van {fields.length}</p>
            <p><strong>Foto's:</strong> {fotos.length}</p>
            <p><strong>Checklist:</strong> {Object.values(checklist).filter(Boolean).length} / {checklistItems.length} afgevinkt</p>
            {aandachtspunten && <p><strong>Aandachtspunten:</strong> {aandachtspunten}</p>}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => step > 0 ? setStep(step - 1) : navigate(`/schouwen/${id}`)} className="gap-2">
          <ChevronLeft className="h-4 w-4" /> {step === 0 ? "Terug" : "Vorige"}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep(step + 1)} className="gap-2">
            Volgende <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="gap-2">
            <Check className="h-4 w-4" /> Schouw afronden
          </Button>
        )}
      </div>
    </div>
  );
};

export default SchouwUitvoeren;
