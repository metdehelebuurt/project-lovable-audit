import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { AffiliateSubnav } from "@/components/affiliate/AffiliateSubnav";
import { LeadDetailBody } from "@/components/affiliate/LeadDetailBody";
import type { AffiliateLead } from "@/hooks/affiliate/useAffiliateLeads";
import { useRealtimeAffiliateLeads } from "@/hooks/affiliate/useRealtimeAffiliateLeads";
import { AffiliateDuplicaatWaarschuwing } from "@/components/affiliate/duplicaten/AffiliateDuplicaatWaarschuwing";
import { markeerLeadBekeken } from "@/hooks/affiliate/useLeadSignals";
import { NieuweActiviteitBanner } from "@/components/affiliate/LeadDetail/NieuweActiviteitBanner";

const AffiliateLeadDetail = () => {
  useRealtimeAffiliateLeads();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();
  const qc = useQueryClient();

  const { data: lead, isLoading, error } = useQuery({
    queryKey: ["affiliate-lead", id],
    enabled: !!id,
    queryFn: async (): Promise<AffiliateLead | null> => {
      const { data, error } = await supabase.from("affiliate_leads").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const markeerAlsGelezen = async () => {
    if (!lead?.id) return;
    await markeerLeadBekeken(lead.id);
    qc.invalidateQueries({ queryKey: ["affiliate-lead-ongelezen", lead.id] });
    qc.invalidateQueries({ queryKey: ["affiliate-lead-signals"] });
  };

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
          <div className="mb-3 space-y-3">
            <NieuweActiviteitBanner
              leadId={lead.id}
              onGelezen={markeerAlsGelezen}
              onOpenNotities={() => {
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev);
                  next.set("tab", "notities");
                  return next;
                }, { replace: true });
                void markeerAlsGelezen();
              }}
            />
            <AffiliateDuplicaatWaarschuwing leadId={lead.id} />
          </div>
          <LeadDetailBody lead={lead} />
        </div>
      )}
    </div>
  );
};

export default AffiliateLeadDetail;