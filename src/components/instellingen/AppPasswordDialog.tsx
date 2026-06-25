import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  defaultEmail?: string;
  onLinked?: () => void;
}

/**
 * Koppel Gmail via een 16-cijferig App-wachtwoord (vereist 2FA).
 * Wordt gebruikt als fallback voor de Google-API koppeling.
 */
export function AppPasswordDialog({ open, onOpenChange, defaultEmail, onLinked }: Props) {
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  const valid = /^\S+@\S+\.\S+$/.test(email) && pw.replace(/\s+/g, "").length >= 12;

  const link = async () => {
    if (!valid) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("email-app-password-link", {
        body: { email: email.trim(), app_password: pw },
      });
      const payload = data as { ok?: boolean; error?: string; message?: string } | null;
      if (error || payload?.error) {
        toast.error(payload?.message || error?.message || "Koppeling mislukt");
        return;
      }
      toast.success("Gmail-koppeling via app-wachtwoord opgeslagen");
      setPw("");
      onOpenChange(false);
      onLinked?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Onbekende fout");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gmail koppelen via App-wachtwoord</DialogTitle>
          <DialogDescription>
            Werkt als fallback wanneer de Google-API niet beschikbaar is. Vereist 2-staps-verificatie op je Google-account.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border bg-muted/40 p-3 text-xs space-y-2">
          <p className="font-medium text-foreground">Zo maak je een App-wachtwoord:</p>
          <ol className="list-decimal pl-4 space-y-1">
            <li>Schakel 2-staps-verificatie in op je Google-account.</li>
            <li>
              Ga naar{" "}
              <a
                href="https://myaccount.google.com/apppasswords"
                target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary underline"
              >
                myaccount.google.com/apppasswords <ExternalLink className="h-3 w-3" />
              </a>
              .
            </li>
            <li>Maak een wachtwoord aan met naam "Mijnhuis" en plak de 16 tekens hieronder.</li>
          </ol>
        </div>

        <div className="space-y-3 pt-1">
          <div className="space-y-1">
            <Label>Gmail-adres</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jij@gmail.com" />
          </div>
          <div className="space-y-1">
            <Label>App-wachtwoord (16 tekens)</Label>
            <Input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="xxxx xxxx xxxx xxxx"
              autoComplete="new-password"
            />
            <p className="text-xs text-muted-foreground">
              Spaties worden automatisch verwijderd. Wordt versleuteld opgeslagen.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Annuleren</Button>
          <Button onClick={link} disabled={!valid || busy}>
            {busy ? "Verifiëren…" : "Koppelen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}