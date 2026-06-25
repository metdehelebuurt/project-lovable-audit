import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateTerugbel } from "@/hooks/affiliate/useTerugbelAfspraken";
import { useInterneCollegas } from "@/hooks/affiliate/useInterneCollegas";
import { TijdzoneBanner } from "@/components/shared/TijdzoneBanner";
import { useAuth } from "@/contexts/AuthContext";
import { usePlanAfspraakViaSales } from "@/hooks/sales/useSalesAgenda";
import { useAffiliatesMetAgenda } from "@/hooks/sales/useAffiliatesMetAgenda";
import { MailReviewDialog } from "@/components/email/MailReviewDialog";
import { supabase } from "@/integrations/supabase/client";
import type { PlanningContextInput } from "@/lib/email/planningContext";

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
  const { profile, user } = useAuth();
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
  const [email, setEmail] = useState(klantEmail ?? "");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewContext, setReviewContext] = useState<PlanningContextInput | null>(null);
  const [reviewCollega, setReviewCollega] = useState<{ email: string | null; show: boolean }>({ email: null, show: false });
  const isDemo = afspraakType === "demo";
  const geselecteerdeAffiliateId = targetAffiliateId || affiliateId || "";
  const isSalesProxy = canPlanForAffiliate && !!geselecteerdeAffiliateId;
  const titel = isDemo ? "Demo inplannen" : "Terugbelafspraak plannen";
  const placeholder = isDemo
    ? "Bijv. demo van schouwmodule, met wie, link naar meeting..."
    : "Waar bel je over terug?";

  useEffect(() => {
    if (!open || !canPlanForAffiliate) return;
    if (affiliatesLoading) return;
    const klantMail = klantEmail?.trim().toLowerCase();
    const match = klantMail
      ? affiliates.find((a) => a.email?.trim().toLowerCase() === klantMail)
      : null;
    setTargetAffiliateId(match?.id ?? affiliateId ?? "");
    setEmail(klantEmail ?? "");
  }, [affiliateId, affiliates, affiliatesLoading, canPlanForAffiliate, klantEmail, open]);

  const opslaan = async () => {
    if (!moment) return;
    if (canPlanForAffiliate && affiliatesLoading) return;
    if (canPlanForAffiliate && !geselecteerdeAffiliateId) return;
    if (!canPlanForAffiliate && !collegaId) return;

    // Bouw context voor MailReviewDialog (na opslaan).
    const buildContext = async (): Promise<PlanningContextInput> => {
      const { data: lead } = await supabase
        .from("affiliate_leads")
        .select("contactpersoon, bedrijfsnaam, email, telefoon")
        .eq("id", leadId)
        .maybeSingle();
      const affiliateBronId = geselecteerdeAffiliateId || user?.id || null;
      const { data: affiliate } = affiliateBronId
        ? await supabase
            .from("users").select("voornaam, achternaam, email, telefoon")
            .eq("id", affiliateBronId).maybeSingle()
        : { data: null };
      const { data: collega } = collegaId
        ? await supabase
            .from("users").select("voornaam, achternaam, email, telefoon")
            .eq("id", collegaId).maybeSingle()
        : { data: null };
      return {
        lead, affiliate, collega,
        planner: profile ? {
          voornaam: profile.voornaam, achternaam: profile.achternaam, email: profile.email,
        } : null,
        afspraak: {
          type: afspraakType,
          gepland_op: new Date(moment).toISOString(),
          duur_minuten: isDemo ? 45 : 30,
          notitie: notitie || null,
        },
      };
    };

    if (isSalesProxy) {
      await planViaSales.mutateAsync({
        affiliate_id: geselecteerdeAffiliateId,
        lead_id: leadId,
        type: afspraakType,
        geplande_op: new Date(moment).toISOString(),
        duur_minuten: isDemo ? 45 : 30,
        notitie: notitie || null,
      });
      const ctx = await buildContext();
      setReviewContext(ctx);
      setReviewCollega({ email: null, show: false });
      setReviewOpen(true);
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
      skip_auto_notify: true,
    });
    const ctx = await buildContext();
    setReviewContext(ctx);
    const colEmail = collegas.find((c) => c.id === collegaId)?.email ?? null;
    setReviewCollega({ email: colEmail, show: !!colEmail });
    setReviewOpen(true);
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
          <div className="rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground">
            Na het plannen kun je nog kiezen of je de klant {(!isSalesProxy) ? "en collega" : ""} mailt — je ziet de mail eerst en kunt 'm bewerken.
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuleren</Button>
          <Button
            onClick={opslaan}
            disabled={
              create.isPending || planViaSales.isPending ||
              !moment ||
              (canPlanForAffiliate && affiliatesLoading) ||
              (canPlanForAffiliate && !geselecteerdeAffiliateId) ||
              (!canPlanForAffiliate && !collegaId)
            }
          >
            Plannen
          </Button>
        </DialogFooter>
      </DialogContent>
      {reviewContext && (
        <MailReviewDialog
          open={reviewOpen}
          onOpenChange={setReviewOpen}
          afspraakType={afspraakType}
          contextInput={reviewContext}
          toonCollega={reviewCollega.show}
          klantEmail={email || klantEmail || reviewContext.lead?.email || null}
          collegaEmail={reviewCollega.email}
          affiliateLeadId={leadId}
        />
      )}
    </Dialog>
  );
}
