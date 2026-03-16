import { TrendingUp, Clock, Award, Cloud, Globe, Handshake, X, Check } from "lucide-react";
import CTASection from "@/components/website/CTASection";

const benefits = [
  {
    icon: TrendingUp,
    title: "Meer omzet genereren",
    description:
      "Maak sneller offertes, volg leads beter op en verhoog je conversie. Gemiddeld 30% meer omzet binnen 6 maanden.",
  },
  {
    icon: Clock,
    title: "Minder administratie",
    description:
      "Automatiseer je papierwerk. Digitale schouwen, automatische rapportages en gestroomlijnde facturatie.",
  },
  {
    icon: Award,
    title: "Professionele uitstraling",
    description:
      "Verstuur branded offertes en rapporten. Laat je klanten zien dat je een professional bent met moderne tools.",
  },
  {
    icon: Cloud,
    title: "Altijd en overal toegang",
    description:
      "Cloudgebaseerd platform. Werk op locatie, thuis of op kantoor. Altijd actuele data, op elk apparaat.",
  },
  {
    icon: Globe,
    title: "Website-widgets",
    description:
      "Embed besparingscalculatoren en contactformulieren op je eigen website. Leads stromen automatisch je CRM in.",
  },
  {
    icon: Handshake,
    title: "Affiliate programma",
    description:
      "Verdien mee als wederverkoper. Genereer affiliate links, maak kortingscodes aan en ontvang commissie per aangebrachte klant.",
  },
];

const comparison = [
  { feature: "Offertes maken", without: false, with: true },
  { feature: "Digitale schouwen", without: false, with: true },
  { feature: "Planning & agenda", without: false, with: true },
  { feature: "CRM & leadbeheer", without: false, with: true },
  { feature: "Website-widgets", without: false, with: true },
  { feature: "Alles in één systeem", without: false, with: true },
  { feature: "Excel-bestanden rondmailen", without: true, with: false },
  { feature: "Papieren formulieren invullen", without: true, with: false },
];

const Voordelen = () => (
  <>
    {/* Hero */}
    <section className="pt-32 pb-16 lg:pb-20 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">
            Waarom mijnhuis.nu
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
            Voordelen die het verschil maken
          </h1>
          <p className="mt-5 text-muted-foreground text-lg leading-relaxed max-w-2xl mx-auto">
            Ontdek waarom honderden professionals in de verduurzamingsbranche
            kiezen voor mijnhuis.nu.
          </p>
        </div>
      </div>
    </section>

    {/* Benefits grid */}
    <section className="py-16 lg:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="flex gap-5 p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/20 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <b.icon className="text-primary" size={22} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  {b.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {b.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Stats strip */}
    <section className="py-12 bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "30%", label: "Meer omzet" },
            { value: "2u", label: "Admin bespaard/dag" },
            { value: "40%", label: "Hogere conversie" },
            { value: "500+", label: "Actieve gebruikers" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl sm:text-4xl font-bold text-primary-foreground">{stat.value}</p>
              <p className="text-primary-foreground/70 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Comparison table */}
    <section className="py-16 lg:py-24 bg-card">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            Zonder vs. met mijnhuis.nu
          </h2>
          <p className="mt-3 text-muted-foreground">
            Zie het verschil in je dagelijkse werkwijze.
          </p>
        </div>
        <div className="rounded-2xl border border-border/50 overflow-hidden">
          <div className="grid grid-cols-3 bg-muted/50 px-6 py-3 text-sm font-semibold text-foreground">
            <span>Werkwijze</span>
            <span className="text-center">Zonder</span>
            <span className="text-center text-primary">Met mijnhuis.nu</span>
          </div>
          {comparison.map((row, i) => (
            <div
              key={row.feature}
              className={`grid grid-cols-3 px-6 py-3 text-sm items-center ${
                i % 2 === 0 ? "bg-background" : "bg-card"
              }`}
            >
              <span className="text-foreground">{row.feature}</span>
              <span className="flex justify-center">
                {row.without ? (
                  <Check className="text-muted-foreground" size={18} />
                ) : (
                  <X className="text-destructive/50" size={18} />
                )}
              </span>
              <span className="flex justify-center">
                {row.with ? (
                  <Check className="text-primary" size={18} />
                ) : (
                  <X className="text-destructive/50" size={18} />
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>

    <CTASection />
  </>
);

export default Voordelen;
