// Veilige headerwaarden voor SMTP-verzending via denomailer.
//
// Achtergrond: denomailer 1.6.0 encodeert headers met non-ASCII tekens als
// quoted-printable encoded-word (=?utf-8?Q?...?=) en voegt daarbij bij lange
// waarden soft line breaks (=\r\n) toe. Dat is binnen een encoded-word niet
// toegestaan: de headerblokkade breekt en de mailserver ziet de rest van de
// headers (From/To/Content-Type) als body. De ontvanger krijgt dan de ruwe
// MIME-tekst te zien in plaats van de opgemaakte e-mail.
//
// Oplossing: headerwaarden naar pure ASCII normaliseren, zodat denomailer ze
// ongewijzigd doorgeeft en er nooit een encoded-word ontstaat.

const ASCII_FALLBACKS: Record<string, string> = {
  "€": "EUR", "£": "GBP", "„": '"', "“": '"', "”": '"', "‘": "'", "’": "'",
  "–": "-", "—": "-", "…": "...", "•": "-", "×": "x", "ß": "ss",
};

/**
 * Zet een headerwaarde om naar veilige, korte ASCII.
 * @param value ruwe headerwaarde
 * @param maxLength maximale lengte (standaard 200 tekens)
 */
export function toAsciiHeader(value: string, maxLength = 200): string {
  if (!value) return "";

  let out = value.replace(/[\r\n\t]+/g, " ");
  for (const [from, to] of Object.entries(ASCII_FALLBACKS)) {
    out = out.split(from).join(to);
  }
  // Diakrieten strippen (é -> e) en resterende non-ASCII verwijderen.
  out = out.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  out = out.replace(/[^\x20-\x7E]/g, "");
  out = out.replace(/\s{2,}/g, " ").trim();

  if (out.length > maxLength) out = `${out.slice(0, maxLength - 1).trimEnd()}…`.replace("…", "...");
  return out;
}
