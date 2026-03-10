import { TrendingUp, Clock, Award, Cloud } from "lucide-react";

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
];

const BenefitsSection = () => (
  <section id="voordelen" className="py-20 lg:py-28 bg-card">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">
          Waarom mijnhuis.nu
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
          Voordelen die het verschil maken
        </h2>
      </div>

      <div className="grid sm:grid-cols-2 gap-8">
        {benefits.map((b) => (
          <div
            key={b.title}
            className="flex gap-5 p-6 rounded-2xl bg-background border border-border/50 hover:border-primary/20 hover:shadow-lg transition-all duration-300"
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
);

export default BenefitsSection;
