import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, RotateCcw, Pencil, Save, X } from "lucide-react";
import { useAiSchrijfstijl } from "@/hooks/mailtemplates/useAiSchrijfstijl";

export function StijlprofielSamenvatting() {
  const { data, upsert, reset } = useAiSchrijfstijl();
  const [bewerken, setBewerken] = useState(false);
  const [tekst, setTekst] = useState("");

  const samenvatting = data?.profiel_samenvatting?.trim() ?? "";

  const startBewerken = () => {
    setTekst(samenvatting);
    setBewerken(true);
  };

  const opslaan = () => {
    upsert.mutate({ profiel_samenvatting: tekst }, { onSuccess: () => setBewerken(false) });
  };

  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-medium">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> Mijn AI-schrijfstijl
        </div>
        {!bewerken && (
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" className="h-6 px-1.5 text-xs" onClick={startBewerken}>
              <Pencil className="h-3 w-3" />
            </Button>
            {samenvatting && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-1.5 text-xs text-destructive"
                onClick={() => confirm("Schrijfstijl wissen? AI begint dan opnieuw met leren.") && reset.mutate()}
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </div>
      {bewerken ? (
        <div className="space-y-2">
          <Textarea
            rows={6}
            value={tekst}
            onChange={(e) => setTekst(e.target.value)}
            className="text-xs"
            placeholder="- Schrijft kort en zakelijk
- Vermijdt uitroeptekens
- Sluit af met open vraag"
          />
          <div className="flex justify-end gap-1">
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setBewerken(false)}>
              <X className="h-3 w-3 mr-1" /> Annuleer
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={opslaan} disabled={upsert.isPending}>
              <Save className="h-3 w-3 mr-1" /> Opslaan
            </Button>
          </div>
        </div>
      ) : samenvatting ? (
        <pre className="text-xs whitespace-pre-wrap text-muted-foreground font-sans leading-relaxed">{samenvatting}</pre>
      ) : (
        <p className="text-xs text-muted-foreground italic">
          Nog leeg — gebruik de AI een paar keer en geef feedback, dan leert het systeem jouw stijl.
        </p>
      )}
    </div>
  );
}