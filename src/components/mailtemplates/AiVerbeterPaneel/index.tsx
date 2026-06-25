import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Sparkles, Wand2, Mail, Split, Check, X as XIcon, RefreshCw, MessageSquarePlus } from "lucide-react";
import { toast } from "sonner";
import {
  useAiVerbeterTemplate,
  useAiTemplateStatus,
  useAiTemplateFeedback,
  type VerbeterOutput,
} from "@/hooks/mailtemplates/useAiVerbeterTemplate";
import { StijlChips } from "./StijlChips";
import { DiffWeergave } from "./DiffWeergave";
import { StijlprofielSamenvatting } from "./StijlprofielSamenvatting";
import {
  DOEL_PRESETS,
  STIJL_OPTIES,
  DOELGROEP_OPTIES,
  CONVERSIE_OPTIES,
} from "./constants";

interface Props {
  open: boolean;
  onClose: () => void;
  bron: "affiliate" | "sales";
  templateKey?: string | null;
  templateNaam?: string;
  onderwerp: string;
  body: string;
  bodyFormaat?: "html" | "tekst";
  onApply: (next: { onderwerp: string; body: string }) => void;
}

const LENGTE_LABELS = ["kort", "gemiddeld", "uitgebreid"] as const;

export function AiVerbeterPaneel({
  open,
  onClose,
  bron,
  templateKey,
  templateNaam,
  onderwerp,
  body,
  bodyFormaat = "html",
  onApply,
}: Props) {
  const verbeteren = useAiVerbeterTemplate();
  const statusMut = useAiTemplateStatus();
  const feedbackMut = useAiTemplateFeedback();

  const [doel, setDoel] = useState("");
  const [stijl, setStijl] = useState<string[]>([]);
  const [doelgroep, setDoelgroep] = useState<string[]>([]);
  const [conversie, setConversie] = useState<string[]>([]);
  const [lengteIdx, setLengteIdx] = useState(1);
  const [vrijeInstructie, setVrijeInstructie] = useState("");
  const [resultaat, setResultaat] = useState<VerbeterOutput | null>(null);
  const [feedbackTekst, setFeedbackTekst] = useState("");

  const toggle = (lst: string[], set: (v: string[]) => void) => (v: string) =>
    set(lst.includes(v) ? lst.filter((x) => x !== v) : [...lst, v]);

  const genereer = (mode: "volledig" | "alleen_onderwerp" | "ab_variant") => {
    verbeteren.mutate(
      {
        bron,
        template_key: templateKey,
        huidige_onderwerp: onderwerp,
        huidige_body: body,
        body_formaat: bodyFormaat,
        doel: doel.trim() || undefined,
        stijl,
        doelgroep,
        conversie,
        lengte: LENGTE_LABELS[lengteIdx],
        vrije_instructie: vrijeInstructie.trim() || undefined,
        mode,
      },
      { onSuccess: setResultaat },
    );
  };

  const toepassen = () => {
    if (!resultaat) return;
    onApply({
      onderwerp: resultaat.onderwerp || onderwerp,
      body: resultaat.body || body,
    });
    if (resultaat.generatie_id) {
      statusMut.mutate({
        generatie_id: resultaat.generatie_id,
        status: "toegepast",
        finale_onderwerp: resultaat.onderwerp || onderwerp,
        finale_body: resultaat.body || body,
      });
    }
    toast.success("AI-suggestie toegepast");
    setResultaat(null);
    setFeedbackTekst("");
  };

  const verwerpen = () => {
    if (resultaat?.generatie_id) {
      statusMut.mutate({ generatie_id: resultaat.generatie_id, status: "verworpen" });
    }
    setResultaat(null);
    setFeedbackTekst("");
  };

  const stuurFeedback = (sentiment: "positief" | "negatief") => {
    if (!resultaat?.generatie_id || !feedbackTekst.trim()) return;
    feedbackMut.mutate({
      generatie_id: resultaat.generatie_id,
      feedback: feedbackTekst.trim(),
      sentiment,
    });
    setFeedbackTekst("");
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-0">
        <div className="sticky top-0 z-10 bg-background border-b px-5 py-3">
          <SheetHeader className="space-y-1">
            <SheetTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              AI-template verbeteren
            </SheetTitle>
            <SheetDescription className="text-xs">
              {templateNaam ? `Voor: ${templateNaam} · ` : ""}AI leert van jouw keuzes en feedback, zodat suggesties steeds beter bij jouw stijl passen.
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="px-5 py-4 space-y-4">
          {!resultaat && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Doel van deze mail</Label>
                <Input
                  value={doel}
                  onChange={(e) => setDoel(e.target.value)}
                  placeholder="Bijv. afspraak inplannen voor offerte-bespreking"
                  className="text-sm"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {DOEL_PRESETS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDoel(d)}
                      className="text-[11px] px-2 py-0.5 rounded-full border bg-background hover:bg-muted"
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <StijlChips label="Schrijfstijl" opties={STIJL_OPTIES} geselecteerd={stijl} onToggle={toggle(stijl, setStijl)} />
              <StijlChips label="Doelgroep" opties={DOELGROEP_OPTIES} geselecteerd={doelgroep} onToggle={toggle(doelgroep, setDoelgroep)} />
              <StijlChips label="Conversie-element" opties={CONVERSIE_OPTIES} geselecteerd={conversie} onToggle={toggle(conversie, setConversie)} />

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Lengte</Label>
                  <span className="text-xs font-medium">{LENGTE_LABELS[lengteIdx]}</span>
                </div>
                <Slider
                  value={[lengteIdx]}
                  onValueChange={([v]) => setLengteIdx(v)}
                  min={0}
                  max={2}
                  step={1}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Extra instructie (optioneel)</Label>
                <Textarea
                  rows={3}
                  value={vrijeInstructie}
                  onChange={(e) => setVrijeInstructie(e.target.value)}
                  placeholder='Bijv. "noem de subsidieregeling 2026", "begin met voornaam", "geen prijzen noemen"'
                  className="text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <Button onClick={() => genereer("volledig")} disabled={verbeteren.isPending} className="gap-1">
                  <Wand2 className="h-4 w-4" /> Verbeter mail
                </Button>
                <Button onClick={() => genereer("alleen_onderwerp")} variant="outline" disabled={verbeteren.isPending} className="gap-1">
                  <Mail className="h-4 w-4" /> Alleen onderwerp
                </Button>
                <Button onClick={() => genereer("ab_variant")} variant="outline" disabled={verbeteren.isPending} className="gap-1">
                  <Split className="h-4 w-4" /> A/B-variant
                </Button>
              </div>
              {verbeteren.isPending && (
                <p className="text-xs text-muted-foreground text-center animate-pulse">AI denkt na…</p>
              )}
            </>
          )}

          {resultaat && (
            <div className="space-y-4">
              <DiffWeergave
                oudOnderwerp={onderwerp}
                nieuwOnderwerp={resultaat.onderwerp || onderwerp}
                oudBody={body}
                nieuwBody={resultaat.body || body}
              />
              {resultaat.uitleg && (
                <div className="rounded-md bg-primary/5 border-l-2 border-primary p-2 text-xs">
                  <strong className="text-primary">Waarom:</strong> {resultaat.uitleg}
                </div>
              )}
              {resultaat.suggesties.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Vervolgsuggesties</div>
                  <ul className="text-xs space-y-0.5 list-disc list-inside text-muted-foreground">
                    {resultaat.suggesties.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button onClick={toepassen} className="gap-1">
                  <Check className="h-4 w-4" /> Toepassen
                </Button>
                <Button onClick={verwerpen} variant="outline" className="gap-1">
                  <XIcon className="h-4 w-4" /> Verwerpen
                </Button>
                <Button onClick={() => { setResultaat(null); }} variant="ghost" className="gap-1">
                  <RefreshCw className="h-4 w-4" /> Pas instellingen aan
                </Button>
              </div>

              <div className="space-y-1.5 rounded-md border p-2 bg-background">
                <Label className="text-xs flex items-center gap-1">
                  <MessageSquarePlus className="h-3.5 w-3.5" /> Feedback (AI onthoudt dit voor volgende keer)
                </Label>
                <Textarea
                  rows={2}
                  value={feedbackTekst}
                  onChange={(e) => setFeedbackTekst(e.target.value)}
                  placeholder='Bijv. "te formeel", "perfecte CTA", "te lang"'
                  className="text-xs"
                />
                <div className="flex gap-1.5 justify-end">
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => stuurFeedback("negatief")} disabled={!feedbackTekst.trim()}>
                    👎 Stuur als negatief
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => stuurFeedback("positief")} disabled={!feedbackTekst.trim()}>
                    👍 Stuur als positief
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="pt-3 border-t">
            <StijlprofielSamenvatting />
          </div>

          <p className="text-[11px] text-muted-foreground italic pt-2">
            Suggesties van AI — controleer altijd voor je verstuurt.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}