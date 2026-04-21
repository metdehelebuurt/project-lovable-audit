import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import RichTextEditor from "@/components/shared/RichTextEditor";
import { PenLine, Save } from "lucide-react";
import { toast } from "sonner";

interface HandtekeningEditorProps {
  userId: string;
  initialHtml?: string | null;
  voornaam?: string;
  achternaam?: string;
  functie?: string | null;
  telefoon?: string | null;
  email?: string;
}

export const HandtekeningEditor = ({
  userId, initialHtml, voornaam, achternaam, functie, telefoon, email,
}: HandtekeningEditorProps) => {
  const [html, setHtml] = useState(initialHtml || "");

  useEffect(() => { setHtml(initialHtml || ""); }, [initialHtml]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("users").update({ handtekening_html: html || null }).eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => toast.success("Handtekening opgeslagen"),
    onError: (err: Error) => toast.error("Opslaan mislukt", { description: err.message }),
  });

  const useTemplate = () => {
    const tmpl = `<p><strong>${voornaam ?? ""} ${achternaam ?? ""}</strong>${functie ? ` — ${functie}` : ""}</p>` +
      `<p>${telefoon ? `📞 ${telefoon}<br/>` : ""}${email ? `✉️ ${email}` : ""}</p>`;
    setHtml(tmpl);
  };

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <PenLine className="h-4 w-4 text-primary" /> E-mailhandtekening
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Wordt automatisch onderaan elke offerte-, factuur- en helpdesk-mail die jij verstuurt geplakt.
        </p>
        <div className="border rounded-xl">
          <RichTextEditor value={html} onChange={setHtml} placeholder="Begin met typen..." />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button type="button" variant="outline" size="sm" onClick={useTemplate} className="rounded-pill">
            Template invullen
          </Button>
          <Button type="button" size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="rounded-pill gap-2">
            <Save className="h-3.5 w-3.5" />
            {saveMutation.isPending ? "Opslaan..." : "Opslaan"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default HandtekeningEditor;