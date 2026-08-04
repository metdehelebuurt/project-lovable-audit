// Structured audit + failsafe guard voor PDF-bijlagen bij offerte-mails.
// Wordt gebruikt door send-offerte-email om te garanderen dat elke verstuurde
// offerte-mail een geldige PDF bevat, en dat elke poging (ok of fail) traceerbaar
// is voor superadmin/partner_admin (alerts lopen via DB-trigger).

import { verifyPdfBytes, type AttachmentInfo } from "./email-send.ts";

export type AccountType =
  | "gmail_oauth"
  | "ms_graph_oauth"
  | "smtp_app_password"
  | "partner_smtp"
  | "unknown";

export type AuditStatus =
  | "ok"
  | "missing_path"
  | "empty"
  | "invalid_pdf"
  | "storage_error"
  | "send_error"
  | "sent_without_attachment";

export interface AuditContext {
  offerteId: string | null;
  partnerId: string | null;
  userId: string | null;
  accountId: string | null;
  accountType: AccountType;
  attachmentPath: string | null;
  requestId: string;
}

export interface GuardResult {
  ok: boolean;
  status: AuditStatus;
  reason?: string;
  attachment?: AttachmentInfo;
}

export function newRequestId(): string {
  return crypto.randomUUID();
}

function log(ctx: AuditContext, level: "info" | "warn" | "error", msg: string, extra?: Record<string, unknown>) {
  const line = {
    ts: new Date().toISOString(),
    level,
    scope: "offerte_email_attachment",
    request_id: ctx.requestId,
    offerte_id: ctx.offerteId,
    partner_id: ctx.partnerId,
    account_id: ctx.accountId,
    account_type: ctx.accountType,
    attachment_path: ctx.attachmentPath,
    message: msg,
    ...(extra || {}),
  };
  const out = JSON.stringify(line);
  if (level === "error") console.error(out);
  else if (level === "warn") console.warn(out);
  else console.log(out);
}

export async function recordAudit(
  adminClient: any,
  ctx: AuditContext,
  fields: {
    status: AuditStatus;
    bytesSize?: number | null;
    pdfValid?: boolean;
    provider?: string | null;
    sentMessageId?: string | null;
    error?: string | null;
  },
): Promise<void> {
  try {
    await adminClient.from("offerte_email_attachment_audit").insert({
      offerte_id: ctx.offerteId,
      partner_id: ctx.partnerId,
      user_id: ctx.userId,
      account_id: ctx.accountId,
      account_type: ctx.accountType,
      attachment_path: ctx.attachmentPath,
      bytes_size: fields.bytesSize ?? null,
      pdf_valid: fields.pdfValid ?? false,
      status: fields.status,
      provider: fields.provider ?? null,
      sent_message_id: fields.sentMessageId ?? null,
      error: fields.error ?? null,
      request_id: ctx.requestId,
    });
  } catch (err) {
    // Audit-schrijffout mag verzending niet blokkeren, maar wel loud loggen.
    log(ctx, "error", "audit insert failed", { err: (err as Error).message });
  }
  log(ctx, fields.status === "ok" ? "info" : "warn", `audit:${fields.status}`, {
    bytes_size: fields.bytesSize ?? null,
    provider: fields.provider ?? null,
    error: fields.error ?? null,
  });
}

/**
 * Centrale guard: haalt de PDF op, valideert magic bytes + minimum grootte,
 * verifieert dat het pad bij de offerte hoort, en logt de uitkomst in de
 * audit-tabel. Bij falen kan de caller direct 422 teruggeven.
 */
export async function guardAttachment(
  adminClient: any,
  ctx: AuditContext,
  attachmentFilename: string,
): Promise<GuardResult> {
  if (!ctx.attachmentPath) {
    await recordAudit(adminClient, ctx, {
      status: "missing_path",
      error: "attachment_path ontbreekt in request body",
    });
    return { ok: false, status: "missing_path", reason: "attachment_path ontbreekt" };
  }

  // Path-prefix check: voorkomt dat een verkeerde/oude PDF meegestuurd wordt.
  // Verwacht formaat: 'offertes/<offerte_id>/...'
  if (ctx.offerteId && !ctx.attachmentPath.includes(ctx.offerteId)) {
    await recordAudit(adminClient, ctx, {
      status: "invalid_pdf",
      error: `attachment_path bevat offerte_id niet: ${ctx.attachmentPath}`,
    });
    return { ok: false, status: "invalid_pdf", reason: "attachment_path hoort niet bij deze offerte" };
  }

  let bytes: Uint8Array;
  let contentType = "application/pdf";
  try {
    const { data, error } = await adminClient.storage
      .from("email-bijlagen")
      .download(ctx.attachmentPath);
    if (error || !data) {
      await recordAudit(adminClient, ctx, {
        status: "storage_error",
        error: error?.message || "download returned empty",
      });
      return { ok: false, status: "storage_error", reason: error?.message || "download leeg" };
    }
    bytes = new Uint8Array(await data.arrayBuffer());
    contentType = (data as any).type || contentType;
  } catch (err) {
    await recordAudit(adminClient, ctx, {
      status: "storage_error",
      error: (err as Error).message,
    });
    return { ok: false, status: "storage_error", reason: (err as Error).message };
  }

  if (bytes.length === 0) {
    await recordAudit(adminClient, ctx, { status: "empty", bytesSize: 0 });
    return { ok: false, status: "empty", reason: "PDF is 0 bytes" };
  }

  // Bovengrens: boven ~18 MB loopt base64-encoding + provider-upload tegen de
  // CPU-limiet van de edge-runtime aan. Liever een duidelijke melding dan een
  // harde "CPU Time exceeded" waar de gebruiker niets mee kan.
  const MAX_ATTACHMENT_BYTES = 18 * 1024 * 1024;
  if (bytes.length > MAX_ATTACHMENT_BYTES) {
    const mb = (bytes.length / (1024 * 1024)).toFixed(1);
    await recordAudit(adminClient, ctx, {
      status: "invalid_pdf",
      bytesSize: bytes.length,
      error: `PDF te groot: ${mb} MB`,
    });
    return {
      ok: false,
      status: "invalid_pdf",
      reason: `De PDF is ${mb} MB en daarmee te groot om te mailen (max 18 MB). Verklein de offerte-PDF, bijvoorbeeld door minder datasheets of afbeeldingen mee te sturen.`,
    };
  }

  const check = verifyPdfBytes(bytes);
  if (!check.ok) {
    await recordAudit(adminClient, ctx, {
      status: "invalid_pdf",
      bytesSize: bytes.length,
      error: check.reason,
    });
    return { ok: false, status: "invalid_pdf", reason: check.reason };
  }

  return {
    ok: true,
    status: "ok",
    attachment: { filename: attachmentFilename, bytes, contentType },
  };
}

/** Hard assertion — vlak vóór de netwerkoproep naar de mailprovider. */
export function assertAttachmentReady(att: AttachmentInfo | null | undefined): asserts att is AttachmentInfo {
  if (!att || !att.bytes || att.bytes.length === 0) {
    throw new Error("ATTACHMENT_MISSING_AT_SEND: guard passed maar attachment is leeg vlak voor send");
  }
  const check = verifyPdfBytes(att.bytes);
  if (!check.ok) {
    throw new Error(`ATTACHMENT_INVALID_AT_SEND: ${check.reason}`);
  }
}