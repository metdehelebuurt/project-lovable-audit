import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateAffiliateLead } from "@/hooks/affiliate/useAffiliateLeads";
import { useLogContactmoment } from "@/hooks/affiliate/useAffiliateLeadContact";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

export type VerlorenCategorie = Database["public"]["Enums"]["affiliate_verloren_categorie"];

export const VERLOREN_CATEGORIEEN: { value: VerlorenCategorie; label: string }[] = [
  { value: "geen_interesse", label: "Geen interesse" },
  { value: "geen_budget", label: "Geen budget" },
  { value: "concurrent", label: "Gaat met concurrent verder" },
  { value: "timing", label: "Timing klopt niet (later misschien)" },
  { value: "geen_contact", label: "Krijg geen contact" },
  { value: "anders", label: "Anders" },
];

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  leadId: string;
  leadNaam: string;
  onSaved?: () => void;
}

export function VerlorenRedenDialog({ open, onOpenChange, leadId, leadNaam, onSaved }: Props) {
  const update = useUpdateAffiliateLead();
  const log = useLogContactmoment();
  const [categorie, setCategorie] = useState<VerlorenCategorie | "">("");
  const [reden, setReden] = useState("");

  useEffect(() => {
    if (open) {
      setCategorie("");
      setReden("");
    }
  }, [open]);

  const valid = !!categorie && reden.trim().length >= 10;

  const opslaan = async () => {
    if (!valid || !categorie) return;
    try {
      await update.mutateAsync({
        id: leadId,
        patch: {
          status: "verloren",
          verloren_reden: reden.trim(),
          verloren_categorie: categorie,
        },
      });
      await log.mutateAsync({
        lead_id: leadId,
        type: "notitie",
        uitkomst: `Verloren: ${categorie}`,
        notitie: reden.trim(),
      });
      toast.success("Lead op verloren gezet — wordt beoordeeld in lost-review");
      onOpenChange(false);
      onSaved?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Opslaan mislukt");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lead op verloren zetten</DialogTitle>
          <DialogDescription>
            {leadNaam} — geef een categorie én reden zodat we de lead later kunnen beoordelen.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Categorie</Label>
            <Select value={categorie} onValueChange={(v) => setCategorie(v as VerlorenCategorie)}>
              <SelectTrigger><SelectValue placeholder="Kies een categorie" /></SelectTrigger>
              <SelectContent>
                {VERLOREN_CATEGORIEEN.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Toelichting (min. 10 tekens)</Label>
            <Textarea
              rows={4}
              value={reden}
              onChange={(e) => setReden(e.target.value)}
              placeholder="Waarom is deze lead verloren? Wat zei de klant precies?"
            />
            <p className="text-xs text-muted-foreground mt-1">{reden.trim().length}/10 tekens</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuleren</Button>
          <Button onClick={opslaan} disabled={!valid || update.isPending} variant="destructive">
            Markeer als verloren
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}