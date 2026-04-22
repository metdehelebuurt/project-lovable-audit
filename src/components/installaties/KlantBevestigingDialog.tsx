import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateInstallatie, type Installatie } from "./api/installatieApi";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  installatie: Installatie;
  onSent?: () => void;
}

export default function KlantBevestigingDialog({ open, onOpenChange, installatie, onSent }: Props) {
  const datum = installatie.geplande_startdatum
    ? new Date(installatie.geplande_startdatum).toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "(nog niet bekend)";
  const tijd = installatie.start_tijd
    ? `${installatie.start_tijd.slice(0, 5)}${installatie.eind_tijd ? ` – ${installatie.eind_tijd.slice(0, 5)}` : ""}`
    : "in overleg";
  const adres = installatie.werkadres ?? installatie.klant_adres ?? "";

  const [to, setTo] = useState(installatie.klant_email ?? "");
  const [subject, setSubject] = useState(`Bevestiging installatieafspraak — ${datum}`);
  const [body, setBody] = useState(
    `Beste ${installatie.consument_naam ?? "klant"},

Hierbij bevestigen wij uw installatieafspraak.

Datum: ${datum}
Tijd: ${tijd}
Locatie: ${adres}
${installatie.werkomschrijving ? `\nWerkzaamheden: ${installatie.werkomschrijving}` : ""}

Mocht u vragen hebben of de afspraak willen wijzigen, neem dan gerust contact met ons op.

Met vriendelijke groet`
  );
  const [busy, setBusy] = useState(false);

  const verzenden = async () => {
    if (!to.trim()) { toast.error("Vul een ontvanger in"); return; }
    setBusy(true);
    try {
      const html = `<div style="font-family:sans-serif;padding:20px;">${body.split("\n").map((l) => `<p>${l || "&nbsp;"}</p>`).join("")}</div>`;

      const { data, error } = await supabase.functions.invoke("send-orderbevestiging-email", {
        body: {
          opdracht_id: installatie.opdracht_id ?? installatie.id,
          ontvanger_email: to.trim(),
          subject,
          html_body: html,
          attachment_path: null,
        },
      });
      if (error || data?.error) {
        toast.error("Verzenden mislukt", { description: data?.error || error?.message });
        setBusy(false);
        return;
      }
      await updateInstallatie(installatie.id, {
        bevestiging_verzonden_op: new Date().toISOString(),
        status: installatie.status === "gepland" ? "bevestigd" : installatie.status,
      });
      toast.success("Bevestiging verzonden");
      onSent?.();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message);
    }
    setBusy(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Installatiebevestiging naar klant</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Aan</Label><Input value={to} onChange={(e) => setTo(e.target.value)} /></div>
          <div><Label>Onderwerp</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
          <div><Label>Bericht</Label><Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={12} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuleren</Button>
          <Button onClick={verzenden} disabled={busy} className="gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Verzenden
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}