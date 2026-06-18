import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mail, ArrowRight, Euro, MessageCircle } from "lucide-react";
import { STATUS_KLEUR, STATUS_LABEL, type AffiliateLeadStatus } from "@/lib/affiliate/leadStatus";
import type { AffiliateLead } from "@/hooks/affiliate/useAffiliateLeads";
import { telLink, whatsappLink } from "@/lib/affiliate/contact";

interface Props {
  lead: AffiliateLead;
  onOpen: () => void;
  onAdvance?: () => void;
}

export function PipelineKaart({ lead, onOpen, onAdvance }: Props) {
  const tel = telLink(lead.telefoon);
  const wa = whatsappLink(lead.telefoon);
  return (
    <Card className="p-3 space-y-2 hover:shadow-md transition-shadow cursor-pointer" onClick={onOpen}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">{lead.bedrijfsnaam}</p>
          {lead.contactpersoon && <p className="text-xs text-muted-foreground truncate">{lead.contactpersoon}</p>}
        </div>
        <Badge variant="secondary" className={STATUS_KLEUR[lead.status as AffiliateLeadStatus]}>{STATUS_LABEL[lead.status as AffiliateLeadStatus]}</Badge>
      </div>
      {lead.geschatte_waarde ? (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Euro className="h-3 w-3" /> {Number(lead.geschatte_waarde).toLocaleString("nl-NL", { style: "currency", currency: "EUR" })}
        </div>
      ) : null}
      <div className="flex gap-1 pt-1" onClick={(e) => e.stopPropagation()}>
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
      </div>
    </Card>
  );
}