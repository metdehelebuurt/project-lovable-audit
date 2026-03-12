import { BarChart3, PieChart, Download, TrendingUp, Eye, Calendar } from "lucide-react";
import FeaturePageLayout from "@/components/website/FeaturePageLayout";

const FeatureRapportages = () => (
  <FeaturePageLayout
    badge="Rapportages & analytics"
    title="Inzicht in je"
    highlight="bedrijfsprestaties"
    subtitle="Dashboards en rapportages die je helpen betere beslissingen te nemen. Van omzetoverzicht tot conversieratio's — alles op één plek."
    heroImage="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1920&q=80&fm=webp"
    features={[
      { icon: BarChart3, title: "Visuele dashboards", description: "Bekijk je KPI's in overzichtelijke grafieken en diagrammen. Van leadaantallen tot omzet per maand." },
      { icon: PieChart, title: "Conversieratio's", description: "Meet hoeveel leads daadwerkelijk klant worden. Identificeer knelpunten in je salesproces en verbeter je conversie." },
      { icon: TrendingUp, title: "Omzetprognoses", description: "Voorspel je omzet op basis van lopende offertes en geplande installaties. Plan vooruit met vertrouwen." },
      { icon: Download, title: "Exporteren", description: "Exporteer rapportages naar Excel of PDF. Ideaal voor boekhouding, managementoverleg of subsidieaanvragen." },
      { icon: Eye, title: "Teamprestaties", description: "Vergelijk prestaties per adviseur of installateur. Wie converteert het best? Waar zit ruimte voor coaching?" },
      { icon: Calendar, title: "Periodefilters", description: "Bekijk cijfers per week, maand, kwartaal of jaar. Vergelijk periodes en ontdek seizoenspatronen." },
    ]}
    detailTitle="Data-gedreven groeien met mijnhuis.nu"
    detailText={[
      "Veel installateurs en adviseurs werken op gevoel. Hoeveel leads kwamen er deze maand binnen? Wat is de gemiddelde doorlooptijd van offerte tot installatie? Met mijnhuis.nu heb je deze antwoorden altijd paraat.",
      "Het analytics-dashboard toont je belangrijkste KPI's in real-time. Zie direct hoeveel leads er openstaan, welke offertes binnenkort verlopen en hoe je omzet zich ontwikkelt ten opzichte van vorige maand.",
      "Voor bedrijfseigenaren en managers bieden de rapportages inzicht in teamprestaties. Welke adviseur heeft de hoogste conversieratio? Welke installateur rondt projecten het snelst af? Gebruik deze data voor gerichte coaching en bijsturing.",
      "Alle data is exporteerbaar. Genereer een maandrapport voor je boekhouder, maak een overzicht voor een subsidieaanvraag of bereid je voor op een strategisch overleg — met concrete cijfers in plaats van aannames.",
    ]}
    relatedPages={[
      { label: "Offertes op locatie", href: "/features/offertes" },
      { label: "Digitale schouwen", href: "/features/digitale-schouwen" },
      { label: "Planning & agenda", href: "/features/planning" },
      { label: "Klant- & leadbeheer", href: "/features/leadbeheer" },
    ]}
  />
);

export default FeatureRapportages;
