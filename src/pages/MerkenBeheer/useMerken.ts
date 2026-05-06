import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { PartnerMerk } from "./types";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

export const useMerken = () => {
  const { profile } = useAuth();
  const [merken, setMerken] = useState<PartnerMerk[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!profile?.partner_id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await (supabase
      .from("partner_merken" as never) as any)
      .select("*")
      .eq("partner_id", profile.partner_id)
      .order("volgorde", { ascending: true })
      .order("merk", { ascending: true });

    if (error) {
      toast.error("Kon merken niet laden");
    } else {
      setMerken((data ?? []) as PartnerMerk[]);
    }
    setLoading(false);
  }, [profile?.partner_id]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (merk: string) => {
    if (!profile?.partner_id || !merk.trim()) return;
    const slug = slugify(merk);
    const { error } = await (supabase.from("partner_merken" as never) as any).insert({
      partner_id: profile.partner_id,
      merk: merk.trim(),
      slug,
      toon_op_website: true,
    });
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Merk bestaat al" : "Aanmaken mislukt");
      return;
    }
    toast.success("Merk toegevoegd");
    load();
  };

  const update = async (id: string, patch: Partial<PartnerMerk>) => {
    const { error } = await (supabase.from("partner_merken" as never) as any)
      .update(patch)
      .eq("id", id);
    if (error) {
      toast.error("Opslaan mislukt");
      return;
    }
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Merk verwijderen?")) return;
    const { error } = await (supabase.from("partner_merken" as never) as any)
      .delete()
      .eq("id", id);
    if (error) {
      toast.error("Verwijderen mislukt");
      return;
    }
    toast.success("Merk verwijderd");
    load();
  };

  const uploadLogo = async (id: string, file: File): Promise<string | null> => {
    if (!profile?.partner_id) return null;
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
    const path = `${profile.partner_id}/merken/${id}.${ext}`;
    const { error } = await supabase.storage
      .from("partner-assets")
      .upload(path, file, { upsert: true });
    if (error) {
      toast.error("Upload mislukt");
      return null;
    }
    const { data } = supabase.storage.from("partner-assets").getPublicUrl(path);
    const url = `${data.publicUrl}?t=${Date.now()}`;
    await update(id, { logo_url: url });
    return url;
  };

  return { merken, loading, create, update, remove, uploadLogo, reload: load };
};