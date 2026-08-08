import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useEffectieveModules } from "@/lib/modules";
import type { TourPlan } from "@/lib/tour/types";
import type { HelpMessage } from "./useHelpChat";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/help-assistant`;
const PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

/** Haalt op basis van het gesprek een interactief stappenplan op bij de AI. */
export function useTutorialPlan() {
  const { profile } = useAuth();
  const { moduleSet } = useEffectieveModules();
  const [bezig, setBezig] = useState(false);

  const haalPlan = useCallback(
    async (messages: HelpMessage[]): Promise<TourPlan | null> => {
      if (bezig) return null;
      setBezig(true);
      try {
        const resp = await fetch(CHAT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${PUBLISHABLE_KEY}` },
          body: JSON.stringify({
            mode: "tutorial",
            messages: messages.slice(-6),
            rol: profile?.rol ?? "partner_staff",
            module_keys: Array.from(moduleSet),
          }),
        });
        if (resp.status === 429) { toast.error("Even druk, probeer het zo opnieuw."); return null; }
        if (resp.status === 402) { toast.error("AI-tegoed op. Neem contact op met je beheerder."); return null; }
        if (!resp.ok) { toast.error("Tutorial kon niet worden opgebouwd."); return null; }
        const data = (await resp.json()) as { plan?: TourPlan | null };
        if (!data.plan || data.plan.stappen.length === 0) {
          toast.error("Hier kan ik geen stappenplan van maken. Volg de uitleg in de chat.");
          return null;
        }
        return data.plan;
      } catch (e) {
        console.error("tutorial-plan fout", e);
        toast.error("Tutorial kon niet worden gestart.");
        return null;
      } finally {
        setBezig(false);
      }
    },
    [bezig, profile?.rol, moduleSet],
  );

  return { haalPlan, bezig };
}
