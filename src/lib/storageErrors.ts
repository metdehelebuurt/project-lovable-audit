/**
 * Vertaalt rauwe Supabase Storage / RLS fouten naar gebruikersvriendelijke
 * Nederlandse meldingen. Houd dit klein en focus op de meest voorkomende
 * scenario's die end-users tegenkomen bij uploads.
 */
export function vriendelijkeUploadFout(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err ?? "");
  if (/row-level security|not authorized|unauthorized|permission/i.test(msg)) {
    return "Je hebt geen rechten om dit bestand te uploaden. Neem contact op met je beheerder.";
  }
  if (/exceeded|too large|payload|size/i.test(msg) && /(MB|byte|limit)/i.test(msg)) {
    return "Het bestand is te groot. Kies een kleiner bestand of comprimeer het.";
  }
  if (/mime|content-type|allowed/i.test(msg)) {
    return "Dit bestandstype wordt niet geaccepteerd voor deze upload.";
  }
  if (/duplicate|already exists/i.test(msg)) {
    return "Er bestaat al een bestand met deze naam. Probeer het opnieuw.";
  }
  if (/network|fetch|timeout/i.test(msg)) {
    return "Geen verbinding met de server. Controleer je internet en probeer opnieuw.";
  }
  return msg || "Onbekende fout bij uploaden.";
}