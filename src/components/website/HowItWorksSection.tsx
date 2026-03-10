import { FileText, Search, Wrench } from "lucide-react";

const steps = [
  {
    icon: FileText,
    step: "01",
    title: "Aanvraag",
    description:
      "Vul je gegevens in en geef aan welke verduurzaming je interesseert. Binnen 24 uur nemen we contact op.",
  },
  {
    icon: Search,
    step: "02",
    title: "Schouw & Advies",
    description:
      "Een gecertificeerde adviseur komt langs voor een gratis schouw en stelt een persoonlijk plan op.",
  },
  {
    icon: Wrench,
    step: "03",
    title: "Installatie",
    description:
      "Onze vakmensen installeren alles vakkundig. Na oplevering krijg je een compleet certificaat.",
  },
];

const HowItWorksSection = () => (
  <section id="hoe-het-werkt" className="py-20 lg:py-28 bg-background">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">
          Hoe het werkt
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
          In 3 stappen verduurzaamd
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
        {steps.map((s, i) => (
          <div key={s.step} className="relative text-center group">
            {/* Connector line */}
            {i < steps.length - 1 && (
              <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-px bg-border" />
            )}

            <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-6 group-hover:bg-primary/20 transition-colors">
              <s.icon className="text-primary" size={28} />
              <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                {s.step}
              </span>
            </div>

            <h3 className="text-xl font-semibold text-foreground mb-2">
              {s.title}
            </h3>
            <p className="text-muted-foreground leading-relaxed max-w-xs mx-auto">
              {s.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorksSection;
