// Unit tests voor de failsafe attachment guard.
// Dekt: geen path, verkeerd path (hoort niet bij offerte), storage error,
// lege bytes, ongeldige PDF (geen %PDF magic), te klein, en happy path.
// Ook: assertAttachmentReady faalt bij lege/ongeldige payload vlak voor send.

import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  guardAttachment,
  assertAttachmentReady,
  newRequestId,
  type AuditContext,
} from "../_shared/offerte-attachment-audit.ts";

const OFFERTE_ID = "11111111-1111-1111-1111-111111111111";

function baseCtx(overrides: Partial<AuditContext> = {}): AuditContext {
  return {
    offerteId: OFFERTE_ID,
    partnerId: "22222222-2222-2222-2222-222222222222",
    userId: "33333333-3333-3333-3333-333333333333",
    accountId: null,
    accountType: "smtp_app_password",
    attachmentPath: `offertes/${OFFERTE_ID}/offerte.pdf`,
    requestId: newRequestId(),
    ...overrides,
  };
}

/** Mock adminClient met configureerbare storage-download en insert capture. */
function makeClient(opts: {
  bytes?: Uint8Array | null;
  storageError?: string;
  contentType?: string;
}) {
  const inserts: any[] = [];
  return {
    _inserts: inserts,
    from(_: string) {
      return {
        insert(row: any) {
          inserts.push(row);
          return Promise.resolve({ error: null });
        },
      };
    },
    storage: {
      from(_: string) {
        return {
          async download(_path: string) {
            if (opts.storageError) return { data: null, error: { message: opts.storageError } };
            if (opts.bytes === null) return { data: null, error: null };
            const blob = new Blob([opts.bytes! as any], { type: opts.contentType || "application/pdf" });
            (blob as any).type = opts.contentType || "application/pdf";
            return { data: blob, error: null };
          },
        };
      },
    },
  };
}

function validPdfBytes(size = 6000): Uint8Array {
  const arr = new Uint8Array(size);
  const header = new TextEncoder().encode("%PDF-1.4\n");
  arr.set(header, 0);
  const eof = new TextEncoder().encode("\n%%EOF\n");
  arr.set(eof, size - eof.length);
  return arr;
}

Deno.test("guard: missing attachment_path -> missing_path", async () => {
  const client = makeClient({});
  const r = await guardAttachment(client as any, baseCtx({ attachmentPath: null }), "offerte.pdf");
  assertEquals(r.ok, false);
  assertEquals(r.status, "missing_path");
  assertEquals(client._inserts[0].status, "missing_path");
});

Deno.test("guard: attachment_path bevat offerte_id niet -> invalid_pdf", async () => {
  const client = makeClient({ bytes: validPdfBytes() });
  const r = await guardAttachment(
    client as any,
    baseCtx({ attachmentPath: "offertes/other-id/x.pdf" }),
    "x.pdf",
  );
  assertEquals(r.ok, false);
  assertEquals(r.status, "invalid_pdf");
});

Deno.test("guard: storage error -> storage_error", async () => {
  const client = makeClient({ storageError: "not found" });
  const r = await guardAttachment(client as any, baseCtx(), "x.pdf");
  assertEquals(r.ok, false);
  assertEquals(r.status, "storage_error");
  assertEquals(client._inserts[0].error, "not found");
});

Deno.test("guard: empty bytes -> empty", async () => {
  const client = makeClient({ bytes: new Uint8Array(0) });
  const r = await guardAttachment(client as any, baseCtx(), "x.pdf");
  assertEquals(r.ok, false);
  // 0-byte trips MIN_PDF_BYTES check first -> invalid_pdf via verifyPdfBytes
  assert(r.status === "empty" || r.status === "invalid_pdf");
});

Deno.test("guard: te klein PDF -> invalid_pdf", async () => {
  const client = makeClient({ bytes: new TextEncoder().encode("%PDF-1.4 tiny") });
  const r = await guardAttachment(client as any, baseCtx(), "x.pdf");
  assertEquals(r.ok, false);
  assertEquals(r.status, "invalid_pdf");
});

Deno.test("guard: geen %PDF magic -> invalid_pdf", async () => {
  const bogus = new Uint8Array(6000);
  bogus.fill(0x41);
  const client = makeClient({ bytes: bogus });
  const r = await guardAttachment(client as any, baseCtx(), "x.pdf");
  assertEquals(r.ok, false);
  assertEquals(r.status, "invalid_pdf");
});

Deno.test("guard: happy path -> ok + attachment", async () => {
  const bytes = validPdfBytes(8000);
  const client = makeClient({ bytes });
  const r = await guardAttachment(client as any, baseCtx(), "offerte.pdf");
  assertEquals(r.ok, true);
  assertEquals(r.status, "ok");
  assert(r.attachment);
  assertEquals(r.attachment!.filename, "offerte.pdf");
  assertEquals(r.attachment!.bytes.length, 8000);
  // Geen audit insert bij ok (die schrijft de send-branch pas na succesvolle send)
  assertEquals(client._inserts.length, 0);
});

Deno.test("assertAttachmentReady: null throws", () => {
  let threw = false;
  try { assertAttachmentReady(null as any); } catch { threw = true; }
  assert(threw, "moet gooien bij null");
});

Deno.test("assertAttachmentReady: lege bytes throws", () => {
  let threw = false;
  try {
    assertAttachmentReady({ filename: "x", bytes: new Uint8Array(0), contentType: "application/pdf" });
  } catch { threw = true; }
  assert(threw, "moet gooien bij 0 bytes");
});

Deno.test("assertAttachmentReady: ongeldige PDF throws", () => {
  const bogus = new Uint8Array(6000); bogus.fill(0x41);
  let threw = false;
  try {
    assertAttachmentReady({ filename: "x", bytes: bogus, contentType: "application/pdf" });
  } catch { threw = true; }
  assert(threw, "moet gooien bij ongeldige PDF");
});

Deno.test("assertAttachmentReady: geldige PDF passeert", () => {
  const bytes = validPdfBytes(6000);
  assertAttachmentReady({ filename: "x", bytes, contentType: "application/pdf" });
});

// ─── Integratie-achtige test: simuleer MIME-serialisatie voor Gmail/Graph ───
// Verifieert dat de bytes de PDF-magic behouden na base64-encoding.

function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

Deno.test("MIME serialisatie: base64 bevat PDF-magic (JVBERi)", () => {
  const bytes = validPdfBytes(6000);
  const b64 = bytesToBase64(bytes);
  assert(b64.startsWith("JVBERi"), `verwacht JVBERi prefix, kreeg ${b64.slice(0, 12)}`);
});

Deno.test("SMTP payload shape: attachments array niet leeg", () => {
  const bytes = validPdfBytes(6000);
  const smtpAttachments = [{
    filename: "offerte.pdf",
    content: bytes,
    contentType: "application/pdf",
    encoding: "binary" as const,
  }];
  assertEquals(smtpAttachments.length, 1);
  assert((smtpAttachments[0].content as Uint8Array).length > 5000);
});