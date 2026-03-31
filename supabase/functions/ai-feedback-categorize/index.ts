import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();

    // MODE: Generate interview questions for feature requests
    if (body.mode === "generate_questions") {
      const { titel, type } = body;
      if (!titel) {
        return new Response(JSON.stringify({ error: "titel is required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

      const prompt = `Een gebruiker van een SaaS-platform voor energiebedrijven wil een ${type === "functieverzoek" ? "nieuwe functie aanvragen" : "feedback geven"}.

Titel van het verzoek: "${titel}"

Genereer precies 5 korte, gerichte verduidelijkingsvragen (in het Nederlands) die helpen om het verzoek beter te begrijpen. De vragen moeten inzicht geven in:
1. Het onderliggende probleem of de behoefte
2. De doelgroep/gebruikersrol
3. De frequentie/urgentie
4. Het gewenste eindresultaat
5. Eventuele referenties of voorbeelden

Houd de vragen kort, duidelijk en vriendelijk.`;

      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "Je bent een product manager die verduidelijkende vragen stelt aan gebruikers. Antwoord alleen met de tool-call." },
            { role: "user", content: prompt },
          ],
          tools: [{
            type: "function",
            function: {
              name: "generate_questions",
              description: "Genereer verduidelijkende vragen",
              parameters: {
                type: "object",
                properties: {
                  vragen: { type: "array", items: { type: "string" }, minItems: 5, maxItems: 5 },
                },
                required: ["vragen"],
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "generate_questions" } },
        }),
      });

      if (!aiResp.ok) {
        const status = aiResp.status;
        if (status === 429) return new Response(JSON.stringify({ error: "AI rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error(`AI gateway error: ${status}`);
      }

      const aiData = await aiResp.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) throw new Error("No tool call in AI response");

      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify({ vragen: result.vragen }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // MODE: Categorize feedback (original behavior)
    const { feedback_id } = body;
    if (!feedback_id) {
      return new Response(JSON.stringify({ error: "feedback_id is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: feedback, error: fetchErr } = await supabase
      .from("feedback_verzoeken")
      .select("*")
      .eq("id", feedback_id)
      .single();

    if (fetchErr || !feedback) {
      return new Response(JSON.stringify({ error: "Feedback not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: recentItems } = await supabase
      .from("feedback_verzoeken")
      .select("id, titel, categorie, stemmen")
      .neq("id", feedback_id)
      .order("created_at", { ascending: false })
      .limit(20);

    const existingTitles = (recentItems || []).map((i: any) => `- ${i.titel} (categorie: ${i.categorie}, stemmen: ${i.stemmen})`).join("\n");

    // Include AI interview answers if present
    const interviewData = (feedback as any).ai_interview;
    let interviewText = "";
    if (Array.isArray(interviewData) && interviewData.length > 0) {
      interviewText = "\n\nAntwoorden op verduidelijkende vragen:\n" +
        interviewData.map((item: any) => `V: ${item.vraag}\nA: ${item.antwoord}`).join("\n\n");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `Analyseer deze ${feedback.type === "functieverzoek" ? "functieverzoek" : "feedback"} voor een SaaS-platform voor energiebedrijven.

Titel: ${feedback.titel}
Beschrijving: ${feedback.beschrijving}
Type: ${feedback.type}${interviewText}

Bestaande items in het systeem:
${existingTitles || "Geen"}

Bepaal:
1. categorie: een van "ui", "performance", "nieuwe_functie", "bug", "integratie", "workflow", "overig"
2. prioriteit: een van "laag", "normaal", "hoog", "kritiek"
3. samenvatting: korte analyse in 1-2 zinnen (Nederlands)
4. tags: array van 2-5 relevante tags (Nederlands)
5. duplicaat_hint: als dit lijkt op een bestaand item, geef de titel daarvan`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Je bent een productmanagement-AI die feedback categoriseert. Antwoord alleen met de gevraagde tool-call." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "categorize_feedback",
            description: "Categoriseer en analyseer feedback",
            parameters: {
              type: "object",
              properties: {
                categorie: { type: "string", enum: ["ui", "performance", "nieuwe_functie", "bug", "integratie", "workflow", "overig"] },
                prioriteit: { type: "string", enum: ["laag", "normaal", "hoog", "kritiek"] },
                samenvatting: { type: "string" },
                tags: { type: "array", items: { type: "string" } },
                duplicaat_hint: { type: "string" },
              },
              required: ["categorie", "prioriteit", "samenvatting", "tags"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "categorize_feedback" } },
      }),
    });

    if (!aiResp.ok) {
      const status = aiResp.status;
      if (status === 429) return new Response(JSON.stringify({ error: "AI rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResp.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const result = JSON.parse(toolCall.function.arguments);

    const { error: updateErr } = await supabase
      .from("feedback_verzoeken")
      .update({
        categorie: result.categorie,
        prioriteit: result.prioriteit,
        ai_samenvatting: result.samenvatting + (result.duplicaat_hint ? `\n\nMogelijk duplicaat van: "${result.duplicaat_hint}"` : ""),
        ai_tags: result.tags,
      })
      .eq("id", feedback_id);

    if (updateErr) throw updateErr;

    // Create notification for admins
    const { data: admins } = await supabase
      .from("users")
      .select("id")
      .in("rol", ["superadmin", "partner_admin"])
      .eq(feedback.partner_id ? "partner_id" : "id", feedback.partner_id || feedback.user_id);

    if (admins && admins.length > 0) {
      const notifications = admins.map((admin: any) => ({
        user_id: admin.id,
        titel: `Nieuwe ${feedback.type}: ${feedback.titel}`,
        bericht: result.samenvatting,
        type: "feedback",
        entity_type: "feedback_verzoeken",
        entity_id: feedback_id,
      }));

      await supabase.from("notificaties").insert(notifications);
    }

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-feedback-categorize error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
