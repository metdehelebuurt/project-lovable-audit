export function normaliseerAffiliateTag(raw: string): string | null {
  const tag = raw.trim().toLowerCase().replace(/\s+/g, " ");
  return tag.length > 0 ? tag : null;
}

export function voegAffiliateTagsToe(huidigeTags: string[], raw: string): string[] | null {
  const nieuweTags = raw
    .split(",")
    .map((tag) => normaliseerAffiliateTag(tag))
    .filter((tag): tag is string => tag !== null);

  if (nieuweTags.length === 0) return null;

  const tags = new Set(huidigeTags);
  nieuweTags.forEach((tag) => tags.add(tag));
  return Array.from(tags);
}

export function verwijderAffiliateTag(huidigeTags: string[], tag: string): string[] {
  return huidigeTags.filter((item) => item !== tag);
}