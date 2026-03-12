import { Camera, ClipboardCheck, Layers, FileDown, Smartphone, ShieldCheck } from "lucide-react";
import FeaturePageLayout from "@/components/website/FeaturePageLayout";

const FeatureSchouwen = () => (
  <FeaturePageLayout
    badge="Digitale schouwen"
    title="Digitale schouwen"
    highlight="zonder papierwerk"
    subtitle="Voer professionele schouwen uit op locatie met je tablet of telefoon. Foto's, metingen en checklists — alles digitaal vastgelegd en direct beschikbaar."
    heroImage="https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1920&q=80&fm=webp"
    features={[
      { icon: Camera, title: "Foto's toevoegen", description: "Maak foto's op locatie en koppel ze direct aan de schouw. Documenteer de situatie visueel voor een compleet dossier." },
      { icon: ClipboardCheck, title: "Digitale checklists", description: "Werk categoriespecifieke checklists af voor zonnepanelen, warmtepompen, isolatie en meer. Niets wordt vergeten." },
      { icon: Layers, title: "Meerdere categorieën", description: "Van zonnepanelen tot HR-glas: kies de juiste schouwcategorie en krijg automatisch de bijbehorende velden en checklists." },
      { icon: Smartphone, title: "Mobiel werken", description: "Optimaal ontworpen voor tablets en smartphones. Voer schouwen uit zonder laptop — ideaal voor op het dak of in de kruipruimte." },
      { icon: FileDown, title: "Rapport genereren", description: "Genereer automatisch een professioneel schouwrapport in PDF. Deel het met de klant of gebruik het als basis voor een offerte." },
      { icon: ShieldCheck, title: "Kwaliteitsborging", description: "Standaard checklists zorgen ervoor dat elke schouw aan dezelfde kwaliteitseisen voldoet, ongeacht wie hem uitvoert." },
    ]}
    detailTitle="Hoe werken digitale schouwen met mijnhuis.nu?"
    detailText={[
      "Een schouw is het fundament van elk verduurzamingsproject. Met mijnhuis.nu vervang je papieren formulieren en losse foto's door een gestructureerd digitaal proces. Selecteer de categorie — zonnepanelen, warmtepomp, dakisolatie — en het systeem toont automatisch de juiste velden.",
      "Op locatie werk je een checklist af, voeg je foto's toe en noteer je bijzonderheden. Alles wordt direct opgeslagen in de cloud, zodat je nooit meer gegevens kwijtraakt. Na afloop genereer je met één klik een professioneel rapport.",
      "De schouw is naadloos gekoppeld aan de rest van het platform. Vanuit een afgeronde schouw start je direct een offerte, plan je een installatie of deel je het rapport met de klant. Geen dubbel werk, geen overtypen.",
      "Voor bedrijven met meerdere adviseurs of installateurs biedt mijnhuis.nu uniformiteit. Iedereen werkt met dezelfde templates en checklists, wat de kwaliteit waarborgt en de doorlooptijd verkort.",
    ]}
    relatedPages={[
      { label: "Offertes op locatie", href: "/features/offertes" },
      { label: "Planning & agenda", href: "/features/planning" },
      { label: "Klant- & leadbeheer", href: "/features/leadbeheer" },
      { label: "Rapportages", href: "/features/rapportages" },
    ]}
  />
);

export default FeatureSchouwen;
