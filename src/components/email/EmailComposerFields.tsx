import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import RichTextEditor from "@/components/shared/RichTextEditor";
import { Mail, X } from "lucide-react";
import { TEMPLATE_VARIABLES } from "@/lib/email/renderTemplate";

export interface EmailComposerValue {
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  bodyHtml: string;
}

interface Props {
  value: EmailComposerValue;
  onChange: (next: EmailComposerValue) => void;
  /** E-mail van de huidige gebruiker — voor "BCC mij"-snelknop. */
  currentUserEmail?: string;
  /** Hide variabelen-helper (bijv. wanneer body al gerenderd is). */
  hideVariableHelper?: boolean;
}

export default function EmailComposerFields({
  value,
  onChange,
  currentUserEmail,
  hideVariableHelper,
}: Props) {
  const [showCc, setShowCc] = useState(value.cc.length > 0);
  const [showBcc, setShowBcc] = useState(value.bcc.length > 0);

  const set = (patch: Partial<EmailComposerValue>) =>
    onChange({ ...value, ...patch });

  const addToBcc = (email: string) => {
    if (!email) return;
    const list = value.bcc
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (list.includes(email)) return;
    list.push(email);
    set({ bcc: list.join(", ") });
    setShowBcc(true);
  };

  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="email-to">Aan</Label>
          <div className="flex items-center gap-1 text-xs">
            {!showCc && (
              <button
                type="button"
                onClick={() => setShowCc(true)}
                className="text-muted-foreground hover:text-foreground px-1"
              >
                + CC
              </button>
            )}
            {!showBcc && (
              <button
                type="button"
                onClick={() => setShowBcc(true)}
                className="text-muted-foreground hover:text-foreground px-1"
              >
                + BCC
              </button>
            )}
          </div>
        </div>
        <Input
          id="email-to"
          type="email"
          value={value.to}
          onChange={(e) => set({ to: e.target.value })}
          className="mt-1"
          placeholder="ontvanger@voorbeeld.nl"
        />
      </div>

      {showCc && (
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="email-cc">CC</Label>
            <button
              type="button"
              onClick={() => {
                set({ cc: "" });
                setShowCc(false);
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
              aria-label="CC verwijderen"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <Input
            id="email-cc"
            value={value.cc}
            onChange={(e) => set({ cc: e.target.value })}
            className="mt-1"
            placeholder="cc1@voorbeeld.nl, cc2@voorbeeld.nl"
          />
        </div>
      )}

      {showBcc && (
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="email-bcc">BCC</Label>
            <div className="flex items-center gap-2">
              {currentUserEmail && (
                <button
                  type="button"
                  onClick={() => addToBcc(currentUserEmail)}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <Mail className="h-3 w-3" /> BCC mij
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  set({ bcc: "" });
                  setShowBcc(false);
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
                aria-label="BCC verwijderen"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <Input
            id="email-bcc"
            value={value.bcc}
            onChange={(e) => set({ bcc: e.target.value })}
            className="mt-1"
            placeholder="bcc1@voorbeeld.nl, bcc2@voorbeeld.nl"
          />
        </div>
      )}

      <div>
        <Label htmlFor="email-subject">Onderwerp</Label>
        <Input
          id="email-subject"
          value={value.subject}
          onChange={(e) => set({ subject: e.target.value })}
          className="mt-1"
        />
      </div>

      <div>
        <Label>Bericht</Label>
        <div className="mt-1 border rounded-md">
          <RichTextEditor
            value={value.bodyHtml}
            onChange={(html) => set({ bodyHtml: html })}
          />
        </div>
        {!hideVariableHelper && (
          <VariableHelper
            onInsert={(varName) =>
              set({ bodyHtml: value.bodyHtml + ` {{${varName}}}` })
            }
          />
        )}
      </div>
    </div>
  );
}

function VariableHelper({ onInsert }: { onInsert: (key: string) => void }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1">
      <span className="text-xs text-muted-foreground self-center mr-1">
        Variabelen:
      </span>
      {TEMPLATE_VARIABLES.map((v) => (
        <Button
          key={v.key}
          type="button"
          size="sm"
          variant="outline"
          className="h-6 text-xs px-2"
          onClick={() => onInsert(v.key)}
        >
          {v.label}
        </Button>
      ))}
    </div>
  );
}

/** Helper: parse comma-separated string naar trimmed array. */
export function parseAddressList(str: string): string[] {
  return str
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}
