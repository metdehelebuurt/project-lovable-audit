import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateTerugbel } from "@/hooks/affiliate/useTerugbelAfspraken";
import { useInterneCollegas } from "@/hooks/affiliate/useInterneCollegas";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  leadId: string;
  leadNaam: string;
  afspraakType?: "terugbel" | "demo";
}

export function TerugbelDialog({ open, onOpenChange, leadId, leadNaam, afspraakType = "terugbel" }: Props) {
  const create = useCreateTerugbel();
  const { data: collegas = [], isLoading: collegasLoading } = useInterneCollegas();
  const morgen = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
  const [moment, setMoment] = useState(morgen);
  const [collegaId, setCollegaId] = useState<string>("");
  const [notitie, setNotitie] = useState("");
  const isDemo = afspraakType === "demo";
  const titel = isDemo ? "Demo inplannen" : "Terugbelafspraak plannen";
  const placeholder = isDemo
    ? "Bijv. demo van schouwmodule, met wie, link naar meeting..."
    : "Waar bel je over terug?";

  const opslaan = async () => {
    if (!moment || !collegaId) return;
    await create.mutateAsync({
      lead_id: leadId,
      geplande_op: new Date(moment).toISOString(),
      notitie: notitie || null,
      type: afspraakType,
      collega_user_id: collegaId,
    });
    setNotitie("");
    setCollegaId("");
    onOpenChange(false);
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
              Zowel de klant als deze collega krijgt een bevestigingsmail.
            </p>
          </div>
          <div className="space-y-1">
            <Label>Notitie (optioneel)</Label>
            <Textarea rows={3} value={notitie} onChange={(e) => setNotitie(e.target.value)} placeholder={placeholder} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuleren</Button>
          <Button onClick={opslaan} disabled={create.isPending || !moment || !collegaId}>Plannen</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
