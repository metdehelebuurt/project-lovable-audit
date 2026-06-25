import { useMemo } from "react";
import { wrapInMijnhuisTemplateClient } from "@/lib/affiliateTemplates/mijnhuisWrapper";
import { renderTemplate } from "@/lib/affiliateTemplates/registry";

interface Props {
  onderwerp: string;
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

export function MailIframePreview({ onderwerp, bodyHtml, variabelen, afzender, device }: Props) {
  const html = useMemo(() => {
    const renderedBody = renderTemplate(bodyHtml, variabelen);
    return wrapInMijnhuisTemplateClient(renderedBody, {
      senderName: afzender.naam,
      senderEmail: afzender.email,
      senderTelefoon: afzender.telefoon,
      bedrijf: afzender.bedrijf,
      senderRole: afzender.rol,
    });
  }, [bodyHtml, variabelen, afzender]);

  const renderedSubject = useMemo(
    () => renderTemplate(onderwerp, variabelen),
    [onderwerp, variabelen],
  );

  const width = device === "mobile" ? 390 : 720;

  return (
    <div className="flex flex-col h-full bg-slate-100 rounded-lg border overflow-hidden">
      <div className="bg-white border-b px-4 py-3 text-xs">
        <div className="flex items-baseline gap-2">
          <span className="text-muted-foreground">Aan:</span>
          <span className="font-medium truncate">{variabelen["lead.voornaam"] || "klant"}@voorbeeld.nl</span>
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-muted-foreground">Van:</span>
          <span className="font-medium truncate">
            {afzender.naam} &lt;{afzender.email ?? "noreply@mijnhuis.nu"}&gt;
          </span>
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-muted-foreground">Onderwerp:</span>
          <span className="font-semibold truncate">{renderedSubject}</span>
        </div>
      </div>
      <div className="flex-1 overflow-auto flex justify-center py-4">
        <iframe
          title="E-mail preview"
          srcDoc={html}
          sandbox=""
          className="border bg-white rounded-md shadow-sm transition-all"
          style={{ width, maxWidth: "100%", height: "100%", minHeight: 600 }}
        />
      </div>
    </div>
  );
}