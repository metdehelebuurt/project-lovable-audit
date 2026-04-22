import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SignaturePad from "./SignaturePad";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { uploadOpleverFile, patchRapport, setStatus, logAudit } from "./api/opleverApi";
import type { Opleverrapport } from "./types";

interface Props {
  rapport: Opleverrapport;
  onSent: () => void;
}

export default function StepOndertekening({ rapport, onSent }: Props) {
  const [naam, setNaam] = useState("");
  const [sig, setSig] = useState<string | null>(rapport.installateur_handtekening?.image_url ?? null);
  const [busy, setBusy] = useState(false);

  const verzendNaarKlant = async () => {
    if (!naam.trim() || !sig) {
      toast({ title: "Naam en handtekening verplicht", variant: "destructive" });
      return;
    }
    try {
      setBusy(true);
      // upload signature
      const blob = await (await fetch(sig)).blob();
      const path = await uploadOpleverFile(rapport.partner_id, rapport.id, blob, "installateur-handtekening.png");
      await patchRapport(rapport.id, {
        installateur_handtekening: { image_url: path, name: naam, signed_at: new Date().toISOString() },
      });
      await setStatus(rapport.id, "wacht_op_klant");
      await logAudit(rapport.id, rapport.partner_id, rapport.installateur_id, "installateur_ondertekend", { naam });
      // call edge function to generate token + mail klant
      const { error } = await supabase.functions.invoke("oplever-verzend-klant", {
        body: { rapport_id: rapport.id },
      });
      if (error) throw error;
      toast({ title: "Verzonden naar klant" });
      onSent();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Versturen mislukt";
      toast({ title: "Mislukt", description: msg, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Onderteken het rapport en verstuur het naar de klant ter ondertekening.
      </p>
      <div>
        <Label>Naam installateur</Label>
        <Input value={naam} onChange={(e) => setNaam(e.target.value)} />
      </div>
      <div>
        <Label>Handtekening</Label>
        <SignaturePad value={sig} onChange={setSig} />
      </div>
      <Button onClick={verzendNaarKlant} disabled={busy}>
        {busy ? "Bezig…" : "Onderteken en verstuur naar klant"}
      </Button>
    </div>
  );
}