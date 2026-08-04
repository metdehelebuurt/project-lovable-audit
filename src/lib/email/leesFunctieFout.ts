/**
 * Haalt de leesbare foutmelding uit een mislukte Edge Function-aanroep.
 * `supabase.functions.invoke` geeft bij een non-2xx alleen "Edge Function
 * returned a non-2xx status code"; de echte reden staat in de response-body.
 */
export async function leesFunctieFout(
  error: unknown,
  data?: { error?: string; detail?: string } | null,
): Promise<string> {
  if (data?.detail) return data.detail;
  if (data?.error) return data.error;

  const context = (error as { context?: Response })?.context;
  if (context && typeof context.json === "function") {
    try {
      const body = await context.json();
      if (typeof body?.detail === "string") return body.detail;
      if (typeof body?.error === "string") return body.error;
    } catch {
      /* body niet leesbaar */
    }
  }

  const message = (error as Error)?.message;
  if (message?.includes("non-2xx")) {
    return "De server kon de e-mail niet verwerken. Probeer het opnieuw of neem contact op met support.";
  }
  return message || "Onbekende fout";
}
