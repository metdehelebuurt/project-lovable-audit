import { Sun, Thermometer, Home, BatteryCharging } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const services = [
  {
    icon: Sun,
    title: "Zonnepanelen",
    description:
      "Bespaar op je energierekening met hoogwaardige zonnepanelen. Wij regelen alles van schouw tot installatie.",
  },
  {
    icon: Thermometer,
    title: "Warmtepompen",
    description:
      "Verwarm je huis efficiënt en duurzaam met een warmtepomp. Geschikt voor nieuwbouw én bestaande woningen.",
  },
  {
    icon: Home,
    title: "Isolatie",
    description:
      "Dak-, muur- en vloerisolatie voor optimaal comfort en lagere stookkosten. Direct merkbaar verschil.",
  },
  {
    icon: BatteryCharging,
    title: "Thuisbatterij & Laadpaal",
    description:
      "Sla je eigen energie op of laad je auto thuis. Slimme oplossingen voor maximaal rendement.",
  },
];

const ServicesSection = () => (
  <section id="diensten" className="py-20 lg:py-28 bg-card">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">
          Onze diensten
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
          Alles voor een duurzaam huis
        </h2>
        <p className="mt-4 text-muted-foreground text-lg">
          Van advies tot installatie — wij bieden een compleet pakket aan
          verduurzamingsoplossingen.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {services.map((service) => (
          <Card
            key={service.title}
            className="group border-border/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 cursor-default"
          >
            <CardContent className="p-6 pt-8">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                <service.icon className="text-primary" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {service.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {service.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
);

export default ServicesSection;
