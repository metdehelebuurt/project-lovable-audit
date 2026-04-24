import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PROJECT_REF = "xmguipmetciwvzeyxugu";

type LogType = "edge" | "auth" | "postgres" | "function";

interface RequestBody {
  type: LogType;
  search?: string;
  function_name?: string;
  limit?: number;
  hours?: number;
}

function buildSql(body: RequestBody): string {
  const limit = Math.min(Math.max(body.limit ?? 100, 1), 500);
  const hours = Math.min(Math.max(body.hours ?? 24, 1), 168);
  const search = (body.search ?? "").replace(/'/g, "''").trim();
  const fnName = (body.function_name ?? "").replace(/'/g, "''").trim();

  if (body.type === "edge") {
    const where: string[] = [
      `function_edge_logs.timestamp > timestamp_sub(current_timestamp(), interval ${hours} hour)`,
    ];
    if (search) where.push(`(event_message like '%${search}%' or response.status_code >= 400)`);
    return `select id, function_edge_logs.timestamp, event_message,
              response.status_code, request.method, m.function_id, m.execution_time_ms, m.deployment_id, m.version
            from function_edge_logs
              cross join unnest(metadata) as m
              cross join unnest(m.response) as response
              cross join unnest(m.request) as request
            where ${where.join(" and ")}
            order by timestamp desc
            limit ${limit}`;
  }

  if (body.type === "auth") {
    const where: string[] = [
      `auth_logs.timestamp > timestamp_sub(current_timestamp(), interval ${hours} hour)`,
    ];
    if (search) where.push(`(event_message like '%${search}%' or metadata.error like '%${search}%')`);
    return `select id, auth_logs.timestamp, event_message,
              metadata.level, metadata.status, metadata.path, metadata.msg as msg, metadata.error
            from auth_logs
              cross join unnest(metadata) as metadata
            where ${where.join(" and ")}
            order by timestamp desc
            limit ${limit}`;
  }

  if (body.type === "postgres") {
    const where: string[] = [
      `postgres_logs.timestamp > timestamp_sub(current_timestamp(), interval ${hours} hour)`,
      `parsed.error_severity in ('ERROR','FATAL','PANIC','WARNING')`,
    ];
    if (search) where.push(`event_message like '%${search}%'`);
    return `select identifier, postgres_logs.timestamp, id, event_message, parsed.error_severity
            from postgres_logs
              cross join unnest(metadata) as m
              cross join unnest(m.parsed) as parsed
            where ${where.join(" and ")}
            order by timestamp desc
            limit ${limit}`;
  }

  // type === "function" → logs van een specifieke edge function
  const where: string[] = [
    `function_logs.timestamp > timestamp_sub(current_timestamp(), interval ${hours} hour)`,
  ];
  if (fnName) where.push(`m.function_id like '%${fnName}%' or event_message like '%${fnName}%'`);
  if (search) where.push(`event_message like '%${search}%'`);
  return `select id, function_logs.timestamp, event_message, m.level, m.function_id
          from function_logs
            cross join unnest(metadata) as m
          where ${where.join(" and ")}
          order by timestamp desc
          limit ${limit}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Niet ingelogd" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: userData } = await admin.auth.getUser(auth.replace("Bearer ", ""));
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Sessie ongeldig" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: prof } = await admin
      .from("users")
      .select("rol")
      .eq("id", userData.user.id)
      .maybeSingle();

    if ((prof as { rol?: string } | null)?.rol !== "superadmin") {
      return new Response(JSON.stringify({ error: "Alleen superadmin" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as RequestBody;
    if (!["edge", "auth", "postgres", "function"].includes(body?.type)) {
      return new Response(JSON.stringify({ error: "type ongeldig" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sbToken = Deno.env.get("SUPABASE_ACCESS_TOKEN");
    if (!sbToken) {
      return new Response(
        JSON.stringify({
          error:
            "SUPABASE_ACCESS_TOKEN ontbreekt. Configureer deze als secret om Management API logs op te halen.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const sql = buildSql(body);
    const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/analytics/endpoints/logs.all?sql=${encodeURIComponent(sql)}`;

    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${sbToken}` },
    });
    const text = await r.text();
    if (!r.ok) {
      return new Response(JSON.stringify({ error: text || "Management API fout", status: r.status }), {
        status: r.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(text, {
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