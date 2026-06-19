// Diagnose helper for de e-mail-onboardingchecklist.
// Bundelt alle controles in één call zodat de UI per stap status + reden + fix-suggestie
// kan tonen. Input: { partner_id }. Output: { steps: [...], accounts: [...] }.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Status = "ok" | "warning" | "fail" | "pending";
interface Step {
  id: string;
  titel: string;
  status: Status;
  reden: string;
  suggestie?: string;
  details?: string;
  fixActie?: { type: "scroll"; target: string } | { type: "send_test" } | { type: "sync_now" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { partner_id } = await req.json();
    if (!partner_id) {
      return json({ error: "partner_id ontbreekt" }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const googleConfigured = !!Deno.env.get("GOOGLE_EMAIL_CLIENT_ID")
      && !!Deno.env.get("GOOGLE_EMAIL_CLIENT_SECRET");
    const microsoftConfigured = !!Deno.env.get("MICROSOFT_EMAIL_CLIENT_ID")
      && !!Deno.env.get("MICROSOFT_EMAIL_CLIENT_SECRET");

    const [accountsRes, routingRes, sentRes, inkomendRes, partnerRes] = await Promise.all([
      admin.from("email_accounts")
        .select("id, email_adres, provider, user_id, is_default_voor_partner, scopes, actief, last_sync_at, last_sync_error, last_sync_error_at, needs_reauth")
        .eq("partner_id", partner_id).eq("actief", true),
      admin.from("email_routing_config")
        .select("document_type, bron, email_account_id").eq("partner_id", partner_id),
      admin.from("email_berichten").select("id, datum")
        .eq("partner_id", partner_id).eq("richting", "uitgaand")
        .gte("datum", new Date(Date.now() - 30 * 86400_000).toISOString())
        .order("datum", { ascending: false }).limit(1),
      admin.from("email_berichten").select("id, datum")
        .eq("partner_id", partner_id).eq("richting", "inkomend")
        .gte("datum", new Date(Date.now() - 30 * 86400_000).toISOString())
        .order("datum", { ascending: false }).limit(1),
      admin.from("partners").select("smtp_host, afzender_email, afzender_naam, email_provider")
        .eq("id", partner_id).maybeSingle(),
    ]);

    const accounts = accountsRes.data || [];
    const routing = routingRes.data || [];
    const partner = partnerRes.data;
    const gAccounts = accounts.filter((a) => a.provider === "google");
    const reauthAccounts = accounts.filter((a) => a.needs_reauth);
    const defaultAccount = accounts.find((a) => a.is_default_voor_partner);
    const personalAccounts = accounts.filter((a) => a.user_id);

    const steps: Step[] = [];

    // 1. OAuth credentials in backend
    steps.push(buildStep1(googleConfigured, microsoftConfigured));

    // 2. Minstens één gekoppeld account
    steps.push(buildStep2(accounts, gAccounts, reauthAccounts, partner));

    // 3. Algemeen afzenderadres
    steps.push(buildStep3(defaultAccount, accounts, partner));

    // 4. Persoonlijke mailboxen
    steps.push(buildStep4(personalAccounts.length));

    // 5. Routing per documenttype
    steps.push(buildStep5(routing));

    // 6. Verzenden testen
    steps.push(buildStep6(sentRes.data?.[0]));

    // 7. Inkomende sync / logging
    steps.push(buildStep7(inkomendRes.data?.[0], personalAccounts.length, reauthAccounts));

    return json({
      steps,
      accounts: accounts.map((a) => ({
        id: a.id,
        email_adres: a.email_adres,
        provider: a.provider,
        is_default_voor_partner: a.is_default_voor_partner,
        user_id: a.user_id,
        last_sync_at: a.last_sync_at,
        last_sync_error: a.last_sync_error,
        last_sync_error_at: a.last_sync_error_at,
        needs_reauth: a.needs_reauth,
        scopes: a.scopes,
      })),
    });
  } catch (err) {
    console.error("email-config-diagnose error:", err);
    return json({ error: (err as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}

function buildStep1(g: boolean, m: boolean): Step {
  if (g || m) {
    return {
      id: "oauth_backend", titel: "1. OAuth-credentials backend",
      status: g && m ? "ok" : "warning",
      reden: g && m
        ? "Zowel Gmail- als Outlook-koppeling staat klaar."
        : g ? "Gmail OK. Outlook niet geconfigureerd (optioneel)."
            : "Outlook OK. Gmail niet geconfigureerd.",
      suggestie: g && m ? undefined
        : "Vraag een beheerder om de ontbrekende OAuth client-id + secret in te stellen.",
    };
  }
  return {
    id: "oauth_backend", titel: "1. OAuth-credentials backend",
    status: "fail",
    reden: "Geen enkele OAuth-provider is in de backend geconfigureerd.",
    suggestie: "Stel GOOGLE_EMAIL_CLIENT_ID + GOOGLE_EMAIL_CLIENT_SECRET (en/of Microsoft) in als backend-secrets. Zonder dit kan niemand Gmail/Outlook koppelen.",
  };
}

function buildStep2(accounts: any[], gAccounts: any[], reauth: any[], partner: any): Step {
  if (accounts.length === 0) {
    return {
      id: "koppeling", titel: "2. Mailbox koppelen",
      status: partner?.smtp_host ? "warning" : "fail",
      reden: partner?.smtp_host
        ? "Nog geen OAuth-account gekoppeld. SMTP staat wel ingesteld als fallback."
        : "Nog geen mailbox gekoppeld en geen SMTP als fallback.",
      suggestie: "Klik op 'Gmail koppelen' in de kaart 'E-mail configuratie' en sta álle gevraagde permissies toe (lezen, verzenden, wijzigen).",
      fixActie: { type: "scroll", target: "email-configuratie" },
    };
  }
  if (reauth.length > 0) {
    return {
      id: "koppeling", titel: "2. Mailbox koppelen",
      status: "fail",
      reden: `${reauth.length} account(s) hebben opnieuw koppelen nodig.`,
      suggestie: "Ontkoppel het account en koppel het opnieuw. Refresh-token is door de provider ingetrokken (vaak na wachtwoord-reset of 6 maanden inactiviteit).",
      details: reauth.map((r) => `${r.email_adres}: ${r.last_sync_error || "needs_reauth"}`).join("\n"),
      fixActie: { type: "scroll", target: "email-accounts" },
    };
  }
  return {
    id: "koppeling", titel: "2. Mailbox koppelen",
    status: "ok",
    reden: `${accounts.length} actieve mailbox(en) gekoppeld${gAccounts.length ? ` waarvan ${gAccounts.length} Gmail` : ""}.`,
  };
}

function buildStep3(def: any, accounts: any[], partner: any): Step {
  if (def) {
    return {
      id: "default", titel: "3. Algemeen afzenderadres",
      status: "ok",
      reden: `Standaard partner-adres: ${def.email_adres}`,
    };
  }
  if (partner?.smtp_host && partner?.afzender_email) {
    return {
      id: "default", titel: "3. Algemeen afzenderadres",
      status: "warning",
      reden: `Geen OAuth-standaard. SMTP-fallback actief: ${partner.afzender_email}`,
      suggestie: "Markeer een gekoppelde Gmail/Outlook als 'Partner-standaard' voor betere deliverability (geen SMTP-wachtwoorden meer nodig).",
      fixActie: { type: "scroll", target: "email-accounts" },
    };
  }
  return {
    id: "default", titel: "3. Algemeen afzenderadres",
    status: "fail",
    reden: "Geen standaard afzender ingesteld.",
    suggestie: accounts.length > 0
      ? "Markeer een van je gekoppelde mailboxen als 'Partner-standaard' in 'Gekoppelde mailboxen'."
      : "Koppel eerst een mailbox in stap 2.",
    fixActie: { type: "scroll", target: "email-accounts" },
  };
}

function buildStep4(personalCount: number): Step {
  if (personalCount > 0) {
    return {
      id: "persoonlijk", titel: "4. Persoonlijke mailboxen",
      status: "ok",
      reden: `${personalCount} medewerker(s) hebben een persoonlijke mailbox gekoppeld.`,
    };
  }
  return {
    id: "persoonlijk", titel: "4. Persoonlijke mailboxen",
    status: "warning",
    reden: "Geen enkele medewerker heeft persoonlijk Gmail/Outlook gekoppeld.",
    suggestie: "Chat-mails en follow-ups kunnen nu alleen via het partner-postvak. Laat medewerkers via Profiel → E-mail hun eigen mailbox koppelen.",
  };
}

function buildStep5(routing: any[]): Step {
  const verwachte = ["offerte", "orderbevestiging", "factuur", "chat_klant", "chat_lead"];
  const aanwezig = new Set(routing.map((r) => r.document_type));
  const ontbrekend = verwachte.filter((d) => !aanwezig.has(d));

  if (routing.length === 0) {
    return {
      id: "routing", titel: "5. Routing per documenttype",
      status: "warning",
      reden: "Nog geen routingregels ingesteld. Het systeem valt terug op de partner-standaard.",
      suggestie: "Configureer per documenttype welke mailbox gebruikt wordt — meestal: documenten via partner-standaard, chat via persoonlijke mailbox.",
      fixActie: { type: "scroll", target: "email-routing" },
    };
  }
  if (ontbrekend.length > 0) {
    return {
      id: "routing", titel: "5. Routing per documenttype",
      status: "warning",
      reden: `${ontbrekend.length} documenttype(s) zonder expliciete regel.`,
      details: `Ontbreekt: ${ontbrekend.join(", ")}`,
      suggestie: "Voeg een regel toe voor elk ontbrekend type, of accepteer de partner-standaard als fallback.",
      fixActie: { type: "scroll", target: "email-routing" },
    };
  }
  return {
    id: "routing", titel: "5. Routing per documenttype",
    status: "ok",
    reden: `${routing.length} regels actief — alle hoofdtypes geconfigureerd.`,
  };
}

function buildStep6(last: any): Step {
  if (last) {
    return {
      id: "verzenden", titel: "6. Verzenden testen",
      status: "ok",
      reden: `Laatste uitgaande mail: ${new Date(last.datum).toLocaleString("nl-NL")}`,
      fixActie: { type: "send_test" },
    };
  }
  return {
    id: "verzenden", titel: "6. Verzenden testen",
    status: "warning",
    reden: "Nog geen uitgaande mail verstuurd in de laatste 30 dagen.",
    suggestie: "Klik op 'Stuur testmail naar mezelf' om de configuratie nu te valideren.",
    fixActie: { type: "send_test" },
  };
}

function buildStep7(last: any, personalCount: number, reauth: any[]): Step {
  if (last) {
    return {
      id: "ontvangen", titel: "7. Inkomende mail & logging",
      status: "ok",
      reden: `Laatste inkomende mail gelogd: ${new Date(last.datum).toLocaleString("nl-NL")}`,
    };
  }
  if (reauth.length > 0) {
    return {
      id: "ontvangen", titel: "7. Inkomende mail & logging",
      status: "fail",
      reden: "Inkomende sync werkt niet — een mailbox heeft opnieuw koppelen nodig.",
      suggestie: "Koppel het account in stap 2 opnieuw, klik daarna op 'Nu synchroniseren'.",
      fixActie: { type: "sync_now" },
    };
  }
  if (personalCount === 0) {
    return {
      id: "ontvangen", titel: "7. Inkomende mail & logging",
      status: "warning",
      reden: "Geen persoonlijke mailboxen om te synchroniseren.",
      suggestie: "Pas zodra een medewerker zijn Gmail koppelt worden binnenkomende mails per klant gelogd.",
    };
  }
  return {
    id: "ontvangen", titel: "7. Inkomende mail & logging",
    status: "warning",
    reden: "Nog geen inkomende mail gelogd. Stuur een testantwoord en klik op 'Nu synchroniseren'.",
    fixActie: { type: "sync_now" },
  };
}