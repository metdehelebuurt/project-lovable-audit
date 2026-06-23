import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Tag, Building2, Send, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SalesLead } from "@/hooks/sales/useSalesLeads";
import TemperatuurBadge from "@/components/sales/TemperatuurBadge";
import type { Temperatuur } from "@/lib/sales/temperatuur";

interface Props {
  lead: SalesLead;
  onClick: () => void;
  onToewijzen?: () => void;
}

export default function LeadKaart({ lead, onClick, onToewijzen }: Props) {
  const temperatuur = (lead.temperatuur ?? "koud") as Temperatuur;
  const deadline = lead.volgende_actie_op ? new Date(lead.volgende_actie_op) : null;
  const teLaat = deadline ? deadline.getTime() < Date.now() : false;
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
      className={`p-3 cursor-pointer hover:shadow-md transition-shadow space-y-1.5 ${teLaat ? "border-rose-300" : ""}`}
    >
      <div className="flex items-start gap-2">
        <Building2 className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
        <div className="font-medium text-sm flex-1 truncate">{lead.bedrijfsnaam}</div>
        <TemperatuurBadge temperatuur={temperatuur} showLabel={false} />
      </div>
      {lead.contactpersoon && (
        <div className="text-xs text-muted-foreground truncate pl-6">{lead.contactpersoon}</div>
      )}
      <div className="flex flex-wrap gap-1.5 pl-6 pt-1">
        {lead.email && <Mail className="h-3 w-3 text-muted-foreground" aria-label="heeft e-mail" />}
        {lead.telefoon && <Phone className="h-3 w-3 text-muted-foreground" aria-label="heeft telefoon" />}
        {lead.regio && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{lead.regio}</Badge>}
        {lead.branche && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{lead.branche}</Badge>}
      </div>
      <div className="flex items-center justify-between pl-6 pt-1">
        <span className="text-[11px] text-muted-foreground">
          {lead.eigenaar_id ? "Toegewezen" : "Platform"}
        </span>
        {lead.geschatte_waarde != null && (
          <span className="text-[11px] font-medium inline-flex items-center gap-1">
            <Tag className="h-3 w-3" />€{Number(lead.geschatte_waarde).toLocaleString("nl-NL")}
          </span>
        )}
      </div>
      {deadline && (
        <div className={`text-[11px] pl-6 inline-flex items-center gap-1 ${teLaat ? "text-rose-600 font-medium" : "text-muted-foreground"}`}>
          {teLaat && <AlertTriangle className="h-3 w-3" />}
          Volgende actie: {deadline.toLocaleDateString("nl-NL")}
        </div>
      )}
      {onToewijzen && (
        <div className="pt-1.5 border-t flex justify-end" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs gap-1"
            onClick={onToewijzen}
            aria-label={`Lead ${lead.bedrijfsnaam} toewijzen aan affiliate`}
          >
            <Send className="h-3 w-3" />
            {lead.eigenaar_id ? "Opnieuw toewijzen" : "Toewijzen"}
          </Button>
        </div>
      )}
    </Card>
  );
}