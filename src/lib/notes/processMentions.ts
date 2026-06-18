import { supabase } from "@/integrations/supabase/client";
import { extractMentionUserIds } from "@/components/shared/notes/mentionSyntax";

export type MentionResourceType = "lead" | "klant" | "offerte" | "installatie" | "schouw";

interface ProcessArgs {
  noteId?: string;
  inhoud: string;
  resourceType: MentionResourceType;
  resourceId: string;
  resourceTitel?: string;
  partnerId: string | null | undefined;
  senderId: string | null | undefined;
}

/**
 * Stuurt mentions naar de edge function als de notitie minimaal één @-mention bevat.
 * Faalt stil (alleen console) zodat het de notitie-flow nooit blokkeert.
 */
export async function processNoteMentions(args: ProcessArgs): Promise<void> {
  if (!args.partnerId || !args.senderId) return;
  const ids = extractMentionUserIds(args.inhoud);
  if (ids.length === 0) return;
  try {
    await supabase.functions.invoke("process-mentions", {
      body: {
        noteId: args.noteId,
        inhoud: args.inhoud,
        resourceType: args.resourceType,
        resourceId: args.resourceId,
        resourceTitel: args.resourceTitel ?? "",
        partnerId: args.partnerId,
        senderId: args.senderId,
      },
    });
  } catch (e) {
    console.error("process-mentions invoke failed", e);
  }
}