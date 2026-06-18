import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateTerugbel } from "@/hooks/affiliate/useTerugbelAfspraken";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  leadId: string;
  leadNaam: string;
}

export function TerugbelDialog({ open, onOpenChange, leadId, leadNaam }: Props) {
  const create = useCreateTerugbel();
  const morgen = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
  const [moment, setMoment] = useState(morgen);
  const [notitie, setNotitie] = useState("");

  const opslaan = async () => {
    if (!moment) return;
    await create.mutateAsync({
      lead_id: leadId,
      geplande_op: new Date(moment).toISOString(),
      notitie: notitie || null,
    });
    setNotitie("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Terugbelafspraak plannen</DialogTitle>
          <DialogDescription>Voor {leadNaam}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Datum en tijd</Label>
            <Input type="datetime-local" value={moment} onChange={(e) => setMoment(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Notitie (optioneel)</Label>
            <Textarea rows={3} value={notitie} onChange={(e) => setNotitie(e.target.value)} placeholder="Waar bel je over terug?" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuleren</Button>
          <Button onClick={opslaan} disabled={create.isPending || !moment}>Plannen</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
