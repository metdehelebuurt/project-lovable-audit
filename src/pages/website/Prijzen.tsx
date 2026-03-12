import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Starter",
    price: "49",
    description: "Voor zelfstandige adviseurs en installateurs die net starten met digitalisering.",
    features: [
      "1 gebruiker",
      "Offertes op locatie",
      "Digitale schouwen",
      "Klant- & leadbeheer",
      "E-mail support",
      "500 MB opslag",
    ],
    popular: false,
  },
  {
    name: "Professional",
    price: "99",
    description: "Voor groeiende bedrijven met meerdere medewerkers en meer volume.",
    features: [
      "Tot 5 gebruikers",
      "Alles van Starter",
      "Planning & agenda",
      "Rapportages & analytics",
      "Documentbeheer",
      "Productcatalogus",
      "5 GB opslag",
      "Prioriteit support",
    ],
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Op maat",
    description: "Voor grote organisaties met specifieke wensen en hoge volumes.",
    features: [
      "Onbeperkt gebruikers",
      "Alles van Professional",
      "API-toegang",
      "SSO / SAML",
      "Dedicated accountmanager",
      "Onbeperkte opslag",
      "Custom integraties",
      "SLA garantie",
    ],
    popular: false,
  },
];

const faqItems = [
  { q: "Kan ik het platform eerst gratis proberen?", a: "Ja! Je kunt mijnhuis.nu 30 dagen gratis uitproberen met alle Professional-functies. Geen creditcard nodig." },
  { q: "Kan ik tussentijds upgraden of downgraden?", a: "Absoluut. Je kunt op elk moment wisselen van plan. Bij een upgrade krijg je direct toegang tot de nieuwe functies." },
  { q: "Zijn er verborgen kosten?", a: "Nee, de genoemde prijzen zijn alles. Geen setup-kosten, geen verborgen toeslagen. BTW wordt apart berekend." },
  { q: "Wat gebeurt er na de proefperiode?", a: "Na 30 dagen kies je een plan dat bij je past. Je data blijft bewaard. Kies je ervoor om te stoppen, dan kun je je gegevens exporteren." },
  { q: "Bieden jullie korting voor jaarlijkse betaling?", a: "Ja, bij jaarlijkse betaling ontvang je 2 maanden gratis. Neem contact op voor meer informatie." },
];

const Prijzen = () => {
  const navigate = useNavigate();

  return (
    <>
      {/* Hero */}
      <section className="relative py-32 bg-foreground overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-primary/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-background leading-tight">
            Eerlijke <span className="text-primary">prijzen</span>, geen verrassingen
          </h1>
          <p className="mt-6 text-lg text-background/70 max-w-2xl mx-auto">
            Kies het plan dat bij je bedrijf past. Start met 30 dagen gratis proberen.
          </p>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="py-20 -mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`rounded-2xl border-0 shadow-md relative ${plan.popular ? "ring-2 ring-primary shadow-xl scale-105" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-4 py-1 rounded-full">
                    Meest gekozen
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <p className="text-muted-foreground text-sm mt-1">{plan.description}</p>
                  <div className="mt-4">
                    {plan.price === "Op maat" ? (
                      <span className="text-3xl font-bold text-foreground">Op maat</span>
                    ) : (
                      <>
                        <span className="text-4xl font-bold text-foreground">€{plan.price}</span>
                        <span className="text-muted-foreground text-sm"> / maand</span>
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                        <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full rounded-full h-11 ${plan.popular ? "" : "variant-outline"}`}
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => navigate(plan.price === "Op maat" ? "/contact" : "/signup")}
                  >
                    {plan.price === "Op maat" ? "Neem contact op" : "Start gratis proefperiode"}
                    <ArrowRight size={16} />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-muted/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground text-center mb-10">Veelgestelde vragen over prijzen</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {faqItems.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="bg-card rounded-xl border-0 shadow-sm px-6">
                <AccordionTrigger className="text-left font-medium">{item.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <p className="text-center mt-8 text-muted-foreground text-sm">
            Meer vragen? Bekijk onze <Link to="/veelgestelde-vragen" className="text-primary hover:underline">volledige FAQ-pagina</Link>.
          </p>
        </div>
      </section>
    </>
  );
};

export default Prijzen;
