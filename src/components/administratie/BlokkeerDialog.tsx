import { useState } from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import BlokkadeScherm from "./BlokkadeScherm";
import { usePartnerBlokkade } from "@/hooks/administratie/usePartnerBlokkade";

interface BlokkeerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerId: string | null;
  partnerNaam: string;
  actie: "blokkeren" | "deblokkeren";
  openstaandBedrag?: number;
}

const isGeldigeUrl = (waarde: string) => {
  if (!waarde.trim()) return true;
  try {
    const url = new URL(waarde.trim());
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
};

export default function BlokkeerDialog({
  open, onOpenChange, partnerId, partnerNaam, actie, openstaandBedrag = 0,
}: BlokkeerDialogProps) {
  const [reden, setReden] = useState("");
  const [betaalUrl, setBetaalUrl] = useState("");
  const [voorbeeld, setVoorbeeld] = useState(false);
  const blokkade = usePartnerBlokkade();
  const blokkeren = actie === "blokkeren";
  const urlOk = isGeldigeUrl(betaalUrl);
  const geldig = reden.trim().length >= 5 && urlOk;

  const sluit = () => { setReden(""); setBetaalUrl(""); setVoorbeeld(false); };

  const bevestig = async () => {
    if (!partnerId || !geldig) return;
    await blokkade.mutateAsync({
      partnerId,
      actie,
      reden: reden.trim(),
      betaalUrl: blokkeren ? betaalUrl.trim() || null : null,
    });
    sluit();
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) sluit(); onOpenChange(v); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{blokkeren ? "Toegang blokkeren" : "Blokkade opheffen"}</DialogTitle>
            <DialogDescription>
              {blokkeren
                ? `Alle gebruikers van ${partnerNaam} verliezen direct toegang tot het systeem.`
                : `Gebruikers van ${partnerNaam} kunnen daarna weer inloggen en werken.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
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

            {blokkeren && (
              <div className="space-y-2">
                <Label htmlFor="blokkade-betaalurl">Betaallink (optioneel)</Label>
                <Input
                  id="blokkade-betaalurl"
                  value={betaalUrl}
                  onChange={(e) => setBetaalUrl(e.target.value)}
                  placeholder="https://..."
                  aria-invalid={!urlOk}
                />
                {!urlOk && (
                  <p className="text-xs text-destructive">Vul een volledige link in, beginnend met https://</p>
                )}
                <Button type="button" variant="outline" size="sm" onClick={() => setVoorbeeld(true)}>
                  <Eye className="h-4 w-4 mr-1" aria-hidden="true" />Voorbeeld klantscherm
                </Button>
              </div>
            )}
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

      <Dialog open={voorbeeld} onOpenChange={setVoorbeeld}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Voorbeeld: dit ziet de klant</DialogTitle>
            <DialogDescription>Zo ziet {partnerNaam} het scherm na blokkeren.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center bg-muted/40 p-4 rounded-lg">
            <BlokkadeScherm
              reden={reden.trim() || null}
              openstaandBedrag={openstaandBedrag}
              betaalUrl={urlOk ? betaalUrl.trim() || null : null}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
