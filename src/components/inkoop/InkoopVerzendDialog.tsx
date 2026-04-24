import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Mail, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  inkooporderId: string;
  defaultEmail: string;
  leverancierNaam: string;
  onSent?: () => void;
}

export default function InkoopVerzendDialog({
  open, onOpenChange, inkooporderId, defaultEmail, leverancierNaam, onSent,
}: Props) {
  const { user } = useAuth();
  const [to, setTo] = useState(defaultEmail);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [hasMailbox, setHasMailbox] = useState<boolean | null>(null);
  const [mailboxAdres, setMailboxAdres] = useState<string>("");

  useEffect(() => {
    if (!open || !user?.id) return;
    setTo(defaultEmail);
    setSubject(`Inkooporder van ${leverancierNaam || "ons"}`);
    setBody(
      `Beste${leverancierNaam ? " " + leverancierNaam : ""},\n\n` +
      `Hierbij onze inkooporder als bijlage. We zien de bevestiging graag tegemoet.\n\n` +
      `Met vriendelijke groet,`,
    );
    void supabase
      .from("email_accounts")
      .select("email_adres")
      .eq("user_id", user.id)
      .eq("actief", true)
      .maybeSingle()
      .then(({ data }) => {
        setHasMailbox(!!data);
        setMailboxAdres(data?.email_adres ?? "");
      });
  }, [open, user?.id, defaultEmail, leverancierNaam]);

  const verstuur = async () => {
    if (!to.trim()) {
      toast.error("Vul een ontvanger in");
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("inkoop-verzend-leverancier", {
        body: {
          inkooporder_id: inkooporderId,
          ontvanger_email: to.trim(),
          onderwerp: subject.trim(),
          bericht: body,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success("Inkooporder verstuurd vanuit jouw eigen postvak");
      onSent?.();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Verzenden mislukt");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Inkooporder versturen</DialogTitle>
        </DialogHeader>

        {hasMailbox === false && (
          <div className="rounded-lg border border-warning/30 bg-warning-light/30 p-3 text-sm flex gap-2">
            <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
            <div>
              Je hebt nog geen persoonlijk e-mailaccount gekoppeld. Communicatie naar leveranciers verloopt
              uitsluitend via je eigen postvak. Koppel eerst Gmail of Outlook bij <em>Instellingen → E-mailkoppeling</em>.
            </div>
          </div>
        )}
        {hasMailbox && (
          <div className="rounded-lg border bg-muted/40 p-3 text-sm flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            Wordt verstuurd vanuit <span className="font-medium">{mailboxAdres}</span>
          </div>
        )}

        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Naar</Label>
            <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="leverancier@bedrijf.nl" />
          </div>
          <div className="space-y-2">
            <Label>Onderwerp</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Bericht</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} />
          </div>
          <p className="text-xs text-muted-foreground">
            De PDF-versie van de inkooporder wordt automatisch als bijlage meegestuurd.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Annuleren
          </Button>
          <Button onClick={verstuur} disabled={sending || hasMailbox === false}>
            {sending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Versturen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
