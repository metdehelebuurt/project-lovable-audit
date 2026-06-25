import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

interface VerbeterPayload {
  bron: "affiliate" | "sales";
  template_key?: string | null;
  huidige_onderwerp: string;
  huidige_body: string;
  body_formaat?: "html" | "tekst";
  doel?: string;
  stijl?: string[];
  doelgroep?: string[];
  conversie?: string[];
  lengte?: "kort" | "gemiddeld" | "uitgebreid";
  vrije_instructie?: string;
  mode?: "volledig" | "alleen_onderwerp" | "ab_variant";
  feedback_hint?: string;
}

interface FollowupPayload {
  actie: "status" | "feedback";
  generatie_id: string;
  status?: "toegepast" | "verworpen" | "bewerkt";
  finale_onderwerp?: string;
  finale_body?: string;
  feedback?: string;
  sentiment?: "positief" | "negatief" | "neutraal";
}

async function authClient(req: Request) {
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  const supa = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supa.auth.getUser(token);
  if (error || !data.user) throw new Error("Niet geautoriseerd");
  return { supa, userId: data.user.id };
}

function buildSystemPrompt(opts: {
  profielSamenvatting: string;
  bodyFormaat: "html" | "tekst";
  voorbeelden: string;
}) {
  const formaatRegel =
    opts.bodyFormaat === "html"
      ? "Body MOET geldige inline HTML zijn (<p>, <strong>, <em>, <a>, <ul>, <ol>, <li>, <h2>, <hr>). Geen <html>, <head>, <body>, <style> tags. Behoud bestaande {{variabelen}}-syntax exact zoals ze nu zijn."
      : "Body is PLATTE TEKST zonder HTML-tags. Behoud bestaande {{variabelen}}-syntax exact.";

  return `Je bent een conversie-expert die Nederlandse zakelijke e-mailtemplates schrijft voor sales- en affiliate-professionals.
Je doel: hogere open-rate (onderwerp), hogere click/respons (body), professionele tone-of-voice.

REGELS:
- Schrijf ALTIJD in het Nederlands.
- Zakelijk, direct, kort. Geen uitroeptekens. Geen marketing-clichés ("revolutionair", "uniek", "must-have").
- Geen emoji's in onderwerp of body, tenzij gebruiker daar expliciet om vraagt.
- ${formaatRegel}
- Onderwerp ideaal 45-70 tekens, vermijd ALL CAPS en spamwoorden.
- Eindig body altijd met één concrete call-to-action.
- Behoud de bedoeling van de oorspronkelijke template; maak hem beter, schrijf hem niet vanaf nul tenzij hij echt rommelig is.

${opts.profielSamenvatting ? `PERSOONLIJK STIJLPROFIEL VAN DEZE GEBRUIKER (volg dit waar het kan):
${opts.profielSamenvatting}
` : ""}
${opts.voorbeelden ? `EERDER GEACCEPTEERDE VOORBEELDEN VAN DEZE GEBRUIKER:
${opts.voorbeelden}
` : ""}

OUTPUT: ALLEEN geldig JSON-object zonder code-fences, in dit exacte schema:
{"onderwerp": string, "body": string, "uitleg": string, "suggesties": string[]}
- "uitleg": 1-2 zinnen waarom je dit zo hebt geschreven.
- "suggesties": 0-3 korte vervolgtips (bv. "test A/B met cijfer in onderwerp").`;
}

function buildUserPrompt(p: VerbeterPayload) {
  const stuks: string[] = [];
  if (p.doel) stuks.push(`Doel van de mail: ${p.doel}`);
  if (p.stijl?.length) stuks.push(`Schrijfstijl: ${p.stijl.join(", ")}`);
  if (p.doelgroep?.length) stuks.push(`Doelgroep: ${p.doelgroep.join(", ")}`);
  if (p.conversie?.length) stuks.push(`Conversie-element(en): ${p.conversie.join(", ")}`);
  if (p.lengte) stuks.push(`Gewenste lengte: ${p.lengte}`);
  if (p.vrije_instructie) stuks.push(`Aanvullende instructie: ${p.vrije_instructie}`);
  if (p.feedback_hint) stuks.push(`Houd rekening met deze hint: ${p.feedback_hint}`);

  const modeInstr =
    p.mode === "alleen_onderwerp"
      ? "Verbeter ALLEEN het onderwerp. Geef voor body exact dezelfde tekst terug."
      : p.mode === "ab_variant"
        ? "Maak een duidelijk ANDERE variant (andere hoek/insteek) — niet alleen synoniemen."
        : "Verbeter onderwerp én body.";

  return `${modeInstr}

HUIDIG ONDERWERP:
${p.huidige_onderwerp || "(leeg)"}

HUIDIGE BODY:
${p.huidige_body || "(leeg)"}

INSTRUCTIES:
${stuks.length ? stuks.map((s) => `- ${s}`).join("\n") : "- Geen extra instructies; gebruik je oordeel."}`;
}

