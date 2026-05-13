import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Haal e-mailadressen op van personen binnen een partner die notificaties moeten ontvangen.
 * Standaard: alle partner_admin + backoffice gebruikers van de partner.
 * Optioneel: specifieke extra user-ids meesturen (bijv. de adviseur van een offerte).
 */
export async function getPartnerNotifyRecipients(
  supabase: SupabaseClient,
  partnerId: string,
  extraUserIds: (string | null | undefined)[] = [],
): Promise<string[]> {
  const ids = new Set<string>();

  const { data: admins } = await supabase
    .from("users")
    .select("id, email, status")
    .eq("partner_id", partnerId)
    .in("rol", ["partner_admin", "backoffice"]);

  const emails = new Set<string>();
  for (const u of admins ?? []) {
    if (u.email && (u.status ?? "actief") === "actief") emails.add(u.email.toLowerCase());
    ids.add(u.id);
  }

  const extras = extraUserIds.filter((x): x is string => !!x && !ids.has(x));
  if (extras.length > 0) {
    const { data: extraUsers } = await supabase
      .from("users")
      .select("email, status")
      .in("id", extras);
    for (const u of extraUsers ?? []) {
      if (u.email && (u.status ?? "actief") === "actief") emails.add(u.email.toLowerCase());
    }
  }

  return Array.from(emails);
}

/**
 * Roep send-transactional-email aan voor 1 ontvanger. Faalt nooit blokkerend —
 * fouten worden alleen gelogd zodat de aanroepende flow niet stuk gaat.
 */
export async function sendTransactional(
  templateName: string,
  recipientEmail: string,
  idempotencyKey: string,
  templateData: Record<string, unknown> = {},
): Promise<void> {
  try {
    const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-transactional-email`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({ templateName, recipientEmail, idempotencyKey, templateData }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn(`send-transactional-email faalde (${res.status}) voor ${templateName} → ${recipientEmail}: ${text}`);
    }
  } catch (e) {
    console.warn(`send-transactional-email exception voor ${templateName}:`, e);
  }
}

/** Verstuur dezelfde template naar meerdere ontvangers met idempotency per ontvanger. */
export async function sendTransactionalBatch(
  templateName: string,
  recipients: string[],
  idempotencyKeyBase: string,
  templateData: Record<string, unknown> = {},
): Promise<void> {
  await Promise.all(
    recipients.map((email) =>
      sendTransactional(templateName, email, `${idempotencyKeyBase}-${email}`, templateData),
    ),
  );
}

/** Convenience: maak een service-role supabase client. */
export function makeServiceClient() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}