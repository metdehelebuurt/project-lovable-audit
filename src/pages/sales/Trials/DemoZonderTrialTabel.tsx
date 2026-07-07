import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SalesLead } from "@/hooks/sales/useSalesLeads";
import { STATUS_LABEL, type AffiliateLeadStatus } from "@/lib/affiliate/leadStatus";
import { Mail, Phone } from "lucide-react";

interface Props {
  leads: SalesLead[];
}

export default function DemoZonderTrialTabel({ leads }: Props) {
  if (leads.length === 0) {
    return (
      <Card className="p-6 text-center text-sm text-muted-foreground">
        Geen open demo-leads zonder trial.
      </Card>
    );
  }
  return (
    <div className="space-y-2">
      {leads.map((l) => (
        <Card key={l.id} className="p-3 flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={`/sales/leads/${l.id}`}
                className="font-semibold text-sm hover:underline truncate"
              >
                {l.bedrijfsnaam ?? "Onbekend"}
              </Link>
              <Badge variant="secondary" className="text-[10px]">
                {STATUS_LABEL[(l.status ?? "nieuw") as AffiliateLeadStatus]}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
              {l.contactpersoon && <span>{l.contactpersoon}</span>}
              {l.email && (
                <a href={`mailto:${l.email}`} className="inline-flex items-center gap-1 hover:text-foreground">
                  <Mail className="h-3 w-3" />
                  {l.email}
                </a>
              )}
              {l.telefoon && (
                <a href={`tel:${l.telefoon}`} className="inline-flex items-center gap-1 hover:text-foreground">
                  <Phone className="h-3 w-3" />
                  {l.telefoon}
                </a>
              )}
              {l.updated_at && (
                <span>· laatst bijgewerkt {new Date(l.updated_at).toLocaleDateString("nl-NL")}</span>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}