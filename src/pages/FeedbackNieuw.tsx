import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Upload, X, Send, Lightbulb, MessageSquareText, ArrowRight, ArrowLeft, Sparkles, Loader2, CheckCircle } from "lucide-react";
import RichTextEditor from "@/components/shared/RichTextEditor";

interface InterviewItem {
  vraag: string;
  antwoord: string;
}

export default function FeedbackNieuw() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialType = searchParams.get("type") === "functieverzoek" ? "functieverzoek" : "feedback";
  const [type, setType] = useState<"feedback" | "functieverzoek">(initialType as any);
  const [titel, setTitel] = useState("");
  const [beschrijving, setBeschrijving] = useState("");
  const [bestanden, setBestanden] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  // Wizard state
  const [step, setStep] = useState(1);
  const totalSteps = type === "functieverzoek" ? 4 : 3;

  // AI interview
  const [aiVragen, setAiVragen] = useState<string[]>([]);
  const [aiAntwoorden, setAiAntwoorden] = useState<string[]>([]);
  const [loadingVragen, setLoadingVragen] = useState(false);

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const filtered = files.filter(f => f.size <= 10 * 1024 * 1024);
    if (filtered.length < files.length) toast.error("Bestanden groter dan 10MB zijn overgeslagen");
    setBestanden(prev => [...prev, ...filtered].slice(0, 5));
    e.target.value = "";
  };

  const removeFile = (i: number) => setBestanden(prev => prev.filter((_, idx) => idx !== i));

  // Generate AI questions when entering step 2 for functieverzoek
  const fetchAiVragen = async () => {
    if (!titel.trim()) return;
    setLoadingVragen(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-feedback-categorize", {
        body: { mode: "generate_questions", titel: titel.trim(), type },
      });
      if (error) throw error;
      const vragen = data?.vragen || [];
      setAiVragen(vragen);
      setAiAntwoorden(new Array(vragen.length).fill(""));
    } catch (e) {
      console.error("AI vragen ophalen mislukt:", e);
      // Fallback questions
      const fallback = [
        "Welk probleem lost deze functie op?",
        "Wie gaat deze functie gebruiken? (welke rol/doelgroep)",
        "Hoe vaak zou je deze functie gebruiken?",
        "Wat is het gewenste resultaat als deze functie er is?",
        "Ken je voorbeelden van andere tools die dit bieden?",
      ];
      setAiVragen(fallback);
      setAiAntwoorden(new Array(fallback.length).fill(""));
    } finally {
      setLoadingVragen(false);
    }
  };

  const goNext = () => {
    if (step === 1 && !titel.trim()) {
      toast.error("Vul een titel in");
      return;
    }
    if (step === 1 && type === "functieverzoek") {
      fetchAiVragen();
    }
    setStep(s => Math.min(s + 1, totalSteps));
  };

  const goBack = () => setStep(s => Math.max(s - 1, 1));

  // Map step to actual content step for feedback (skip interview)
  const contentStep = type === "functieverzoek" ? step : (step === 1 ? 1 : step + 1);

  const handleSubmit = async () => {
    if (!user) return;
    setUploading(true);
    try {
      const bijlagen: { naam: string; pad: string; grootte: number }[] = [];
      for (const f of bestanden) {
        const pad = `${user.id}/${Date.now()}-${f.name}`;
        const { error } = await supabase.storage.from("feedback-bijlagen").upload(pad, f);
        if (error) throw error;
        bijlagen.push({ naam: f.name, pad, grootte: f.size });
      }

      const interview: InterviewItem[] = type === "functieverzoek"
        ? aiVragen.map((v, i) => ({ vraag: v, antwoord: aiAntwoorden[i] || "" })).filter(item => item.antwoord.trim())
        : [];

      const { data, error } = await supabase.from("feedback_verzoeken").insert({
        user_id: user.id,
        partner_id: profile?.partner_id || null,
        type,
        titel: titel.trim(),
        beschrijving: beschrijving || "<p>Zie antwoorden op de vragen.</p>",
        bijlagen,
        ai_interview: interview,
      } as any).select("id").single();

      if (error) throw error;

      supabase.functions.invoke("ai-feedback-categorize", {
        body: { feedback_id: data.id },
      }).catch(console.error);

      toast.success(type === "functieverzoek" ? "Functieverzoek ingediend!" : "Feedback verstuurd!");
      navigate("/feedback");
    } catch (e: any) {
      toast.error(e.message || "Fout bij versturen");
    } finally {
      setUploading(false);
    }
  };

  const stepLabels = type === "functieverzoek"
    ? ["Type & Titel", "Verduidelijking", "Details & Bijlagen", "Samenvatting"]
    : ["Type & Titel", "Details & Bijlagen", "Samenvatting"];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {type === "functieverzoek" ? "Functieverzoek indienen" : "Feedback geven"}
        </h1>
        <p className="text-muted-foreground">Help ons het platform te verbeteren</p>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2">
        {stepLabels.map((label, i) => (
          <div key={i} className="flex-1">
            <div className={`h-1.5 rounded-full transition-colors ${i < step ? "bg-primary" : "bg-muted"}`} />
            <p className={`text-[10px] mt-1 ${i < step ? "text-primary font-medium" : "text-muted-foreground"}`}>{label}</p>
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">

          {/* STEP 1: Type + Titel */}
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label>Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setType("feedback")}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      type === "feedback" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <MessageSquareText className="h-5 w-5 text-primary" />
                    <div className="text-left">
                      <p className="font-medium text-sm">Feedback</p>
                      <p className="text-xs text-muted-foreground">Suggestie of opmerking</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("functieverzoek")}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      type === "functieverzoek" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <Lightbulb className="h-5 w-5 text-amber-500" />
                    <div className="text-left">
                      <p className="font-medium text-sm">Functieverzoek</p>
                      <p className="text-xs text-muted-foreground">Nieuwe functionaliteit</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="titel">Titel *</Label>
                <Input
                  id="titel"
                  placeholder={type === "functieverzoek" ? "Bijv. Automatische herinneringen voor verlopen offertes" : "Korte omschrijving van je feedback"}
                  value={titel}
                  onChange={e => setTitel(e.target.value)}
                  maxLength={200}
                />
              </div>
            </>
          )}

          {/* STEP 2 (functieverzoek only): AI Interview */}
          {step === 2 && type === "functieverzoek" && (
            <div className="space-y-4">
              <div className="bg-primary/5 rounded-xl p-4 flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-sm">AI Verduidelijking</p>
                  <p className="text-xs text-muted-foreground">
                    Om je verzoek zo goed mogelijk te begrijpen, stellen we een paar gerichte vragen. Dit helpt ons bij de beoordeling.
                  </p>
                </div>
              </div>

              {loadingVragen ? (
                <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Vragen worden opgesteld...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {aiVragen.map((vraag, i) => (
                    <div key={i} className="space-y-1.5">
                      <Label className="text-sm font-medium">{i + 1}. {vraag}</Label>
                      <Textarea
                        value={aiAntwoorden[i] || ""}
                        onChange={e => {
                          const copy = [...aiAntwoorden];
                          copy[i] = e.target.value;
                          setAiAntwoorden(copy);
                        }}
                        placeholder="Je antwoord..."
                        rows={2}
                        className="resize-none"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 2/3: Description + Files */}
          {((type === "functieverzoek" && step === 3) || (type === "feedback" && step === 2)) && (
            <>
              <div className="space-y-2">
                <Label>Aanvullende beschrijving</Label>
                <RichTextEditor
                  value={beschrijving}
                  onChange={setBeschrijving}
                  placeholder={type === "functieverzoek" ? "Eventuele aanvullende details, schermvoorbeelden, etc..." : "Beschrijf je feedback zo gedetailleerd mogelijk..."}
                />
              </div>

              <div className="space-y-2">
                <Label>Bijlagen (max 5, elk max 10MB)</Label>
                <div className="space-y-2">
                  {bestanden.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 text-sm">
                      <span className="truncate flex-1">{f.name}</span>
                      <span className="text-muted-foreground text-xs">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                      <button onClick={() => removeFile(i)} className="text-destructive hover:text-destructive/80">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {bestanden.length < 5 && (
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-primary hover:text-primary/80 transition-colors">
                      <Upload className="h-4 w-4" />
                      <span>Bestand toevoegen</span>
                      <input type="file" className="hidden" multiple onChange={handleFileAdd} accept="image/*,.pdf,.doc,.docx,.xlsx,.csv" />
                    </label>
                  )}
                </div>
              </div>
            </>
          )}

          {/* FINAL STEP: Summary */}
          {step === totalSteps && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <p className="font-medium">Samenvatting</p>
                </div>

                <div className="grid grid-cols-[100px_1fr] gap-y-2 text-sm">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium">{type === "functieverzoek" ? "Functieverzoek" : "Feedback"}</span>
                  <span className="text-muted-foreground">Titel:</span>
                  <span className="font-medium">{titel}</span>
                  {bestanden.length > 0 && (
                    <>
                      <span className="text-muted-foreground">Bijlagen:</span>
                      <span>{bestanden.length} bestand(en)</span>
                    </>
                  )}
                </div>

                {type === "functieverzoek" && aiVragen.length > 0 && (
                  <div className="border-t pt-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Antwoorden op verduidelijking:</p>
                    {aiVragen.map((v, i) => (
                      aiAntwoorden[i]?.trim() ? (
                        <div key={i} className="text-sm">
                          <p className="text-muted-foreground text-xs">{v}</p>
                          <p>{aiAntwoorden[i]}</p>
                        </div>
                      ) : null
                    ))}
                  </div>
                )}

                {beschrijving && beschrijving !== "<p></p>" && (
                  <div className="border-t pt-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Beschrijving:</p>
                    <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(beschrijving) }} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3 pt-2">
            {step > 1 ? (
              <Button variant="outline" onClick={goBack} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" /> Vorige
              </Button>
            ) : (
              <Button variant="outline" onClick={() => navigate("/feedback")} className="flex-1">
                Annuleren
              </Button>
            )}

            {step < totalSteps ? (
              <Button onClick={goNext} disabled={step === 1 && !titel.trim()} className="flex-1">
                Volgende <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={uploading || !titel.trim()} className="flex-1">
                <Send className="h-4 w-4 mr-2" />
                {uploading ? "Versturen..." : "Verstuur"}
              </Button>
            )}
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
