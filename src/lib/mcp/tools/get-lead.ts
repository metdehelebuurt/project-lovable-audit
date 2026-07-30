import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_lead",
  title: "Lead ophalen",
  description: "Haalt één lead op met de laatste notities en bijbehorende offertes.",
  inputSchema: { lead_id: z.string().uuid().describe("Het id van de lead.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ lead_id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Niet ingelogd" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data: lead, error } = await supabase
      .from("leads")
      .select("*")
      .eq("id", lead_id)
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!lead) return { content: [{ type: "text", text: "Lead niet gevonden" }], isError: true };

    const [{ data: notities }, { data: offertes }] = await Promise.all([
      supabase
        .from("lead_notities")
        .select("id, titel, inhoud, intern, created_at")
        .eq("lead_id", lead_id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("offertes")
        .select("id, offertenummer, status, totaal_bedrag, created_at")
        .eq("lead_id", lead_id)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    const resultaat = { lead, notities: notities ?? [], offertes: offertes ?? [] };
    return {
      content: [{ type: "text", text: JSON.stringify(resultaat) }],
      structuredContent: resultaat,
    };
  },
});