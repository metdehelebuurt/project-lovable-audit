import { ShieldCheck, Users, PiggyBank, HeartHandshake } from "lucide-react";

const benefits = [
  {
    icon: ShieldCheck,
    title: "Gecertificeerde installateurs",
    description: "Al onze vakmensen zijn erkend en gecertificeerd. Kwaliteit en veiligheid gegarandeerd.",
  },
  {
    icon: Users,
    title: "Persoonlijk advies",
    description: "Een vaste adviseur die je kent, begeleidt je door het hele traject. Geen callcenter.",
  },
  {
    icon: PiggyBank,
    title: "Scherpe prijzen",
    description: "Dankzij ons netwerk van partners bieden wij scherpe, eerlijke prijzen zonder verborgen kosten.",
  },
  {
    icon: HeartHandshake,
    title: "Subsidie-hulp",
    description: "We helpen je alle beschikbare subsidies en regelingen aan te vragen. Maximaal voordeel.",
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
          <div key={b.title} className="flex gap-5 p-6 rounded-2xl bg-background border border-border/50 hover:border-primary/20 hover:shadow-lg transition-all duration-300">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <b.icon className="text-primary" size={22} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-1">{b.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{b.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default BenefitsSection;
