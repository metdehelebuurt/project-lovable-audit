import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, Send, Lightbulb, MessageSquareText } from "lucide-react";
import RichTextEditor from "@/components/shared/RichTextEditor";

export default function FeedbackNieuw() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [type, setType] = useState<"feedback" | "functieverzoek">("feedback");
  const [titel, setTitel] = useState("");
  const [beschrijving, setBeschrijving] = useState("");
  const [bestanden, setBestanden] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const filtered = files.filter(f => f.size <= 10 * 1024 * 1024);
    if (filtered.length < files.length) toast.error("Bestanden groter dan 10MB zijn overgeslagen");
    setBestanden(prev => [...prev, ...filtered].slice(0, 5));
    e.target.value = "";
  };

  const removeFile = (i: number) => setBestanden(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!titel.trim() || !beschrijving.trim()) {
      toast.error("Vul titel en beschrijving in");
      return;
    }
    if (!user) return;

    setUploading(true);
    try {
      // Upload files
      const bijlagen: { naam: string; pad: string; grootte: number }[] = [];
      for (const f of bestanden) {
        const pad = `${user.id}/${Date.now()}-${f.name}`;
        const { error } = await supabase.storage.from("feedback-bijlagen").upload(pad, f);
        if (error) throw error;
        bijlagen.push({ naam: f.name, pad, grootte: f.size });
      }

      // Insert feedback
      const { data, error } = await supabase.from("feedback_verzoeken").insert({
        user_id: user.id,
        partner_id: profile?.partner_id || null,
        type,
        titel: titel.trim(),
        beschrijving,
        bijlagen,
      } as any).select("id").single();

      if (error) throw error;

      // Trigger AI categorization in background
      supabase.functions.invoke("ai-feedback-categorize", {
        body: { feedback_id: data.id },
      }).catch(console.error);

      toast.success("Feedback verstuurd! AI analyseert je verzoek.");
      navigate("/feedback");
    } catch (e: any) {
      toast.error(e.message || "Fout bij versturen");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Feedback & Functieverzoeken</h1>
        <p className="text-muted-foreground">Help ons het platform te verbeteren</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Nieuw verzoek indienen</CardTitle>
          <CardDescription>Je verzoek wordt automatisch geanalyseerd en gecategoriseerd door AI</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
              placeholder="Korte omschrijving van je verzoek"
              value={titel}
              onChange={e => setTitel(e.target.value)}
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label>Beschrijving *</Label>
            <RichTextEditor
              value={beschrijving}
              onChange={setBeschrijving}
              placeholder="Beschrijf je feedback of verzoek zo gedetailleerd mogelijk..."
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

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => navigate("/feedback")} className="flex-1">
              Annuleren
            </Button>
            <Button onClick={handleSubmit} disabled={uploading || !titel.trim() || !beschrijving.trim()} className="flex-1">
              <Send className="h-4 w-4 mr-2" />
              {uploading ? "Versturen..." : "Verstuur"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
