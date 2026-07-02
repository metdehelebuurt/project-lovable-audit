import { useRef, useState, useEffect, useMemo, useCallback, type ChangeEvent, type KeyboardEvent } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useColleagues, type Colleague } from "@/hooks/useColleagues";
import { useAuth } from "@/contexts/AuthContext";
import { MENTION_REGEX } from "./mentionSyntax";
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
interface Mention { start: number; end: number; naam: string; userId: string }

/** Parse raw string ("@[Naam](uuid)") into display + mention offsets. */
function parseRaw(raw: string): { display: string; mentions: Mention[] } {
  const re = new RegExp(MENTION_REGEX.source, "g");
  const mentions: Mention[] = [];
  let display = "";
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    display += raw.slice(last, m.index);
    const start = display.length;
    const visible = `@${m[1]}`;
    display += visible;
    mentions.push({ start, end: start + visible.length, naam: m[1], userId: m[2] });
    last = m.index + m[0].length;
  }
  display += raw.slice(last);
  return { display, mentions };
}

/** Build raw string by re-injecting mention tokens into display. */
function buildRaw(display: string, mentions: Mention[]): string {
  const sorted = [...mentions].sort((a, b) => a.start - b.start);
  let out = "";
  let cursor = 0;
  for (const m of sorted) {
    if (m.start < cursor || m.end > display.length) continue;
    if (display.slice(m.start, m.end) !== `@${m.naam}`) continue;
    out += display.slice(cursor, m.start);
    out += `@[${m.naam}](${m.userId})`;
    cursor = m.end;
  }
  out += display.slice(cursor);
  return out;
}

/** Compute the changed range between old and new display strings. */
function diffRange(a: string, b: string) {
  let start = 0;
  const min = Math.min(a.length, b.length);
  while (start < min && a[start] === b[start]) start++;
  let ea = a.length;
  let eb = b.length;
  while (ea > start && eb > start && a[ea - 1] === b[eb - 1]) {
    ea--;
    eb--;
  }
  return { start, oldEnd: ea, newEnd: eb };
}

/** Detect @query trigger at caret in display text. */
function detectDisplayTrigger(display: string, caret: number, mentions: Mention[]) {
  // caret mag niet binnen een bestaande mention zitten
  for (const m of mentions) {
    if (caret > m.start && caret <= m.end) return null;
  }
  for (let i = caret - 1; i >= Math.max(0, caret - 50); i--) {
    const ch = display[i];
    if (ch === "@") {
      const prev = i > 0 ? display[i - 1] : " ";
      if (i !== 0 && !/[\s\n(]/.test(prev)) return null;
      // niet als deze @ het begin is van een bestaande mention
      if (mentions.some((m) => m.start === i)) return null;
      const query = display.slice(i + 1, caret);
      if (/[\s\n\[\]()@]/.test(query)) return null;
      return { triggerStart: i, query };
    }
    if (/[\s\n]/.test(ch)) return null;
  }
  return null;
}

export function MentionTextarea({ value, onChange, placeholder, rows = 3, className, disabled }: MentionTextareaProps) {
  const { profile } = useAuth();
  const ref = useRef<HTMLTextAreaElement>(null);
  const [display, setDisplay] = useState<string>(() => parseRaw(value || "").display);
  const [mentions, setMentions] = useState<Mention[]>(() => parseRaw(value || "").mentions);
  const [trigger, setTrigger] = useState<{ start: number; query: string } | null>(null);
  const [highlight, setHighlight] = useState(0);
  const lastEmittedRawRef = useRef<string>(value || "");

  // Externe value → herparse alleen als het verschilt van wat we zelf uitzonden.
  useEffect(() => {
    const raw = value || "";
    if (raw === lastEmittedRawRef.current) return;
    const parsed = parseRaw(raw);
    setDisplay(parsed.display);
    setMentions(parsed.mentions);
    lastEmittedRawRef.current = raw;
  }, [value]);

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

  const emit = useCallback((nextDisplay: string, nextMentions: Mention[]) => {
    setDisplay(nextDisplay);
    setMentions(nextMentions);
    const raw = buildRaw(nextDisplay, nextMentions);
    lastEmittedRawRef.current = raw;
    onChange(raw);
  }, [onChange]);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value;
    const range = diffRange(display, next);
    const delta = range.newEnd - range.oldEnd;
    const nextMentions = mentions
      .map((m) => {
        // Volledig vóór wijziging → onaangetast
        if (m.end <= range.start) return m;
        // Volledig na wijziging → verschuiven
        if (m.start >= range.oldEnd) return { ...m, start: m.start + delta, end: m.end + delta };
        // Overlap → verwijderen
        return null;
      })
      .filter((m): m is Mention => {
        if (!m) return false;
        // Verifieer dat de mention-tekst nog exact klopt
        return next.slice(m.start, m.end) === `@${m.naam}`;
      });
    emit(next, nextMentions);
    const caret = e.target.selectionStart ?? next.length;
    setTrigger(detectDisplayTrigger(next, caret, nextMentions));
  };

  const handleSelect = () => {
    if (!ref.current) return;
    const caret = ref.current.selectionStart ?? display.length;
    setTrigger(detectDisplayTrigger(display, caret, mentions));
  };

  const pickMention = (c: Colleague) => {
    if (!trigger || !ref.current) return;
    const el = ref.current;
    const caret = el.selectionStart ?? display.length;
    const naam = `${c.voornaam} ${c.achternaam}`.trim();
    const visible = `@${naam}`;
    const before = display.slice(0, trigger.start);
    const after = display.slice(caret);
    const nextDisplay = `${before}${visible} ${after}`;
    const shift = (before.length + visible.length + 1) - caret; // delta t.o.v. oude tekst tot caret
    // Mentions vóór trigger blijven; mentions na caret schuiven met shift + verwijderde-typed-query
    const removedQueryLen = caret - (trigger.start + 1 + trigger.query.length);
    const deltaBeforeCaret = visible.length + 1 - (1 + trigger.query.length + removedQueryLen);
    const shiftedMentions: Mention[] = mentions
      .map((m) => {
        if (m.end <= trigger.start) return m;
        if (m.start >= caret) return { ...m, start: m.start + deltaBeforeCaret, end: m.end + deltaBeforeCaret };
        return null;
      })
      .filter((m): m is Mention => !!m);
    const newMention: Mention = {
      start: before.length,
      end: before.length + visible.length,
      naam,
      userId: c.id,
    };
    const nextMentions = [...shiftedMentions, newMention].sort((a, b) => a.start - b.start);
    emit(nextDisplay, nextMentions);
    setTrigger(null);
    const nextCaret = before.length + visible.length + 1;
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(nextCaret, nextCaret);
    });
    // shift is berekend maar niet gebruikt buiten deze scope
    void shift;
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
        value={display}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onSelect={handleSelect}
        onBlur={() => setTimeout(() => setTrigger(null), 150)}
        placeholder={placeholder ?? "Schrijf een notitie… gebruik @ om een collega te taggen"}
        rows={rows}
        disabled={disabled}
        className="rounded-xl leading-[1.5]"
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