import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  const [inAgenda, setInAgenda] = useState(false);
  const [datum, setDatum] = useState("");
  const [start, setStart] = useState("09:00");
  const [eind, setEind] = useState("09:30");
  const [agendaUserId, setAgendaUserId] = useState<string>("");
  const [herinnering, setHerinnering] = useState(true);
  const upsert = useUpsertTaak();

  const { data: teamUsers = [] } = useQuery({
    queryKey: ["taak-team-users", partnerId],
    enabled: open && !!partnerId,
    queryFn: async () => {
      const { data } = await supabase
        .from("users")
        .select("id, voornaam, achternaam, rol")
        .eq("partner_id", partnerId)
        .eq("status", "actief")
        .order("voornaam");
      return data ?? [];
    },
  });

  useEffect(() => {
    if (open) {
      setTitel(taak?.titel ?? "");
      setOmschrijving(taak?.omschrijving ?? "");
      setPrioriteit(taak?.prioriteit ?? "normaal");
      setStatus(taak?.status ?? "open");
      setDeadline(taak?.deadline ? taak.deadline.slice(0, 10) : "");
      const t = taak as unknown as { inplannen_in_agenda?: boolean; geplande_datum?: string | null; geplande_starttijd?: string | null; geplande_eindtijd?: string | null; agenda_user_id?: string | null; herinnering_dag_voor?: boolean } | undefined;
      setInAgenda(t?.inplannen_in_agenda ?? false);
      setDatum(t?.geplande_datum ?? "");
      setStart((t?.geplande_starttijd ?? "09:00").slice(0, 5));
      setEind((t?.geplande_eindtijd ?? "09:30").slice(0, 5));
      setAgendaUserId(t?.agenda_user_id ?? "");
      setHerinnering(t?.herinnering_dag_voor ?? true);
    }
  }, [open, taak]);

  const opslaan = async () => {
    if (!titel.trim()) return;
    const agendaPayload = inAgenda ? {
      inplannen_in_agenda: true,
      geplande_datum: datum || null,
      geplande_starttijd: start || null,
      geplande_eindtijd: eind || null,
      agenda_user_id: agendaUserId || null,
      herinnering_dag_voor: herinnering,
    } : { inplannen_in_agenda: false };
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
      ...agendaPayload,
    } as never);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{taak ? "Taak bewerken" : "Nieuwe taak"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
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
                  <SelectItem value="klaar">Klaar</SelectItem>
                  <SelectItem value="geannuleerd">Geannuleerd</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="taak-dl">Deadline</Label>
              <Input id="taak-dl" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
          </div>

          <div className="rounded-xl border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Inplannen in agenda</Label>
                <p className="text-xs text-muted-foreground">Toont deze taak in de planning-kalender</p>
              </div>
              <Switch checked={inAgenda} onCheckedChange={setInAgenda} />
            </div>
            {inAgenda && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="taak-datum">Datum</Label>
                    <Input id="taak-datum" type="date" value={datum} onChange={(e) => setDatum(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="taak-start">Start</Label>
                    <Input id="taak-start" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="taak-eind">Eind</Label>
                    <Input id="taak-eind" type="time" value={eind} onChange={(e) => setEind(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>Toegewezen aan</Label>
                  <Select value={agendaUserId || "_self"} onValueChange={(v) => setAgendaUserId(v === "_self" ? userId : v)}>
                    <SelectTrigger><SelectValue placeholder="Kies team-lid" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_self">Mijzelf</SelectItem>
                      {teamUsers.map((u: { id: string; voornaam: string | null; achternaam: string | null; rol: string }) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.voornaam ?? ""} {u.achternaam ?? ""} ({u.rol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Herinnering 1 dag van tevoren</Label>
                  <Switch checked={herinnering} onCheckedChange={setHerinnering} />
                </div>
              </div>
            )}
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