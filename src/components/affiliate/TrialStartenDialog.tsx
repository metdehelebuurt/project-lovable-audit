import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Rocket, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useStartTrialVoorLead } from "@/hooks/affiliate/useStartTrialVoorLead";
import { useCanCustomizeTrialDuration } from "@/hooks/affiliate/useCanCustomizeTrialDuration";
import type { AffiliateLead } from "@/hooks/affiliate/useAffiliateLeads";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: AffiliateLead;
  onStarted?: () => void;
}

function genereerWachtwoord() {
  const alfabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  const arr = new Uint32Array(12);
  crypto.getRandomValues(arr);
  for (const n of arr) out += alfabet[n % alfabet.length];
  return out + "!9";
}

function splitContactpersoon(naam: string | null | undefined) {
  if (!naam) return { voornaam: "", achternaam: "" };
  const delen = naam.trim().split(/\s+/);
  return { voornaam: delen[0] ?? "", achternaam: delen.slice(1).join(" ") };
}

export function TrialStartenDialog({ open, onOpenChange, lead, onStarted }: Props) {
  const init = useMemo(() => splitContactpersoon(lead.contactpersoon), [lead.contactpersoon]);
  const [bedrijfsnaam, setBedrijfsnaam] = useState(lead.bedrijfsnaam);
  const [voornaam, setVoornaam] = useState(init.voornaam);
  const [achternaam, setAchternaam] = useState(init.achternaam);
  const [email, setEmail] = useState(lead.email ?? "");
  const [telefoon, setTelefoon] = useState(lead.telefoon ?? "");
  const [password, setPassword] = useState(() => genereerWachtwoord());
  const [toestemming, setToestemming] = useState(false);
  const [trialDagen, setTrialDagen] = useState<number>(30);
  const magDuurAanpassen = useCanCustomizeTrialDuration();

  const start = useStartTrialVoorLead();

  useEffect(() => {
    if (open) {
      setBedrijfsnaam(lead.bedrijfsnaam);
      const s = splitContactpersoon(lead.contactpersoon);
      setVoornaam(s.voornaam);
      setAchternaam(s.achternaam);
      setEmail(lead.email ?? "");
      setTelefoon(lead.telefoon ?? "");
      setPassword(genereerWachtwoord());
      setToestemming(false);
      setTrialDagen(30);
    }
  }, [open, lead]);

  const dagenValide = Number.isInteger(trialDagen) && trialDagen >= 1 && trialDagen <= 30;
  const valide = bedrijfsnaam.trim() && voornaam.trim() && achternaam.trim() && email.trim() && password.length >= 8 && toestemming && dagenValide;

  const versturen = async () => {
    if (!valide) return;
    try {
      await start.mutateAsync({
        lead_id: lead.id,
        bedrijfsnaam: bedrijfsnaam.trim(),
        voornaam: voornaam.trim(),
        achternaam: achternaam.trim(),
        email: email.trim(),
        telefoon: telefoon.trim() || null,
        password,
        toestemming: true,
        trial_dagen: magDuurAanpassen ? trialDagen : undefined,
      });
      onOpenChange(false);
      onStarted?.();
    } catch {
      /* toast door hook */
    }
  };

  const kopieer = async () => {
    await navigator.clipboard.writeText(password);
    toast.success("Wachtwoord gekopieerd");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Rocket className="h-5 w-5 text-primary" /> Trial starten voor klant</DialogTitle>
          <DialogDescription>
            {magDuurAanpassen
              ? `Maakt direct een trial-account aan op naam van de klant (max 30 dagen). De klant ontvangt een welkomstmail. Jij wordt automatisch gekoppeld als affiliate.`
              : `Maakt direct een 30-daags trial-account aan op naam van de klant. De klant ontvangt een welkomstmail. Jij wordt automatisch gekoppeld als affiliate.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label>Bedrijfsnaam</Label>
            <Input value={bedrijfsnaam} onChange={(e) => setBedrijfsnaam(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Voornaam</Label>
              <Input value={voornaam} onChange={(e) => setVoornaam(e.target.value)} />
            </div>
            <div>
              <Label>Achternaam</Label>
              <Input value={achternaam} onChange={(e) => setAchternaam(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>E-mailadres klant</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label>Telefoon (optioneel)</Label>
            <Input value={telefoon} onChange={(e) => setTelefoon(e.target.value)} />
          </div>
          <div>
            <Label>Tijdelijk wachtwoord</Label>
            <div className="flex gap-2">
              <Input value={password} onChange={(e) => setPassword(e.target.value)} className="font-mono" />
              <Button type="button" variant="outline" size="icon" onClick={() => setPassword(genereerWachtwoord())} title="Nieuw wachtwoord"><RefreshCw className="h-4 w-4" /></Button>
              <Button type="button" variant="outline" size="icon" onClick={kopieer} title="Kopiëren"><Copy className="h-4 w-4" /></Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Stuur dit aan de klant of bespreek het tijdens het belgesprek. De klant kan het wijzigen na inloggen.</p>
          </div>

          {magDuurAanpassen && (
            <div>
              <Label>Trial-duur (dagen, max 30)</Label>
              <Input
                type="number"
                min={1}
                max={30}
                value={trialDagen}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  if (Number.isNaN(n)) { setTrialDagen(0); return; }
                  setTrialDagen(Math.min(30, Math.max(1, n)));
                }}
              />
              <p className="text-xs text-muted-foreground mt-1">Alleen zichtbaar voor jou en Bas. Standaard 30 dagen.</p>
            </div>
          )}

          <label className="flex items-start gap-2 text-sm border rounded-md p-3 bg-muted/30">
            <Checkbox checked={toestemming} onCheckedChange={(c) => setToestemming(c === true)} className="mt-0.5" />
            <span>De klant heeft mondeling toestemming gegeven voor het aanmaken van een trial-account op zijn naam.</span>
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={start.isPending}>Annuleren</Button>
          <Button onClick={versturen} disabled={!valide || start.isPending}>
            <Rocket className="h-4 w-4 mr-2" />
            {start.isPending ? "Bezig..." : "Trial starten"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}