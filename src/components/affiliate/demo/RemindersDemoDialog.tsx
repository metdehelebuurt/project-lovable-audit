import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { BellRing } from "lucide-react";
import type { DemoAfspraakRow } from "@/hooks/affiliate/useAlleDemoAfspraken";
import { toLocalInput } from "./demoTijdHelpers";

interface Props {
  afspraak: DemoAfspraakRow | null;
  onClose: () => void;
  onDirectVerzenden: (id: string) => void;
  directVerzendenPending?: boolean;
}

/**
 * Beheert per demo of en wanneer de 24-uurs en 1-uurs reminder verstuurd worden.
 * Toont ook of de reminder al verstuurd is en geeft de mogelijkheid direct te
 * verzenden of het "verstuurd"-vlaggetje te wissen zodat een reminder opnieuw
 * ingepland wordt.
 */
export function RemindersDemoDialog({ afspraak, onClose, onDirectVerzenden, directVerzendenPending }: Props) {
  const qc = useQueryClient();
  const [r24Actief, setR24Actief] = useState(true);
  const [r1Actief, setR1Actief] = useState(true);
  const [r24Tijd, setR24Tijd] = useState("");
  const [r1Tijd, setR1Tijd] = useState("");

  useEffect(() => {
    if (!afspraak) return;
    setR24Actief(afspraak.reminder_24u_actief);
    setR1Actief(afspraak.reminder_1u_actief);
    const gepland = new Date(afspraak.geplande_op).getTime();
    setR24Tijd(toLocalInput(afspraak.reminder_24u_gepland_op ?? new Date(gepland - 24 * 60 * 60_000).toISOString()));
    setR1Tijd(toLocalInput(afspraak.reminder_1u_gepland_op ?? new Date(gepland - 60 * 60_000).toISOString()));
  }, [afspraak]);

  const opslaan = useMutation({
    mutationFn: async () => {
      if (!afspraak) throw new Error("Geen afspraak geselecteerd");
      const { error } = await supabase
        .from("affiliate_terugbel_afspraken")
        .update({
          reminder_24u_actief: r24Actief,
          reminder_1u_actief: r1Actief,
          reminder_24u_gepland_op: new Date(r24Tijd).toISOString(),
          reminder_1u_gepland_op: new Date(r1Tijd).toISOString(),
        })
        .eq("id", afspraak.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alle-demo-afspraken"] });
      toast.success("Reminder-instellingen opgeslagen");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resetVerzonden = useMutation({
    mutationFn: async (welke: "24" | "1") => {
      if (!afspraak) throw new Error("Geen afspraak geselecteerd");
      const veld = welke === "24" ? "reminder_24u_op" : "reminder_1u_op";
      const { error } = await supabase
        .from("affiliate_terugbel_afspraken")
        .update({ [veld]: null })
        .eq("id", afspraak.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alle-demo-afspraken"] });
      toast.success("Reminder gereset — wordt opnieuw ingepland");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={!!afspraak} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BellRing className="h-4 w-4" /> Reminders beheren
          </DialogTitle>
          <DialogDescription>
            Zet reminders aan of uit en bepaal wanneer ze verstuurd moeten worden.
          </DialogDescription>
        </DialogHeader>
        {afspraak && (
          <div className="space-y-4">
            <ReminderRij
              label="24-uurs herinnering"
              actief={r24Actief}
              setActief={setR24Actief}
              tijd={r24Tijd}
              setTijd={setR24Tijd}
              verstuurdOp={afspraak.reminder_24u_op}
              onReset={() => resetVerzonden.mutate("24")}
            />
            <ReminderRij
              label="1-uurs herinnering"
              actief={r1Actief}
              setActief={setR1Actief}
              tijd={r1Tijd}
              setTijd={setR1Tijd}
              verstuurdOp={afspraak.reminder_1u_op}
              onReset={() => resetVerzonden.mutate("1")}
            />
            {afspraak.affiliate_leads?.email && (
              <div className="pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDirectVerzenden(afspraak.id)}
                  disabled={directVerzendenPending}
                >
                  {directVerzendenPending ? "Bezig…" : "Nu reminder-mail naar klant sturen"}
                </Button>
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Sluiten</Button>
          <Button onClick={() => opslaan.mutate()} disabled={opslaan.isPending}>
            {opslaan.isPending ? "Bezig…" : "Opslaan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ReminderRijProps {
  label: string;
  actief: boolean;
  setActief: (v: boolean) => void;
  tijd: string;
  setTijd: (v: string) => void;
  verstuurdOp: string | null;
  onReset: () => void;
}

function ReminderRij({ label, actief, setActief, tijd, setTijd, verstuurdOp, onReset }: ReminderRijProps) {
  return (
    <div className="rounded-md border p-3 space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <Switch checked={actief} onCheckedChange={setActief} />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Verstuur op</Label>
        <Input type="datetime-local" value={tijd} onChange={(e) => setTijd(e.target.value)} disabled={!actief} />
      </div>
      {verstuurdOp ? (
        <div className="flex items-center justify-between text-xs text-emerald-700">
          <span>Verstuurd op {new Date(verstuurdOp).toLocaleString("nl-NL")}</span>
          <Button variant="ghost" size="sm" onClick={onReset}>Reset</Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Nog niet verstuurd.</p>
      )}
    </div>
  );
}