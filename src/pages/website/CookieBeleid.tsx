import { Link } from "react-router-dom";

const CookieBeleid = () => (
  <>
    <section className="relative py-32 bg-foreground overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-primary/5" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-background">Cookiebeleid</h1>
        <p className="mt-4 text-background/70">Laatst bijgewerkt: 12 maart 2026</p>
      </div>
    </section>

    <section className="py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-sm max-w-none text-foreground">
        <h2 className="text-2xl font-bold mb-4">1. Wat zijn cookies?</h2>
        <p className="text-muted-foreground mb-6">
          Cookies zijn kleine tekstbestanden die op uw apparaat worden opgeslagen wanneer u onze website bezoekt.
          Ze helpen ons de website goed te laten functioneren, uw voorkeuren te onthouden en het gebruik van
          de website te analyseren.
        </p>

        <h2 className="text-2xl font-bold mb-4">2. Welke cookies gebruiken wij?</h2>

        <h3 className="text-lg font-semibold mb-2">2.1 Noodzakelijke cookies</h3>
        <p className="text-muted-foreground mb-4">
          Deze cookies zijn essentieel voor het functioneren van het Platform. Ze zorgen voor authenticatie,
          sessibeheer en beveiliging. Zonder deze cookies kan het Platform niet correct werken.
        </p>

        <h3 className="text-lg font-semibold mb-2">2.2 Functionele cookies</h3>
        <p className="text-muted-foreground mb-4">
          Functionele cookies onthouden uw voorkeuren, zoals taalinstellingen en weergaveopties. Ze verbeteren
          uw gebruikservaring maar zijn niet strikt noodzakelijk.
        </p>

        <h3 className="text-lg font-semibold mb-2">2.3 Analytische cookies</h3>
        <p className="text-muted-foreground mb-6">
          Wij gebruiken analytische cookies om te begrijpen hoe bezoekers onze website gebruiken. Deze data
          helpt ons de website te verbeteren. De gegevens worden geanonimiseerd verwerkt.
        </p>

        <h2 className="text-2xl font-bold mb-4">3. Cookiebeheer</h2>
        <p className="text-muted-foreground mb-6">
          Bij uw eerste bezoek vragen wij via een cookiebanner om uw toestemming voor niet-noodzakelijke cookies.
          U kunt uw cookievoorkeuren op elk moment wijzigen via uw browserinstellingen. Het verwijderen of
          blokkeren van cookies kan de functionaliteit van het Platform beïnvloeden.
        </p>

        <h2 className="text-2xl font-bold mb-4">4. Cookies van derden</h2>
        <p className="text-muted-foreground mb-6">
          Wij maken beperkt gebruik van diensten van derden die ook cookies kunnen plaatsen. Het gaat hierbij
          om analytische diensten. Wij hebben verwerkersovereenkomsten gesloten met deze partijen.
        </p>

        <h2 className="text-2xl font-bold mb-4">5. Bewaartermijnen</h2>
        <p className="text-muted-foreground mb-6">
          Sessiecookies worden verwijderd wanneer u uw browser sluit. Permanente cookies hebben een maximale
          bewaartermijn van 12 maanden, waarna ze automatisch verlopen.
        </p>

        <h2 className="text-2xl font-bold mb-4">6. Meer informatie</h2>
        <p className="text-muted-foreground">
          Voor meer informatie over hoe wij met uw gegevens omgaan, verwijzen wij naar ons{" "}
          <Link to="/privacy" className="text-primary hover:underline">privacybeleid</Link>.
          Heeft u vragen? Neem contact op via <strong>info@mijnhuis.nu</strong>.
        </p>
      </div>
    </section>
  </>
);

export default CookieBeleid;
