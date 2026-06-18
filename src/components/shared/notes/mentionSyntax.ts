/**
 * Mention-syntax voor notitievelden.
 *
 * We slaan mentions op als platte tekst in de vorm:
 *   @[Voornaam Achternaam](user-uuid)
 *
 * Voordelen:
 * - Werkt in elk bestaand `inhoud` TEXT veld (geen schema-migratie nodig).
 * - Backwards-compatible: oudere notities zonder mentions blijven gewoon zichtbaar.
 * - Eenvoudig te parsen vanuit zowel frontend renderer als edge function.
 */

export const MENTION_REGEX = /@\[([^\]]+)\]\(([0-9a-fA-F-]{36})\)/g;

export interface MentionMatch {
  naam: string;
  userId: string;
}

/** Extract alle (unieke) user-IDs die in de tekst worden genoemd. */
export function extractMentionUserIds(inhoud: string | null | undefined): string[] {
  if (!inhoud) return [];
  const ids = new Set<string>();
  for (const m of inhoud.matchAll(MENTION_REGEX)) ids.add(m[2]);
  return [...ids];
}

/** Vervang een mention-token in de huidige tekst op de gegeven caretpositie. */
export function insertMentionAtCaret(
  text: string,
  caret: number,
  triggerStart: number,
  mention: MentionMatch,
): { next: string; nextCaret: number } {
  const before = text.slice(0, triggerStart);
  const after = text.slice(caret);
  const token = `@[${mention.naam}](${mention.userId}) `;
  return { next: `${before}${token}${after}`, nextCaret: before.length + token.length };
}

/** Geeft de zoekterm terug die na een `@` is getypt, of null als er geen actieve trigger is. */
export function detectMentionTrigger(text: string, caret: number): { triggerStart: number; query: string } | null {
  // zoek laatste @ vóór de caret die niet onderdeel is van een bestaande mention
  for (let i = caret - 1; i >= Math.max(0, caret - 50); i--) {
    const ch = text[i];
    if (ch === "@") {
      const prev = i > 0 ? text[i - 1] : " ";
      if (!/[\s\n(]/.test(prev) && i !== 0) return null;
      const query = text.slice(i + 1, caret);
      if (/[\s\n\[\]()]/.test(query)) return null;
      return { triggerStart: i, query };
    }
    if (/[\s\n]/.test(ch)) return null;
  }
  return null;
}