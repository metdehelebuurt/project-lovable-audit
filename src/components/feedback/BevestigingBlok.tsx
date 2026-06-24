import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThumbsUp, ThumbsDown, AlertCircle, CheckCircle2, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  BEVESTIGING_KLEUR,
  BEVESTIGING_LABEL,
  type BevestigingStatus,
} from "@/lib/feedback/constants";

interface Props {
  feedbackId: string;
  huidigeStatus: string | null;
  onAfgehandeld: () => void;
}

export default function BevestigingBlok({ feedbackId, huidigeStatus, onAfgehandeld }: Props) {
  const [keuze, setKeuze] = useState<BevestigingStatus | null>(null);
  const [opmerking, setOpmerking] = useState("");
  const [score, setScore] = useState<number>(0);
  const [hoverScore, setHoverScore] = useState<number>(0);
  const [busy, setBusy] = useState(false);

  const isAfgehandeld =
    huidigeStatus === "bevestigd_werkt" ||
    huidigeStatus === "werkt_niet" ||
    huidigeStatus === "deels";

  if (isAfgehandeld) {
    return (
      <Card>
        <CardContent className="pt-4 flex items-center gap-2 text-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>Je hebt al teruggekoppeld:</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs ${
              BEVESTIGING_KLEUR[huidigeStatus as BevestigingStatus]
            }`}
          >
            {BEVESTIGING_LABEL[huidigeStatus as BevestigingStatus]}
          </span>
        </CardContent>
      </Card>
    );
  }

  const bevestig = async () => {
    if (!keuze) return;
    if ((keuze === "werkt_niet" || keuze === "deels") && !opmerking.trim()) {
      toast.error("Voeg een toelichting toe");
      return;
    }
    if (score === 0) {
      toast.error("Geef een tevredenheidsscore");
      return;
    }
    setBusy(true);
    const update: Record<string, unknown> = {
      bevestiging_status: keuze,
      bevestiging_opmerking: opmerking.trim() || null,
      bevestiging_op: new Date().toISOString(),
      csat_score: score,
    };
    if (keuze === "werkt_niet" || keuze === "deels") {
      update.status = "in_behandeling";
    } else {
      update.status = "afgerond";
    }
    const { error } = await supabase
      .from("feedback_verzoeken")
      .update(update)
      .eq("id", feedbackId);
    setBusy(false);
    if (error) return toast.error(error.message);

    if (keuze === "werkt_niet" || keuze === "deels") {
      supabase.functions
        .invoke("feedback-notify", {
          body: {
            event: "indiener_meldt_probleem",
            feedback_id: feedbackId,
            bevestiging_status: keuze,
            bevestiging_opmerking: opmerking.trim(),
          },
        })
        .catch(console.error);
    }
    toast.success("Bedankt voor je terugkoppeling");
    onAfgehandeld();
  };

  return (
    <Card className="border-primary/40 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Werkt deze functie zoals bedoeld?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant={keuze === "bevestigd_werkt" ? "default" : "outline"}
            size="sm"
            onClick={() => setKeuze("bevestigd_werkt")}
          >
            <ThumbsUp className="h-4 w-4 mr-1" /> Ja
          </Button>
          <Button
            variant={keuze === "deels" ? "default" : "outline"}
            size="sm"
            onClick={() => setKeuze("deels")}
          >
            <AlertCircle className="h-4 w-4 mr-1" /> Deels
          </Button>
          <Button
            variant={keuze === "werkt_niet" ? "default" : "outline"}
            size="sm"
            onClick={() => setKeuze("werkt_niet")}
          >
            <ThumbsDown className="h-4 w-4 mr-1" /> Nee
          </Button>
        </div>
        {keuze && (
          <>
            <div>
              <p className="text-xs font-medium mb-1">Hoe tevreden ben je over de afhandeling?</p>
              <div className="flex items-center gap-1" role="radiogroup" aria-label="Tevredenheidsscore">
                {[1, 2, 3, 4, 5].map((n) => {
                  const actief = (hoverScore || score) >= n;
                  return (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={score === n}
                      aria-label={`${n} ster${n === 1 ? "" : "ren"}`}
                      onClick={() => setScore(n)}
                      onMouseEnter={() => setHoverScore(n)}
                      onMouseLeave={() => setHoverScore(0)}
                      className="p-0.5 rounded hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <Star
                        className={`h-6 w-6 transition ${
                          actief ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  );
                })}
                {score > 0 && (
                  <span className="ml-2 text-xs text-muted-foreground">{score}/5</span>
                )}
              </div>
            </div>
            <Textarea
            placeholder={
              keuze === "bevestigd_werkt"
                ? "Optionele toelichting…"
                : "Wat mist er nog of werkt niet zoals verwacht?"
            }
            value={opmerking}
            onChange={(e) => setOpmerking(e.target.value)}
            rows={3}
            />
          </>
        )}
        <Button onClick={bevestig} disabled={!keuze || busy} className="w-full">
          {busy ? "Versturen…" : "Terugkoppeling versturen"}
        </Button>
      </CardContent>
    </Card>
  );
}