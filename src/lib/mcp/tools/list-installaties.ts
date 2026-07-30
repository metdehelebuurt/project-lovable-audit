import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_installaties",
  title: "Installaties plannen bekijken",
  description: "Toont geplande installaties, optioneel gefilterd op status en startdatum-bereik.",
  inputSchema: {
    status: z.string().trim().min(1).optional().describe("Filter op status, bijv. 'gepland' of 'afgerond'."),
    vanaf: z.string().date().optional().describe("Startdatum vanaf (YYYY-MM-DD)."),
    tot: z.string().date().optional().describe("Startdatum tot en met (YYYY-MM-DD)."),
    limiet: z.number().int().min(1).max(50).default(20).describe("Maximaal aantal installaties."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, vanaf, tot, limiet }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Niet ingelogd" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("installaties")
      .select(
        "id, installatienummer, klant_adres, klant_plaats, status, geplande_startdatum, geplande_einddatum, werkomschrijving",
      )
      .order("geplande_startdatum", { ascending: true })
      .limit(limiet ?? 20);
    if (status) query = query.eq("status", status);
    if (vanaf) query = query.gte("geplande_startdatum", vanaf);
    if (tot) query = query.lte("geplande_startdatum", tot);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { installaties: data ?? [] },
    };
  },
});