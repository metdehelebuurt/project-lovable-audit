// Verzendt e-mail via het PERSOONLIJKE e-mailaccount van de ingelogde gebruiker.
// Geen fallback naar partner-SMTP: als de gebruiker geen actief OAuth-account heeft,
// faalt deze functie hard. Dit voorkomt dat communicatie ooit vanuit een
// generiek partner-postvak gaat ipv de gebruiker zelf.

import {
  AttachmentInfo, sendViaGmailApi, sendViaMsGraphApi, refreshOAuthToken,
} from "./email-send.ts";

export class UserMailboxError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export interface SendUserEmailParams {
  adminClient: any;
  userId: string;
  partnerId: string;
  to: string;
  subject: string;
  html: string;
  attachment?: AttachmentInfo | null;
  type: string;
  klantId?: string | null;
  leadId?: string | null;
  offerteId?: string | null;
  inkooporderId?: string | null;
}

export interface SendUserEmailResult {
  provider: "gmail" | "msgraph";
  from: string;
  emailBerichtId: string | null;
}

/**
 * Stuurt een e-mail via het eigen mailaccount van de gebruiker.
 * Verplicht: de gebruiker moet een actief OAuth-mailaccount hebben.
 */
export async function sendUserEmail(params: SendUserEmailParams): Promise<SendUserEmailResult> {
  const {
    adminClient, userId, partnerId, to, subject, html, attachment = null,
    type, klantId = null, leadId = null, offerteId = null, inkooporderId = null,
  } = params;

  const { data: account, error } = await adminClient
    .from("email_accounts")
    .select("*")
    .eq("user_id", userId)
    .eq("actief", true)
    .maybeSingle();

  if (error) {
    throw new UserMailboxError("Kon e-mailaccount niet ophalen", 500);
  }
  if (!account) {
    throw new UserMailboxError(
      "Je hebt nog geen e-mailaccount gekoppeld. Ga naar Profiel → E-mail om Gmail of Outlook te koppelen, daarna kun je deze e-mail vanuit je eigen postvak versturen.",
      400,
    );
  }

  let accessToken = account.access_token;
  if (!accessToken || (account.token_expiry && new Date(account.token_expiry) <= new Date())) {
    accessToken = await refreshOAuthToken(adminClient, account);
  }

  let provider: "gmail" | "msgraph";
  try {
    if (account.provider === "google") {
      await sendViaGmailApi({
        accessToken, from: account.email_adres, to, subject, html, attachment,
      });
      provider = "gmail";
    } else if (account.provider === "microsoft") {
      await sendViaMsGraphApi({ accessToken, to, subject, html, attachment });
      provider = "msgraph";
    } else {
      throw new UserMailboxError(`Onbekende provider: ${account.provider}`, 400);
    }
  } catch (err: any) {
    await adminClient.from("email_log").insert({
      partner_id: partnerId, ontvanger_email: to, onderwerp: subject, html_body: html,
      status: "mislukt", type, verzonden_door_id: userId,
      error_message: err?.message || String(err),
    });
    throw new UserMailboxError(err?.message || "E-mail verzenden mislukt", 500);
  }

  // Log in email_berichten (zodat het in de inbox-thread van de gebruiker verschijnt)
  const { data: berichtRow } = await adminClient.from("email_berichten").insert({
    email_account_id: account.id,
    partner_id: partnerId,
    richting: "uitgaand",
    van: account.email_adres,
    aan: to,
    onderwerp: subject,
    body_html: html,
    datum: new Date().toISOString(),
    is_gelezen: true,
    klant_id: klantId, lead_id: leadId, offerte_id: offerteId,
  }).select("id").maybeSingle();

  await adminClient.from("email_log").insert({
    partner_id: partnerId, ontvanger_email: to, onderwerp: subject, html_body: html,
    status: "verzonden", type, verzonden_door_id: userId,
    ...(inkooporderId ? {} : {}),
  });

  return {
    provider,
    from: account.email_adres,
    emailBerichtId: berichtRow?.id ?? null,
  };
}