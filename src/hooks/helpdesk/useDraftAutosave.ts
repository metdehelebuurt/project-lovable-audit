import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type DraftStatus = "idle" | "saving" | "saved" | "error";

export function useDraftAutosave<T>(contextKey: string, value: T, intervalMs = 5000) {
  const { user, profile } = useAuth();
  const [status, setStatus] = useState<DraftStatus>("idle");
  const lastSaved = useRef<string>("");

  useEffect(() => {
    if (!user || !profile?.partner_id) return;
    const interval = setInterval(async () => {
      const serialized = JSON.stringify(value);
      if (serialized === lastSaved.current) return;
      setStatus("saving");
      try {
        const { error } = await supabase
          .from("helpdesk_drafts")
          .upsert(
            {
              user_id: user.id,
              partner_id: profile.partner_id,
              context_key: contextKey,
              inhoud: value as never,
            } as never,
            { onConflict: "user_id,context_key" },
          );
        if (error) throw error;
        lastSaved.current = serialized;
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    }, intervalMs);
    return () => clearInterval(interval);
  }, [user, profile?.partner_id, contextKey, value, intervalMs]);

  return status;
}

export async function loadDraft<T>(userId: string, contextKey: string): Promise<T | null> {
  const { data } = await supabase
    .from("helpdesk_drafts")
    .select("inhoud")
    .eq("user_id", userId)
    .eq("context_key", contextKey)
    .maybeSingle();
  return (data?.inhoud as T) ?? null;
}

export async function clearDraft(userId: string, contextKey: string): Promise<void> {
  await supabase
    .from("helpdesk_drafts")
    .delete()
    .eq("user_id", userId)
    .eq("context_key", contextKey);
}