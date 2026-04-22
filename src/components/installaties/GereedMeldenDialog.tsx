import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (notitie: string) => Promise<void> | void;
  isPending?: boolean;
}

export default function GereedMeldenDialog({ open, onOpenChange, onConfirm, isPending }: Props) {
  const [notitie, setNotitie] = useState("");

  const handleConfirm = async () => {
    await onConfirm(notitie);
    setNotitie("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>Installatie gereed melden</DialogTitle>
          <DialogDescription>
            Voeg eventueel bijzonderheden of een toelichting toe. De status wordt op "Gereed" gezet.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="gereed-notitie">Notitie (optioneel)</Label>
          <Textarea
            id="gereed-notitie"
            value={notitie}
            onChange={(e) => setNotitie(e.target.value)}
            placeholder="Bijv. afwijkingen, restpunten of vervolgafspraken"
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">Annuleren</Button>
          <Button onClick={handleConfirm} disabled={isPending} className="rounded-xl gap-2">
            <CheckCircle2 className="h-4 w-4" /> Gereed melden
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}