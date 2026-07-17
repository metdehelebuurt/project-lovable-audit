/**
 * Centrale registry van alle e-mailtemplates die een affiliate kan versturen
 * naar leads/klanten. Elke key heeft een default onderwerp en body in
 * mijnhuis.nu huisstijl. Affiliates kunnen deze overschrijven via de tabel
 * `affiliate_email_templates`.
 */

export type AffiliateTemplateCategorie =
  | "leads"
  | "afspraken"
  | "demo-trial"
  | "offerte"
  | "opvolging"
  | "klant";

export interface AffiliateTemplate {
  key: string;
  categorie: AffiliateTemplateCategorie;
  displayName: string;
  beschrijving: string;
  trigger: string;
  variabelen: ReadonlyArray<string>;
  defaultOnderwerp: string;
  defaultBodyHtml: string;
  previewData: Record<string, string>;
}

export const CATEGORIE_LABELS: Record<AffiliateTemplateCategorie, string> = {
  leads: "Leads",
  afspraken: "Afspraken",
  "demo-trial": "Demo & Trial",
  offerte: "Offertes",
  opvolging: "Opvolging",
  klant: "Klanten",
};

const STD = [
  "lead.voornaam",
  "lead.achternaam",
  "lead.bedrijf",
  "affiliate.naam",
  "affiliate.bedrijf",
  "affiliate.email",
  "affiliate.telefoon",
];

const P = {
  "lead.voornaam": "Marieke",
  "lead.achternaam": "Janssen",
  "lead.bedrijf": "Voorbeeld Installatiebedrijf BV",
  "affiliate.naam": "Bas de Vries",
  "affiliate.bedrijf": "mijnhuis.nu",
  "affiliate.email": "bas@mijnhuis.nu",
  "affiliate.telefoon": "06 12 34 56 78",
};

