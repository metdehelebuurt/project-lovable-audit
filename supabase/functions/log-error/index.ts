import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface LogErrorBody {
  bron?: string;
  niveau?: string;
  bericht: string;
  stacktrace?: string;
  context?: Record<string, unknown>;
  edge_function_naam?: string;
  route?: string;
  status_code?: number;
  request_id?: string;
}

const ALLOWED_BRON = ["frontend", "edge_function", "database", "client_unhandled", "client_promise"];
const ALLOWED_NIVEAU = ["error", "warning", "info", "fatal"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as LogErrorBody;
    if (!body?.bericht || typeof body.bericht !== "string") {
      return new Response(JSON.stringify({ error: "bericht is verplicht" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const bron = ALLOWED_BRON.includes(body.bron ?? "") ? body.bron! : "frontend";
    const niveau = ALLOWED_NIVEAU.includes(body.niveau ?? "") ? body.niveau! : "error";

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Probeer user op te halen op basis van Bearer token
    let userId: string | null = null;
    let userEmail: string | null = null;
    let userRol: string | null = null;
    let partnerId: string | null = null;

    const auth = req.headers.get("authorization");
    if (auth?.startsWith("Bearer ")) {
      const { data } = await admin.auth.getUser(auth.replace("Bearer ", ""));
      if (data?.user) {
        userId = data.user.id;
        userEmail = data.user.email ?? null;
        const { data: prof } = await admin
          .from("users")
          .select("rol, partner_id")
          .eq("id", userId)
          .maybeSingle();
        if (prof) {
          userRol = (prof.rol as string) ?? null;
          partnerId = (prof.partner_id as string) ?? null;
        }
      }
    }

    const ua = req.headers.get("user-agent") ?? null;
    const ipHeader = req.headers.get("x-forwarded-for") ?? "";
    const ip = ipHeader.split(",")[0]?.trim() || null;

    // Limiteer veldgrootte om misbruik te voorkomen
    const trim = (s: string | undefined | null, max: number) =>
      typeof s === "string" ? s.slice(0, max) : null;

    const { error } = await admin.from("system_error_logs").insert({
      bron,
      niveau,
      bericht: trim(body.bericht, 4000)!,
      stacktrace: trim(body.stacktrace, 16000),
      context: body.context ?? {},
      edge_function_naam: trim(body.edge_function_naam, 200),
      route: trim(body.route, 500),
      status_code: body.status_code ?? null,
      request_id: trim(body.request_id, 200),
      user_id: userId,
      user_email: userEmail,
      user_rol: userRol,
      partner_id: partnerId,
      user_agent: trim(ua, 500),
      ip,
    });

    if (error) {
      console.error("log-error insert fout:", error.message);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Onbekende fout";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});