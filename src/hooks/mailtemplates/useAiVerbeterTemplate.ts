import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface VerbeterInput {
  bron: "affiliate" | "sales";
  template_key?: string | null;
  huidige_onderwerp: string;
  huidige_body: string;
  body_formaat?: "html" | "tekst";
  doel?: string;
  stijl?: string[];
  doelgroep?: string[];
  conversie?: string[];
  lengte?: "kort" | "gemiddeld" | "uitgebreid";
  vrije_instructie?: string;
  mode?: "volledig" | "alleen_onderwerp" | "ab_variant";
  feedback_hint?: string;
}

export interface VerbeterOutput {
  generatie_id: string | null;
  onderwerp: string;
  body: string;
  uitleg: string;
  suggesties: string[];
}

export function useAiVerbeterTemplate() {
  return useMutation({
    mutationFn: async (input: VerbeterInput): Promise<VerbeterOutput> => {
      const { data, error } = await supabase.functions.invoke("ai-template-verbeteren", { body: input });
      if (error) throw new Error(error.message || "AI-verbetering mislukt");
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      return data as VerbeterOutput;
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAiTemplateStatus() {
  return useMutation({
    mutationFn: async (input: {
      generatie_id: string;
      status: "toegepast" | "verworpen" | "bewerkt";
      finale_onderwerp?: string;
      finale_body?: string;
    }) => {
      const { error } = await supabase.functions.invoke("ai-template-verbeteren", {
        body: { actie: "status", ...input },
      });
      if (error) throw new Error(error.message);
    },
  });
}

export function useAiTemplateFeedback() {
  return useMutation({
    mutationFn: async (input: {
      generatie_id: string;
      feedback: string;
      sentiment?: "positief" | "negatief" | "neutraal";
    }) => {
      const { error } = await supabase.functions.invoke("ai-template-verbeteren", {
        body: { actie: "feedback", ...input },
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => toast.success("Bedankt — AI leert van je feedback"),
    onError: (e: Error) => toast.error(e.message),
  });
}