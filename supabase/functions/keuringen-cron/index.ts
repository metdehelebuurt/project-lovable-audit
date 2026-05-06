// Dagelijkse cron voor keuringen:
//  1. Zet 'gepland' → 'achterstallig' wanneer geplande_datum verstreken is.
//  2. Verstuurt een herinneringsmail naar de klant X dagen vóór de geplande
//     datum (X = keuring_intervallen.herinner_dagen_vooraf, default 30).
//
// Wordt aangeroepen door pg_cron (zie SQL die de gebruiker via insert tool draait).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { sendPartnerEmail } from "../_shared/partner-email-send.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface KeuringRow {
  id: string;
  partner_id: string;
  type: string;
  keuringnummer: string | null;
  geplande_datum: string;
  klant_id: string | null;
  herinnering_verstuurd_op: string | null;
}

interface IntervalRow {
  partner_id: string;
  type: string;
  herinner_dagen_vooraf: number;
}

const TYPE_LABEL: Record<string, string> = {
  zonnepanelen: "zonnepanelen",
  thuisbatterij: "thuisbatterij",
  combi: "zonnepanelen en thuisbatterij",
};

function buildHerinneringHtml(args: {
  klantNaam: string;
  partnerNaam: string;
  type: string;
  geplandeDatum: string;
  keuringnummer: string;
}): { subject: string; html: string } {
  const dt = new Date(args.geplandeDatum).toLocaleDateString("nl-NL", {
    day: "numeric", month: "long", year: "numeric",
  });
  const subject = `Periodieke keuring ${TYPE_LABEL[args.type] ?? args.type} gepland op ${dt}`;
  const html = `
    <p>Beste ${args.klantNaam || "klant"},</p>
    <p>Op <strong>${dt}</strong> staat een periodieke keuring van uw
    ${TYPE_LABEL[args.type] ?? args.type}-installatie gepland (referentie ${args.keuringnummer}).</p>
    <p>Wij voeren deze inspectie uit conform de geldende normen (NEN 1010, NEN 3140
    en Scope 12) om uw installatie veilig en optimaal te laten functioneren.</p>
    <p>U hoeft zelf niets te doen. Onze monteur neemt vooraf contact op om een
    tijdvak te bevestigen.</p>
    <p>Met vriendelijke groet,<br/>${args.partnerNaam}</p>
  `;
  return { subject, html };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);

  // 1. Achterstallig markeren
  const { data: achterstallig, error: errAcht } = await admin
    .from("keuringen")
    .update({ status: "achterstallig" })
    .eq("status", "gepland")
    .lt("geplande_datum", todayIso)
    .select("id");

  if (errAcht) {
    console.error("Achterstallig update fout:", errAcht);
  }
  const achterstalligCount = achterstallig?.length ?? 0;

  // 2. Herinneringen versturen
  const { data: intervallen, error: errInt } = await admin
    .from("keuring_intervallen")
    .select("partner_id, type, herinner_dagen_vooraf");
  if (errInt) {
    console.error("Intervallen ophalen fout:", errInt);
    return jsonResponse({ ok: false, error: errInt.message }, 500);
  }

  const intervalMap = new Map<string, number>();
  for (const i of (intervallen ?? []) as IntervalRow[]) {
    intervalMap.set(`${i.partner_id}|${i.type}`, i.herinner_dagen_vooraf ?? 30);
  }

  const maxDagen = Math.max(30, ...Array.from(intervalMap.values()));
  const grensDatum = new Date(today);
  grensDatum.setDate(grensDatum.getDate() + maxDagen);
  const grensIso = grensDatum.toISOString().slice(0, 10);

  const { data: kandidaten, error: errKand } = await admin
    .from("keuringen")
    .select("id, partner_id, type, keuringnummer, geplande_datum, klant_id, herinnering_verstuurd_op")
    .eq("status", "gepland")
    .is("herinnering_verstuurd_op", null)
    .gte("geplande_datum", todayIso)
    .lte("geplande_datum", grensIso);

  if (errKand) {
    console.error("Herinnering kandidaten fout:", errKand);
    return jsonResponse({ ok: false, error: errKand.message }, 500);
  }

  let verzonden = 0;
  let overgeslagen = 0;

  for (const k of (kandidaten ?? []) as KeuringRow[]) {
    const dagenVooraf = intervalMap.get(`${k.partner_id}|${k.type}`) ?? 30;
    const dagenTotKeuring = Math.ceil(
      (new Date(k.geplande_datum).getTime() - today.getTime()) / 86_400_000,
    );
    if (dagenTotKeuring > dagenVooraf) {
      overgeslagen++;
      continue;
    }
    if (!k.klant_id) {
      overgeslagen++;
      continue;
    }

    const { data: klant } = await admin
      .from("klanten")
      .select("voornaam, achternaam, bedrijfsnaam, email")
      .eq("id", k.klant_id).maybeSingle();
    if (!klant?.email) {
      overgeslagen++;
      continue;
    }

    const { data: partner } = await admin
      .from("partners")
      .select("naam")
      .eq("id", k.partner_id).maybeSingle();

    const klantNaam =
      klant.bedrijfsnaam ||
      `${klant.voornaam ?? ""} ${klant.achternaam ?? ""}`.trim() ||
      "klant";

    const { subject, html } = buildHerinneringHtml({
      klantNaam,
      partnerNaam: partner?.naam ?? "Uw installateur",
      type: k.type,
      geplandeDatum: k.geplande_datum,
      keuringnummer: k.keuringnummer ?? k.id.slice(0, 8),
    });

    try {
      await sendPartnerEmail({
        adminClient: admin,
        partnerId: k.partner_id,
        to: klant.email,
        subject,
        html,
        type: "keuring_herinnering",
        klantId: k.klant_id,
      });
      await admin
        .from("keuringen")
        .update({ herinnering_verstuurd_op: new Date().toISOString() })
        .eq("id", k.id);
      verzonden++;
    } catch (e) {
      console.error("Herinnering verzenden fout voor keuring", k.id, e);
    }
  }

  return jsonResponse({
    ok: true,
    achterstallig_gemarkeerd: achterstalligCount,
    herinneringen_verzonden: verzonden,
    overgeslagen,
  });
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}