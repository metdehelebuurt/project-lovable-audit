/**
 * Wraps an HTML body in the mijnhuis.nu house-style email template.
 * Inline CSS only — email clients strip <style> tags and class-based styling.
 */
export function wrapInMijnhuisTemplate(htmlBody: string, senderName?: string): string {
  const safeName = (senderName ?? "").trim();
  const signature = safeName
    ? `<p style="margin:24px 0 4px;color:#0f172a;font-weight:600;">Met vriendelijke groet,</p>
       <p style="margin:0;color:#0f172a;">${escapeHtml(safeName)}</p>`
    : `<p style="margin:24px 0 4px;color:#0f172a;font-weight:600;">Met vriendelijke groet,</p>
       <p style="margin:0;color:#0f172a;">Team mijnhuis.nu</p>`;

  return `<!doctype html>
<html lang="nl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>mijnhuis.nu</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f7;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,0.06);">
            <tr>
              <td style="background:linear-gradient(135deg,#6d28d9 0%,#8b5cf6 100%);padding:24px 28px;">
                <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.01em;">mijnhuis.nu</p>
                <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.85);">Platform voor verduurzamingsprofessionals</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;font-size:15px;line-height:1.6;color:#0f172a;">
                ${htmlBody}
                ${signature}
              </td>
            </tr>
            <tr>
              <td style="background-color:#f8fafc;padding:18px 28px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;text-align:center;">
                <p style="margin:0;">Verzonden via <a href="https://mijnhuis.nu" style="color:#6d28d9;text-decoration:none;font-weight:600;">mijnhuis.nu</a></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}