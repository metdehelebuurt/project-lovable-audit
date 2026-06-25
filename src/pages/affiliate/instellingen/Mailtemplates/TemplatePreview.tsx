import { renderTemplate, type AffiliateTemplate } from "@/lib/affiliateTemplates/registry";

interface Props {
  template: AffiliateTemplate;
  onderwerp: string;
  bodyHtml: string;
}

export function TemplatePreview({ template, onderwerp, bodyHtml }: Props) {
  const renderedSubject = renderTemplate(onderwerp, template.previewData);
  const renderedBody = renderTemplate(bodyHtml, template.previewData);

  return (
    <div className="border rounded-lg overflow-hidden bg-muted/30">
      <div className="bg-gradient-to-br from-[#6d28d9] to-[#8b5cf6] px-5 py-4">
        <p className="text-white font-bold text-lg leading-tight">mijnhuis.nu</p>
        <p className="text-white/80 text-[11px] mt-0.5">Platform voor verduurzamingsprofessionals</p>
      </div>
      <div className="bg-white px-5 py-4 border-b">
        <p className="text-xs text-muted-foreground mb-0.5">Onderwerp</p>
        <p className="font-semibold text-sm">{renderedSubject}</p>
      </div>
      <div
        className="bg-white px-5 py-4 prose prose-sm max-w-none text-sm"
        dangerouslySetInnerHTML={{ __html: renderedBody }}
      />
      <div className="bg-slate-50 px-5 py-3 text-center text-xs text-muted-foreground border-t">
        Verzonden via <span className="text-primary font-semibold">mijnhuis.nu</span>
      </div>
    </div>
  );
}
