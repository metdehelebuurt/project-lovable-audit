// Gedeelde Mollie helper voor alle edge functions
const MOLLIE_BASE = "https://api.mollie.com/v2";

export interface MollieFetchOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: Record<string, unknown>;
  query?: Record<string, string>;
}

export async function mollieFetch<T = unknown>(
  path: string,
  opts: MollieFetchOptions = {},
): Promise<T> {
  const apiKey = Deno.env.get("MOLLIE_API_KEY");
  if (!apiKey) throw new Error("MOLLIE_API_KEY is niet geconfigureerd");

  const url = new URL(`${MOLLIE_BASE}${path}`);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    method: opts.method ?? "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const detail = (data as { detail?: string })?.detail ?? text;
    throw new Error(`Mollie API ${res.status}: ${detail}`);
  }
  return data as T;
}

export function webhookUrl(): string {
  const projectId = Deno.env.get("SUPABASE_URL")?.match(/https:\/\/([^.]+)/)?.[1];
  if (!projectId) throw new Error("SUPABASE_URL ontbreekt");
  return `https://${projectId}.supabase.co/functions/v1/mollie-webhook`;
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};