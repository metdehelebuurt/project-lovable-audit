import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { SalesFase } from "@/lib/sales/faseLabels";

export type Bestemming = "platform" | "pool" | "affiliate";

export interface BulkImportInput {
  rijen: Record<string, string>[];
  bestemming: Bestemming;
  affiliate_id?: string | null;
  fase: SalesFase;
  bestandsnaam: string;
  kolom_mapping: Record<string, string>;
}

export interface BulkImportResultaat {
  batch_id: string;
  aangemaakt: number;
  geskipped: number;
  fouten: Array<{ rij: Record<string, string>; reden: string }>;
}

export function useCsvImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: BulkImportInput): Promise<BulkImportResultaat> => {
      const { data, error } = await supabase.rpc("admin_bulk_import_sales_leads", {
        _rows: input.rijen as unknown as never,
        _bestemming: input.bestemming,
        _affiliate_id: input.affiliate_id ?? null,
        _fase: input.fase,
        _bestandsnaam: input.bestandsnaam,
        _kolom_mapping: input.kolom_mapping as unknown as never,
      });
      if (error) throw error;
      return data as unknown as BulkImportResultaat;
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["sales-leads"] });
      toast.success(`${res.aangemaakt} leads geïmporteerd, ${res.geskipped} overgeslagen`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}