import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

type Prioriteit = "laag" | "normaal" | "hoog" | "urgent";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  defaultTitel?: string;
}

export default function NieuweTaakDialog({ open, onOpenChange, onCreated, defaultTitel = "" }: Props) {
  const { user, profile } = useAuth();
  const [titel, setTitel] = useState(defaultTitel);
  const [omschrijving, setOmschrijving] = useState("");
  const [deadline, setDeadline] = useState<string>("");
  const [prioriteit, setPrioriteit] = useState<Prioriteit>("normaal");
  const [toegewezen, setToegewezen] = useState<string>(user?.id ?? "");
  const [bezig, setBezig] = useState(false);

  const { data: collegas = [] } = useQuery({
    queryKey: ["ac-collegas", profile?.partner_id],
    enabled: !!profile?.partner_id && open,
    queryFn: async () => {
      const { data } = await supabase
        .from("users")
        .select("id, voornaam, achternaam")
        .eq("partner_id", profile!.partner_id!)
        .in("rol", ["partner_admin", "partner_staff", "adviseur", "installateur", "backoffice"])
        .order("voornaam");
      return data ?? [];
    },
  });

  const reset = () => {
    setTitel(""); setOmschrijving(""); setDeadline(""); setPrioriteit("normaal");
    setToegewezen(user?.id ?? "");
  };

  const opslaan = async () => {
    if (!titel.trim() || !user?.id || !profile?.partner_id) return;
    setBezig(true);
    const { error } = await supabase.from("helpdesk_ticket_taken").insert({
      titel: titel.trim(),
      omschrijving: omschrijving.trim() || null,
      deadline: deadline || null,
      prioriteit,
      status: "open",
      partner_id: profile.partner_id,
      gemaakt_door: user.id,
      toegewezen_aan: toegewezen || user.id,
    });
    setBezig(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Taak aangemaakt");
    reset();
    onOpenChange(false);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nieuwe taak</DialogTitle>
          <DialogDescription>Maak een snelle taak aan zonder ticketkoppeling.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="t-titel">Titel</Label>
            <Input id="t-titel" autoFocus value={titel} onChange={(e) => setTitel(e.target.value)} placeholder="Bijv. Klant terugbellen" />
          </div>
          <div>
            <Label htmlFor="t-oms">Omschrijving (optioneel)</Label>
            <Textarea id="t-oms" value={omschrijving} onChange={(e) => setOmschrijving(e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="t-deadline">Deadline</Label>
              <Input id="t-deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
            <div>
              <Label>Prioriteit</Label>
              <Select value={prioriteit} onValueChange={(v) => setPrioriteit(v as Prioriteit)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="laag">Laag</SelectItem>
                  <SelectItem value="normaal">Normaal</SelectItem>
                  <SelectItem value="hoog">Hoog</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Toewijzen aan</Label>
            <Select value={toegewezen} onValueChange={setToegewezen}>
              <SelectTrigger><SelectValue placeholder="Kies collega" /></SelectTrigger>
              <SelectContent>
                {collegas.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.voornaam} {c.achternaam}{c.id === user?.id ? " (jij)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuleren</Button>
          <Button onClick={opslaan} disabled={!titel.trim() || bezig}>
            {bezig ? "Opslaan…" : "Taak aanmaken"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}