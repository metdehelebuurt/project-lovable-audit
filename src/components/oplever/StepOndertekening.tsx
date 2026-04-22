import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SignaturePad from "./SignaturePad";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { uploadOpleverFile, patchRapport, setStatus, logAudit } from "./api/opleverApi";
import type { Opleverrapport } from "./types";
import { useEffect } from "react";

interface Props {
  rapport: Opleverrapport;
  onSent: () => void;
}

export default function StepOndertekening({ rapport, onSent }: Props) {
  const [naam, setNaam] = useState("");
  const [sig, setSig] = useState<string | null>(rapport.installateur_handtekening?.image_url ?? null);
  const [busy, setBusy] = useState(false);
  const [klantEmail, setKlantEmail] = useState("");

  // Prefill klant-e-mail uit gekoppelde klant of opdracht
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let email: string | null = null;
      if (rapport.klant_id) {
        const { data } = await supabase
          .from("klanten")
          .select("email")
          .eq("id", rapport.klant_id)
          .maybeSingle();
        email = data?.email ?? null;
      }
      if (!email && rapport.opdracht_id) {
        const { data } = await supabase
          .from("opdrachten")
          .select("klant_email")
          .eq("id", rapport.opdracht_id)
          .maybeSingle();
        email = (data as { klant_email: string | null } | null)?.klant_email ?? null;
      }
      if (!cancelled && email) setKlantEmail(email);
    })();
    return () => { cancelled = true; };
  }, [rapport.klant_id, rapport.opdracht_id]);

  const verzendNaarKlant = async () => {
    if (!naam.trim() || !sig) {
      toast({ title: "Naam en handtekening verplicht", variant: "destructive" });
      return;
    }
    const emailTrimmed = klantEmail.trim();
    if (!emailTrimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      toast({ title: "Geldig e-mailadres klant verplicht", variant: "destructive" });
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
        body: { rapport_id: rapport.id, klant_email: emailTrimmed },
      });
      if (error) throw error;
      toast({ title: "Verzonden naar klant", description: emailTrimmed });
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
      <div>
        <Label htmlFor="klant-email">E-mailadres klant</Label>
        <Input
          id="klant-email"
          type="email"
          placeholder="naam@voorbeeld.nl"
          value={klantEmail}
          onChange={(e) => setKlantEmail(e.target.value)}
        />
        <p className="text-xs text-muted-foreground mt-1">
          De klant ontvangt op dit adres een ondertekenlink (14 dagen geldig).
        </p>
      </div>
      <Button onClick={verzendNaarKlant} disabled={busy}>
        {busy ? "Bezig…" : "Onderteken en verstuur naar klant"}
      </Button>
    </div>
  );
}