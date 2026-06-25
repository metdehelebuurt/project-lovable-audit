import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MailWysiwyg } from "@/pages/affiliate/instellingen/Mailtemplates/MailWysiwyg";
import { MailIframePreview } from "@/pages/affiliate/instellingen/Mailtemplates/MailIframePreview";
import { renderWithContext, type PlanningContext } from "@/lib/email/planningContext";
import { alleBeschikbareTemplates } from "@/lib/email/actieDefault";
import type { AffiliateEmailTemplateRow } from "@/hooks/affiliate/useAffiliateEmailTemplates";

export interface MailTabState {
  versturen: boolean;
  templateKey: string;
  aan: string;
  onderwerp: string;
  bodyHtml: string;
}

interface Props {
  ontvangerLabel: string;
  state: MailTabState;
  onChange: (next: MailTabState) => void;
  customTemplates: Record<string, AffiliateEmailTemplateRow> | undefined;
  context: PlanningContext;
  afzender: {
    naam: string;
    email: string | null;
    telefoon: string | null;
    bedrijf?: string | null;
  };
}

export function MailTab({ ontvangerLabel, state, onChange, customTemplates, context, afzender }: Props) {
  const beschikbaar = useMemo(() => alleBeschikbareTemplates(customTemplates), [customTemplates]);

  const setVeld = <K extends keyof MailTabState>(k: K, v: MailTabState[K]) =>
    onChange({ ...state, [k]: v });

  const wisselTemplate = (key: string) => {
    const t = beschikbaar.find((x) => x.key === key);
    if (!t) return;
    onChange({ ...state, templateKey: key, onderwerp: t.onderwerp, bodyHtml: t.bodyHtml });
  };

  const renderedOnderwerp = renderWithContext(state.onderwerp, context);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(85vh-180px)] min-h-[480px]">
      <div className="flex flex-col gap-3 overflow-auto pr-1">
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={state.versturen}
            onCheckedChange={(v) => setVeld("versturen", !!v)}
          />
          <span className="text-sm font-medium">Mail versturen naar {ontvangerLabel.toLowerCase()}</span>
        </label>

        <div className="space-y-1">
          <Label className="text-xs">Template</Label>
          <Select value={state.templateKey} onValueChange={wisselTemplate} disabled={!state.versturen}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-72">
              {beschikbaar.map((t) => (
                <SelectItem key={t.key} value={t.key}>
                  <span className="flex items-center gap-2">
                    {t.label}
                    {t.aangepast && <Badge variant="outline" className="text-[10px] h-4">aangepast</Badge>}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Aan</Label>
          <Input
            type="email"
            value={state.aan}
            onChange={(e) => setVeld("aan", e.target.value)}
            disabled={!state.versturen}
            placeholder="naam@bedrijf.nl"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Onderwerp</Label>
          <Input
            value={state.onderwerp}
            onChange={(e) => setVeld("onderwerp", e.target.value)}
            disabled={!state.versturen}
          />
          {state.onderwerp !== renderedOnderwerp && (
            <p className="text-[11px] text-muted-foreground italic">→ {renderedOnderwerp}</p>
          )}
        </div>

        <div className="space-y-1 flex-1 min-h-[260px] flex flex-col">
          <Label className="text-xs">Bericht</Label>
          <div className={state.versturen ? "" : "opacity-50 pointer-events-none"}>
            <MailWysiwyg
              value={state.bodyHtml}
              onChange={(html) => setVeld("bodyHtml", html)}
            />
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-col min-h-0">
        <p className="text-xs text-muted-foreground mb-2">Voorbeeld (placeholders ingevuld)</p>
        <div className="flex-1 min-h-0">
          <MailIframePreview
            onderwerp={state.onderwerp}
            bodyHtml={state.bodyHtml}
            variabelen={context}
            afzender={{
              naam: afzender.naam,
              email: afzender.email,
              telefoon: afzender.telefoon,
              bedrijf: afzender.bedrijf ?? null,
            }}
            device="desktop"
          />
        </div>
      </div>
    </div>
  );
}