async function callGateway(systemPrompt: string, userPrompt: string) {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    }),
  });
  return res;
}

function parseAiJson(raw: string): { onderwerp: string; body: string; uitleg: string; suggesties: string[] } {
  let txt = raw.trim();
  if (txt.startsWith("```")) txt = txt.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
  const obj = JSON.parse(txt);
  return {
    onderwerp: String(obj.onderwerp ?? "").trim(),
    body: String(obj.body ?? "").trim(),
    uitleg: String(obj.uitleg ?? "").trim(),
    suggesties: Array.isArray(obj.suggesties) ? obj.suggesties.map((s: unknown) => String(s)).slice(0, 5) : [],
  };
}

async function consolideerStijlprofiel(supa: ReturnType<typeof createClient>, userId: string) {
  // Verzamel laatste 20 generaties + alle nog-niet-verwerkte feedback
  const [genResp, fbResp] = await Promise.all([
    supa
      .from("ai_template_generaties")
      .select("instellingen, output_onderwerp, output_body, finale_onderwerp, finale_body, status, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
    supa
      .from("ai_template_feedback")
      .select("id, feedback, sentiment, created_at")
      .eq("user_id", userId)
      .eq("verwerkt_in_profiel", false)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const generaties = genResp.data ?? [];
  const feedbacks = fbResp.data ?? [];
  if (generaties.length === 0 && feedbacks.length === 0) return;

  const acceptedEdits = generaties
    .filter((g: any) => g.status === "toegepast" || g.status === "bewerkt")
    .slice(0, 10)
    .map(
      (g: any, i: number) =>
        `[${i + 1}] AI: "${(g.output_onderwerp ?? "").slice(0, 80)}" | Finale: "${(g.finale_onderwerp ?? g.output_onderwerp ?? "").slice(0, 80)}"`,
    )
    .join("\n");

  const feedbackTxt = feedbacks
    .map((f: any) => `- (${f.sentiment ?? "neutraal"}) ${f.feedback}`)
    .join("\n");

  const prompt = `Je analyseert de schrijfstijl-voorkeuren van één specifieke gebruiker op basis van diens recente AI-mailtemplate gebruik.

RECENTE GENERATIES (AI-voorstel → finale tekst die user koos):
${acceptedEdits || "(geen geaccepteerde edits)"}

RECENTE FEEDBACK VAN USER:
${feedbackTxt || "(geen feedback)"}

Schrijf een COMPACTE samenvatting (max 200 woorden, in 5-10 bullets) van de schrijfvoorkeuren van deze user. Voorbeelden van bullets:
- "Schrijft persoonlijk, opent vaak met voornaam"
- "Vermijdt uitroeptekens"
- "Houdt van korte zinnen (<15 woorden)"
- "Sluit af met open vraag"
- "Gebruikt zelden emoji"

Geef ALLEEN de bullets terug, geen inleiding. Nederlandse taal.`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) return;
  const data = await res.json();
  const samenvatting = data.choices?.[0]?.message?.content?.trim() ?? "";
  if (!samenvatting) return;

  await supa.from("ai_template_schrijfstijl").upsert(
    {
      user_id: userId,
      profiel_samenvatting: samenvatting,
      generaties_sinds_consolidatie: 0,
      laatst_geconsolideerd_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (feedbacks.length > 0) {
    await supa
      .from("ai_template_feedback")
      .update({ verwerkt_in_profiel: true })
      .in("id", feedbacks.map((f: any) => f.id));
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY ontbreekt");
    const { supa, userId } = await authClient(req);
    const body = await req.json();

    // Follow-up: status update of feedback registreren
    if (body?.actie === "status" || body?.actie === "feedback") {
      const f = body as FollowupPayload;
      if (f.actie === "status") {
        const upd: Record<string, unknown> = { status: f.status ?? "voorgesteld" };
        if (typeof f.finale_onderwerp === "string") upd.finale_onderwerp = f.finale_onderwerp;
        if (typeof f.finale_body === "string") upd.finale_body = f.finale_body;
        await supa.from("ai_template_generaties").update(upd).eq("id", f.generatie_id).eq("user_id", userId);
      } else if (f.actie === "feedback" && f.feedback) {
        await supa.from("ai_template_feedback").insert({
          user_id: userId,
          generatie_id: f.generatie_id,
          feedback: f.feedback.slice(0, 500),
          sentiment: f.sentiment ?? "neutraal",
        });
      }
      // Check of consolidatie nodig is (elke 5 nieuwe generaties of 5 feedbacks)
      const { data: prof } = await supa
        .from("ai_template_schrijfstijl")
        .select("generaties_sinds_consolidatie")
        .eq("user_id", userId)
        .maybeSingle();
      const teller = (prof?.generaties_sinds_consolidatie ?? 0) + 1;
      await supa.from("ai_template_schrijfstijl").upsert(
        { user_id: userId, generaties_sinds_consolidatie: teller },
        { onConflict: "user_id" },
      );
      if (teller >= 5) {
        await consolideerStijlprofiel(supa, userId);
      }
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Hoofd-actie: verbeter template
    const payload = body as VerbeterPayload;
    if (!payload?.huidige_body && !payload?.huidige_onderwerp) {
      return new Response(JSON.stringify({ error: "Onderwerp of body is verplicht" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Stijlprofiel + voorbeelden ophalen
    const [profResp, voorbeeldenResp] = await Promise.all([
      supa
        .from("ai_template_schrijfstijl")
        .select("profiel_samenvatting, voorkeuren")
        .eq("user_id", userId)
        .maybeSingle(),
      supa
        .from("ai_template_generaties")
        .select("output_onderwerp, finale_onderwerp, finale_body, status")
        .eq("user_id", userId)
        .in("status", ["toegepast", "bewerkt"])
        .order("created_at", { ascending: false })
        .limit(3),
    ]);

    const profielSamenvatting = profResp.data?.profiel_samenvatting ?? "";
    const voorbeelden = (voorbeeldenResp.data ?? [])
      .map(
        (v: any, i: number) =>
          `[Voorbeeld ${i + 1}]\nOnderwerp: ${v.finale_onderwerp ?? v.output_onderwerp ?? ""}\nBody (start): ${(v.finale_body ?? "").slice(0, 240)}`,
      )
      .join("\n\n");

    const systemPrompt = buildSystemPrompt({
      profielSamenvatting,
      bodyFormaat: payload.body_formaat ?? "html",
      voorbeelden,
    });
    const userPrompt = buildUserPrompt(payload);

    const res = await callGateway(systemPrompt, userPrompt);
    if (!res.ok) {
      if (res.status === 429) {
        return new Response(JSON.stringify({ error: "Te veel verzoeken. Probeer het over een minuut opnieuw." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (res.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI-tegoed op. Voeg credits toe via Settings → Workspace → Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await res.text();
      console.error("Gateway error", res.status, t);
      return new Response(JSON.stringify({ error: "AI niet beschikbaar" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? "{}";
    let parsed;
    try {
      parsed = parseAiJson(raw);
    } catch (e) {
      console.error("Parse error", e, raw);
      return new Response(JSON.stringify({ error: "AI-antwoord onleesbaar, probeer opnieuw" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log generatie
    const { data: ins, error: insErr } = await supa
      .from("ai_template_generaties")
      .insert({
        user_id: userId,
        bron: payload.bron,
        template_key: payload.template_key ?? null,
        mode: payload.mode ?? "volledig",
        input_onderwerp: payload.huidige_onderwerp,
        input_body: payload.huidige_body,
        instellingen: {
          doel: payload.doel,
          stijl: payload.stijl,
          doelgroep: payload.doelgroep,
          conversie: payload.conversie,
          lengte: payload.lengte,
          vrije_instructie: payload.vrije_instructie,
          body_formaat: payload.body_formaat ?? "html",
        },
        output_onderwerp: parsed.onderwerp,
        output_body: parsed.body,
        output_uitleg: parsed.uitleg,
        status: "voorgesteld",
      })
      .select("id")
      .single();

    if (insErr) console.error("insert generatie error", insErr);

    return new Response(
      JSON.stringify({
        generatie_id: ins?.id ?? null,
        onderwerp: parsed.onderwerp,
        body: parsed.body,
        uitleg: parsed.uitleg,
        suggesties: parsed.suggesties,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("ai-template-verbeteren error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Onbekende fout" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});