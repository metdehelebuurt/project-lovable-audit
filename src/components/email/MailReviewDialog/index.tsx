import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAffiliateEmailTemplates } from "@/hooks/affiliate/useAffiliateEmailTemplates";
import { resolveDefaultTemplate, type ActieKey } from "@/lib/email/actieDefault";
import { buildPlanningContext, renderWithContext, type PlanningContextInput } from "@/lib/email/planningContext";
import { MailTab, type MailTabState } from "./MailTab";
import { useSendPlanningMail } from "@/hooks/email/useSendPlanningMail";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { wrapInMijnhuisTemplateClient } from "@/lib/affiliateTemplates/mijnhuisWrapper";

export interface MailReviewDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** "demo" | "terugbel" | "trial" */
  afspraakType: "demo" | "terugbel" | "trial";
  /** Volledig context-object met lead/affiliate/collega/afspraak. */
  contextInput: PlanningContextInput;
  /** Of de collega-tab überhaupt zichtbaar moet zijn. */
  toonCollega: boolean;
  /** Default 'aan' adres voor klant en collega. */
  klantEmail?: string | null;
  collegaEmail?: string | null;
  /** Linking metadata voor email_berichten. */
  leadId?: string | null;
  affiliateLeadId?: string | null;
  onSent?: () => void;
}

export function MailReviewDialog(props: MailReviewDialogProps) {
  const {
    open, onOpenChange, afspraakType, contextInput, toonCollega,
    klantEmail, collegaEmail, leadId, affiliateLeadId, onSent,
  } = props;
  const { data: customTemplates } = useAffiliateEmailTemplates();
  const { user, profile } = useAuth();
  const send = useSendPlanningMail();

  const context = useMemo(() => buildPlanningContext(contextInput), [contextInput]);

  const klantActie: ActieKey = afspraakType === "demo" ? "demo_klant"
    : afspraakType === "terugbel" ? "terugbel_klant" : "trial_klant";
  const collegaActie: ActieKey | null = afspraakType === "demo" ? "demo_collega"
    : afspraakType === "terugbel" ? "terugbel_collega" : null;

  const [klant, setKlant] = useState<MailTabState>(() => leegState());
  const [collega, setCollega] = useState<MailTabState>(() => leegState());

  useEffect(() => {
    if (!open) return;
    const k = resolveDefaultTemplate(klantActie, customTemplates);
    setKlant({
      versturen: !!klantEmail,
      templateKey: k?.templateKey ?? "",
      aan: klantEmail ?? "",
      onderwerp: k?.onderwerp ?? "",
      bodyHtml: k?.bodyHtml ?? "",
    });
    if (toonCollega && collegaActie) {
      const c = resolveDefaultTemplate(collegaActie, customTemplates);
      setCollega({
        versturen: !!collegaEmail,
        templateKey: c?.templateKey ?? "",
        aan: collegaEmail ?? "",
        onderwerp: c?.onderwerp ?? "",
        bodyHtml: c?.bodyHtml ?? "",
      });
    }
  }, [open, klantActie, collegaActie, customTemplates, klantEmail, collegaEmail, toonCollega]);

  const afzenderNaam = [profile?.voornaam, profile?.achternaam].filter(Boolean).join(" ").trim()
    || user?.email?.split("@")[0]
    || "mijnhuis.nu";

  const versturen = async () => {
    const taken: Array<{ rol: "klant" | "collega"; state: MailTabState }> = [];
    if (klant.versturen) taken.push({ rol: "klant", state: klant });
    if (toonCollega && collega.versturen) taken.push({ rol: "collega", state: collega });
    if (taken.length === 0) {
      toast.info("Geen mails geselecteerd om te versturen");
      onOpenChange(false);
      return;
    }
    const validRe = /^\S+@\S+\.\S+$/;
    for (const t of taken) {
      if (!validRe.test(t.state.aan)) {
        toast.error(`Ongeldig e-mailadres voor ${t.rol}`);
        return;
      }
    }

    let mislukt = 0;
    for (const t of taken) {
      const subject = renderWithContext(t.state.onderwerp, context).trim() || "(geen onderwerp)";
      const renderedBody = renderWithContext(t.state.bodyHtml, context);
      const html = wrapInMijnhuisTemplateClient(renderedBody, {
        senderName: afzenderNaam,
        senderEmail: user?.email ?? null,
        senderTelefoon: contextInput.affiliate?.telefoon ?? null,
        bedrijf: contextInput.affiliate?.bedrijf ?? null,
      });
      try {
        await send.mutateAsync({
          to: t.state.aan.trim(),
          subject,
          html,
          rol: t.rol,
          afspraakType,
          leadId: leadId ?? null,
          affiliateLeadId: affiliateLeadId ?? null,
        });
      } catch (e) {
        console.error("planning-mail", t.rol, e);
        mislukt++;
        toast.error(`Mail aan ${t.rol} mislukt: ${(e as Error).message}`);
      }
    }
    if (mislukt === 0) {
      toast.success(taken.length === 2 ? "Beide mails verzonden" : "Mail verzonden");
      onSent?.();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] p-0 gap-0">
        <DialogHeader className="p-5 pb-3 border-b">
          <DialogTitle>Mail versturen</DialogTitle>
          <DialogDescription>
            Afspraak is opgeslagen. Controleer en bewerk de mails voordat je verstuurt.
          </DialogDescription>
        </DialogHeader>

        <div className="p-5">
          {toonCollega ? (
            <Tabs defaultValue="klant">
              <TabsList>
                <TabsTrigger value="klant">
                  Klant {klant.versturen ? "" : "(uit)"}
                </TabsTrigger>
                <TabsTrigger value="collega">
                  Collega {collega.versturen ? "" : "(uit)"}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="klant" className="mt-4">
                <MailTab
                  ontvangerLabel="Klant"
                  state={klant}
                  onChange={setKlant}
                  customTemplates={customTemplates}
                  context={context}
                  afzender={{
                    naam: afzenderNaam,
                    email: user?.email ?? null,
                    telefoon: contextInput.affiliate?.telefoon ?? null,
                  }}
                />
              </TabsContent>
              <TabsContent value="collega" className="mt-4">
                <MailTab
                  ontvangerLabel="Collega"
                  state={collega}
                  onChange={setCollega}
                  customTemplates={customTemplates}
                  context={context}
                  afzender={{
                    naam: afzenderNaam,
                    email: user?.email ?? null,
                    telefoon: contextInput.affiliate?.telefoon ?? null,
                  }}
                />
              </TabsContent>
            </Tabs>
          ) : (
            <MailTab
              ontvangerLabel="Klant"
              state={klant}
              onChange={setKlant}
              customTemplates={customTemplates}
              context={context}
              afzender={{
                naam: afzenderNaam,
                email: user?.email ?? null,
                telefoon: contextInput.affiliate?.telefoon ?? null,
              }}
            />
          )}
        </div>

        <DialogFooter className="p-5 pt-3 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={send.isPending}>
            Overslaan
          </Button>
          <Button onClick={versturen} disabled={send.isPending}>
            {send.isPending ? "Versturen…" : "Verstuur geselecteerde mails"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function leegState(): MailTabState {
  return { versturen: false, templateKey: "", aan: "", onderwerp: "", bodyHtml: "" };
}