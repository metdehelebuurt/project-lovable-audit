import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import LeadDetailEditor from "./LeadDetailEditor";
import type { SalesLead } from "@/hooks/sales/useSalesLeads";

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
    <div className="container mx-auto p-4 md:p-6 max-w-5xl space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate("/sales")} className="gap-1">
        <ArrowLeft className="h-4 w-4" /> Terug naar Sales
      </Button>

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
        <>
          <div>
            <h1 className="text-2xl font-semibold truncate">{lead.bedrijfsnaam || "Lead"}</h1>
            {(lead.contactpersoon || lead.email || lead.telefoon) && (
              <p className="text-sm text-muted-foreground">
                {[lead.contactpersoon, lead.email, lead.telefoon].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
          <LeadDetailEditor lead={lead} onAfterDelete={() => navigate("/sales")} />
        </>
      )}
    </div>
  );
}