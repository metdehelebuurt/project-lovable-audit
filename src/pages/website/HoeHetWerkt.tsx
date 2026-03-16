import { UserPlus, Settings, Rocket, MessageSquare, Clock, Shield } from "lucide-react";
import CTASection from "@/components/website/CTASection";

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Account aanmaken",
    description:
      "Maak in een paar minuten je account aan. Kies je abonnement en krijg direct toegang tot het platform.",
    details: [
      "Kies uit Starter, Professional of Enterprise",
      "30 dagen gratis proefperiode — geen creditcard nodig",
      "Direct toegang tot alle features",
    ],
  },
  {
    icon: Settings,
    step: "02",
    title: "Team & producten instellen",
    description:
      "Voeg je teamleden toe, configureer je productcatalogus en stel je offerte-templates in.",
    details: [
      "Importeer producten via Excel of handmatig",
      "Nodig adviseurs en installateurs uit",
      "Pas offertes aan met je branding",
    ],
  },
  {
    icon: Rocket,
    step: "03",
    title: "Direct aan de slag",
    description:
      "Ga op locatie aan de slag met digitale schouwen, offertes en planning. Alles vanuit je tablet of laptop.",
    details: [
      "Maak je eerste offerte bij de klant thuis",
      "Plan schouwen en installaties in je agenda",
      "Volg leads en conversies in real-time",
    ],
  },
];

const faqs = [
  {
    q: "Hoe lang duurt het om alles in te richten?",
    a: "De meeste teams zijn binnen 30 minuten operationeel. Producten importeren kan via Excel, dus je bent snel klaar.",
  },
  {
    q: "Moet ik technische kennis hebben?",
    a: "Nee. Het platform is ontworpen voor installateurs en adviseurs, niet voor IT-specialisten. Alles werkt via een intuïtieve interface.",
  },
  {
    q: "Kan ik mijn bestaande data importeren?",
    a: "Ja. Je kunt klanten, producten en leads importeren via Excel-bestanden. Ons team helpt je graag bij de migratie.",
  },
];

const HoeHetWerkt = () => (
  <>
    {/* Hero */}
    <section className="pt-32 pb-16 lg:pb-20 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">
            Hoe het werkt
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
            In 3 stappen operationeel
          </h1>
          <p className="mt-5 text-muted-foreground text-lg leading-relaxed max-w-2xl mx-auto">
            Binnen een paar minuten ben je klaar om je eerste offerte te maken,
            een schouw in te plannen of je team uit te nodigen.
          </p>
        </div>
      </div>
    </section>

    {/* Steps */}
    <section className="py-16 lg:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-16">
          {steps.map((s, i) => (
            <div
              key={s.step}
              className={`flex flex-col lg:flex-row gap-8 lg:gap-16 items-center ${
                i % 2 === 1 ? "lg:flex-row-reverse" : ""
              }`}
            >
              <div className="flex-1">
                <div className="inline-flex items-center gap-3 mb-4">
                  <span className="w-10 h-10 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                    {s.step}
                  </span>
                  <h3 className="text-2xl font-bold text-foreground">{s.title}</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-5">
                  {s.description}
                </p>
                <ul className="space-y-2">
                  {s.details.map((d) => (
                    <li key={d} className="flex items-start gap-2 text-sm text-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1 w-full">
                <div className="aspect-video rounded-2xl bg-card border border-border/50 flex items-center justify-center">
                  <s.icon className="text-primary/30" size={64} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Snelheid strip */}
    <section className="py-12 bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-3 gap-8 text-center">
          {[
            { icon: Clock, value: "5 min", label: "Account aanmaken" },
            { icon: Settings, value: "30 min", label: "Volledig inrichten" },
            { icon: Shield, value: "30 dagen", label: "Gratis proberen" },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-2">
              <item.icon className="text-primary-foreground/70" size={24} />
              <p className="text-3xl font-bold text-primary-foreground">{item.value}</p>
              <p className="text-primary-foreground/70 text-sm">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* FAQ */}
    <section className="py-16 lg:py-24 bg-card">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">
            Veelgestelde vragen
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            Vragen over starten?
          </h2>
        </div>
        <div className="space-y-6">
          {faqs.map((faq) => (
            <div key={faq.q} className="p-6 rounded-2xl bg-background border border-border/50">
              <div className="flex items-start gap-3">
                <MessageSquare className="text-primary flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="font-semibold text-foreground mb-2">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    <CTASection />
  </>
);

export default HoeHetWerkt;
