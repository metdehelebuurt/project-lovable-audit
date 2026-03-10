import { FileText, Search, CalendarDays, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: FileText,
    title: "Offertes op locatie",
    description:
      "Genereer direct professionele offertes bij de klant thuis. Producten selecteren, prijzen berekenen en versturen — ter plekke.",
  },
  {
    icon: Search,
    title: "Digitale schouwen",
    description:
      "Voer schouwen uit met digitale formulieren, maak foto's en genereer automatisch rapportages. Geen papierwerk meer.",
  },
  {
    icon: CalendarDays,
    title: "Planning & agenda",
    description:
      "Beheer installaties, schouwen en afspraken in één overzichtelijke planning. Wijs taken toe aan je team.",
  },
  {
    icon: Users,
    title: "Klant- & leadbeheer",
    description:
      "Volg je leads van eerste contact tot installatie. Complete CRM-pipeline speciaal voor de verduurzamingsbranche.",
  },
];

const ServicesSection = () => (
  <section id="features" className="py-20 lg:py-28 bg-card">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">
          Platform features
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
          Alles wat je nodig hebt, in één platform
        </h2>
        <p className="mt-4 text-muted-foreground text-lg">
          Van het eerste klantcontact tot de oplevering — mijnhuis.nu
          stroomlijnt je hele werkproces.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature) => (
          <Card
            key={feature.title}
            className="group border-border/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 cursor-default"
          >
            <CardContent className="p-6 pt-8">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="text-primary" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
);

export default ServicesSection;
