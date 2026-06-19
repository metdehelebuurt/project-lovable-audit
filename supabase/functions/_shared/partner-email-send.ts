// Gedeelde sender voor partner-email (offerte, factuur, orderbevestiging, test).
// Eén bron van waarheid: kiest provider (OAuth Google / OAuth MS / SMTP),
// verstuurt, logt in email_log + email_berichten en geeft duidelijke fouten.

import {
  AttachmentInfo, sendViaSMTP, sendViaGmailApi, sendViaMsGraphApi,
  refreshOAuthToken,
} from "./email-send.ts";
import { resolveEmailSender, DocumentType, EmailSenderError } from "./resolve-email-sender.ts";

export interface SendPartnerEmailParams {
  adminClient: any;
  partnerId: string;
  to: string;
  cc?: string[];
  bcc?: string[];
  subject: string;
  html: string;
  attachment?: AttachmentInfo | null;
  type: string;          // 'factuur' | 'offerte' | 'orderbevestiging' | 'test' | ...
  klantId?: string | null;
  offerteId?: string | null;
  leadId?: string | null;
  verzondenDoorId?: string | null;
  documentType?: DocumentType;  // Optioneel: stuurt routing-keuze. Default = mapping op `type`.
}

export interface SendPartnerEmailResult {
  provider: "smtp" | "gmail" | "msgraph";
  from: string;
}

/**
 * Foutklasse met HTTP-statushint zodat callers makkelijk een 400 vs 500 kunnen retourneren.
 */
export class PartnerEmailError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

export async function sendPartnerEmail(params: SendPartnerEmailParams): Promise<SendPartnerEmailResult> {
  const {
    adminClient, partnerId, to, cc = [], bcc = [], subject, html, attachment = null,
    type, klantId = null, offerteId = null, leadId = null, verzondenDoorId = null,
    documentType,
  } = params;

  // Map het bestaande `type` naar een DocumentType voor routing-config.
  const docType: DocumentType =
    documentType
    ?? (["offerte","orderbevestiging","factuur","herinnering","chat_klant","chat_lead","notificatie","algemeen"].includes(type)
        ? (type as DocumentType)
        : "algemeen");

  let resolved;
  try {
    resolved = await resolveEmailSender(adminClient, partnerId, docType, verzondenDoorId);
  } catch (err) {
    if (err instanceof EmailSenderError) {
      throw new PartnerEmailError(err.message, err.status);
    }
    throw err;
  }

  const partner = resolved.partner;
  const emailAccount = resolved.account;
  const useOAuth = resolved.method === "oauth";

  let result: SendPartnerEmailResult;

  try {
    if (useOAuth) {
      let accessToken = emailAccount.access_token;
      if (!accessToken || (emailAccount.token_expiry && new Date(emailAccount.token_expiry) <= new Date())) {
        accessToken = await refreshOAuthToken(adminClient, emailAccount);
      }
      if (emailAccount.provider === "google") {
        await sendViaGmailApi({
          accessToken, from: emailAccount.email_adres, to, cc, bcc, subject, html, attachment,
        });
        result = { provider: "gmail", from: emailAccount.email_adres };
      } else {
        await sendViaMsGraphApi({ accessToken, to, cc, bcc, subject, html, attachment });
        result = { provider: "msgraph", from: emailAccount.email_adres };
      }

      await adminClient.from("email_berichten").insert({
        email_account_id: emailAccount.id, partner_id: partnerId,
        richting: "uitgaand", van: emailAccount.email_adres, aan: to,
        onderwerp: subject, body_html: html, datum: new Date().toISOString(),
        is_gelezen: true,
        klant_id: klantId, lead_id: leadId, offerte_id: offerteId,
        user_id: verzondenDoorId,
        document_type: docType,
        via_account_id: emailAccount.id,
        bron_method: "oauth",
      });
    } else {
      await sendViaSMTP({
        host: partner.smtp_host!, port: partner.smtp_port || 587,
        user: partner.smtp_user!, pass: partner.smtp_pass_encrypted!,
        from: partner.afzender_email!, fromName: partner.afzender_naam || partner.naam,
        to, cc, bcc, subject, html, attachment,
      });
      result = { provider: "smtp", from: partner.afzender_email! };

      await adminClient.from("email_berichten").insert({
        partner_id: partnerId,
        richting: "uitgaand", van: partner.afzender_email!, aan: to,
        onderwerp: subject, body_html: html, datum: new Date().toISOString(),
        is_gelezen: true,
        klant_id: klantId, lead_id: leadId, offerte_id: offerteId,
        user_id: verzondenDoorId,
        document_type: docType,
        bron_method: "smtp",
      });
    }
  } catch (err: any) {
    await adminClient.from("email_log").insert({
      partner_id: partnerId, ontvanger_email: to, onderwerp: subject, html_body: html,
      status: "mislukt", type, verzonden_door_id: verzondenDoorId,
      error_message: err?.message || String(err),
    });
    throw new PartnerEmailError(err?.message || "E-mail verzenden mislukt", 500);
  }

  await adminClient.from("email_log").insert({
    partner_id: partnerId, ontvanger_email: to, onderwerp: subject, html_body: html,
    status: "verzonden", type, verzonden_door_id: verzondenDoorId,
  });

  return result;
}