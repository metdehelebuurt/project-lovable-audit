import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useCreateTerugbel } from "@/hooks/affiliate/useTerugbelAfspraken";
import { useInterneCollegas } from "@/hooks/affiliate/useInterneCollegas";
import { TijdzoneBanner } from "@/components/shared/TijdzoneBanner";
import { useAuth } from "@/contexts/AuthContext";
import { usePlanAfspraakViaSales } from "@/hooks/sales/useSalesAgenda";
import { useAffiliatesMetAgenda } from "@/hooks/sales/useAffiliatesMetAgenda";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  leadId: string;
  leadNaam: string;
  klantEmail?: string | null;
  afspraakType?: "terugbel" | "demo";
  /** Eigenaar (affiliate) van de lead — nodig voor sales-manager flow. */
  affiliateId?: string | null;
  onSaved?: () => void;
}

export function TerugbelDialog({ open, onOpenChange, leadId, leadNaam, klantEmail, afspraakType = "terugbel", affiliateId, onSaved }: Props) {
  const create = useCreateTerugbel();
  const planViaSales = usePlanAfspraakViaSales();
  const { user, profile } = useAuth();
  const canPlanForAffiliate = profile?.rol === "sales_manager" || profile?.rol === "superadmin";
  const { data: collegas = [], isLoading: collegasLoading } = useInterneCollegas();
  const { data: affiliates = [], isLoading: affiliatesLoading } = useAffiliatesMetAgenda();
  // datetime-local verwacht LOKALE tijd (zonder timezone). toISOString() geeft UTC
  // en zou daardoor in bv. Portugal het uur verkeerd voorinvullen.
  const morgen = (() => {
    const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  })();
  const [moment, setMoment] = useState(morgen);
  const [collegaId, setCollegaId] = useState<string>("");
  const [targetAffiliateId, setTargetAffiliateId] = useState<string>(affiliateId ?? "");
  const [notitie, setNotitie] = useState("");
  const [stuurBevestiging, setStuurBevestiging] = useState(true);
  const [email, setEmail] = useState(klantEmail ?? "");
  const isDemo = afspraakType === "demo";
  const geselecteerdeAffiliateId = targetAffiliateId || affiliateId || "";
  const isSalesProxy = canPlanForAffiliate && !!geselecteerdeAffiliateId;
  const titel = isDemo ? "Demo inplannen" : "Terugbelafspraak plannen";
  const placeholder = isDemo
    ? "Bijv. demo van schouwmodule, met wie, link naar meeting..."
    : "Waar bel je over terug?";

  const opslaan = async () => {
    if (!moment) return;
    if (canPlanForAffiliate && !geselecteerdeAffiliateId) return;
    if (!canPlanForAffiliate && !collegaId) return;
    if (stuurBevestiging && !/^\S+@\S+\.\S+$/.test(email)) return;
    if (isSalesProxy) {
      await planViaSales.mutateAsync({
        affiliate_id: geselecteerdeAffiliateId,
        lead_id: leadId,
        type: afspraakType,
        geplande_op: new Date(moment).toISOString(),
        duur_minuten: isDemo ? 45 : 30,
        notitie: notitie || null,
      });
      setNotitie("");
      onOpenChange(false);
      onSaved?.();
      return;
    }
    await create.mutateAsync({
      lead_id: leadId,
      geplande_op: new Date(moment).toISOString(),
      notitie: notitie || null,
      type: afspraakType,
      collega_user_id: collegaId,
      klant_bevestiging: stuurBevestiging,
      klant_email: stuurBevestiging ? email.trim() : null,
    });
    setNotitie("");
    setCollegaId("");
    onOpenChange(false);
    onSaved?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titel}</DialogTitle>
          <DialogDescription>Voor {leadNaam}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Datum en tijd</Label>
            <Input type="datetime-local" value={moment} onChange={(e) => setMoment(e.target.value)} />
            <TijdzoneBanner moment={moment} className="mt-2" />
          </div>
          {canPlanForAffiliate ? (
          <div className="space-y-1">
            <Label>Affiliate-agenda</Label>
            <Select value={geselecteerdeAffiliateId} onValueChange={setTargetAffiliateId}>
              <SelectTrigger>
                <SelectValue placeholder={affiliatesLoading ? "Laden..." : "Kies een affiliate"} />
              </SelectTrigger>
              <SelectContent>
                {affiliates.map((a) => {
                  const naam = `${a.voornaam ?? ""} ${a.achternaam ?? ""}`.trim() || a.email || "Onbekend";
                  return (
                    <SelectItem key={a.id} value={a.id}>
                      {naam}{a.has_google_calendar ? " · Google gekoppeld" : ""}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              De afspraak wordt in de agenda van deze affiliate gezet.
            </p>
          </div>
          ) : (
          <div className="space-y-1">
            <Label>Voor welke collega?</Label>
            <Select value={collegaId} onValueChange={setCollegaId}>
              <SelectTrigger>
                <SelectValue placeholder={collegasLoading ? "Laden..." : "Kies een collega"} />
              </SelectTrigger>
              <SelectContent>
                {collegas.map((c) => {
                  const naam = `${c.voornaam ?? ""} ${c.achternaam ?? ""}`.trim() || c.email || "Onbekend";
                  return (
                    <SelectItem key={c.id} value={c.id}>
                      {naam}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Deze collega krijgt altijd een interne notificatie.
            </p>
          </div>
          )}
          {canPlanForAffiliate && (
            <div className="rounded-md border bg-primary/5 p-3 text-xs text-primary">
              Je plant deze afspraak namens de affiliate. De afspraak komt in hun agenda
              (en Google-agenda indien gekoppeld); jij wordt geregistreerd als planner.
            </div>
          )}
          <div className="space-y-1">
            <Label>Notitie (optioneel)</Label>
            <Textarea rows={3} value={notitie} onChange={(e) => setNotitie(e.target.value)} placeholder={placeholder} />
          </div>
          {!isSalesProxy && (
          <div className="rounded-md border p-3 space-y-2 bg-muted/30">
            <label className="flex items-start gap-2 cursor-pointer">
              <Checkbox
                checked={stuurBevestiging}
                onCheckedChange={(v) => setStuurBevestiging(!!v)}
                className="mt-0.5"
              />
              <span className="text-sm font-medium">Bevestigingsmail naar klant sturen</span>
            </label>
            {stuurBevestiging && (
              <div className="space-y-1 pl-6">
                <Label className="text-xs">E-mailadres klant</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="naam@bedrijf.nl"
                />
              </div>
            )}
          </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuleren</Button>
          <Button
            onClick={opslaan}
            disabled={
              create.isPending || planViaSales.isPending ||
              !moment ||
              (canPlanForAffiliate && !geselecteerdeAffiliateId) ||
              (!canPlanForAffiliate && !collegaId) ||
              (!canPlanForAffiliate && stuurBevestiging && !/^\S+@\S+\.\S+$/.test(email))
            }
          >
            Plannen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
