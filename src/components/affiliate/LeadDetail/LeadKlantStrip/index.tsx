import type { AffiliateLead } from "@/hooks/affiliate/useAffiliateLeads";
import type { AffiliateLeadStatus } from "@/lib/affiliate/leadStatus";
import { ContactCard } from "./ContactCard";
import { BedrijfCard } from "./BedrijfCard";
import { SalesCard } from "./SalesCard";

interface Props {
  lead: AffiliateLead;
  bronLabel: string | null;
  status: AffiliateLeadStatus;
  setStatus: (s: AffiliateLeadStatus) => void;
  temperatuur: string;
  setTemperatuur: (t: string) => void;
  waarde: string;
  setWaarde: (w: string) => void;
  volgendeActie: string;
  setVolgendeActie: (v: string) => void;
  tags: string[];
  setTags: (t: string[]) => void;
  isPending: boolean;
  onOpslaan: () => void;
  gewonnenPartnerId: string | null;
}

/** Horizontale 3-koloms strip met contact, bedrijf en sales-gegevens. */
export function LeadKlantStrip(props: Props) {
  return (
    <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
      <ContactCard
        leadId={props.lead.id}
        fallbackEmail={props.lead.email}
        fallbackTelefoon={props.lead.telefoon}
      />
      <BedrijfCard lead={props.lead} bronLabel={props.bronLabel} />
      <SalesCard {...props} />
    </div>
  );
}