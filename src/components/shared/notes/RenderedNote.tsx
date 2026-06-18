import { Fragment } from "react";
import { cn } from "@/lib/utils";
import { MENTION_REGEX } from "./mentionSyntax";

interface RenderedNoteProps {
  inhoud: string | null | undefined;
  className?: string;
}

/**
 * Toont notitie-inhoud met @[Naam](uuid) tokens als paarse mention-badges.
 * Veilig: geen HTML interpretatie, alleen tekst + regex.
 */
export function RenderedNote({ inhoud, className }: RenderedNoteProps) {
  if (!inhoud) return null;
  const parts: Array<{ type: "text" | "mention"; value: string }> = [];
  let lastIndex = 0;
  const regex = new RegExp(MENTION_REGEX.source, "g");
  let m: RegExpExecArray | null;
  while ((m = regex.exec(inhoud)) !== null) {
    if (m.index > lastIndex) parts.push({ type: "text", value: inhoud.slice(lastIndex, m.index) });
    parts.push({ type: "mention", value: m[1] });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < inhoud.length) parts.push({ type: "text", value: inhoud.slice(lastIndex) });

  return (
    <span className={cn("whitespace-pre-wrap", className)}>
      {parts.map((p, i) =>
        p.type === "mention" ? (
          <span
            key={i}
            className="inline-flex items-center rounded-md bg-primary/15 text-primary px-1.5 py-0.5 text-xs font-medium mx-0.5"
          >
            @{p.value}
          </span>
        ) : (
          <Fragment key={i}>{p.value}</Fragment>
        ),
      )}
    </span>
  );
}

export default RenderedNote;