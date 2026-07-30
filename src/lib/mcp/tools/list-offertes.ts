import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_offertes",
  title: "Offertes zoeken",
  description:
    "Toont offertes waar de ingelogde gebruiker toegang toe heeft, optioneel gefilterd op status of klantnaam.",
  inputSchema: {
    status: z
      .string()
      .trim()
      .min(1)
      .optional()
      .describe("Filter op status, bijv. 'concept', 'verzonden' of 'geaccepteerd'."),
    klant: z.string().trim().min(1).optional().describe("Zoekt in klantnaam en offertenummer."),
    limiet: z.number().int().min(1).max(50).default(20).describe("Maximaal aantal offertes."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, klant, limiet }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Niet ingelogd" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("offertes")
      .select("id, offertenummer, klant_naam, klant_plaats, status, totaal_bedrag, geldig_tot, created_at")
      .order("created_at", { ascending: false })
      .limit(limiet ?? 20);
    if (status) query = query.eq("status", status);
    if (klant) {
      const term = `%${klant}%`;
      query = query.or(`klant_naam.ilike.${term},offertenummer.ilike.${term}`);
    }
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { offertes: data ?? [] },
    };
  },
});