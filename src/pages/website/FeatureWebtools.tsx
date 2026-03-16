import { Globe, Calculator, Mail, Paintbrush, Zap, Code } from "lucide-react";
import FeaturePageLayout from "@/components/website/FeaturePageLayout";

const FeatureWebtools = () => (
  <FeaturePageLayout
    badge="Webtools & widgets"
    title="Embeddable tools"
    highlight="voor je website"
    subtitle="Plaats besparingscalculatoren en contactformulieren op je eigen website. Leads stromen automatisch je CRM in — zonder extra werk."
    heroImage="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1920&q=80&fm=webp"
    features={[
      { icon: Calculator, title: "Besparingscalculatoren", description: "Kant-en-klare calculatoren voor zonnepanelen, warmtepompen, isolatie, laadpalen en thuisbatterijen. Bezoekers berekenen hun besparing en worden direct lead." },
      { icon: Mail, title: "Contactformulieren", description: "Professionele contactformulieren die inzendingen automatisch als lead aanmaken in je CRM. Inclusief e-mailnotificaties." },
      { icon: Paintbrush, title: "Eigen huisstijl", description: "Pas kleuren, logo en teksten aan zodat de widgets naadloos aansluiten bij je website-ontwerp." },
      { icon: Code, title: "Eenvoudig embedden", description: "Kopieer de embed-code en plak deze in je website. Werkt met WordPress, Wix, Squarespace en elke andere website." },
      { icon: Zap, title: "Automatische leadverwerking", description: "Inzendingen worden direct als lead aangemaakt met de juiste bron. Geen handmatige invoer meer nodig." },
      { icon: Globe, title: "Onbeperkt widgets", description: "Maak meerdere widgets aan voor verschillende pagina's of campagnes. Elke widget met eigen configuratie en notificatie-e-mail." },
    ]}
    detailTitle="Waarom webtools via mijnhuis.nu?"
    detailText={[
      "Je website is vaak het eerste contactpunt met potentiële klanten. Met de webtools van mijnhuis.nu maak je van passieve bezoekers actieve leads. Een besparingscalculator triggert interesse en levert direct contactgegevens op.",
      "Alle inzendingen worden automatisch verwerkt als lead in je CRM. Je hoeft niets over te typen of te importeren. De bron wordt automatisch geregistreerd, zodat je precies weet welke widget of pagina de meeste leads genereert.",
      "De widgets zijn volledig aanpasbaar aan je huisstijl. Kies je primaire kleuren, upload je logo en pas de teksten aan. Het resultaat is een professionele tool die eruitziet alsof hij speciaal voor jouw website is gebouwd.",
      "Technisch is het simpel: kopieer een stukje embed-code en plak het in je website. De widgets werken op elke website — van WordPress tot custom HTML. Geen technische kennis vereist.",
    ]}
    relatedPages={[
      { label: "Klant- & leadbeheer", href: "/features/leadbeheer" },
      { label: "Energieadvies tools", href: "/features/energieadvies" },
      { label: "Offertes op locatie", href: "/features/offertes" },
      { label: "Rapportages", href: "/features/rapportages" },
    ]}
  />
);

export default FeatureWebtools;
