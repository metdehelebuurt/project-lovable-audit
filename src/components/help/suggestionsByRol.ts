import type { AppRole } from "@/lib/permissions";

const SUGGESTIONS: Record<string, string[]> = {
  superadmin: [
    "Hoe maak ik een nieuwe offerte?",
    "Waar beheer ik gebruikers en rollen?",
    "Hoe werkt de abonnementenmodule?",
    "Waar zie ik de analytics?",
  ],
  partner_admin: [
    "Hoe maak ik een nieuwe offerte?",
    "Waar pas ik de huisstijl aan?",
    "Hoe nodig ik een nieuwe gebruiker uit?",
    "Waar beheer ik betalingsvoorwaarden?",
  ],
  backoffice: [
    "Hoe maak ik een verkoopfactuur?",
    "Waar registreer ik een inkoopontvangst?",
    "Hoe verstuur ik een offerte?",
    "Waar zie ik openstaande posten?",
  ],
  partner_staff: [
    "Hoe maak ik een nieuwe offerte?",
    "Waar zie ik mijn voorraad?",
    "Hoe registreer ik een retour?",
    "Hoe plan ik een installatie?",
  ],
  adviseur: [
    "Hoe start ik een schouw?",
    "Hoe maak ik een offerte?",
    "Waar voeg ik een lead toe?",
    "Hoe werkt energieadvies?",
  ],
  installateur: [
    "Waar zie ik mijn installaties?",
    "Hoe maak ik een opleverrapport?",
    "Waar staat mijn planning?",
    "Hoe meld ik een installatie gereed?",
  ],
  affiliate: [
    "Waar vind ik mijn referral-link?",
    "Hoe maak ik een kortingscode?",
    "Waar zie ik mijn commissies?",
    "Hoe werkt het affiliate-systeem?",
  ],
};

export function getSuggestions(rol: AppRole | null | undefined): string[] {
  if (!rol) return SUGGESTIONS.partner_staff;
  return SUGGESTIONS[rol] ?? SUGGESTIONS.partner_staff;
}