import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, RefreshCw, Rocket } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useTrialHandmatigAanmaken } from "@/hooks/sales/useTrialHandmatigAanmaken";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function genereerWachtwoord() {
  const alfabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const arr = new Uint32Array(12);
  crypto.getRandomValues(arr);
  let out = "";
  for (const n of arr) out += alfabet[n % alfabet.length];
  return `${out}!9`;
}

const LEEG = { bedrijfsnaam: "", voornaam: "", achternaam: "", email: "", telefoon: "" };

export default function NieuweTrialDialog({ open, onOpenChange }: Props) {
  const { profile } = useAuth();
  const [velden, setVelden] = useState(LEEG);
  const [password, setPassword] = useState(genereerWachtwoord);
  const [trialDagen, setTrialDagen] = useState(14);
  const aanmaken = useTrialHandmatigAanmaken();

  useEffect(() => {
    if (open) {
      setVelden(LEEG);
      setPassword(genereerWachtwoord());
      setTrialDagen(14);
    }
  }, [open]);

  const zet = (key: keyof typeof LEEG, waarde: string) =>
    setVelden((v) => ({ ...v, [key]: waarde }));

  const valide =
    velden.bedrijfsnaam.trim().length >= 2 &&
    velden.voornaam.trim() &&
    velden.achternaam.trim() &&
    /\S+@\S+\.\S+/.test(velden.email.trim()) &&
    password.length >= 8 &&
    trialDagen >= 1 && trialDagen <= 14;

  const versturen = async () => {
    if (!valide) return;
    try {
      await aanmaken.mutateAsync({
        bedrijfsnaam: velden.bedrijfsnaam.trim(),
        voornaam: velden.voornaam.trim(),
        achternaam: velden.achternaam.trim(),
        email: velden.email.trim().toLowerCase(),
        telefoon: velden.telefoon.trim() || null,
        password,
        trial_dagen: trialDagen,
        aangemaakt_door: profile?.email ?? null,
        aangemaakt_door_id: profile?.id ?? null,
      });
      onOpenChange(false);
    } catch {
      /* foutmelding via hook */
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
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" /> Nieuwe trial aanmaken
          </DialogTitle>
          <DialogDescription>
            Maakt direct een trial-account aan voor een klant. De klant ontvangt een welkomstmail
            en verschijnt hieronder in het trial-overzicht.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label htmlFor="trial-bedrijf">Bedrijfsnaam</Label>
            <Input id="trial-bedrijf" value={velden.bedrijfsnaam} onChange={(e) => zet("bedrijfsnaam", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="trial-voornaam">Voornaam</Label>
              <Input id="trial-voornaam" value={velden.voornaam} onChange={(e) => zet("voornaam", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="trial-achternaam">Achternaam</Label>
              <Input id="trial-achternaam" value={velden.achternaam} onChange={(e) => zet("achternaam", e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="trial-email">E-mailadres klant</Label>
            <Input id="trial-email" type="email" value={velden.email} onChange={(e) => zet("email", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="trial-telefoon">Telefoon (optioneel)</Label>
            <Input id="trial-telefoon" value={velden.telefoon} onChange={(e) => zet("telefoon", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="trial-wachtwoord">Tijdelijk wachtwoord</Label>
            <div className="flex gap-2">
              <Input id="trial-wachtwoord" className="font-mono" value={password} onChange={(e) => setPassword(e.target.value)} />
              <Button type="button" variant="outline" size="icon" onClick={() => setPassword(genereerWachtwoord())} aria-label="Nieuw wachtwoord genereren">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" size="icon" onClick={kopieer} aria-label="Wachtwoord kopiëren">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div>
            <Label htmlFor="trial-dagen">Trial-duur (dagen, max 14)</Label>
            <Input
              id="trial-dagen"
              type="number"
              min={1}
              max={14}
              value={trialDagen}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                setTrialDagen(Number.isNaN(n) ? 0 : Math.min(14, Math.max(1, n)));
              }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={aanmaken.isPending}>
            Annuleren
          </Button>
          <Button onClick={versturen} disabled={!valide || aanmaken.isPending}>
            <Rocket className="h-4 w-4 mr-2" />
            {aanmaken.isPending ? "Bezig..." : "Trial aanmaken"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
