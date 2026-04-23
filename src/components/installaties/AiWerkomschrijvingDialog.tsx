import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installatieId: string;
  huidigeTekst?: string | null;
  onAccept: (tekst: string) => void;
}

export default function AiWerkomschrijvingDialog({ open, onOpenChange, installatieId, huidigeTekst, onAccept }: Props) {
  const [busy, setBusy] = useState(false);
  const [tekst, setTekst] = useState<string>("");

  const genereer = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("genereer-werkomschrijving", {
        body: { installatie_id: installatieId },
      });
      if (error) {
        const msg = error.message || "";
        if (msg.includes("429")) toast.error("Te veel verzoeken — probeer over een minuut opnieuw");
        else if (msg.includes("402")) toast.error("AI-credits opgeraakt — vul aan in workspace-instellingen");
        else toast.error(`Generatie mislukt: ${msg}`);
        return;
      }
      const t = (data as { tekst?: string })?.tekst ?? "";
      if (!t) {
        toast.error("AI gaf geen bruikbare tekst terug");
        return;
      }
      setTekst(t);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Onbekende fout";
      toast.error(`Generatie mislukt: ${msg}`);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (open && !tekst && !busy) {
      void genereer();
    }
    if (!open) {
      setTekst("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const accepteren = () => {
    if (!tekst.trim()) return;
    onAccept(tekst.trim());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI-werkomschrijving voor monteur
          </DialogTitle>
          <DialogDescription>
            Op basis van schouw, producten, klantgegevens en checklist. Bewerk indien nodig.
          </DialogDescription>
        </DialogHeader>

        {busy && !tekst ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm">Werkomschrijving genereren…</p>
          </div>
        ) : (
          <Textarea
            value={tekst}
            onChange={(e) => setTekst(e.target.value)}
            rows={14}
            placeholder="Tekst verschijnt hier…"
            className="font-mono text-sm"
          />
        )}

        {huidigeTekst && tekst && (
          <p className="text-xs text-muted-foreground">
            Let op: bestaande werkomschrijving wordt overschreven na opslaan.
          </p>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Annuleren
          </Button>
          <Button variant="outline" onClick={() => { setTekst(""); void genereer(); }} disabled={busy}>
            <RefreshCw className={`h-4 w-4 mr-1 ${busy ? "animate-spin" : ""}`} />
            Opnieuw genereren
          </Button>
          <Button onClick={accepteren} disabled={busy || !tekst.trim()}>
            Gebruiken
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}