import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

export type LostReviewBucket = Database["public"]["Enums"]["affiliate_lost_review_bucket"];
export type LostLead = Database["public"]["Tables"]["affiliate_leads"]["Row"] & {
  eigenaar?: { voornaam: string | null; achternaam: string | null; email: string | null } | null;
};

export const BUCKET_VOLGORDE: LostReviewBucket[] = [
  "te_beoordelen",
  "terugbellen",
  "wacht_3_maanden",
  "wacht_6_maanden",
  "echt_verloren",
];

export const BUCKET_LABEL: Record<LostReviewBucket, string> = {
  te_beoordelen: "Te beoordelen",
  terugbellen: "Terugbellen",
  wacht_3_maanden: "Wacht 3 maanden",
  wacht_6_maanden: "Wacht 6 maanden",
  echt_verloren: "Echt verloren",
};

export const BUCKET_KLEUR: Record<LostReviewBucket, string> = {
  te_beoordelen: "bg-amber-100 text-amber-800 border-amber-300",
  terugbellen: "bg-sky-100 text-sky-800 border-sky-300",
  wacht_3_maanden: "bg-blue-100 text-blue-800 border-blue-300",
  wacht_6_maanden: "bg-indigo-100 text-indigo-800 border-indigo-300",
  echt_verloren: "bg-rose-100 text-rose-800 border-rose-300",
};

const KEY = ["affiliate-lost-review"] as const;

export function useLostLeads() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<LostLead[]> => {
      const { data, error } = await supabase
        .from("affiliate_leads")
        .select("*, eigenaar:users!affiliate_leads_eigenaar_id_fkey(voornaam,achternaam,email)")
        .eq("status", "verloren")
        .order("verloren_op", { ascending: false });
      if (error) throw error;
      return (data ?? []) as LostLead[];
    },
  });
}

function bucketTerugDatum(bucket: LostReviewBucket): string | null {
  const d = new Date();
  if (bucket === "wacht_3_maanden") { d.setMonth(d.getMonth() + 3); return d.toISOString().slice(0, 10); }
  if (bucket === "wacht_6_maanden") { d.setMonth(d.getMonth() + 6); return d.toISOString().slice(0, 10); }
  if (bucket === "terugbellen") { d.setDate(d.getDate() + 7); return d.toISOString().slice(0, 10); }
  return null;
}

export function useSetReviewBucket() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, bucket, notitie }: { id: string; bucket: LostReviewBucket; notitie?: string }) => {
      const { error } = await supabase
        .from("affiliate_leads")
        .update({
          review_bucket: bucket,
          review_door_id: user?.id ?? null,
          review_op: new Date().toISOString(),
          review_notitie: notitie ?? null,
          terug_in_pipeline_op: bucketTerugDatum(bucket),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    onError: (e: Error) => toast.error(e.message),
  });
}