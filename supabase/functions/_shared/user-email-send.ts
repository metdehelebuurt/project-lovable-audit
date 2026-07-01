// Verzendt e-mail via het PERSOONLIJKE e-mailaccount van de ingelogde gebruiker.
// Geen fallback naar partner-SMTP: als de gebruiker geen actief OAuth-account heeft,
// faalt deze functie hard. Dit voorkomt dat communicatie ooit vanuit een
// generiek partner-postvak gaat ipv de gebruiker zelf.

import {
  AttachmentInfo, sendViaGmailApi, sendViaMsGraphApi, refreshOAuthToken,
} from "./email-send.ts";
import { smtpSend } from "./smtp-send.ts";
import { decryptAppPassword } from "./email-crypto.ts";

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
  provider: "gmail" | "msgraph" | "smtp";
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

  const { data: accounts, error } = await adminClient
    .from("email_accounts")
    .select("*")
    .eq("user_id", userId)
    .eq("actief", true)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    throw new UserMailboxError("Kon e-mailaccount niet ophalen", 500);
  }
  const account = accounts?.[0] ?? null;
  if (!account) {
    throw new UserMailboxError(
      "Je hebt nog geen e-mailaccount gekoppeld. Ga naar Profiel → E-mail om Gmail of Outlook te koppelen, daarna kun je deze e-mail vanuit je eigen postvak versturen.",
      400,
    );
  }

  const hasOAuth = !!account.refresh_token;
  const hasAppPassword = !!account.app_password_encrypted;

  let provider: "gmail" | "msgraph" | "smtp";
  try {
    if (hasOAuth && account.provider === "google") {
      let accessToken = account.access_token;
      if (!accessToken || (account.token_expiry && new Date(account.token_expiry) <= new Date())) {
        accessToken = await refreshOAuthToken(adminClient, account);
      }
      await sendViaGmailApi({
        accessToken, from: account.email_adres, to, subject, html, attachment,
      });
      provider = "gmail";
    } else if (hasOAuth && account.provider === "microsoft") {
      let accessToken = account.access_token;
      if (!accessToken || (account.token_expiry && new Date(account.token_expiry) <= new Date())) {
        accessToken = await refreshOAuthToken(adminClient, account);
      }
      await sendViaMsGraphApi({ accessToken, to, subject, html, attachment });
      provider = "msgraph";
    } else if (hasAppPassword) {
      const plain = await decryptAppPassword(account.app_password_encrypted);
      await smtpSend(
        {
          email_adres: account.email_adres,
          smtp_host: account.smtp_host,
          smtp_port: account.smtp_port,
          app_password_plain: plain,
        },
        {
          from: account.email_adres,
          to, subject, html,
          attachments: attachment
            ? [{
                filename: attachment.filename,
                content: attachment.bytes,
                contentType: attachment.contentType,
                encoding: "binary",
              }]
            : undefined,
        },
      );
      provider = "smtp";
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