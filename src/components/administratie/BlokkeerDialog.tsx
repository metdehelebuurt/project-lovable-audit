import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { usePartnerBlokkade } from "@/hooks/administratie/usePartnerBlokkade";

interface BlokkeerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerId: string | null;
  partnerNaam: string;
  actie: "blokkeren" | "deblokkeren";
}

export default function BlokkeerDialog({
  open, onOpenChange, partnerId, partnerNaam, actie,
}: BlokkeerDialogProps) {
  const [reden, setReden] = useState("");
  const blokkade = usePartnerBlokkade();
  const blokkeren = actie === "blokkeren";
  const geldig = reden.trim().length >= 5;

  const bevestig = async () => {
    if (!partnerId || !geldig) return;
    await blokkade.mutateAsync({ partnerId, actie, reden: reden.trim() });
    setReden("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setReden(""); onOpenChange(v); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{blokkeren ? "Toegang blokkeren" : "Blokkade opheffen"}</DialogTitle>
          <DialogDescription>
            {blokkeren
              ? `Alle gebruikers van ${partnerNaam} verliezen direct toegang tot het systeem.`
              : `Gebruikers van ${partnerNaam} kunnen daarna weer inloggen en werken.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="blokkade-reden">Reden (minimaal 5 tekens)</Label>
          <Textarea
            id="blokkade-reden"
            value={reden}
            onChange={(e) => setReden(e.target.value)}
            placeholder={blokkeren ? "Wanbetaling factuur ..." : "Betaling ontvangen op ..."}
            rows={3}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuleren</Button>
          <Button
            variant={blokkeren ? "destructive" : "default"}
            disabled={!geldig || blokkade.isPending}
            onClick={bevestig}
          >
            {blokkade.isPending ? "Bezig..." : blokkeren ? "Blokkeren" : "Deblokkeren"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
