import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { usePlanAfspraakViaSales } from "@/hooks/sales/useSalesAgenda";
import type { AffiliateMetAgenda } from "@/hooks/sales/useAffiliatesMetAgenda";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  affiliates: AffiliateMetAgenda[];
  defaultAffiliateId?: string;
  defaultDatum?: Date;
}

function naam(a?: AffiliateMetAgenda) {
  if (!a) return "";
  const v = [a.voornaam, a.achternaam].filter(Boolean).join(" ").trim();
  return v || a.email || "Onbekend";
}

function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function PlanAfspraakDialog({ open, onOpenChange, affiliates, defaultAffiliateId, defaultDatum }: Props) {
  const plan = usePlanAfspraakViaSales();
  const [affiliateId, setAffiliateId] = useState<string>(defaultAffiliateId ?? "");
  const [type, setType] = useState<"terugbel" | "demo">("terugbel");
  const [datumTijd, setDatumTijd] = useState<string>(() => toLocalInputValue(defaultDatum ?? new Date(Date.now() + 60 * 60_000)));
  const [duur, setDuur] = useState<number>(30);
  const [notitie, setNotitie] = useState<string>("");

  useEffect(() => {
    if (open) {
      setAffiliateId(defaultAffiliateId ?? "");
      setDatumTijd(toLocalInputValue(defaultDatum ?? new Date(Date.now() + 60 * 60_000)));
    }
  }, [open, defaultAffiliateId, defaultDatum]);

  useEffect(() => {
    setDuur(type === "demo" ? 45 : 30);
  }, [type]);

  const valid = !!affiliateId && !!datumTijd && duur >= 5;

  const submit = () => {
    if (!valid) return;
    const iso = new Date(datumTijd).toISOString();
    plan.mutate(
      { affiliate_id: affiliateId, type, geplande_op: iso, duur_minuten: duur, notitie: notitie || null },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  const aff = affiliates.find((a) => a.id === affiliateId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Afspraak plannen namens affiliate</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Affiliate</Label>
            <Select value={affiliateId} onValueChange={setAffiliateId}>
              <SelectTrigger><SelectValue placeholder="Kies een affiliate" /></SelectTrigger>
              <SelectContent>
                {affiliates.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {naam(a)}{a.has_google_calendar ? " · Google ✓" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {aff && !aff.has_google_calendar && (
              <p className="text-xs text-amber-700">Affiliate heeft geen Google-agenda gekoppeld; afspraak wordt alleen in het platform gezet.</p>
            )}
          </div>
          <div className="space-y-1">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as "terugbel" | "demo")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="terugbel">Terugbelafspraak</SelectItem>
                <SelectItem value="demo">Demo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label>Datum & tijd</Label>
              <Input type="datetime-local" value={datumTijd} onChange={(e) => setDatumTijd(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Duur (min)</Label>
              <Input type="number" min={5} max={480} step={5} value={duur} onChange={(e) => setDuur(Number(e.target.value) || 30)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Notitie</Label>
            <Textarea rows={3} value={notitie} onChange={(e) => setNotitie(e.target.value)} placeholder="Onderwerp van de afspraak" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuleren</Button>
          <Button onClick={submit} disabled={!valid || plan.isPending}>
            {plan.isPending ? "Plannen…" : "Inplannen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}