import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mail, ArrowRight, Euro, MessageCircle, GripVertical } from "lucide-react";
import { STATUS_KLEUR, STATUS_LABEL, type AffiliateLeadStatus } from "@/lib/affiliate/leadStatus";
import type { AffiliateLead } from "@/hooks/affiliate/useAffiliateLeads";
import { telLink, whatsappLink } from "@/lib/affiliate/contact";
import { TrialStatusBadge } from "./TrialStatusBadge";
import { TrialStartenButton } from "./TrialStartenButton";
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
      <div className="flex items-start justify-between gap-2">
        {draggable && (
          <span
            aria-hidden
            className="text-muted-foreground -ml-1 mt-0.5"
          >
            <GripVertical className="h-4 w-4" />
          </span>
        )}
        <div className="min-w-0">
          <button type="button" onClick={onOpen} className="text-left hover:underline">
            <p className="font-semibold text-sm truncate">{lead.bedrijfsnaam}</p>
          </button>
          {lead.contactpersoon && <p className="text-xs text-muted-foreground truncate">{lead.contactpersoon}</p>}
        </div>
        <Badge variant="secondary" className={STATUS_KLEUR[lead.status as AffiliateLeadStatus]}>{STATUS_LABEL[lead.status as AffiliateLeadStatus]}</Badge>
      </div>
      {gewonnenPartnerId && (
        <TrialStatusBadge compact />
      )}
      {lead.geschatte_waarde ? (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Euro className="h-3 w-3" /> {Number(lead.geschatte_waarde).toLocaleString("nl-NL", { style: "currency", currency: "EUR" })}
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
      {!gewonnenPartnerId && (
        <TrialStartenButton lead={lead} size="sm" variant="outline" className="w-full h-7 text-xs" />
      )}
    </Card>
  );
}