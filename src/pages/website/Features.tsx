import { FileText, Search, CalendarDays, Users, BarChart3, Globe, Lightbulb, FolderOpen, CheckCircle, ArrowRight } from "lucide-react";
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

const usps = [
  "Eén platform in plaats van 5+ losse tools",
  "Speciaal gebouwd voor de verduurzamingsbranche",
  "Werkt op tablet, laptop en telefoon",
  "Dagelijks updates en nieuwe functionaliteiten",
];

const Features = () => (
  <>
    {/* Hero */}
    <section className="pt-32 pb-16 lg:pb-20 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">
            Platform features
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
            Alles wat je nodig hebt, in één platform
          </h1>
          <p className="mt-5 text-muted-foreground text-lg leading-relaxed max-w-2xl mx-auto">
            Van het eerste klantcontact tot de oplevering — mijnhuis.nu
            stroomlijnt je hele werkproces. Ontdek alle mogelijkheden hieronder.
          </p>
        </div>
      </div>
    </section>

    {/* Feature cards */}
    <section className="py-16 lg:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                  <span className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Meer info <ArrowRight size={14} />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>

    {/* Waarom alles-in-één */}
    <section className="py-16 lg:py-24 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">
              Waarom alles-in-één?
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              Stop met schakelen tussen losse tools
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              De meeste installateurs en adviseurs werken met een mix van Excel,
              WhatsApp, losse agenda's en papieren formulieren. Mijnhuis.nu
              vervangt al die losse systemen door één geïntegreerd platform —
              ontworpen voor jouw branche.
            </p>
            <ul className="space-y-3">
              {usps.map((usp) => (
                <li key={usp} className="flex items-start gap-3">
                  <CheckCircle className="text-primary flex-shrink-0 mt-0.5" size={20} />
                  <span className="text-foreground">{usp}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: "8+", label: "Geïntegreerde modules" },
              { value: "500+", label: "Actieve professionals" },
              { value: "30%", label: "Meer omzet gemiddeld" },
              { value: "2u", label: "Admin bespaard per dag" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="p-6 rounded-2xl bg-background border border-border/50 text-center"
              >
                <p className="text-3xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    <CTASection />
  </>
);

export default Features;
