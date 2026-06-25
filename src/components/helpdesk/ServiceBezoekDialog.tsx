import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCreateServiceBezoek } from "@/hooks/helpdesk/useServiceBezoeken";
import type { HelpdeskTicket } from "@/hooks/helpdesk/useTickets";
import { TijdzoneBanner } from "@/components/shared/TijdzoneBanner";

function useMonteurs(partnerId: string) {
  return useQuery({
    queryKey: ["partner_monteurs", partnerId],
    enabled: !!partnerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, voornaam, achternaam, rol")
        .eq("partner_id", partnerId)
        .in("rol", ["installateur", "partner_staff", "partner_admin"]);
      if (error) throw error;
      return (data ?? []) as Array<{ id: string; voornaam: string; achternaam: string; rol: string }>;
    },
  });
}

export function ServiceBezoekDialog({ ticket, type, trigger }: { ticket: HelpdeskTicket; type: "service_bezoek" | "storing"; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [monteurId, setMonteurId] = useState<string>("");
  const [datum, setDatum] = useState<string>(type === "storing" ? new Date().toISOString().slice(0, 10) : "");
  const [tijd, setTijd] = useState<string>("");
  const [notities, setNotities] = useState("");
  const [duur, setDuur] = useState<string>(ticket.geschatte_duur_minuten ? String(ticket.geschatte_duur_minuten) : "");
  const create = useCreateServiceBezoek();
  const { data: monteurs = [] } = useMonteurs(ticket.partner_id);

  const opslaan = async () => {
    if (!datum || !monteurId) return;
    await create.mutateAsync({
      ticket_id: ticket.id,
      partner_id: ticket.partner_id,
      type,
      monteur_id: monteurId,
      geplande_datum: datum,
      geplande_tijd: tijd || null,
      notities: notities || null,
      klant_id: ticket.klant_id,
      geschatte_duur_minuten: duur ? parseInt(duur, 10) : null,
    });
    setOpen(false);
    setNotities("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{type === "storing" ? "Storing — monteur direct inplannen" : "Service-bezoek inplannen"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Monteur</Label>
            <Select value={monteurId} onValueChange={setMonteurId}>
              <SelectTrigger><SelectValue placeholder="Kies monteur" /></SelectTrigger>
              <SelectContent>
                {monteurs.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.voornaam} {m.achternaam} <span className="text-xs text-muted-foreground">({m.rol})</span></SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Datum</Label><Input type="date" value={datum} onChange={(e) => setDatum(e.target.value)} /></div>
            <div><Label>Tijd</Label><Input type="time" value={tijd} onChange={(e) => setTijd(e.target.value)} /></div>
            <div>
              <Label>Duur</Label>
              <Select value={duur} onValueChange={setDuur}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="60">1 uur</SelectItem>
                  <SelectItem value="90">1,5 uur</SelectItem>
                  <SelectItem value="120">2 uur</SelectItem>
                  <SelectItem value="180">3 uur</SelectItem>
                  <SelectItem value="240">4 uur</SelectItem>
                  <SelectItem value="480">Hele dag</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <TijdzoneBanner datum={datum} tijd={tijd} compact />
          <div>
            <Label>Notities</Label>
            <Textarea rows={3} value={notities} onChange={(e) => setNotities(e.target.value)} placeholder="Wat moet de monteur weten" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Annuleren</Button>
          <Button onClick={opslaan} disabled={create.isPending || !datum || !monteurId}>Inplannen</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}