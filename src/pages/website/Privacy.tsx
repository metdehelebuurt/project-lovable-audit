import { Link } from "react-router-dom";

const Privacy = () => (
  <>
    <section className="relative py-32 bg-foreground overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-primary/5" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-background">Privacybeleid</h1>
        <p className="mt-4 text-background/70">Laatst bijgewerkt: 12 maart 2026</p>
      </div>
    </section>

    <section className="py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-sm max-w-none text-foreground">
        <h2 className="text-2xl font-bold mb-4">1. Inleiding</h2>
        <p className="text-muted-foreground mb-6">
          mijnhuis.nu ("wij", "ons", "onze") hecht groot belang aan de bescherming van uw persoonsgegevens.
          Dit privacybeleid beschrijft hoe wij gegevens verzamelen, gebruiken, opslaan en beschermen wanneer
          u ons platform en onze diensten gebruikt. Wij verwerken persoonsgegevens in overeenstemming met
          de Algemene Verordening Gegevensbescherming (AVG/GDPR) en overige toepasselijke wet- en regelgeving.
        </p>

        <h2 className="text-2xl font-bold mb-4">2. Welke gegevens verzamelen wij?</h2>
        <p className="text-muted-foreground mb-2">Wij kunnen de volgende categorieën persoonsgegevens verzamelen:</p>
        <ul className="text-muted-foreground list-disc pl-6 mb-6 space-y-1">
          <li><strong>Accountgegevens:</strong> naam, e-mailadres, telefoonnummer, bedrijfsnaam, KVK-nummer</li>
          <li><strong>Gebruiksgegevens:</strong> inlogmomenten, gebruikte functies, IP-adres, browsertype</li>
          <li><strong>Klantgegevens:</strong> gegevens van uw klanten die u invoert in het platform (leads, offertes, schouwen)</li>
          <li><strong>Communicatiegegevens:</strong> berichten die u via het platform verstuurt of ontvangt</li>
          <li><strong>Betalingsgegevens:</strong> factuuradres en betalingshistorie (betalingsverwerking via derden)</li>
        </ul>

        <h2 className="text-2xl font-bold mb-4">3. Waarvoor gebruiken wij uw gegevens?</h2>
        <ul className="text-muted-foreground list-disc pl-6 mb-6 space-y-1">
          <li>Het leveren en verbeteren van onze diensten</li>
          <li>Accountbeheer en authenticatie</li>
          <li>Communicatie over uw account en ons platform</li>
          <li>Het voldoen aan wettelijke verplichtingen</li>
          <li>Analyse en verbetering van de gebruikservaring</li>
          <li>Fraude- en misbruikpreventie</li>
        </ul>

        <h2 className="text-2xl font-bold mb-4">4. Rechtsgronden</h2>
        <p className="text-muted-foreground mb-6">
          Wij verwerken uw persoonsgegevens op basis van: (a) uitvoering van de overeenkomst, (b) wettelijke
          verplichting, (c) gerechtvaardigd belang, of (d) uw toestemming. U kunt toestemming te allen tijde
          intrekken.
        </p>

        <h2 className="text-2xl font-bold mb-4">5. Delen met derden</h2>
        <p className="text-muted-foreground mb-6">
          Wij delen uw gegevens uitsluitend met derden die noodzakelijk zijn voor onze dienstverlening,
          zoals hostingproviders en betalingsverwerkers. Wij verkopen uw gegevens nooit aan derden.
          Met alle verwerkers hebben wij verwerkersovereenkomsten gesloten.
        </p>

        <h2 className="text-2xl font-bold mb-4">6. Bewaartermijnen</h2>
        <p className="text-muted-foreground mb-6">
          Wij bewaren uw persoonsgegevens niet langer dan noodzakelijk voor de doeleinden waarvoor ze zijn
          verzameld. Accountgegevens worden bewaard zolang uw account actief is en tot 30 dagen na opzegging.
          Wettelijk verplichte gegevens worden conform de wettelijke bewaartermijnen bewaard.
        </p>

        <h2 className="text-2xl font-bold mb-4">7. Uw rechten</h2>
        <p className="text-muted-foreground mb-2">Op grond van de AVG heeft u de volgende rechten:</p>
        <ul className="text-muted-foreground list-disc pl-6 mb-6 space-y-1">
          <li>Recht op inzage in uw persoonsgegevens</li>
          <li>Recht op rectificatie van onjuiste gegevens</li>
          <li>Recht op verwijdering ("recht om vergeten te worden")</li>
          <li>Recht op beperking van de verwerking</li>
          <li>Recht op overdraagbaarheid van gegevens</li>
          <li>Recht van bezwaar tegen verwerking</li>
        </ul>
        <p className="text-muted-foreground mb-6">
          U kunt uw rechten uitoefenen door contact met ons op te nemen via <strong>info@mijnhuis.nu</strong>.
        </p>

        <h2 className="text-2xl font-bold mb-4">8. Beveiliging</h2>
        <p className="text-muted-foreground mb-6">
          Wij nemen passende technische en organisatorische maatregelen om uw persoonsgegevens te beschermen,
          waaronder versleutelde verbindingen (SSL/TLS), toegangscontrole en regelmatige back-ups.
          Onze servers staan in de Europese Unie.
        </p>

        <h2 className="text-2xl font-bold mb-4">9. Cookies</h2>
        <p className="text-muted-foreground mb-6">
          Voor informatie over ons cookiegebruik verwijzen wij naar ons{" "}
          <Link to="/cookies" className="text-primary hover:underline">cookiebeleid</Link>.
        </p>

        <h2 className="text-2xl font-bold mb-4">10. Contact & klachten</h2>
        <p className="text-muted-foreground mb-6">
          Heeft u vragen over dit privacybeleid of wilt u een klacht indienen? Neem contact op via{" "}
          <strong>info@mijnhuis.nu</strong>. U heeft ook het recht een klacht in te dienen bij de
          Autoriteit Persoonsgegevens (<a href="https://www.autoriteitpersoonsgegevens.nl" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.autoriteitpersoonsgegevens.nl</a>).
        </p>
      </div>
    </section>
  </>
);

export default Privacy;
