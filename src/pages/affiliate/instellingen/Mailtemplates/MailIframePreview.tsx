import { useMemo } from "react";
import { renderTemplate } from "@/lib/affiliateTemplates/registry";

interface Props {
  onderwerp: string;
  preheader?: string;
  bodyHtml: string;
  variabelen: Record<string, string>;
  afzender: {
    naam: string;
    email: string | null;
    telefoon: string | null;
    bedrijf?: string | null;
    rol?: string | null;
  };
  device: "desktop" | "mobile";
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Pixel-perfect preview, gerendered direct in de DOM (geen iframe — die had
 * sizing- en sandbox-issues waardoor de body niet zichtbaar was).
 * Stijl matcht 1-op-1 met supabase/functions/_shared/mijnhuis-template.ts
 * en src/lib/affiliateTemplates/mijnhuisWrapper.ts.
 */
export function MailIframePreview({
  onderwerp, preheader, bodyHtml, variabelen, afzender, device,
}: Props) {
  const renderedBody = useMemo(
    () => renderTemplate(bodyHtml || "", variabelen),
    [bodyHtml, variabelen],
  );
  const renderedSubject = useMemo(
    () => renderTemplate(onderwerp || "", variabelen),
    [onderwerp, variabelen],
  );
  const renderedPreheader = useMemo(
    () => renderTemplate(preheader || "", variabelen),
    [preheader, variabelen],
  );

  const naam = (afzender.naam || "Team mijnhuis.nu").trim();
  const sigRegels: string[] = [];
  if (afzender.rol) sigRegels.push(esc(afzender.rol));
  if (afzender.bedrijf) sigRegels.push(esc(afzender.bedrijf));
  if (afzender.email)
    sigRegels.push(
      `<a href="mailto:${esc(afzender.email)}" style="color:#6d28d9;text-decoration:none;">${esc(afzender.email)}</a>`,
    );
  if (afzender.telefoon)
    sigRegels.push(
      `<a href="tel:${esc(afzender.telefoon.replace(/\s/g, ""))}" style="color:#6d28d9;text-decoration:none;">${esc(afzender.telefoon)}</a>`,
    );

  const width = device === "mobile" ? 390 : 720;

  return (
    <div className="flex flex-col h-full bg-slate-100 rounded-lg border overflow-hidden">
      {/* Inbox-header */}
      <div className="bg-white border-b px-4 py-3 text-xs space-y-1">
        <div className="flex items-baseline gap-2">
          <span className="text-muted-foreground w-16 shrink-0">Aan:</span>
          <span className="font-medium truncate">{variabelen["lead.voornaam"] || "klant"}@voorbeeld.nl</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-muted-foreground w-16 shrink-0">Van:</span>
          <span className="font-medium truncate">
            {naam} &lt;{afzender.email ?? "noreply@mijnhuis.nu"}&gt;
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-muted-foreground w-16 shrink-0">Onderwerp:</span>
          <span className="font-semibold truncate">{renderedSubject || "(geen onderwerp)"}</span>
        </div>
        {renderedPreheader && (
          <div className="flex items-baseline gap-2">
            <span className="text-muted-foreground w-16 shrink-0">Preview:</span>
            <span className="text-muted-foreground truncate italic">{renderedPreheader}</span>
          </div>
        )}
      </div>

      {/* Email-canvas */}
      <div className="flex-1 overflow-auto bg-[#f4f4f7] py-6 px-3 flex justify-center">
        <div
          className="mh-mail-preview bg-white rounded-xl shadow-sm overflow-hidden transition-all w-full"
          style={{ maxWidth: width, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif", color: "#0f172a" }}
        >
          {/* Header */}
          <div style={{ background: "linear-gradient(135deg,#6d28d9 0%,#8b5cf6 100%)", padding: "24px 28px" }}>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em" }}>mijnhuis.nu</p>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.85)" }}>
              Platform voor verduurzamingsprofessionals
            </p>
          </div>
          {/* Content */}
          <div style={{ padding: "28px", fontSize: 15, lineHeight: 1.6, color: "#0f172a" }}>
            <div
              className="mh-content"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: renderedBody || '<p style="color:#94a3b8;font-style:italic;">(nog geen inhoud)</p>' }}
            />
            {/* Signature */}
            <div style={{ marginTop: 28, paddingTop: 18, borderTop: "1px solid #e2e8f0" }}>
              <p style={{ margin: "0 0 4px", color: "#0f172a" }}>Met vriendelijke groet,</p>
              <p style={{ margin: "0 0 6px", color: "#0f172a", fontWeight: 600 }}>{naam}</p>
              {sigRegels.map((r, i) => (
                <p
                  key={i}
                  style={{ margin: "2px 0", color: "#64748b", fontSize: 13 }}
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{ __html: r }}
                />
              ))}
            </div>
          </div>
          {/* Footer */}
          <div style={{ background: "#f8fafc", padding: "18px 28px", borderTop: "1px solid #e2e8f0", fontSize: 12, color: "#64748b", textAlign: "center" }}>
            Verzonden via{" "}
            <a href="https://mijnhuis.nu" style={{ color: "#6d28d9", textDecoration: "none", fontWeight: 600 }}>mijnhuis.nu</a>
            {" · "}
            <a href="#" style={{ color: "#64748b", textDecoration: "underline" }}>Afmelden</a>
          </div>
        </div>
      </div>
    </div>
  );
}