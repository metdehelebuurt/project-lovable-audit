import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpsertTaak, type TicketTaak } from "@/hooks/helpdesk/useTicketDetail";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  ticketId: string;
  partnerId: string;
  userId: string;
  taak?: TicketTaak | null;
}

export function TaakDialog({ open, onOpenChange, ticketId, partnerId, userId, taak }: Props) {
  const [titel, setTitel] = useState("");
  const [omschrijving, setOmschrijving] = useState("");
  const [prioriteit, setPrioriteit] = useState("normaal");
  const [status, setStatus] = useState("open");
  const [deadline, setDeadline] = useState("");
  const upsert = useUpsertTaak();

  useEffect(() => {
    if (open) {
      setTitel(taak?.titel ?? "");
      setOmschrijving(taak?.omschrijving ?? "");
      setPrioriteit(taak?.prioriteit ?? "normaal");
      setStatus(taak?.status ?? "open");
      setDeadline(taak?.deadline ? taak.deadline.slice(0, 10) : "");
    }
  }, [open, taak]);

  const opslaan = async () => {
    if (!titel.trim()) return;
    await upsert.mutateAsync({
      id: taak?.id,
      ticket_id: ticketId,
      partner_id: partnerId,
      gemaakt_door: userId,
      titel: titel.trim(),
      omschrijving: omschrijving.trim() || null,
      prioriteit,
      status,
      deadline: deadline ? deadline : null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{taak ? "Taak bewerken" : "Nieuwe taak"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="taak-titel">Titel</Label>
            <Input id="taak-titel" value={titel} onChange={(e) => setTitel(e.target.value)} placeholder="Wat moet er gebeuren" />
          </div>
          <div>
            <Label htmlFor="taak-oms">Omschrijving</Label>
            <Textarea id="taak-oms" rows={3} value={omschrijving} onChange={(e) => setOmschrijving(e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Prioriteit</Label>
              <Select value={prioriteit} onValueChange={setPrioriteit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="laag">Laag</SelectItem>
                  <SelectItem value="normaal">Normaal</SelectItem>
                  <SelectItem value="hoog">Hoog</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_behandeling">In behandeling</SelectItem>
                  <SelectItem value="voltooid">Voltooid</SelectItem>
                  <SelectItem value="geannuleerd">Geannuleerd</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="taak-dl">Deadline</Label>
              <Input id="taak-dl" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuleren</Button>
          <Button onClick={opslaan} disabled={upsert.isPending || !titel.trim()}>Opslaan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}