export const AFFILIATE_TEMPLATES: ReadonlyArray<AffiliateTemplate> = [
  {
    key: "lead-welkom",
    categorie: "leads",
    displayName: "Nieuwe lead — welkom",
    beschrijving: "Korte introductie nadat een lead is aangemaakt.",
    trigger: "Handmatig of automatisch bij aanmaken nieuwe lead",
    variabelen: STD,
    defaultOnderwerp: "Welkom bij mijnhuis.nu, {{lead.voornaam}}",
    defaultBodyHtml: `<p>Beste {{lead.voornaam}},</p><p>Wij zien dat je interesse hebt in mijnhuis.nu — leuk! Mijn naam is {{affiliate.naam}} en ik begeleid je graag bij de eerste stappen.</p><p>In de komende dagen neem ik telefonisch contact met je op om een korte kennismaking in te plannen. Zo bekijken we samen of het platform bij {{lead.bedrijf}} past.</p><p>Heb je tussendoor vragen? Reageer gerust op deze e-mail of bel me op {{affiliate.telefoon}}.</p>`,
    previewData: P,
  },
  {
    key: "lead-kennismaking-bevestiging",
    categorie: "leads",
    displayName: "Kennismaking — bevestiging",
    beschrijving: "Bevestiging na eerste telefonisch contact.",
    trigger: "Na eerste belmoment",
    variabelen: STD,
    defaultOnderwerp: "Fijn dat we elkaar spraken, {{lead.voornaam}}",
    defaultBodyHtml: `<p>Beste {{lead.voornaam}},</p><p>Bedankt voor het prettige gesprek. Hierbij ontvang je zoals afgesproken een korte samenvatting:</p><ul><li>mijnhuis.nu helpt verduurzamingsprofessionals met offertes, schouwen, planning en facturatie in één omgeving.</li><li>We bespreken in de volgende stap een persoonlijke demo of starten direct met een proefperiode.</li></ul><p>Ik hoor graag wat de volgende stap voor jou wordt.</p>`,
    previewData: P,
  },
  {
    key: "lead-info-pakket",
    categorie: "leads",
    displayName: "Info-pakket versturen",
    beschrijving: "Algemene productinformatie en links.",
    trigger: "Op aanvraag van de lead",
    variabelen: STD,
    defaultOnderwerp: "Informatie over mijnhuis.nu",
    defaultBodyHtml: `<p>Beste {{lead.voornaam}},</p><p>Zoals beloofd stuur ik je hierbij meer informatie over mijnhuis.nu. Op <a href="https://mijnhuis.nu">mijnhuis.nu</a> vind je een overzicht van alle modules, prijzen en klantverhalen.</p><p>Wil je liever direct een rondleiding? Laat het me weten, dan plannen we een online demo.</p>`,
    previewData: P,
  },
  {
    key: "afspraak-bevestiging",
    categorie: "afspraken",
    displayName: "Afspraak — bevestiging",
    beschrijving: "Datum, tijd en locatie van een geplande afspraak.",
    trigger: "Bij inplannen van een afspraak",
    variabelen: [...STD, "afspraak.datum_lang", "afspraak.tijd", "afspraak.locatie", "afspraak.link"],
    defaultOnderwerp: "Bevestiging afspraak op {{afspraak.datum_lang}}",
    defaultBodyHtml: `<p>Beste {{lead.voornaam}},</p><p>Onze afspraak staat in de agenda. Hieronder vind je de details:</p><ul><li><strong>Datum:</strong> {{afspraak.datum_lang}}</li><li><strong>Tijd:</strong> {{afspraak.tijd}}</li><li><strong>Locatie:</strong> {{afspraak.locatie}}</li><li><strong>Online:</strong> <a href="{{afspraak.link}}">{{afspraak.link}}</a></li></ul><p>Mocht je verhinderd zijn, laat het me even weten dan zoeken we een nieuw moment.</p>`,
    previewData: { ...P, "afspraak.datum_lang": "woensdag 1 juli 2026", "afspraak.tijd": "10:30", "afspraak.locatie": "Online (Google Meet)", "afspraak.link": "https://meet.google.com/abc-defg-hij" },
  },
  {
    key: "afspraak-herinnering-24u",
    categorie: "afspraken",
    displayName: "Afspraak — herinnering (24u)",
    beschrijving: "Herinnering 24 uur voor de afspraak.",
    trigger: "24 uur voor afspraak",
    variabelen: [...STD, "afspraak.datum_lang", "afspraak.tijd", "afspraak.link"],
    defaultOnderwerp: "Herinnering: morgen om {{afspraak.tijd}}",
    defaultBodyHtml: `<p>Beste {{lead.voornaam}},</p><p>Een korte herinnering aan onze afspraak morgen, {{afspraak.datum_lang}} om {{afspraak.tijd}}.</p><p>Deelnemen kan via <a href="{{afspraak.link}}">{{afspraak.link}}</a>.</p>`,
    previewData: { ...P, "afspraak.datum_lang": "woensdag 1 juli 2026", "afspraak.tijd": "10:30", "afspraak.link": "https://meet.google.com/abc-defg-hij" },
  },
  {
    key: "afspraak-herinnering-1u",
    categorie: "afspraken",
    displayName: "Afspraak — herinnering (1u)",
    beschrijving: "Korte herinnering 1 uur voor een digitale afspraak.",
    trigger: "1 uur voor digitale afspraak",
    variabelen: [...STD, "afspraak.tijd", "afspraak.link"],
    defaultOnderwerp: "Over een uur: onze afspraak om {{afspraak.tijd}}",
    defaultBodyHtml: `<p>Beste {{lead.voornaam}},</p><p>Over een uur staat onze afspraak gepland. Je kunt deelnemen via <a href="{{afspraak.link}}">{{afspraak.link}}</a>.</p>`,
    previewData: { ...P, "afspraak.tijd": "10:30", "afspraak.link": "https://meet.google.com/abc-defg-hij" },
  },
  {
    key: "afspraak-gewijzigd",
    categorie: "afspraken",
    displayName: "Afspraak — gewijzigd",
    beschrijving: "Wijziging van datum of tijd.",
    trigger: "Bij verzetten van een afspraak",
    variabelen: [...STD, "afspraak.datum_lang", "afspraak.tijd", "afspraak.locatie"],
    defaultOnderwerp: "Onze afspraak is verzet naar {{afspraak.datum_lang}}",
    defaultBodyHtml: `<p>Beste {{lead.voornaam}},</p><p>Bij dezen bevestig ik dat onze afspraak verzet is naar <strong>{{afspraak.datum_lang}} om {{afspraak.tijd}}</strong>.</p><p>Locatie: {{afspraak.locatie}}. Past dit moment niet? Laat het me weten.</p>`,
    previewData: { ...P, "afspraak.datum_lang": "vrijdag 3 juli 2026", "afspraak.tijd": "14:00", "afspraak.locatie": "Online" },
  },
  {
    key: "afspraak-geannuleerd",
    categorie: "afspraken",
    displayName: "Afspraak — geannuleerd",
    beschrijving: "Annulering met nette afsluiter.",
    trigger: "Bij annuleren afspraak",
    variabelen: STD,
    defaultOnderwerp: "Afspraak geannuleerd",
    defaultBodyHtml: `<p>Beste {{lead.voornaam}},</p><p>Onze afspraak is geannuleerd. Ik plan graag een nieuw moment in zodra dat schikt. Reageer gerust op deze e-mail.</p>`,
    previewData: P,
  },
  {
    key: "afspraak-no-show-followup",
    categorie: "afspraken",
    displayName: "Afspraak — no-show opvolging",
    beschrijving: "Vriendelijke check-in na een gemiste afspraak.",
    trigger: "Na gemiste afspraak",
    variabelen: STD,
    defaultOnderwerp: "Jammer dat het vandaag niet lukte",
    defaultBodyHtml: `<p>Beste {{lead.voornaam}},</p><p>Helaas hebben we elkaar zojuist gemist. Geen probleem — er kan altijd iets tussenkomen.</p><p>Laat me weten wanneer het wél schikt, dan plannen we een nieuw moment.</p>`,
    previewData: P,
  },
  {
    key: "demo-uitnodiging",
    categorie: "demo-trial",
    displayName: "Demo — uitnodiging",
    beschrijving: "Uitnodiging voor een productdemo.",
    trigger: "Bij plannen demo",
    variabelen: [...STD, "afspraak.datum_lang", "afspraak.tijd", "afspraak.link"],
    defaultOnderwerp: "Uitnodiging demo mijnhuis.nu — {{afspraak.datum_lang}}",
    defaultBodyHtml: `<p>Beste {{lead.voornaam}},</p><p>Fijn dat je een demo wilt zien. Hierbij de details:</p><ul><li><strong>Wanneer:</strong> {{afspraak.datum_lang}} om {{afspraak.tijd}}</li><li><strong>Waar:</strong> <a href="{{afspraak.link}}">{{afspraak.link}}</a></li><li><strong>Duur:</strong> circa 30 minuten</li></ul><p>Ik laat je het platform zien aan de hand van praktijkvoorbeelden uit jouw vakgebied.</p>`,
    previewData: { ...P, "afspraak.datum_lang": "donderdag 2 juli 2026", "afspraak.tijd": "11:00", "afspraak.link": "https://meet.google.com/demo-mijnhuis" },
  },
  {
    key: "demo-herinnering",
    categorie: "demo-trial",
    displayName: "Demo — herinnering",
    beschrijving: "Herinnering op de dag van de demo.",
    trigger: "Ochtend van de demo",
    variabelen: [...STD, "afspraak.tijd", "afspraak.link"],
    defaultOnderwerp: "Vandaag om {{afspraak.tijd}}: jouw demo van mijnhuis.nu",
    defaultBodyHtml: `<p>Beste {{lead.voornaam}},</p><p>Vandaag om {{afspraak.tijd}} laat ik je mijnhuis.nu zien. Deelnemen kan via <a href="{{afspraak.link}}">{{afspraak.link}}</a>.</p><p>Tot zo!</p>`,
    previewData: { ...P, "afspraak.tijd": "11:00", "afspraak.link": "https://meet.google.com/demo-mijnhuis" },
  },
  {
    key: "demo-followup",
    categorie: "demo-trial",
    displayName: "Demo — follow-up",
    beschrijving: "Samenvatting en vervolgstappen na de demo.",
    trigger: "Na afronden demo",
    variabelen: STD,
    defaultOnderwerp: "Bedankt voor de demo — vervolgstappen",
    defaultBodyHtml: `<p>Beste {{lead.voornaam}},</p><p>Bedankt voor je tijd vandaag. Zoals besproken zijn dit de mogelijke vervolgstappen:</p><ol><li>Een proefperiode (trial) van 14 dagen activeren.</li><li>Een offerte ontvangen op basis van het aantal gebruikers.</li><li>Een tweede gesprek inplannen om openstaande vragen door te nemen.</li></ol><p>Wat heeft jouw voorkeur?</p>`,
    previewData: P,
  },
  {
    key: "trial-gestart",
    categorie: "demo-trial",
    displayName: "Trial — gestart",
    beschrijving: "Welkomstmail met inloggegevens.",
    trigger: "Bij activeren proefperiode",
    variabelen: [...STD, "trial.url", "trial.eind_datum"],
    defaultOnderwerp: "Jouw proefperiode bij mijnhuis.nu is actief",
    defaultBodyHtml: `<p>Beste {{lead.voornaam}},</p><p>Je proefperiode is geactiveerd. Tot <strong>{{trial.eind_datum}}</strong> heb je volledige toegang tot het platform.</p><p>Inloggen kan via <a href="{{trial.url}}">{{trial.url}}</a>. Je ontvangt apart een uitnodiging om je wachtwoord in te stellen.</p><p>De eerste week neem ik contact met je op om te zien hoe het bevalt.</p>`,
    previewData: { ...P, "trial.url": "https://app.mijnhuis.nu", "trial.eind_datum": "25 juli 2026" },
  },
  {
    key: "trial-halverwege",
    categorie: "demo-trial",
    displayName: "Trial — halverwege",
    beschrijving: "Check-in halverwege de proefperiode.",
    trigger: "Halverwege de trial",
    variabelen: STD,
    defaultOnderwerp: "Hoe bevalt mijnhuis.nu tot nu toe?",
    defaultBodyHtml: `<p>Beste {{lead.voornaam}},</p><p>Je bent inmiddels halverwege je proefperiode. Loop je tegen iets aan, of wil je nog functionaliteit zien? Ik kijk graag mee.</p><p>Je kunt direct reageren op deze e-mail of me bellen op {{affiliate.telefoon}}.</p>`,
    previewData: P,
  },
  {
    key: "trial-verloopt-binnenkort",
    categorie: "demo-trial",
    displayName: "Trial — verloopt binnenkort",
    beschrijving: "Herinnering 3 dagen voor het einde van de trial.",
    trigger: "3 dagen voor einde trial",
    variabelen: [...STD, "trial.eind_datum"],
    defaultOnderwerp: "Je proefperiode loopt af op {{trial.eind_datum}}",
    defaultBodyHtml: `<p>Beste {{lead.voornaam}},</p><p>Over een paar dagen, op <strong>{{trial.eind_datum}}</strong>, loopt je proefperiode af. Wil je doorgaan? Dan zet ik je account graag om naar een betaald abonnement.</p><p>Heb je nog twijfels of vragen? Plan gerust een kort gesprek met me in.</p>`,
    previewData: { ...P, "trial.eind_datum": "25 juli 2026" },
  },
  {
    key: "trial-verlopen",
    categorie: "demo-trial",
    displayName: "Trial — verlopen",
    beschrijving: "Bericht na afloop met conversie-CTA.",
    trigger: "Na afloop trial",
    variabelen: STD,
    defaultOnderwerp: "Je proefperiode is afgelopen — wat is je vervolgstap?",
    defaultBodyHtml: `<p>Beste {{lead.voornaam}},</p><p>Je proefperiode is afgelopen. Ik ben benieuwd of mijnhuis.nu een goede match was voor {{lead.bedrijf}}.</p><p>Wil je doorgaan, twijfel je nog, of past het toch niet? Ik hoor het graag — alle antwoorden zijn welkom.</p>`,
    previewData: P,
  },
  {
    key: "offerte-verstuurd",
    categorie: "offerte",
    displayName: "Offerte — verstuurd",
    beschrijving: "Begeleidende mail bij een nieuwe offerte.",
    trigger: "Bij versturen offerte",
    variabelen: [...STD, "offerte.nummer", "offerte.url", "offerte.bedrag"],
    defaultOnderwerp: "Offerte {{offerte.nummer}} — mijnhuis.nu",
    defaultBodyHtml: `<p>Beste {{lead.voornaam}},</p><p>Hierbij ontvang je onze offerte met nummer <strong>{{offerte.nummer}}</strong>. Je kunt de offerte online bekijken en digitaal accepteren:</p><p><a href="{{offerte.url}}">Bekijk offerte</a></p><p>Het totaalbedrag is {{offerte.bedrag}}. Heb je vragen over een specifieke regel? Reageer gerust op deze e-mail.</p>`,
    previewData: { ...P, "offerte.nummer": "OF-260625-0001", "offerte.url": "https://app.mijnhuis.nu/offerte/abc123", "offerte.bedrag": "€ 4.950,00" },
  },
  {
    key: "offerte-herinnering",
    categorie: "offerte",
    displayName: "Offerte — herinnering",
    beschrijving: "Eerste herinnering bij uitblijven reactie.",
    trigger: "7 dagen na verzenden offerte",
    variabelen: [...STD, "offerte.nummer", "offerte.url"],
    defaultOnderwerp: "Herinnering: offerte {{offerte.nummer}}",
    defaultBodyHtml: `<p>Beste {{lead.voornaam}},</p><p>Een korte herinnering aan onze offerte <strong>{{offerte.nummer}}</strong>. Bekijk hem hier: <a href="{{offerte.url}}">{{offerte.url}}</a>.</p><p>Laat me weten of je nog informatie nodig hebt om een beslissing te nemen.</p>`,
    previewData: { ...P, "offerte.nummer": "OF-260625-0001", "offerte.url": "https://app.mijnhuis.nu/offerte/abc123" },
  },
  {
    key: "offerte-laatste-herinnering",
    categorie: "offerte",
    displayName: "Offerte — laatste herinnering",
    beschrijving: "Final nudge voordat de offerte verloopt.",
    trigger: "Voor verlopen offerte",
    variabelen: [...STD, "offerte.nummer", "offerte.url", "offerte.geldig_tot"],
    defaultOnderwerp: "Laatste kans: offerte {{offerte.nummer}} verloopt op {{offerte.geldig_tot}}",
    defaultBodyHtml: `<p>Beste {{lead.voornaam}},</p><p>Onze offerte <strong>{{offerte.nummer}}</strong> verloopt op {{offerte.geldig_tot}}. Wil je gebruikmaken van de aangeboden condities, accepteer dan vóór die datum.</p><p><a href="{{offerte.url}}">Bekijk offerte</a></p>`,
    previewData: { ...P, "offerte.nummer": "OF-260625-0001", "offerte.url": "https://app.mijnhuis.nu/offerte/abc123", "offerte.geldig_tot": "10 juli 2026" },
  },
  {
    key: "terugbel-bevestiging",
    categorie: "opvolging",
    displayName: "Terugbel — bevestiging",
    beschrijving: "Bevestiging van een ingeplande terugbelafspraak.",
    trigger: "Bij plannen terugbel",
    variabelen: [...STD, "terugbel.datum_lang", "terugbel.tijd"],
    defaultOnderwerp: "Ik bel je terug op {{terugbel.datum_lang}}",
    defaultBodyHtml: `<p>Beste {{lead.voornaam}},</p><p>Zoals afgesproken bel ik je op <strong>{{terugbel.datum_lang}} rond {{terugbel.tijd}}</strong>.</p><p>Komt het dan toch niet uit? Reageer gerust op deze e-mail, dan zoek ik een ander moment.</p>`,
    previewData: { ...P, "terugbel.datum_lang": "maandag 30 juni 2026", "terugbel.tijd": "14:00" },
  },
  {
    key: "algemene-followup",
    categorie: "opvolging",
    displayName: "Algemene follow-up",
    beschrijving: "Vrije opvolgmail voor losse vervolgcontacten.",
    trigger: "Handmatig",
    variabelen: STD,
    defaultOnderwerp: "Even een korte update",
    defaultBodyHtml: `<p>Beste {{lead.voornaam}},</p><p>Hoe staan de zaken bij {{lead.bedrijf}}? Ik wilde even checken of mijnhuis.nu nog op je radar staat en of ik ergens bij kan helpen.</p><p>Reageer gerust met een korte update.</p>`,
    previewData: P,
  },
  {
    key: "lang-niet-gesproken",
    categorie: "opvolging",
    displayName: "Lang niet gesproken",
    beschrijving: "Re-engagement na 3 of 6 maanden stilte.",
    trigger: "Bij reactivatie uit verloren-bak",
    variabelen: STD,
    defaultOnderwerp: "Lang niet gesproken — alles goed bij {{lead.bedrijf}}?",
    defaultBodyHtml: `<p>Beste {{lead.voornaam}},</p><p>We hebben elkaar een tijd niet gesproken. In de tussentijd is er bij mijnhuis.nu het een en ander gebeurd; ik praat je graag bij in 15 minuten.</p><p>Past een korte (vrijblijvende) update je deze of volgende week?</p>`,
    previewData: P,
  },
  {
    key: "verloren-afscheid",
    categorie: "opvolging",
    displayName: "Verloren — vriendelijke afsluiter",
    beschrijving: "Nette afsluiting wanneer een lead definitief afhaakt.",
    trigger: "Bij definitief verloren",
    variabelen: STD,
    defaultOnderwerp: "Bedankt voor je interesse",
    defaultBodyHtml: `<p>Beste {{lead.voornaam}},</p><p>Bedankt voor de gesprekken en de tijd die je in mijnhuis.nu hebt gestoken. Hoewel het nu geen match is, hoor ik graag van je als de situatie verandert.</p><p>Veel succes met {{lead.bedrijf}}.</p>`,
    previewData: P,
  },
  {
    key: "welkom-als-klant",
    categorie: "klant",
    displayName: "Welkom als klant",
    beschrijving: "Eerste mail nadat een lead klant wordt.",
    trigger: "Bij conversie naar klant",
    variabelen: STD,
    defaultOnderwerp: "Welkom bij mijnhuis.nu, {{lead.voornaam}}",
    defaultBodyHtml: `<p>Beste {{lead.voornaam}},</p><p>Welkom als klant van mijnhuis.nu — fijn dat je voor ons hebt gekozen. Ik blijf jouw aanspreekpunt voor vragen over het account, facturatie of nieuwe wensen.</p><p>De komende weken plan ik een onboardingsmoment in om alles snel werkend te krijgen.</p>`,
    previewData: P,
  },
  {
    key: "bedankt-voor-aanbeveling",
    categorie: "klant",
    displayName: "Bedankt voor de aanbeveling",
    beschrijving: "Dank na een referral door een bestaande klant.",
    trigger: "Bij ontvangen referral",
    variabelen: STD,
    defaultOnderwerp: "Bedankt voor de aanbeveling",
    defaultBodyHtml: `<p>Beste {{lead.voornaam}},</p><p>Hartelijk dank dat je mijnhuis.nu hebt aanbevolen. Dat waarderen we enorm.</p><p>Ik laat je weten zodra het contact met de aangedragen partij een eerste resultaat oplevert.</p>`,
    previewData: P,
  },
];

export function getTemplate(key: string): AffiliateTemplate | undefined {
  return AFFILIATE_TEMPLATES.find((t) => t.key === key);
}

export function groupByCategorie(): Record<AffiliateTemplateCategorie, AffiliateTemplate[]> {
  const out = { leads: [], afspraken: [], "demo-trial": [], offerte: [], opvolging: [], klant: [] } as Record<AffiliateTemplateCategorie, AffiliateTemplate[]>;
  for (const t of AFFILIATE_TEMPLATES) out[t.categorie].push(t);
  return out;
}

export function renderTemplate(template: string, data: Record<string, string>): string {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_m, k: string) => data[k] ?? "");
}
