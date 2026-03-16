import { FileText, Search, CalendarDays, Users, BarChart3, Globe, Lightbulb, FolderOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import CTASection from "@/components/website/CTASection";

const features = [
  {
    icon: FileText,
    title: "Offertes op locatie",
    description:
      "Genereer direct professionele offertes bij de klant thuis. Producten selecteren, prijzen berekenen en versturen — ter plekke.",
    href: "/features/offertes",
  },
  {
    icon: Search,
    title: "Digitale schouwen",
    description:
      "Voer schouwen uit met digitale formulieren, maak foto's en genereer automatisch rapportages. Geen papierwerk meer.",
    href: "/features/digitale-schouwen",
  },
  {
    icon: CalendarDays,
    title: "Planning & agenda",
    description:
      "Beheer installaties, schouwen en afspraken in één overzichtelijke planning. Wijs taken toe aan je team.",
    href: "/features/planning",
  },
  {
    icon: Users,
    title: "Klant- & leadbeheer",
    description:
      "Volg je leads van eerste contact tot installatie. Complete CRM-pipeline speciaal voor de verduurzamingsbranche.",
    href: "/features/leadbeheer",
  },
  {
    icon: BarChart3,
    title: "Rapportages & analytics",
    description:
      "Dashboards met KPI's, conversieratio's en omzetprognoses. Exporteer rapportages naar Excel of PDF.",
    href: "/features/rapportages",
  },
  {
    icon: Globe,
    title: "Webtools & widgets",
    description:
      "Embed besparingscalculatoren en contactformulieren op je eigen website. Leads stromen automatisch binnen.",
    href: "/features/webtools",
  },
  {
    icon: Lightbulb,
    title: "Energieadvies tools",
    description:
      "Geef klanten direct inzicht met de energieadvies-wizard en thuisbatterij selector. Onderbouw je advies met data.",
    href: "/features/energieadvies",
  },
  {
    icon: FolderOpen,
    title: "Documentbeheer",
    description:
      "Bewaar contracten, certificaten, foto's en rapporten centraal. Alles gekoppeld aan de juiste klant of installatie.",
    href: "/features/offertes",
  },
];

const Features = () => (
  <>
    <section className="pt-32 pb-20 lg:pb-28 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">
            Platform features
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
            Alles wat je nodig hebt, in één platform
          </h1>
          <p className="mt-4 text-muted-foreground text-lg">
            Van het eerste klantcontact tot de oplevering — mijnhuis.nu
            stroomlijnt je hele werkproces.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <Link key={feature.title} to={feature.href} className="block group">
              <Card className="h-full border-border/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
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
            </Link>
          ))}
        </div>
      </div>
    </section>
    <CTASection />
  </>
);

export default Features;
