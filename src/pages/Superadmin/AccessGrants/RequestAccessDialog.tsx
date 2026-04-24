import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, ShieldAlert } from "lucide-react";
import { useRequestAccessGrant } from "@/hooks/useAccessGrants";

const DUUR_OPTIES = [
  { value: 1, label: "1 uur" },
  { value: 4, label: "4 uur" },
  { value: 8, label: "8 uur" },
  { value: 24, label: "24 uur (max)" },
];

export function RequestAccessDialog() {
  const [open, setOpen] = useState(false);
  const [partnerId, setPartnerId] = useState("");
  const [reden, setReden] = useState("");
  const [duurUren, setDuurUren] = useState(4);
  const [notifyPartner, setNotifyPartner] = useState(true);

  const { data: partners = [] } = useQuery({
    queryKey: ["partners-min"],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partners")
        .select("id, naam")
        .order("naam", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const requestGrant = useRequestAccessGrant();

  const reset = () => {
    setPartnerId("");
    setReden("");
    setDuurUren(4);
    setNotifyPartner(true);
  };

  const canSubmit = partnerId !== "" && reden.trim().length >= 10 && !requestGrant.isPending;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      await requestGrant.mutateAsync({
        partner_id: partnerId,
        reden: reden.trim(),
        duur_uren: duurUren,
        notify_partner: notifyPartner,
      });
      reset();
      setOpen(false);
    } catch {
      // Toast is al door hook getoond
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Toegang aanvragen
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-warning" />
            Tijdelijke toegang aanvragen
          </DialogTitle>
          <DialogDescription>
            Activeer kortdurende toegang tot de gegevens van één partner. Iedere
            aanvraag wordt vastgelegd in het audit-log.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Partner</Label>
            <Select value={partnerId} onValueChange={setPartnerId}>
              <SelectTrigger>
                <SelectValue placeholder="Kies een partner" />
              </SelectTrigger>
              <SelectContent>
                {partners.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.naam ?? p.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reden">Reden (verplicht, min 10 tekens)</Label>
            <Textarea
              id="reden"
              value={reden}
              onChange={(e) => setReden(e.target.value)}
              placeholder="Bijv. Onderzoek incident #1234 — verzoek partner via mail om data-correctie"
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {reden.trim().length}/500 — minimaal 10 tekens
            </p>
          </div>

          <div className="space-y-2">
            <Label>Duur</Label>
            <Select value={String(duurUren)} onValueChange={(v) => setDuurUren(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DUUR_OPTIES.map((o) => (
                  <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-start gap-3 rounded-lg border p-3 bg-muted/30">
            <Checkbox
              id="notify"
              checked={notifyPartner}
              onCheckedChange={(c) => setNotifyPartner(c === true)}
            />
            <div className="space-y-1">
              <Label htmlFor="notify" className="cursor-pointer">
                Partnerbeheerder via e-mail informeren
              </Label>
              <p className="text-xs text-muted-foreground">
                Aanbevolen voor transparantie. Het audit-log registreert toegang
                hoe dan ook.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Annuleren</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {requestGrant.isPending ? "Bezig..." : "Toegang activeren"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}