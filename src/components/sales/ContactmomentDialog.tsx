import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Phone, Mail, StickyNote, CalendarCheck } from "lucide-react";

type ContactType = "telefoon" | "email" | "notitie" | "afspraak";

const TYPE_LABEL: Record<ContactType, string> = {
  telefoon: "Telefoongesprek",
  email: "E-mail",
  notitie: "Notitie",
  afspraak: "Afspraak",
};

const TYPE_ICON = { telefoon: Phone, email: Mail, notitie: StickyNote, afspraak: CalendarCheck };

interface Props {
  leadId: string | null;
  bedrijfsnaam?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ContactmomentDialog({ leadId, bedrijfsnaam, open, onOpenChange }: Props) {
  const [type, setType] = useState<ContactType>("telefoon");
  const [uitkomst, setUitkomst] = useState("");
  const [notitie, setNotitie] = useState("");
  const [duur, setDuur] = useState<string>("");
  const [volgende, setVolgende] = useState<string>("");
  const qc = useQueryClient();

  const opslaan = useMutation({
    mutationFn: async () => {
      if (!leadId) throw new Error("Geen lead");
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      const payload = {
        lead_id: leadId,
        affiliate_id: uid,
        type: type as never,
        uitkomst: uitkomst.trim() || null,
        notitie: notitie.trim() || null,
        duur_seconden: duur ? Math.max(0, Math.round(Number(duur) * 60)) : null,
        volgende_actie_datum: volgende || null,
      };
      const { error } = await supabase.from("affiliate_lead_contactmomenten").insert(payload);
      if (error) throw error;

      if (volgende) {
        const iso = new Date(volgende + "T09:00:00").toISOString();
        await supabase
          .from("affiliate_leads")
          .update({ volgende_actie_op: iso })
          .eq("id", leadId);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lead-contactmomenten", leadId] });
      qc.invalidateQueries({ queryKey: ["sales-leads"] });
      toast.success("Contactmoment gelogd");
      setUitkomst(""); setNotitie(""); setDuur(""); setVolgende("");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const Icon = TYPE_ICON[type];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-4 w-4" /> Contactmoment loggen
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {bedrijfsnaam && (
            <div className="rounded-md bg-muted/40 p-2 text-sm font-medium">{bedrijfsnaam}</div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Soort</Label>
              <Select value={type} onValueChange={(v) => setType(v as ContactType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(TYPE_LABEL) as ContactType[]).map((k) => (
                    <SelectItem key={k} value={k}>{TYPE_LABEL[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {type === "telefoon" && (
              <div>
                <Label>Duur (minuten)</Label>
                <Input type="number" min={0} value={duur} onChange={(e) => setDuur(e.target.value)} />
              </div>
            )}
          </div>
          <div>
            <Label>Uitkomst</Label>
            <Input
              value={uitkomst}
              onChange={(e) => setUitkomst(e.target.value)}
              placeholder="Bijv. Niet bereikt, voicemail, afspraak ingepland…"
              maxLength={200}
            />
          </div>
          <div>
            <Label>Notitie</Label>
            <Textarea
              rows={3}
              value={notitie}
              onChange={(e) => setNotitie(e.target.value)}
              maxLength={1000}
              placeholder="Wat is er besproken? Wat is de volgende stap?"
            />
          </div>
          <div>
            <Label>Volgende actie op</Label>
            <Input type="date" value={volgende} onChange={(e) => setVolgende(e.target.value)} />
            <p className="text-[11px] text-muted-foreground mt-1">
              Update ook automatisch het "volgende actie"-veld op de lead.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuleren</Button>
          <Button onClick={() => opslaan.mutate()} disabled={opslaan.isPending}>
            {opslaan.isPending ? "Bezig…" : "Loggen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}