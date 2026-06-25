import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useCreateTerugbel } from "@/hooks/affiliate/useTerugbelAfspraken";
import { useInterneCollegas } from "@/hooks/affiliate/useInterneCollegas";
import { TijdzoneBanner } from "@/components/shared/TijdzoneBanner";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  leadId: string;
  leadNaam: string;
  klantEmail?: string | null;
  afspraakType?: "terugbel" | "demo";
  onSaved?: () => void;
}

export function TerugbelDialog({ open, onOpenChange, leadId, leadNaam, klantEmail, afspraakType = "terugbel", onSaved }: Props) {
  const create = useCreateTerugbel();
  const { data: collegas = [], isLoading: collegasLoading } = useInterneCollegas();
  const morgen = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
  const [moment, setMoment] = useState(morgen);
  const [collegaId, setCollegaId] = useState<string>("");
  const [notitie, setNotitie] = useState("");
  const [stuurBevestiging, setStuurBevestiging] = useState(true);
  const [email, setEmail] = useState(klantEmail ?? "");
  const isDemo = afspraakType === "demo";
  const titel = isDemo ? "Demo inplannen" : "Terugbelafspraak plannen";
  const placeholder = isDemo
    ? "Bijv. demo van schouwmodule, met wie, link naar meeting..."
    : "Waar bel je over terug?";

  const opslaan = async () => {
    if (!moment || !collegaId) return;
    if (stuurBevestiging && !/^\S+@\S+\.\S+$/.test(email)) return;
    await create.mutateAsync({
      lead_id: leadId,
      geplande_op: new Date(moment).toISOString(),
      notitie: notitie || null,
      type: afspraakType,
      collega_user_id: collegaId,
      klant_bevestiging: stuurBevestiging,
      klant_email: stuurBevestiging ? email.trim() : null,
    });
    setNotitie("");
    setCollegaId("");
    onOpenChange(false);
    onSaved?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titel}</DialogTitle>
          <DialogDescription>Voor {leadNaam}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Datum en tijd</Label>
            <Input type="datetime-local" value={moment} onChange={(e) => setMoment(e.target.value)} />
            <TijdzoneBanner moment={moment} className="mt-2" />
          </div>
          <div className="space-y-1">
            <Label>Voor welke collega?</Label>
            <Select value={collegaId} onValueChange={setCollegaId}>
              <SelectTrigger>
                <SelectValue placeholder={collegasLoading ? "Laden..." : "Kies een collega"} />
              </SelectTrigger>
              <SelectContent>
                {collegas.map((c) => {
                  const naam = `${c.voornaam ?? ""} ${c.achternaam ?? ""}`.trim() || c.email || "Onbekend";
                  return (
                    <SelectItem key={c.id} value={c.id}>
                      {naam}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Deze collega krijgt altijd een interne notificatie.
            </p>
          </div>
          <div className="space-y-1">
            <Label>Notitie (optioneel)</Label>
            <Textarea rows={3} value={notitie} onChange={(e) => setNotitie(e.target.value)} placeholder={placeholder} />
          </div>
          <div className="rounded-md border p-3 space-y-2 bg-muted/30">
            <label className="flex items-start gap-2 cursor-pointer">
              <Checkbox
                checked={stuurBevestiging}
                onCheckedChange={(v) => setStuurBevestiging(!!v)}
                className="mt-0.5"
              />
              <span className="text-sm font-medium">Bevestigingsmail naar klant sturen</span>
            </label>
            {stuurBevestiging && (
              <div className="space-y-1 pl-6">
                <Label className="text-xs">E-mailadres klant</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="naam@bedrijf.nl"
                />
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuleren</Button>
          <Button
            onClick={opslaan}
            disabled={
              create.isPending ||
              !moment ||
              !collegaId ||
              (stuurBevestiging && !/^\S+@\S+\.\S+$/.test(email))
            }
          >
            Plannen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
