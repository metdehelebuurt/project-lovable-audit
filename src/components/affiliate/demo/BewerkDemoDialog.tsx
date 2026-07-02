import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { DemoAfspraakRow } from "@/hooks/affiliate/useAlleDemoAfspraken";
import type { TablesUpdate } from "@/integrations/supabase/types";
import { toLocalInput } from "./demoTijdHelpers";

type Status = "open" | "afgerond" | "noshow";

function huidigeStatus(r: DemoAfspraakRow): Status {
  if (r.noshow) return "noshow";
  if (r.afgehandeld_op) return "afgerond";
  return "open";
}

interface Props {
  afspraak: DemoAfspraakRow | null;
  onClose: () => void;
  eigenaarOpties: Array<[string, string]>;
}

/** Bewerk-flow voor demo-afspraken: datum/tijd, eigenaar, status, notitie. */
export function BewerkDemoDialog({ afspraak, onClose, eigenaarOpties }: Props) {
  const qc = useQueryClient();
  const [tijd, setTijd] = useState("");
  const [eigenaar, setEigenaar] = useState("");
  const [status, setStatus] = useState<Status>("open");
  const [notitie, setNotitie] = useState("");

  useEffect(() => {
    if (!afspraak) return;
    setTijd(toLocalInput(afspraak.geplande_op));
    setEigenaar(afspraak.affiliate_id);
    setStatus(huidigeStatus(afspraak));
    setNotitie(afspraak.notitie ?? "");
  }, [afspraak]);

  const opslaan = useMutation({
    mutationFn: async () => {
      if (!afspraak) throw new Error("Geen afspraak geselecteerd");
      const nu = new Date().toISOString();
      const iso = new Date(tijd).toISOString();
      const update: TablesUpdate<"affiliate_terugbel_afspraken"> = {
        geplande_op: iso,
        affiliate_id: eigenaar,
        notitie: notitie.trim() || null,
      };
      if (status === "open") {
        update.afgehandeld_op = null;
        update.noshow = false;
        update.noshow_gemeld_op = null;
      } else if (status === "afgerond") {
        update.afgehandeld_op = afspraak.afgehandeld_op ?? nu;
        update.noshow = false;
        update.noshow_gemeld_op = null;
      } else {
        update.afgehandeld_op = afspraak.afgehandeld_op ?? nu;
        update.noshow = true;
        update.noshow_gemeld_op = nu;
      }
      // Reset verzonden-timestamps als de tijd verschuift zodat reminders
      // opnieuw ingepland kunnen worden.
      if (iso !== afspraak.geplande_op) {
        update.reminder_24u_op = null;
        update.reminder_1u_op = null;
        update.reminder_24u_gepland_op = new Date(new Date(iso).getTime() - 24 * 60 * 60_000).toISOString();
        update.reminder_1u_gepland_op = new Date(new Date(iso).getTime() - 60 * 60_000).toISOString();
      }
      const { error } = await supabase
        .from("affiliate_terugbel_afspraken")
        .update(update)
        .eq("id", afspraak.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alle-demo-afspraken"] });
      toast.success("Demo aangepast");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={!!afspraak} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Demo bewerken</DialogTitle>
          <DialogDescription>
            Pas datum/tijd, eigenaar, status of notitie aan. Bij een nieuwe tijd worden reminders opnieuw ingepland.
          </DialogDescription>
        </DialogHeader>
        {afspraak && (
          <div className="space-y-3">
            <p className="text-sm">
              <span className="font-medium">{afspraak.affiliate_leads?.bedrijfsnaam ?? "Lead"}</span>
              {afspraak.affiliate_leads?.contactpersoon ? ` · ${afspraak.affiliate_leads.contactpersoon}` : ""}
            </p>
            <div className="space-y-1">
              <Label htmlFor="bw-tijd">Datum & tijd</Label>
              <Input id="bw-tijd" type="datetime-local" value={tijd} onChange={(e) => setTijd(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="bw-eigenaar">Eigenaar (affiliate)</Label>
              <Select value={eigenaar} onValueChange={setEigenaar}>
                <SelectTrigger id="bw-eigenaar"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {eigenaarOpties.map(([id, naam]) => (
                    <SelectItem key={id} value={id}>{naam}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="bw-status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
                <SelectTrigger id="bw-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="afgerond">Afgerond</SelectItem>
                  <SelectItem value="noshow">No-show</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="bw-notitie">Notitie</Label>
              <Textarea id="bw-notitie" rows={3} value={notitie} onChange={(e) => setNotitie(e.target.value)} />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Annuleren</Button>
          <Button onClick={() => opslaan.mutate()} disabled={!tijd || !eigenaar || opslaan.isPending}>
            {opslaan.isPending ? "Bezig…" : "Opslaan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}