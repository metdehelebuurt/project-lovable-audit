import { CalendarDays, Users, Bell, Repeat, Eye, MapPin } from "lucide-react";
import FeaturePageLayout from "@/components/website/FeaturePageLayout";

const FeaturePlanning = () => (
  <FeaturePageLayout
    badge="Planning & agenda"
    title="Slimme planning"
    highlight="voor je hele team"
    subtitle="Beheer afspraken, schouwen en installaties vanuit één overzichtelijke agenda. Wijs taken toe aan teamleden en voorkom dubbele boekingen."
    heroImage="https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=1920&q=80&fm=webp"
    features={[
      { icon: CalendarDays, title: "Visuele agenda", description: "Bekijk alle afspraken in dag-, week- of maandweergave. Drag-and-drop om snel te herplannen." },
      { icon: Users, title: "Teamplanning", description: "Zie de beschikbaarheid van adviseurs en installateurs naast elkaar. Wijs taken toe aan de juiste persoon." },
      { icon: Bell, title: "Herinneringen", description: "Automatische herinneringen per e-mail of notificatie voor aankomende afspraken en deadlines." },
      { icon: Repeat, title: "Terugkerende taken", description: "Plan terugkerende onderhoudsmomenten of follow-ups in en laat het systeem je eraan herinneren." },
      { icon: Eye, title: "Real-time overzicht", description: "Altijd actueel: wijzigingen in de planning zijn direct zichtbaar voor het hele team." },
      { icon: MapPin, title: "Routeoptimalisatie", description: "Bekijk afspraken op de kaart en plan je route efficiënt. Bespaar reistijd en brandstofkosten." },
    ]}
    detailTitle="Waarom planning via mijnhuis.nu?"
    detailText={[
      "Een goed geplande dag betekent meer klanten helpen, minder reistijd en minder stress. Met de ingebouwde planner van mijnhuis.nu heb je altijd overzicht over wie, wat en wanneer doet.",
      "De agenda is direct gekoppeld aan schouwen, offertes en installaties. Wanneer je een schouw inplant, verschijnt deze automatisch in de agenda van de toegewezen adviseur. Hetzelfde geldt voor installaties: plan een startdatum en het hele team is op de hoogte.",
      "Voor bedrijven met meerdere medewerkers is de teamweergave onmisbaar. Zie in één oogopslag wie beschikbaar is, wie overbelast wordt en waar ruimte zit. Zo verdeel je het werk eerlijk en efficiënt.",
      "Herinneringen en notificaties zorgen ervoor dat er geen afspraak wordt gemist. Klanten kunnen optioneel een bevestiging ontvangen, wat no-shows vermindert en je professionele uitstraling versterkt.",
    ]}
    relatedPages={[
      { label: "Offertes op locatie", href: "/features/offertes" },
      { label: "Digitale schouwen", href: "/features/digitale-schouwen" },
      { label: "Klant- & leadbeheer", href: "/features/leadbeheer" },
      { label: "Rapportages", href: "/features/rapportages" },
    ]}
  />
);

export default FeaturePlanning;
