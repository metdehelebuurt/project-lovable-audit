import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import type { DaklayoutRecord, Dakvlak, Paneel, PaneelProduct } from "./types";

function parseAfmetingen(specs: unknown): { breedteMm: number; lengteMm: number; wp: number } {
  const out = { breedteMm: 0, lengteMm: 0, wp: 0 };
  if (!specs || typeof specs !== "object") return out;
  const s = specs as Record<string, unknown>;
  const num = (v: unknown): number => {
    if (typeof v === "number") return v;
    if (typeof v === "string") {
      const m = v.match(/[\d.,]+/);
      if (m) return Number(m[0].replace(",", "."));
    }
    return 0;
  };
  out.breedteMm = num(s.breedte_mm ?? s.breedte ?? s.width_mm);
  out.lengteMm = num(s.lengte_mm ?? s.lengte ?? s.length_mm ?? s.hoogte_mm ?? s.hoogte);
  out.wp = num(s.wp ?? s.vermogen_wp ?? s.vermogen);
  return out;
}

export function useZonnepaneelProducten() {
  const [producten, setProducten] = useState<PaneelProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("producten")
        .select("id, naam, merk, specs")
        .eq("categorie", "zonnepanelen")
        .eq("status", "actief")
        .order("naam");
      if (!active) return;
      if (error) {
        toast({ title: "Producten laden mislukt", description: error.message, variant: "destructive" });
        setLoading(false);
        return;
      }
      const mapped: PaneelProduct[] = (data || []).map((row) => {
        const { breedteMm, lengteMm, wp } = parseAfmetingen(row.specs);
        return {
          id: row.id,
          naam: row.naam,
          merk: row.merk ?? null,
          breedteMm: breedteMm || 1134,
          lengteMm: lengteMm || 1722,
          wp: wp || 0,
        };
      });
      setProducten(mapped);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return { producten, loading };
}

export interface SaveDaklayoutInput {
  id?: string;
  naam: string;
  adres: string | null;
  postcode: string | null;
  plaats: string | null;
  lat: number | null;
  lng: number | null;
  product: PaneelProduct | null;
  dakvlakken: Dakvlak[];
  panelen: Paneel[];
  schouwId?: string | null;
  leadId?: string | null;
  snapshotUrl?: string | null;
  notities?: string | null;
}

export function useDaklayoutOpslag() {
  const { profile } = useAuth();
  const [saving, setSaving] = useState(false);

  const opslaan = useCallback(
    async (input: SaveDaklayoutInput): Promise<DaklayoutRecord | null> => {
      if (!profile?.partner_id) {
        toast({ title: "Geen partner", description: "Geen partner-context", variant: "destructive" });
        return null;
      }
      setSaving(true);
      const payload = {
        partner_id: profile.partner_id,
        gebruiker_id: profile.id,
        schouw_id: input.schouwId ?? null,
        lead_id: input.leadId ?? null,
        naam: input.naam,
        adres: input.adres,
        postcode: input.postcode,
        plaats: input.plaats,
        lat: input.lat,
        lng: input.lng,
        product_id: input.product?.id ?? null,
        paneel_breedte_mm: input.product?.breedteMm ?? null,
        paneel_lengte_mm: input.product?.lengteMm ?? null,
        paneel_wp: input.product?.wp ?? null,
        dakvlakken: input.dakvlakken as unknown as never,
        panelen: input.panelen as unknown as never,
        aantal_panelen: input.panelen.length,
        totaal_wp: input.panelen.length * (input.product?.wp ?? 0),
        snapshot_url: input.snapshotUrl ?? null,
        notities: input.notities ?? null,
      };
      const query = input.id
        ? supabase.from("daklayouts").update(payload).eq("id", input.id).select().single()
        : supabase.from("daklayouts").insert(payload).select().single();
      const { data, error } = await query;
      setSaving(false);
      if (error) {
        toast({ title: "Opslaan mislukt", description: error.message, variant: "destructive" });
        return null;
      }
      toast({ title: "Daklayout opgeslagen" });
      return data as unknown as DaklayoutRecord;
    },
    [profile?.partner_id, profile?.id],
  );

  return { opslaan, saving };
}

export async function uploadSnapshot(partnerId: string, layoutId: string, blob: Blob): Promise<string | null> {
  const path = `${partnerId}/${layoutId}-${Date.now()}.png`;
  const { error } = await supabase.storage.from("daklayouts").upload(path, blob, {
    contentType: "image/png",
    upsert: true,
  });
  if (error) {
    toast({ title: "Snapshot uploaden mislukt", description: error.message, variant: "destructive" });
    return null;
  }
  const { data } = supabase.storage.from("daklayouts").getPublicUrl(path);
  return data.publicUrl;
}