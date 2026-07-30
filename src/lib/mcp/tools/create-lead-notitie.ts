import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_lead_notitie",
  title: "Notitie bij lead plaatsen",
  description: "Voegt een notitie toe aan een lead namens de ingelogde gebruiker.",
  inputSchema: {
    lead_id: z.string().uuid().describe("Het id van de lead."),
    inhoud: z.string().trim().min(1).max(5000).describe("De tekst van de notitie."),
    titel: z.string().trim().min(1).max(200).optional().describe("Optionele titel."),
    intern: z.boolean().default(true).describe("Interne notitie (niet zichtbaar voor de klant)."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ lead_id, inhoud, titel, intern }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Niet ingelogd" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("id, partner_id")
      .eq("id", lead_id)
      .maybeSingle();
    if (leadError) return { content: [{ type: "text", text: leadError.message }], isError: true };
    if (!lead) return { content: [{ type: "text", text: "Lead niet gevonden" }], isError: true };

    const { data, error } = await supabase
      .from("lead_notities")
      .insert({
        lead_id,
        partner_id: lead.partner_id,
        user_id: ctx.getUserId(),
        inhoud,
        titel: titel ?? null,
        intern: intern ?? true,
      })
      .select("id, titel, inhoud, intern, created_at")
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { notitie: data },
    };
  },
});