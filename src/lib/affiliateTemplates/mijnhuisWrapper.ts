/**
 * Client-side port van supabase/functions/_shared/mijnhuis-template.ts.
 * Wordt gebruikt door de live preview-iframe in de e-mailtemplate-editor
 * zodat WYSIWYG exact overeenkomt met wat de klant ontvangt.
 * Bij aanpassingen aan de echte wrapper: pas deze óók aan en vice versa.
 */

export interface WrapperOptions {
  senderName: string;
  senderRole?: string | null;
  senderEmail?: string | null;
  senderTelefoon?: string | null;
  bedrijf?: string | null;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildSignature(opts: WrapperOptions): string {
  const naam = escapeHtml(opts.senderName.trim() || "Team mijnhuis.nu");
  const regels: string[] = [];
  if (opts.senderRole) regels.push(escapeHtml(opts.senderRole));
  if (opts.bedrijf) regels.push(escapeHtml(opts.bedrijf));
  if (opts.senderEmail) {
    regels.push(
      `<a href="mailto:${escapeHtml(opts.senderEmail)}" style="color:#6d28d9;text-decoration:none;">${escapeHtml(opts.senderEmail)}</a>`,
    );
  }
  if (opts.senderTelefoon) regels.push(escapeHtml(opts.senderTelefoon));

  const sub = regels
    .map((r) => `<p style="margin:2px 0;color:#64748b;font-size:13px;">${r}</p>`)
    .join("");

  return `
    <div style="margin-top:28px;padding-top:18px;border-top:1px solid #e2e8f0;">
      <p style="margin:0 0 4px;color:#0f172a;">Met vriendelijke groet,</p>
      <p style="margin:0 0 6px;color:#0f172a;font-weight:600;">${naam}</p>
      ${sub}
    </div>`;
}

export function wrapInMijnhuisTemplateClient(htmlBody: string, opts: WrapperOptions): string {
  return `<!doctype html>
<html lang="nl"><head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>mijnhuis.nu</title>
  <style>
    body { margin:0; padding:0; background:#f4f4f7; }
    .mh-body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#0f172a; }
    .mh-content p { margin:0 0 12px; line-height:1.6; }
    .mh-content ul, .mh-content ol { padding-left:20px; margin:0 0 12px; }
    .mh-content li { margin:4px 0; }
    .mh-content a { color:#6d28d9; }
    .mh-content h1, .mh-content h2, .mh-content h3 { color:#0f172a; margin:18px 0 8px; }
    .mh-btn { display:inline-block; background:#6d28d9; color:#ffffff !important; text-decoration:none;
              padding:11px 22px; border-radius:8px; font-weight:600; font-size:14px; }
    .mh-divider { border:0; border-top:1px solid #e2e8f0; margin:18px 0; }
    .mh-callout { background:#f5f3ff; border-left:3px solid #6d28d9; padding:12px 16px; border-radius:6px; margin:14px 0; font-size:14px; }
  </style>
</head>
<body class="mh-body">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f7;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,0.06);">
        <tr><td style="background:linear-gradient(135deg,#6d28d9 0%,#8b5cf6 100%);padding:24px 28px;">
          <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.01em;">mijnhuis.nu</p>
          <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.85);">Platform voor verduurzamingsprofessionals</p>
        </td></tr>
        <tr><td class="mh-content" style="padding:28px;font-size:15px;line-height:1.6;color:#0f172a;">
          ${htmlBody}
          ${buildSignature(opts)}
        </td></tr>
        <tr><td style="background:#f8fafc;padding:18px 28px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;text-align:center;">
          <p style="margin:0;">Verzonden via <a href="https://mijnhuis.nu" style="color:#6d28d9;text-decoration:none;font-weight:600;">mijnhuis.nu</a> ·
          <a href="#" style="color:#64748b;text-decoration:underline;">Afmelden</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}