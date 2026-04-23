import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { UserCog } from "lucide-react";
import { updateInstallatie } from "./api/installatieApi";
import type { Installatie } from "./api/installatieApi";

interface Monteur {
  id: string;
  voornaam: string;
  achternaam: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installatie: Installatie;
  onSaved?: () => void;
}

export default function MonteurWijzigDialog({ open, onOpenChange, installatie, onSaved }: Props) {
  const [monteurs, setMonteurs] = useState<Monteur[]>([]);
  const [monteurId, setMonteurId] = useState<string>(installatie.installateur_id ?? "");
  const [startdatum, setStartdatum] = useState<string>(installatie.geplande_startdatum ?? "");
  const [starttijd, setStarttijd] = useState<string>(installatie.start_tijd ?? "");
  const [eindtijd, setEindtijd] = useState<string>(installatie.eind_tijd ?? "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMonteurId(installatie.installateur_id ?? "");
    setStartdatum(installatie.geplande_startdatum ?? "");
    setStarttijd(installatie.start_tijd ?? "");
    setEindtijd(installatie.eind_tijd ?? "");
    void supabase
      .from("users")
      .select("id, voornaam, achternaam")
      .eq("rol", "installateur")
      .eq("status", "actief")
      .order("voornaam", { ascending: true })
      .then(({ data }) => setMonteurs((data ?? []) as Monteur[]));
  }, [open, installatie]);

  const opslaan = async () => {
    if (!monteurId) {
      toast.error("Selecteer een monteur");
      return;
    }
    setBusy(true);
    try {
      await updateInstallatie(installatie.id, {
        installateur_id: monteurId,
        geplande_startdatum: startdatum || null,
        start_tijd: starttijd || null,
        eind_tijd: eindtijd || null,
        status: installatie.status === "concept" ? "gepland" : installatie.status,
      });
      toast.success(installatie.installateur_id ? "Monteur gewijzigd" : "Monteur toegewezen");
      onSaved?.();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Opslaan mislukt");
    } finally {
      setBusy(false);
    }
  };

  const titel = installatie.installateur_id ? "Monteur wijzigen" : "Monteur toewijzen";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-primary" /> {titel}
          </DialogTitle>
          <DialogDescription>
            Pas de toegewezen monteur en planning aan voor deze installatie.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Monteur *</Label>
            <Select value={monteurId} onValueChange={setMonteurId}>
              <SelectTrigger><SelectValue placeholder="Selecteer monteur" /></SelectTrigger>
              <SelectContent>
                {monteurs.length === 0 && (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">Geen actieve monteurs gevonden</div>
                )}
                {monteurs.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.voornaam} {m.achternaam}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Startdatum</Label>
            <Input type="date" value={startdatum} onChange={(e) => setStartdatum(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Starttijd</Label>
              <Input type="time" value={starttijd} onChange={(e) => setStarttijd(e.target.value)} />
            </div>
            <div>
              <Label>Eindtijd</Label>
              <Input type="time" value={eindtijd} onChange={(e) => setEindtijd(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuleren</Button>
          <Button onClick={opslaan} disabled={busy}>{busy ? "Opslaan…" : "Opslaan"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}