import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Tag, Building2 } from "lucide-react";
import type { SalesLead } from "@/hooks/sales/useSalesLeads";

interface Props {
  lead: SalesLead;
  onClick: () => void;
}

export default function LeadKaart({ lead, onClick }: Props) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
      className="p-3 cursor-pointer hover:shadow-md transition-shadow space-y-1.5"
    >
      <div className="flex items-start gap-2">
        <Building2 className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
        <div className="font-medium text-sm flex-1 truncate">{lead.bedrijfsnaam}</div>
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
    </Card>
  );
}