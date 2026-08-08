import { buildHelpSystemPrompt } from "./help-knowledge.ts";
import { buildTutorialPrompt, valideerPlan } from "./tutorial-plan.ts";
import { vraagTutorialPlan } from "./tutorial-request.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  messages: ChatMessage[];
  rol?: string;
  module_keys?: string[];
  /** "chat" (standaard) of "tutorial" voor een interactief stappenplan. */
  mode?: "chat" | "tutorial";
}

function isValidMessage(m: unknown): m is ChatMessage {
  if (!m || typeof m !== "object") return false;
  const obj = m as Record<string, unknown>;
  return (obj.role === "user" || obj.role === "assistant") && typeof obj.content === "string";
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleTutorial(
  apiKey: string,
  messages: ChatMessage[],
  rol: string,
  moduleKeys: string[],
): Promise<Response> {
  const vraag = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  if (!vraag) return jsonResponse({ error: "geen vraag" }, 400);

  const context = messages.slice(-4).map((m) => `${m.role}: ${m.content}`).join("\n\n");
  const resultaat = await vraagTutorialPlan(apiKey, buildTutorialPrompt(rol, moduleKeys), context);
  if (resultaat.status === 429) return jsonResponse({ error: "Even druk, probeer het zo opnieuw." }, 429);
  if (resultaat.status === 402) return jsonResponse({ error: "AI-tegoed op." }, 402);
  if (resultaat.status !== 200) return jsonResponse({ error: resultaat.fout ?? "AI fout" }, 500);

  const plan = valideerPlan(resultaat.json, rol, moduleKeys);
  if (!plan) return jsonResponse({ plan: null }, 200);
  return jsonResponse({ plan }, 200);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as RequestBody;
    const messages = Array.isArray(body.messages) ? body.messages.filter(isValidMessage) : [];
    if (messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages is verplicht" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rol = typeof body.rol === "string" ? body.rol : "partner_staff";
    const moduleKeys = Array.isArray(body.module_keys)
      ? body.module_keys.filter((k): k is string => typeof k === "string")
      : [];

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI niet geconfigureerd" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = buildHelpSystemPrompt(rol, moduleKeys);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        stream: true,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.slice(-20),
        ],
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Even druk, probeer het zo opnieuw." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "AI-tegoed op. Neem contact op met je beheerder." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!response.ok || !response.body) {
      const txt = await response.text();
      console.error("AI gateway error:", response.status, txt);
      return new Response(JSON.stringify({ error: "AI fout" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("help-assistant error:", e);
    const message = e instanceof Error ? e.message : "Onbekende fout";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});