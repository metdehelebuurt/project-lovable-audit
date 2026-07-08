import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Phone, Globe } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import LeadDetailEditor from "./LeadDetailEditor";
import type { SalesLead } from "@/hooks/sales/useSalesLeads";
import { AffiliateDuplicaatWaarschuwing } from "@/components/affiliate/duplicaten/AffiliateDuplicaatWaarschuwing";

/**
 * Detailpagina voor één sales lead.
 * Vervangt de oude slide-in drawer met een volwaardige pagina.
 */
export default function SalesLeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: lead, isLoading, error } = useQuery({
    queryKey: ["sales-lead", id],
    enabled: !!id,
    queryFn: async (): Promise<SalesLead | null> => {
      const { data, error } = await supabase
        .from("affiliate_leads")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 md:px-6 py-3 max-w-7xl">
          <Button variant="ghost" size="sm" onClick={() => navigate("/sales")} className="gap-1 -ml-2">
            <ArrowLeft className="h-4 w-4" /> Terug naar Sales
          </Button>
        </div>
      </div>

      <div className="container mx-auto p-4 md:p-6 max-w-7xl">
        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-64 w-full" />
          </div>
        )}
        {error && <p className="text-sm text-destructive">Lead kon niet geladen worden.</p>}
        {!isLoading && !lead && (
          <p className="text-sm text-muted-foreground">Lead niet gevonden.</p>
        )}

        {lead && (
          <div className="space-y-5">
            <header className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Lead</p>
                <h1 className="text-3xl font-semibold truncate">{lead.bedrijfsnaam || "Lead"}</h1>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                  {lead.contactpersoon && <span>{lead.contactpersoon}</span>}
                  {lead.email && (
                    <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1 hover:text-foreground">
                      <Mail className="h-3.5 w-3.5" /> {lead.email}
                    </a>
                  )}
                  {lead.telefoon && (
                    <a href={`tel:${lead.telefoon}`} className="inline-flex items-center gap-1 hover:text-foreground">
                      <Phone className="h-3.5 w-3.5" /> {lead.telefoon}
                    </a>
                  )}
                  {lead.website && (
                    <a href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">
                      <Globe className="h-3.5 w-3.5" /> {lead.website}
                    </a>
                  )}
                </div>
              </div>
            </header>
            <AffiliateDuplicaatWaarschuwing leadId={lead.id} />
            <LeadDetailEditor lead={lead} onAfterDelete={() => navigate("/sales")} />
          </div>
        )}
      </div>
    </div>
  );
}