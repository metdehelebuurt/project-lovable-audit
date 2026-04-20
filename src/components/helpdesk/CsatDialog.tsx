import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  ticketId: string;
  partnerId: string;
  ticketnummer: string;
};

export function CsatDialog({ open, onOpenChange, ticketId, partnerId, ticketnummer }: Props) {
  const [score, setScore] = useState<number>(0);
  const [opmerking, setOpmerking] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (score < 1) return;
    setBusy(true);
    const { error } = await supabase
      .from("helpdesk_csat" as never)
      .insert({ ticket_id: ticketId, partner_id: partnerId, score, opmerking: opmerking.trim() || null } as never);
    setBusy(false);
    if (error) {
      toast.error(`Opslaan mislukt: ${error.message}`);
      return;
    }
    toast.success("Bedankt voor je feedback");
    onOpenChange(false);
    setScore(0);
    setOpmerking("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hoe tevreden ben je over de afhandeling van {ticketnummer}?</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center gap-1 py-4">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setScore(n)}
              className="p-1 rounded hover:bg-muted transition"
              aria-label={`${n} sterren`}
            >
              <Star className={`h-8 w-8 ${n <= score ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
            </button>
          ))}
        </div>
        <Textarea
          placeholder="Optionele toelichting…"
          value={opmerking}
          onChange={(e) => setOpmerking(e.target.value)}
          rows={3}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Overslaan</Button>
          <Button onClick={submit} disabled={score < 1 || busy}>{busy ? "Versturen…" : "Versturen"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
