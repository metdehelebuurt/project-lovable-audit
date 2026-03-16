import { UserPlus, Filter, TrendingUp, FolderOpen, Mail, Target } from "lucide-react";
import FeaturePageLayout from "@/components/website/FeaturePageLayout";

const FeatureLeadbeheer = () => (
  <FeaturePageLayout
    badge="Klant- & leadbeheer"
    title="Leads en klanten"
    highlight="centraal beheren"
    subtitle="Van eerste contact tot tevreden klant: beheer je volledige salesfunnel in één overzichtelijk systeem. Mis nooit meer een follow-up."
    heroImage="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1920&q=80&fm=webp"
    features={[
      { icon: UserPlus, title: "Leads vastleggen", description: "Voeg leads handmatig toe of ontvang ze automatisch via je website. Alle contactgegevens op één plek." },
      { icon: Filter, title: "Slimme filters", description: "Filter op status, bron, postcode of toegewezen adviseur. Vind in seconden de lead die je zoekt." },
      { icon: TrendingUp, title: "Salesfunnel", description: "Volg leads door de funnel: nieuw → gekwalificeerd → offerte verzonden → klant. Zie direct waar actie nodig is." },
      { icon: FolderOpen, title: "Compleet klantdossier", description: "Alle schouwen, offertes, installaties en documenten van een klant in één overzichtelijk dossier." },
      { icon: Mail, title: "Communicatiehistorie", description: "Bekijk alle berichten en notities bij een lead. Iedereen in het team is altijd op de hoogte van de laatste stand." },
      { icon: Target, title: "Leadtoewijzing", description: "Wijs leads toe aan adviseurs of installateurs. Zo weet iedereen precies welke klanten bij hem of haar horen." },
    ]}
    detailTitle="Effectief leadbeheer voor verduurzamingsbedrijven"
    detailText={[
      "In een competitieve markt als verduurzaming is snelle opvolging van leads cruciaal. Uit onderzoek blijkt dat de kans op conversie met 80% daalt als je niet binnen een uur reageert. Met mijnhuis.nu heb je direct overzicht over nieuwe leads en kun je ze meteen opvolgen.",
      "Het CRM-systeem van mijnhuis.nu is speciaal ontworpen voor de verduurzamingsbranche. Geen overbodige velden of complexe configuraties — alleen wat je nodig hebt. Leg contactgegevens vast, noteer de woonsituatie en koppel direct een schouw of offerte.",
      "Voor bedrijven met meerdere adviseurs is leadtoewijzing essentieel. Verdeel leads automatisch of handmatig over je team. Elke adviseur ziet alleen zijn eigen leads en klanten, terwijl de manager het totaaloverzicht behoudt.",
      "Het klantdossier groeit mee met het project. Van eerste lead tot afgeronde installatie — alle documenten, foto's, offertes en notities zijn terug te vinden in één chronologisch overzicht. Ideaal voor nazorg en eventuele garantiekwesties.",
    ]}
    relatedPages={[
      { label: "Offertes op locatie", href: "/features/offertes" },
      { label: "Webtools & widgets", href: "/features/webtools" },
      { label: "Energieadvies tools", href: "/features/energieadvies" },
      { label: "Rapportages", href: "/features/rapportages" },
    ]}
  />
);

export default FeatureLeadbeheer;
