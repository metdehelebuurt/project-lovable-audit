import { FileText, Zap, MapPin, Calculator, Send, Clock } from "lucide-react";
import FeaturePageLayout from "@/components/website/FeaturePageLayout";

const FeatureOffertes = () => (
  <FeaturePageLayout
    badge="Offertes op locatie"
    title="Professionele offertes"
    highlight="ter plekke opstellen"
    subtitle="Maak en verstuur binnen enkele minuten een complete offerte bij de klant aan de keukentafel. Inclusief productcatalogus, prijsberekeningen en digitale handtekening."
    heroImage="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1920&q=80&fm=webp"
    features={[
      { icon: MapPin, title: "Op locatie werken", description: "Stel offertes samen terwijl je bij de klant bent. Geen kantoorwerk meer achteraf — alles direct geregeld." },
      { icon: Calculator, title: "Automatische berekeningen", description: "Prijzen, BTW en kortingen worden automatisch berekend op basis van je productcatalogus en marges." },
      { icon: FileText, title: "Professionele templates", description: "Gebruik je eigen huisstijl met aanpasbare offertetemplates die er altijd professioneel uitzien." },
      { icon: Send, title: "Direct versturen", description: "Verstuur de offerte per e-mail direct vanuit het platform. De klant kan online accepteren of feedback geven." },
      { icon: Clock, title: "Statustracking", description: "Volg de status van elke offerte: concept, verzonden, geaccepteerd of afgewezen. Altijd actueel overzicht." },
      { icon: Zap, title: "Koppeling met schouwen", description: "Start een offerte direct vanuit een uitgevoerde schouw. Alle klantgegevens en technische data worden automatisch overgenomen." },
    ]}
    detailTitle="Waarom offertes op locatie met mijnhuis.nu?"
    detailText={[
      "In de verduurzamingsbranche is snelheid essentieel. Klanten verwachten een snelle, professionele aanbieding. Met mijnhuis.nu maak je ter plekke bij de klant een volledige offerte aan, inclusief productkeuzes uit je catalogus, arbeidskosten en BTW-berekeningen.",
      "Het platform biedt slimme templates die je kunt aanpassen aan je huisstijl. Voeg je logo, contactgegevens en algemene voorwaarden toe en hergebruik ze bij elke offerte. Zo bespaar je tijd én straal je professionaliteit uit.",
      "Na het opstellen verstuur je de offerte direct per e-mail. De klant ontvangt een overzichtelijk document en kan online reageren. Jij ziet in realtime of de offerte is geopend, geaccepteerd of dat er feedback is. Geen eindeloos heen-en-weer mailen meer.",
      "Doordat offertes direct gekoppeld zijn aan schouwen en leads, heb je altijd een compleet klantdossier. Van eerste contact tot getekende opdracht — alles in één systeem.",
    ]}
    relatedPages={[
      { label: "Digitale schouwen", href: "/features/digitale-schouwen" },
      { label: "Planning & agenda", href: "/features/planning" },
      { label: "Klant- & leadbeheer", href: "/features/leadbeheer" },
      { label: "Rapportages", href: "/features/rapportages" },
    ]}
  />
);

export default FeatureOffertes;
