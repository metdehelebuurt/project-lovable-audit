/**
 * Hulpfuncties voor contact-acties op een affiliate-lead.
 * Normaliseert telefoonnummers en bouwt veilige tel:/mailto:/wa.me-links.
 */

export function normaliseerTelefoon(input: string | null | undefined): string | null {
  if (!input) return null;
  const digits = input.replace(/[^\d+]/g, "");
  if (!digits) return null;
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("00")) return "+" + digits.slice(2);
  if (digits.startsWith("0")) return "+31" + digits.slice(1);
  return "+" + digits;
}

export function whatsappLink(telefoon: string | null | undefined, bericht?: string): string | null {
  const n = normaliseerTelefoon(telefoon);
  if (!n) return null;
  const url = `https://wa.me/${n.replace(/[^\d]/g, "")}`;
  return bericht ? `${url}?text=${encodeURIComponent(bericht)}` : url;
}

export function telLink(telefoon: string | null | undefined): string | null {
  const n = normaliseerTelefoon(telefoon);
  return n ? `tel:${n}` : null;
}
