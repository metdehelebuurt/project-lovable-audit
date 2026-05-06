import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, PlayCircle, Pencil } from "lucide-react";
import { categoryFields, getSections, isFieldVisible, type WizardStep } from "@/components/schouwen/SchouwCategoryFields";
import { categoryChecklists } from "@/components/schouwen/SchouwChecklists";
import PaneelClusterEditor from "@/components/schouwen/PaneelClusterEditor";
import SchouwSatellietKaart from "@/components/schouwen/SchouwSatellietKaart";
import SolarPotentieCheck from "@/components/schouwen/SolarPotentieCheck";
import type { Database } from "@/integrations/supabase/types";
import EntiteitHistorieTab from "@/components/historie/EntiteitHistorieTab";
import WerkstroomStepper from "@/components/werkstroom/WerkstroomStepper";

type SchouwCategorie = Database["public"]["Enums"]["schouw_categorie"];

const categorieLabels: Record<SchouwCategorie, string> = {
  zonnepanelen: "Zonnepanelen", warmtepomp: "Warmtepomp",
  isolatie_dak: "Isolatie dak", isolatie_muur: "Isolatie muur",
  isolatie_vloer: "Isolatie vloer", hr_glas: "HR++ glas",
  ventilatie: "Ventilatie", thuisbatterij: "Thuisbatterij",
};

const statusColors: Record<string, string> = {
  gepland: "bg-primary/10 text-primary",
  uitgevoerd: "bg-success-light text-success",
  geannuleerd: "bg-error-light text-error",
};

const showClusters = (cat: SchouwCategorie) => cat === "zonnepanelen" || cat === "thuisbatterij";
const showSatellite = (cat: SchouwCategorie) => cat === "zonnepanelen" || cat === "thuisbatterij";

const wizardStepLabels: Record<WizardStep, string> = {
  wensen: "Wensen & Verwachtingen",
  situatie: "Situatie & Woning",
  technisch: "Technische inspectie",
};

const SchouwDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: schouw, isLoading } = useQuery({
    queryKey: ["schouw", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("schouwen").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading || !schouw) return <div className="p-6 text-muted-foreground">Laden...</div>;

  const gegevens = (schouw.gegevens as Record<string, any>) || {};
  const checklist = (schouw.checklist as Record<string, boolean>) || {};
  const fotos = (schouw.fotos as any[]) || [];
  const fields = categoryFields[schouw.categorie] || [];
  const checklistItems = categoryChecklists[schouw.categorie] || [];
  const clusters = gegevens.paneel_clusters || [];

  const renderFieldsForStep = (wizardStep: WizardStep) => {
    const stepFields = fields.filter(f => f.wizardStep === wizardStep);
    const visibleFields = stepFields.filter(f => isFieldVisible(f, gegevens));
    const hasValues = visibleFields.some(f => gegevens[f.key]);
    if (!hasValues && schouw.status === "gepland") return null;

    const sections = getSections(schouw.categorie, wizardStep);
    const visibleSections = sections.filter(section => {
      const sectionFields = visibleFields.filter(f => (f.section || "Algemeen") === section);
      return sectionFields.some(f => gegevens[f.key]);
    });

    if (visibleSections.length === 0 && schouw.status === "gepland") return null;

    return (
      <div key={wizardStep} className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">{wizardStepLabels[wizardStep]}</h2>
        {(visibleSections.length > 0 ? visibleSections : sections).map(section => {
          const sectionFields = visibleFields.filter(f => (f.section || "Algemeen") === section);
          if (sectionFields.length === 0) return null;
          return (
            <Card key={section} className="rounded-2xl border-0 shadow-sm">
              <CardHeader><CardTitle className="text-base">{section}</CardTitle></CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                  {sectionFields.map(f => (
                    <div key={f.key}>
                      <span className="text-muted-foreground">{f.label}:</span>{" "}
                      <span className="font-medium">{gegevens[f.key] || "-"}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <WerkstroomStepper vanaf="schouw" id={schouw.id} huidig="schouw" />
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/schouwen")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-foreground">Schouw {schouw.schouw_nummer}</h1>
          <p className="text-muted-foreground text-sm">{categorieLabels[schouw.categorie]} • {schouw.consument_naam}</p>
        </div>
        <Badge className={statusColors[schouw.status] || ""}>{schouw.status}</Badge>
        {schouw.status === "gepland" ? (
          <Button onClick={() => navigate(`/schouwen/${schouw.id}/uitvoeren`)} className="gap-2">
            <PlayCircle className="h-4 w-4" /> Uitvoeren
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={() => navigate(`/schouwen/${schouw.id}/uitvoeren`)}
            className="gap-2"
          >
            <Pencil className="h-4 w-4" /> Bewerken
          </Button>
        )}
      </div>

      {/* Basis info */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader><CardTitle className="text-lg">Basisgegevens</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Klant:</span> {schouw.consument_naam || "-"}</p>
            <p><span className="text-muted-foreground">E-mail:</span> {schouw.klant_email || "-"}</p>
            <p><span className="text-muted-foreground">Geplande datum:</span> {new Date(schouw.geplande_datum).toLocaleDateString("nl-NL")}</p>
            <p><span className="text-muted-foreground">Categorie:</span> {categorieLabels[schouw.categorie]}</p>
            {schouw.notities && <p><span className="text-muted-foreground">Notities:</span> {schouw.notities}</p>}
            {schouw.aandachtspunten && <p><span className="text-muted-foreground">Aandachtspunten:</span> {schouw.aandachtspunten}</p>}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader><CardTitle className="text-lg">Checklist</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            {checklistItems.length === 0 ? (
              <p className="text-muted-foreground">Geen checklist items</p>
            ) : (
              checklistItems.map(item => (
                <div key={item.key} className="flex items-center gap-2">
                  <span className={checklist[item.key] ? "text-success" : "text-muted-foreground"}>
                    {checklist[item.key] ? "✓" : "○"}
                  </span>
                  <span>{item.label}</span>
                  {item.required && <span className="text-xs text-destructive">*</span>}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Solar potentie */}
      {showSatellite(schouw.categorie) && (
        <>
          <SolarPotentieCheck
            adres={(schouw as any).adres}
            postcode={(schouw as any).postcode}
            plaats={(schouw as any).plaats}
          />
          <SchouwSatellietKaart
            adres={(schouw as any).adres}
            plaats={(schouw as any).plaats}
            postcode={(schouw as any).postcode}
          />
        </>
      )}

      {/* Paneel clusters */}
      {showClusters(schouw.categorie) && clusters.length > 0 && (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader><CardTitle className="text-lg">Paneel clusters ({clusters.length})</CardTitle></CardHeader>
          <CardContent>
            <PaneelClusterEditor clusters={clusters} onChange={() => {}} readOnly />
          </CardContent>
        </Card>
      )}

      {/* Gegevens per wizard stap */}
      {(["wensen", "situatie", "technisch"] as WizardStep[]).map(renderFieldsForStep)}

      {/* Foto's */}
      {fotos.length > 0 && (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader><CardTitle className="text-lg">Foto's & Media ({fotos.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {fotos.map((f: any, i: number) => {
                const isVideo = f.url?.endsWith(".webm") || f.url?.endsWith(".mp4") || f.url?.includes("video");
                const label = f.label || f.beschrijving || "";
                return (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-muted group">
                    {isVideo ? (
                      <video src={f.url} controls className="w-full h-full object-cover" preload="metadata" />
                    ) : (
                      <img
                        src={f.url}
                        alt={label || `Foto ${i + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                      />
                    )}
                    {label && (
                      <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm px-2 py-1.5 text-xs font-medium">{label}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Handtekening */}
      {schouw.handtekening_data && (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader><CardTitle className="text-lg">Klant akkoord</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="border border-border rounded-xl p-4 bg-muted/30 inline-block">
              <img src={schouw.handtekening_data} alt="Handtekening klant" className="max-h-32" />
            </div>
            {schouw.handtekening_akkoord_op && (
              <p className="text-sm text-muted-foreground">
                Ondertekend op {new Date(schouw.handtekening_akkoord_op).toLocaleString("nl-NL")}
              </p>
            )}
          </CardContent>
        </Card>
      )}
      {id && <EntiteitHistorieTab entiteitType="schouw" entiteitId={id} />}
    </div>
  );
};

export default SchouwDetail;
