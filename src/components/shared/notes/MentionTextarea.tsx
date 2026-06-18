import { useRef, useState, useEffect, useMemo, type ChangeEvent, type KeyboardEvent } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useColleagues, type Colleague } from "@/hooks/useColleagues";
import { useAuth } from "@/contexts/AuthContext";
import { detectMentionTrigger, insertMentionAtCaret } from "./mentionSyntax";
import { cn } from "@/lib/utils";
import { AtSign } from "lucide-react";

interface MentionTextareaProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  disabled?: boolean;
}

/**
 * Textarea met @-mention support. Op `@` opent een lijst van collega's
 * binnen dezelfde partner. Selectie voegt `@[Naam](uuid)` in.
 */
export function MentionTextarea({ value, onChange, placeholder, rows = 3, className, disabled }: MentionTextareaProps) {
  const { profile } = useAuth();
  const ref = useRef<HTMLTextAreaElement>(null);
  const [trigger, setTrigger] = useState<{ start: number; query: string } | null>(null);
  const [highlight, setHighlight] = useState(0);

  const { data: colleagues = [] } = useColleagues(profile?.partner_id, profile?.id);

  const matches = useMemo<Colleague[]>(() => {
    if (!trigger) return [];
    const q = trigger.query.toLowerCase();
    const list = colleagues.filter((c) => {
      const naam = `${c.voornaam} ${c.achternaam}`.toLowerCase();
      return !q || naam.includes(q) || c.email.toLowerCase().includes(q);
    });
    return list.slice(0, 6);
  }, [colleagues, trigger]);

  useEffect(() => setHighlight(0), [trigger?.query]);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value;
    onChange(next);
    const caret = e.target.selectionStart ?? next.length;
    const t = detectMentionTrigger(next, caret);
    setTrigger(t ? { start: t.triggerStart, query: t.query } : null);
  };

  const pickMention = (c: Colleague) => {
    if (!trigger || !ref.current) return;
    const el = ref.current;
    const caret = el.selectionStart ?? value.length;
    const naam = `${c.voornaam} ${c.achternaam}`.trim();
    const { next, nextCaret } = insertMentionAtCaret(value, caret, trigger.start, { naam, userId: c.id });
    onChange(next);
    setTrigger(null);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(nextCaret, nextCaret);
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!trigger || matches.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlight((h) => (h + 1) % matches.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlight((h) => (h - 1 + matches.length) % matches.length); }
    else if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); pickMention(matches[highlight]); }
    else if (e.key === "Escape") { e.preventDefault(); setTrigger(null); }
  };

  return (
    <div className={cn("relative", className)}>
      <Textarea
        ref={ref}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(() => setTrigger(null), 150)}
        placeholder={placeholder ?? "Schrijf een notitie… gebruik @ om een collega te taggen"}
        rows={rows}
        disabled={disabled}
        className="rounded-xl"
      />
      {trigger && (
        <div className="absolute z-[60] left-3 top-full mt-1 w-72 rounded-xl border bg-popover shadow-lg overflow-hidden">
          <div className="px-3 py-2 text-[11px] text-muted-foreground flex items-center gap-1.5 border-b">
            <AtSign className="h-3 w-3" /> Collega taggen
          </div>
          {matches.length === 0 ? (
            <div className="px-3 py-3 text-xs text-muted-foreground">
              {colleagues.length === 0
                ? "Er zijn nog geen collega's binnen je organisatie om te taggen."
                : `Geen collega's gevonden voor "${trigger.query}"`}
            </div>
          ) : (
            <ul className="max-h-60 overflow-y-auto">
              {matches.map((c, i) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); pickMention(c); }}
                    className={cn(
                      "w-full text-left px-3 py-2 flex items-center gap-2 text-sm transition-colors",
                      i === highlight ? "bg-primary/10" : "hover:bg-muted",
                    )}
                  >
                    <div className="h-7 w-7 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[10px] font-semibold shrink-0">
                      {(c.voornaam[0] ?? "").toUpperCase()}{(c.achternaam[0] ?? "").toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{c.voornaam} {c.achternaam}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{c.rol.replace(/_/g, " ")}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default MentionTextarea;