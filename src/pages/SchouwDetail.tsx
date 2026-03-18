import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, PlayCircle, Pencil } from "lucide-react";
import { categoryFields, getSections } from "@/components/schouwen/SchouwCategoryFields";
import { categoryChecklists } from "@/components/schouwen/SchouwChecklists";
import type { Database } from "@/integrations/supabase/types";

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

  const gegevens = (schouw.gegevens as Record<string, string>) || {};
  const checklist = (schouw.checklist as Record<string, boolean>) || {};
  const fotos = (schouw.fotos as any[]) || [];
  const fields = categoryFields[schouw.categorie] || [];
  const sections = getSections(schouw.categorie);
  const checklistItems = categoryChecklists[schouw.categorie] || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/schouwen")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-foreground">Schouw {schouw.schouw_nummer}</h1>
          <p className="text-muted-foreground text-sm">{categorieLabels[schouw.categorie]} • {schouw.consument_naam}</p>
        </div>
        <Badge className={statusColors[schouw.status] || ""}>{schouw.status}</Badge>
        {schouw.status === "gepland" && (
          <Button onClick={() => navigate(`/schouwen/${schouw.id}/uitvoeren`)} className="gap-2">
            <PlayCircle className="h-4 w-4" /> Uitvoeren
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

        {/* Checklist */}
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

      {/* Technische gegevens per sectie */}
      {sections.map(section => {
        const sectionFields = fields.filter(f => (f.section || "Algemeen") === section);
        const hasValues = sectionFields.some(f => gegevens[f.key]);
        if (!hasValues && schouw.status === "gepland") return null;
        return (
          <Card key={section} className="rounded-2xl border-0 shadow-sm">
            <CardHeader><CardTitle className="text-lg">{section}</CardTitle></CardHeader>
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

      {/* Foto's */}
      {fotos.length > 0 && (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader><CardTitle className="text-lg">Foto's & Media ({fotos.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {fotos.map((f: any, i: number) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-muted">
                  <img src={f.url} alt={f.beschrijving || `Foto ${i + 1}`} className="w-full h-full object-cover" />
                  {f.beschrijving && (
                    <div className="absolute bottom-0 left-0 right-0 bg-background/80 px-2 py-1 text-xs">{f.beschrijving}</div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SchouwDetail;
