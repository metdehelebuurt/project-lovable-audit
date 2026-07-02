import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { vervallenRapport } from "./api/opleverApi";
import { useAuth } from "@/contexts/AuthContext";
import { AlertTriangle, Loader2 } from "lucide-react";
import type { Opleverrapport } from "./types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rapport: Opleverrapport;
  onDone?: () => void;
}

const REDEN_OPTIES: { value: string; label: string }[] = [
  { value: "installatie_ongedaan", label: "Installatie is ongedaan gemaakt" },
  { value: "rapport_vervangen", label: "Rapport wordt vervangen door nieuw rapport" },
  { value: "onjuiste_gegevens", label: "Onjuiste of onvolledige gegevens" },
  { value: "verkeerde_klant", label: "Op verkeerde klant / verkooporder aangemaakt" },
  { value: "hermeting_nodig", label: "Hermeting of nieuwe oplevering nodig" },
  { value: "duplicaat", label: "Duplicaat" },
  { value: "anders", label: "Anders (zie omschrijving)" },
];

export default function VervallenDialog({ open, onOpenChange, rapport, onDone }: Props) {
  const nav = useNavigate();
  const { profile } = useAuth();
  const [redenKey, setRedenKey] = useState<string>("rapport_vervangen");
  const [omschrijving, setOmschrijving] = useState("");
  const [maakNieuw, setMaakNieuw] = useState(true);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    if (redenKey === "anders" && omschrijving.trim().length < 3) {
      toast({ title: "Omschrijving verplicht", description: "Geef een korte toelichting.", variant: "destructive" });
      return;
    }
    try {
      setBusy(true);
      const redenLabel = REDEN_OPTIES.find((o) => o.value === redenKey)?.label ?? redenKey;
      const { nieuwRapportId } = await vervallenRapport(rapport, {
        reden_categorie: redenKey,
        reden: omschrijving.trim() || redenLabel,
        maak_nieuw: maakNieuw,
        actor_id: profile?.id ?? null,
      });
      toast({
        title: "Rapport vervallen",
        description: nieuwRapportId ? "Nieuw opleverrapport is gestart." : "Rapport is als vervallen gemarkeerd.",
      });
      onOpenChange(false);
      onDone?.();
      if (nieuwRapportId) nav(`/opleveringen/${nieuwRapportId}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Onbekende fout";
      toast({ title: "Mislukt", description: msg, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Opleverrapport laten vervallen
          </DialogTitle>
          <DialogDescription>
            Het rapport blijft bewaard voor historie, maar wordt gemarkeerd als vervallen. Kies optioneel om direct een
            nieuw rapport te starten dat dit rapport vervangt.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Reden</Label>
            <RadioGroup value={redenKey} onValueChange={setRedenKey} className="space-y-1.5">
              {REDEN_OPTIES.map((opt) => (
                <div key={opt.value} className="flex items-start gap-2">
                  <RadioGroupItem id={`vervallen-${opt.value}`} value={opt.value} className="mt-0.5" />
                  <Label htmlFor={`vervallen-${opt.value}`} className="font-normal cursor-pointer leading-snug">
                    {opt.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vervallen-omschrijving">
              Toelichting {redenKey === "anders" ? "(verplicht)" : "(optioneel)"}
            </Label>
            <Textarea
              id="vervallen-omschrijving"
              value={omschrijving}
              onChange={(e) => setOmschrijving(e.target.value)}
              placeholder="Extra context voor historie en traceability…"
              rows={3}
              maxLength={1000}
            />
          </div>

          <div className="flex items-start gap-2 rounded-lg border p-3">
            <Checkbox
              id="vervallen-maak-nieuw"
              checked={maakNieuw}
              onCheckedChange={(v) => setMaakNieuw(Boolean(v))}
              className="mt-0.5"
            />
            <Label htmlFor="vervallen-maak-nieuw" className="font-normal cursor-pointer leading-snug">
              Direct een nieuw opleverrapport starten met dezelfde klant, opdracht en specificaties. Beide rapporten
              worden aan elkaar gekoppeld.
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Annuleren
          </Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
            {maakNieuw ? "Vervangen door nieuw rapport" : "Laten vervallen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}