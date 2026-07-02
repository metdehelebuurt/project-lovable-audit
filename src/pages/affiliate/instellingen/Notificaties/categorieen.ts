export interface NotificatieCategorie {
  key: string;
  titel: string;
  omschrijving: string;
}

/**
 * Vaste catalogus van notificatie-categorieën voor affiliates.
 * Sluit aan op de `type`-waarden die triggers in `notificaties` schrijven.
 */
export const AFFILIATE_NOTIF_CATEGORIEEN: NotificatieCategorie[] = [
  {
    key: "affiliate_mail_in",
    titel: "Nieuwe e-mail",
    omschrijving: "Een lead of klant heeft je een e-mail gestuurd.",
  },
  {
    key: "affiliate_terugbel",
    titel: "Terugbelafspraak",
    omschrijving: "Een geplande terugbelafspraak komt eraan.",
  },
  {
    key: "affiliate_lead_toegewezen",
    titel: "Lead toegewezen",
    omschrijving: "Er is een nieuwe lead aan jou toegewezen.",
  },
  {
    key: "affiliate_hot_lead",
    titel: "Hot lead",
    omschrijving: "Een lead vertoont een sterk koopsignaal.",
  },
  {
    key: "affiliate_sla_stil",
    titel: "Stille lead",
    omschrijving: "Een lead heeft te lang geen actie gehad.",
  },
  {
    key: "affiliate_trial_verloop",
    titel: "Trial verloopt",
    omschrijving: "Een trial van een klant loopt binnenkort af.",
  },
  {
    key: "affiliate_portal_opmerking",
    titel: "Portal-opmerking",
    omschrijving: "Een klant plaatst een bericht op zijn offerte-portal.",
  },
];

export const TEMPERATUREN: Array<{ key: string; label: string }> = [
  { key: "koud", label: "Koud" },
  { key: "lauw", label: "Lauw" },
  { key: "warm", label: "Warm" },
  { key: "heet", label: "Heet" },
];