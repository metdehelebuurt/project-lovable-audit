import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_leads",
  title: "Leads zoeken",
  description:
    "Zoekt leads waar de ingelogde gebruiker toegang toe heeft, optioneel gefilterd op status of zoekterm (naam, bedrijf, e-mail, plaats).",
  inputSchema: {
    zoekterm: z.string().trim().min(1).optional().describe("Zoekt in naam, bedrijfsnaam, e-mail en plaats."),
    status: z.string().trim().min(1).optional().describe("Filter op lead_status, bijv. 'nieuw' of 'gekwalificeerd'."),
    limiet: z.number().int().min(1).max(50).default(20).describe("Maximaal aantal leads."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ zoekterm, status, limiet }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Niet ingelogd" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("leads")
      .select("id, voornaam, achternaam, bedrijfsnaam, email, telefoon, plaats, lead_status, bron, created_at")
      .order("created_at", { ascending: false })
      .limit(limiet ?? 20);
    if (status) query = query.eq("lead_status", status);
    if (zoekterm) {
      const term = `%${zoekterm}%`;
      query = query.or(
        `voornaam.ilike.${term},achternaam.ilike.${term},bedrijfsnaam.ilike.${term},email.ilike.${term},plaats.ilike.${term}`,
      );
    }
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { leads: data ?? [] },
    };
  },
});