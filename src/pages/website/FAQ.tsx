import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link, useNavigate } from "react-router-dom";

const categories = [
  {
    title: "Over het platform",
    items: [
      { q: "Wat is mijnhuis.nu?", a: "mijnhuis.nu is een alles-in-één softwareplatform voor installateurs en adviseurs in de verduurzamingsbranche. Het combineert offertes, schouwen, planning, leadbeheer, energieadvies tools, webtools en rapportages in één systeem." },
      { q: "Voor wie is mijnhuis.nu bedoeld?", a: "Het platform is ontworpen voor bedrijven die werken met zonnepanelen, warmtepompen, isolatie, laadpalen en andere verduurzamingsoplossingen. Van zelfstandige adviseurs tot grote installatiebedrijven." },
      { q: "Kan ik mijnhuis.nu op mijn telefoon gebruiken?", a: "Ja, mijnhuis.nu werkt volledig responsive op telefoons, tablets en laptops. Ideaal voor gebruik op locatie bij de klant." },
      { q: "Welke categorieën schouwen worden ondersteund?", a: "We ondersteunen schouwen voor zonnepanelen, warmtepompen, dakisolatie, muurisolatie, vloerisolatie, HR-glas, ventilatie en thuisbatterijen." },
    ],
  },
  {
    title: "Webtools & widgets",
    items: [
      { q: "Wat zijn webtools?", a: "Webtools zijn embeddable widgets die je op je eigen website kunt plaatsen. Denk aan besparingscalculatoren voor zonnepanelen, warmtepompen, isolatie, laadpalen en thuisbatterijen, plus contactformulieren." },
      { q: "Hoe embed ik een widget op mijn website?", a: "Je kopieert een stukje embed-code vanuit het platform en plakt het in je website. Werkt met WordPress, Wix, Squarespace en elke andere website. Geen technische kennis vereist." },
      { q: "Worden widget-inzendingen automatisch als lead aangemaakt?", a: "Ja, alle inzendingen via webtools worden automatisch als lead in je CRM aangemaakt, inclusief bronvermelding. Je ontvangt optioneel een e-mailnotificatie." },
      { q: "Kan ik de widgets aanpassen aan mijn huisstijl?", a: "Absoluut. Je kunt kleuren, logo en teksten aanpassen zodat de widgets naadloos aansluiten bij je website-ontwerp." },
    ],
  },
  {
    title: "Affiliate programma",
    items: [
      { q: "Wat is het affiliate programma?", a: "Als affiliate verdien je commissie voor elke klant die je aanbrengt bij mijnhuis.nu. Je krijgt een eigen dashboard met affiliate links, kortingscodes en commissie-overzicht." },
      { q: "Hoe word ik affiliate?", a: "Neem contact met ons op via partners-worden. Na goedkeuring krijg je toegang tot je eigen affiliate dashboard waar je links en kortingscodes kunt aanmaken." },
      { q: "Hoe werkt de commissiestructuur?", a: "Je ontvangt een percentage commissie over het maandbedrag van elke aangebrachte klant, zolang het abonnement actief is. De exacte percentages worden bij aanmelding besproken." },
      { q: "Kan ik kortingscodes aanmaken voor klanten?", a: "Ja, als affiliate kun je kortingscodes aanmaken die je kunt delen met potentiële klanten. De maximale korting wordt door het platform beheerd." },
    ],
  },
  {
    title: "Prijzen & proefperiode",
    items: [
      { q: "Wat kost mijnhuis.nu?", a: "We bieden drie plannen: Starter (€49/maand), Professional (€99/maand) en Enterprise (op maat). Bekijk onze prijzenpagina voor alle details." },
      { q: "Is er een gratis proefperiode?", a: "Ja, je kunt mijnhuis.nu 30 dagen gratis uitproberen met alle Professional-functies. Geen creditcard nodig." },
      { q: "Kan ik tussentijds wisselen van plan?", a: "Absoluut. Je kunt op elk moment upgraden of downgraden. Wijzigingen gaan direct in." },
      { q: "Wat gebeurt er met mijn data als ik stop?", a: "Je kunt al je gegevens exporteren voordat je stopt. Na opzegging bewaren we je data nog 30 dagen, daarna wordt alles verwijderd." },
    ],
  },
  {
    title: "Technisch",
    items: [
      { q: "Is mijn data veilig?", a: "Ja. We gebruiken versleutelde verbindingen (SSL/TLS), regelmatige back-ups en onze servers staan in de EU. We voldoen aan de AVG/GDPR." },
      { q: "Kan ik mijn bestaande klantdata importeren?", a: "Ja, je kunt klant- en productgegevens importeren via Excel of CSV. Ons team helpt je graag bij de migratie." },
      { q: "Bieden jullie een API aan?", a: "Ja, het Enterprise-plan bevat API-toegang voor integratie met je bestaande systemen." },
      { q: "Hoe vaak worden er updates uitgerold?", a: "We rollen continu verbeteringen uit. Grote features worden maandelijks gelanceerd, bugfixes wekelijks." },
    ],
  },
  {
    title: "Support",
    items: [
      { q: "Hoe kan ik contact opnemen met support?", a: "Via e-mail op info@mijnhuis.nu of via het berichtencentrum in het platform. Professional- en Enterprise-klanten krijgen prioriteit support." },
      { q: "Bieden jullie onboarding of training aan?", a: "Ja, bij elk nieuw partneraccount bieden we een gratis onboarding-sessie aan. Enterprise-klanten krijgen uitgebreide training op maat." },
      { q: "Is er een kennisbank of handleiding?", a: "Ja, in het platform vind je uitgebreide documentatie en video-tutorials voor alle functies." },
    ],
  },
];

const FAQ = () => {
  const navigate = useNavigate();

  return (
    <>
      {/* Hero */}
      <section className="relative py-32 bg-foreground overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-primary/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-background leading-tight">
            Veelgestelde <span className="text-primary">vragen</span>
          </h1>
          <p className="mt-6 text-lg text-background/70 max-w-2xl mx-auto">
            Vind snel antwoord op de meest gestelde vragen over mijnhuis.nu.
          </p>
        </div>
      </section>

      {/* FAQ sections */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {categories.map((cat) => (
            <div key={cat.title}>
              <h2 className="text-2xl font-bold text-foreground mb-6">{cat.title}</h2>
              <Accordion type="single" collapsible className="space-y-2">
                {cat.items.map((item, i) => (
                  <AccordionItem key={i} value={`${cat.title}-${i}`} className="bg-card rounded-xl border-0 shadow-sm px-6">
                    <AccordionTrigger className="text-left font-medium">{item.q}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}

          <div className="text-center pt-8">
            <p className="text-muted-foreground mb-4">Staat je vraag er niet bij?</p>
            <p className="text-sm text-muted-foreground mb-6">
              Neem contact op via <strong>info@mijnhuis.nu</strong> of bekijk onze{" "}
              <Link to="/prijzen" className="text-primary hover:underline">prijzenpagina</Link> en{" "}
              <Link to="/over-ons" className="text-primary hover:underline">over ons</Link> pagina voor meer informatie.
            </p>
            <Button size="lg" className="rounded-full px-8 h-12" onClick={() => navigate("/signup")}>
              Gratis proberen <ArrowRight size={18} />
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default FAQ;
