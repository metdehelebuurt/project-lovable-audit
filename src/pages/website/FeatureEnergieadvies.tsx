import { Lightbulb, Battery, Zap, BarChart3, FileText, Settings } from "lucide-react";
import FeaturePageLayout from "@/components/website/FeaturePageLayout";

const FeatureEnergieadvies = () => (
  <FeaturePageLayout
    badge="Energieadvies tools"
    title="Onderbouwd advies"
    highlight="op locatie"
    subtitle="Geef klanten direct inzicht in hun besparingspotentieel met de energieadvies-wizard en thuisbatterij selector. Data-gedreven advies dat vertrouwen wekt."
    heroImage="https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1920&q=80&fm=webp"
    features={[
      { icon: Lightbulb, title: "Energieadvies wizard", description: "Stapsgewijze wizard die woninggegevens, verbruik en wensen combineert tot een concreet verduurzamingsadvies met terugverdientijden." },
      { icon: Battery, title: "Thuisbatterij selector", description: "Help klanten de juiste thuisbatterij te kiezen op basis van hun verbruiksprofiel, zonnepanelen en wensen." },
      { icon: Zap, title: "Besparingsberekeningen", description: "Bereken direct hoeveel een klant kan besparen met zonnepanelen, isolatie of een warmtepomp. Inclusief subsidiemogelijkheden." },
      { icon: BarChart3, title: "Visuele resultaten", description: "Toon resultaten met duidelijke grafieken en vergelijkingen. Klanten begrijpen direct wat de investering oplevert." },
      { icon: FileText, title: "Adviesrapport genereren", description: "Genereer een professioneel adviesrapport dat je met de klant kunt delen. Inclusief productaanbevelingen en terugverdientijden." },
      { icon: Settings, title: "Configureerbare parameters", description: "Pas energieprijzen, subsidietarieven en installatiekosten aan. Zo blijft je advies altijd actueel en accuraat." },
    ]}
    detailTitle="Waarom energieadvies tools van mijnhuis.nu?"
    detailText={[
      "Klanten willen weten wat verduurzaming hen oplevert voordat ze beslissen. Met de energieadvies tools van mijnhuis.nu geef je ter plekke een onderbouwd antwoord. Geen giswerk, maar concrete berekeningen op basis van hun woonsituatie.",
      "De energieadvies-wizard leidt je stap voor stap door het proces: woningtype, huidig verbruik, wensen en budget. Op basis van deze input genereert het systeem een concreet advies met terugverdientijden per maatregel.",
      "De thuisbatterij selector helpt klanten de juiste batterij te kiezen. Op basis van hun energieverbruik, bestaande zonnepanelen en gewenste zelfvoorzieningsgraad wordt de optimale capaciteit berekend.",
      "Alle berekeningen zijn exporteerbaar als professioneel rapport. Deel het met de klant als PDF of gebruik het als bijlage bij je offerte. Zo combineer je advies en verkoop in één vloeiend proces.",
    ]}
    relatedPages={[
      { label: "Webtools & widgets", href: "/features/webtools" },
      { label: "Offertes op locatie", href: "/features/offertes" },
      { label: "Digitale schouwen", href: "/features/digitale-schouwen" },
      { label: "Rapportages", href: "/features/rapportages" },
    ]}
  />
);

export default FeatureEnergieadvies;
