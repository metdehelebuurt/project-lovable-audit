import { Link } from "react-router-dom";

const Voorwaarden = () => (
  <>
    <section className="relative py-32 bg-foreground overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-primary/5" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-background">Algemene Voorwaarden</h1>
        <p className="mt-4 text-background/70">Laatst bijgewerkt: 12 maart 2026</p>
      </div>
    </section>

    <section className="py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-sm max-w-none text-foreground">
        <h2 className="text-2xl font-bold mb-4">1. Definities</h2>
        <p className="text-muted-foreground mb-6">
          In deze algemene voorwaarden wordt verstaan onder: <strong>"Platform"</strong>: de webapplicatie mijnhuis.nu;
          <strong> "Gebruiker"</strong>: iedere natuurlijke of rechtspersoon die gebruik maakt van het Platform;
          <strong> "Diensten"</strong>: alle door mijnhuis.nu aangeboden functionaliteiten en services;
          <strong> "Account"</strong>: het persoonlijke of zakelijke profiel van de Gebruiker op het Platform.
        </p>

        <h2 className="text-2xl font-bold mb-4">2. Toepasselijkheid</h2>
        <p className="text-muted-foreground mb-6">
          Deze algemene voorwaarden zijn van toepassing op elk gebruik van het Platform en alle overeenkomsten
          tussen mijnhuis.nu en de Gebruiker. Door het aanmaken van een Account of het gebruik van het Platform
          gaat u akkoord met deze voorwaarden.
        </p>

        <h2 className="text-2xl font-bold mb-4">3. Accountregistratie</h2>
        <p className="text-muted-foreground mb-6">
          Om gebruik te maken van het Platform dient u een Account aan te maken met correcte en volledige informatie.
          U bent verantwoordelijk voor het vertrouwelijk houden van uw inloggegevens. Elk gebruik van uw Account
          wordt geacht door u te zijn verricht.
        </p>

        <h2 className="text-2xl font-bold mb-4">4. Dienstverlening</h2>
        <p className="text-muted-foreground mb-6">
          mijnhuis.nu biedt een softwareplatform voor het beheren van offertes, schouwen, planning, leads en
          installaties in de verduurzamingsbranche. Wij streven naar een beschikbaarheid van 99,9% maar garanderen
          geen ononderbroken toegang. Gepland onderhoud wordt vooraf aangekondigd.
        </p>

        <h2 className="text-2xl font-bold mb-4">5. Prijzen en betaling</h2>
        <p className="text-muted-foreground mb-6">
          De actuele prijzen staan vermeld op onze <Link to="/prijzen" className="text-primary hover:underline">prijzenpagina</Link>.
          Alle prijzen zijn exclusief BTW, tenzij anders vermeld. Facturering geschiedt maandelijks of jaarlijks
          vooraf, afhankelijk van het gekozen plan. Bij niet-tijdige betaling behouden wij ons het recht voor
          de toegang tot het Platform op te schorten.
        </p>

        <h2 className="text-2xl font-bold mb-4">6. Proefperiode</h2>
        <p className="text-muted-foreground mb-6">
          Nieuwe Gebruikers kunnen het Platform 30 dagen gratis uitproberen. Na afloop van de proefperiode
          dient een betaald abonnement te worden afgesloten om het Platform te blijven gebruiken. Uw data
          blijft bewaard tot 30 dagen na het einde van de proefperiode.
        </p>

        <h2 className="text-2xl font-bold mb-4">7. Intellectueel eigendom</h2>
        <p className="text-muted-foreground mb-6">
          Alle intellectuele eigendomsrechten op het Platform, inclusief software, ontwerpen, teksten en
          logo's, berusten bij mijnhuis.nu. U verkrijgt een niet-exclusief, niet-overdraagbaar gebruiksrecht
          voor de duur van uw abonnement.
        </p>

        <h2 className="text-2xl font-bold mb-4">8. Gegevens en privacy</h2>
        <p className="text-muted-foreground mb-6">
          De verwerking van persoonsgegevens geschiedt conform ons{" "}
          <Link to="/privacy" className="text-primary hover:underline">privacybeleid</Link>. U bent als
          Gebruiker verantwoordelijk voor de gegevens die u invoert in het Platform, inclusief klantgegevens.
          Wij treden op als verwerker van deze gegevens.
        </p>

        <h2 className="text-2xl font-bold mb-4">9. Aansprakelijkheid</h2>
        <p className="text-muted-foreground mb-6">
          De aansprakelijkheid van mijnhuis.nu is beperkt tot het bedrag dat de Gebruiker in de 12 maanden
          voorafgaand aan de schadeveroorzakende gebeurtenis aan mijnhuis.nu heeft betaald. Wij zijn niet
          aansprakelijk voor indirecte schade, gevolgschade, gederfde winst of verlies van data.
        </p>

        <h2 className="text-2xl font-bold mb-4">10. Beëindiging</h2>
        <p className="text-muted-foreground mb-6">
          U kunt uw abonnement op elk moment opzeggen via de instellingen in het Platform. Na opzegging
          behoudt u toegang tot het einde van de lopende factureringsperiode. Wij behouden ons het recht
          voor om Accounts te beëindigen bij schending van deze voorwaarden.
        </p>

        <h2 className="text-2xl font-bold mb-4">11. Wijzigingen</h2>
        <p className="text-muted-foreground mb-6">
          Wij behouden ons het recht voor deze voorwaarden te wijzigen. Wezenlijke wijzigingen worden
          minimaal 30 dagen van tevoren aangekondigd per e-mail. Voortgezet gebruik na wijziging geldt
          als acceptatie van de nieuwe voorwaarden.
        </p>

        <h2 className="text-2xl font-bold mb-4">12. Toepasselijk recht</h2>
        <p className="text-muted-foreground mb-6">
          Op deze voorwaarden is Nederlands recht van toepassing. Geschillen worden voorgelegd aan de
          bevoegde rechter te Amsterdam.
        </p>

        <h2 className="text-2xl font-bold mb-4">13. Contact</h2>
        <p className="text-muted-foreground">
          Heeft u vragen over deze voorwaarden? Neem contact op via <strong>info@mijnhuis.nu</strong>.
        </p>
      </div>
    </section>
  </>
);

export default Voorwaarden;
