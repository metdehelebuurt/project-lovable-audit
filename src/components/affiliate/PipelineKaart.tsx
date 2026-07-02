import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mail, ArrowRight, MessageCircle, GripVertical } from "lucide-react";
import { STATUS_KLEUR, STATUS_LABEL, type AffiliateLeadStatus } from "@/lib/affiliate/leadStatus";
import type { AffiliateLead } from "@/hooks/affiliate/useAffiliateLeads";
import { telLink, whatsappLink } from "@/lib/affiliate/contact";
import { TrialStatusBadge } from "./TrialStatusBadge";
import { TrialStartenButton } from "./TrialStartenButton";
import { LeadSignalBadge } from "./LeadSignalBadge";
import { useAffiliateLeadSignals } from "@/hooks/affiliate/useLeadSignals";
import { useLeadKlantstatus } from "@/hooks/affiliate/useLeadKlantstatus";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

interface Props {
  lead: AffiliateLead;
  onOpen: () => void;
  onAdvance?: () => void;
  draggable?: boolean;
}

export function PipelineKaart({ lead, onOpen, onAdvance, draggable = false }: Props) {
  const tel = telLink(lead.telefoon);
  const wa = whatsappLink(lead.telefoon);
  const gewonnenPartnerId = (lead as unknown as { gewonnen_partner_id?: string | null }).gewonnen_partner_id ?? null;
  const { data: signals } = useAffiliateLeadSignals();
  const signal = signals?.[lead.id];
  const { data: klant } = useLeadKlantstatus(lead.id);
  const heeftActiefAbo = klant?.status === "trial" || klant?.status === "betalend";
  const drag = useDraggable({ id: lead.id, disabled: !draggable });
  const style = drag.transform
    ? { transform: CSS.Translate.toString(drag.transform), opacity: drag.isDragging ? 0.4 : 1 }
    : undefined;
  const dragProps = draggable ? { ...drag.listeners, ...drag.attributes } : {};
  return (
    <Card
      ref={draggable ? drag.setNodeRef : undefined}
      style={style}
      className={`p-3 space-y-2 hover:shadow-md transition-shadow ${draggable ? "cursor-grab active:cursor-grabbing touch-none" : ""}`}
      {...dragProps}
    >
      <div className="flex items-start gap-2 min-w-0">
        {draggable && (
          <span aria-hidden className="text-muted-foreground/60 -ml-1 mt-0.5 shrink-0">
            <GripVertical className="h-4 w-4" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <button type="button" onClick={onOpen} className="text-left hover:underline w-full">
            <p className="font-semibold text-sm truncate">{lead.bedrijfsnaam}</p>
          </button>
          {lead.contactpersoon && <p className="text-xs text-muted-foreground truncate">{lead.contactpersoon}</p>}
          <LeadSignalBadge signal={signal} />
        </div>
      </div>
      <Badge
        variant="secondary"
        className={`${STATUS_KLEUR[lead.status as AffiliateLeadStatus]} text-[10px] font-medium w-fit`}
      >
        {STATUS_LABEL[lead.status as AffiliateLeadStatus]}
      </Badge>
      {gewonnenPartnerId && (
        <TrialStatusBadge compact />
      )}
      {!gewonnenPartnerId && klant && klant.status !== "geen_match" && klant.status !== "geen_toegang" && (
        <Badge
          variant="outline"
          className={
            klant.status === "betalend"
              ? "text-[10px] bg-emerald-50 text-emerald-800 border-emerald-200"
              : klant.status === "trial"
                ? "text-[10px] bg-violet-50 text-violet-800 border-violet-200"
                : "text-[10px] bg-amber-50 text-amber-800 border-amber-200"
          }
          title={klant.partner_naam ?? undefined}
        >
          {klant.status === "betalend" ? "Reeds klant" : klant.status === "trial" ? "Trial actief" : "Bekende partner"}
        </Badge>
      )}
      {lead.geschatte_waarde ? (
        <div className="text-xs text-muted-foreground tabular-nums">
          {Number(lead.geschatte_waarde).toLocaleString("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}
        </div>
      ) : null}
      <div className="flex gap-1 pt-1">
        {tel && (
          <Button asChild size="sm" variant="outline" className="h-7 px-2 text-xs">
            <a href={tel}><Phone className="h-3 w-3 mr-1" />Bellen</a>
          </Button>
        )}
        {wa && (
          <Button asChild size="sm" variant="outline" className="h-7 px-2 text-xs text-emerald-700 border-emerald-300">
            <a href={wa} target="_blank" rel="noreferrer"><MessageCircle className="h-3 w-3" /></a>
          </Button>
        )}
        {lead.email && (
          <Button asChild size="sm" variant="outline" className="h-7 px-2 text-xs">
            <a href={`mailto:${lead.email}`}><Mail className="h-3 w-3" /></a>
          </Button>
        )}
        {onAdvance && (
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs ml-auto" onClick={onAdvance}>
            <ArrowRight className="h-3 w-3" />
          </Button>
        )}
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={onOpen}>
          Details
        </Button>
      </div>
      {!gewonnenPartnerId && !heeftActiefAbo && (
        <TrialStartenButton lead={lead} size="sm" variant="outline" className="w-full h-7 text-xs" />
      )}
    </Card>
  );
}