import { useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { AffiliateSubnav } from "@/components/affiliate/AffiliateSubnav";
import { LeadDetailBody } from "@/components/affiliate/LeadDetailBody";
import type { AffiliateLead } from "@/hooks/affiliate/useAffiliateLeads";
import { useRealtimeAffiliateLeads } from "@/hooks/affiliate/useRealtimeAffiliateLeads";
import { AffiliateDuplicaatWaarschuwing } from "@/components/affiliate/duplicaten/AffiliateDuplicaatWaarschuwing";
import { markeerLeadBekeken } from "@/hooks/affiliate/useLeadSignals";

const AffiliateLeadDetail = () => {
  useRealtimeAffiliateLeads();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: lead, isLoading, error } = useQuery({
    queryKey: ["affiliate-lead", id],
    enabled: !!id,
    queryFn: async (): Promise<AffiliateLead | null> => {
      const { data, error } = await supabase.from("affiliate_leads").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (lead?.id) {
      // Best-effort: markeer signalen als bekeken zodra de detailpagina open is.
      void markeerLeadBekeken(lead.id);
    }
  }, [lead?.id]);

  return (
    <div className="p-4 sm:p-6 min-w-0 w-full overflow-x-hidden">
      <AffiliateSubnav />
      <Button variant="ghost" size="sm" className="mb-3" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Terug
      </Button>
      {isLoading && <p className="text-sm text-muted-foreground">Lead laden...</p>}
      {error && <p className="text-sm text-destructive">Lead kon niet geladen worden.</p>}
      {!isLoading && !lead && <p className="text-sm text-muted-foreground">Lead niet gevonden.</p>}
      {lead && (
        <div className="w-full min-w-0">
          <div className="mb-3">
            <AffiliateDuplicaatWaarschuwing leadId={lead.id} />
          </div>
          <LeadDetailBody lead={lead} />
        </div>
      )}
    </div>
  );
};

export default AffiliateLeadDetail;