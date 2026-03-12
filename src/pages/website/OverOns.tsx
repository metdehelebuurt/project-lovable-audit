import { ArrowRight, Users, Zap, Shield, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";

const stats = [
  { value: "500+", label: "Professionals" },
  { value: "50.000+", label: "Offertes gemaakt" },
  { value: "99,9%", label: "Uptime" },
  { value: "4,8/5", label: "Klanttevredenheid" },
];

const values = [
  { icon: Zap, title: "Eenvoud", text: "Software moet het werk makkelijker maken, niet moeilijker. Elke functie is ontworpen met minimale klikken en maximaal resultaat." },
  { icon: Shield, title: "Betrouwbaarheid", text: "Jouw data is veilig bij ons. We investeren continu in beveiliging, back-ups en een stabiele infrastructuur." },
  { icon: Users, title: "Samenwerking", text: "We bouwen mijnhuis.nu samen met onze gebruikers. Feedback van installateurs en adviseurs stuurt onze roadmap." },
  { icon: Heart, title: "Verduurzaming", text: "We geloven in een duurzame toekomst. Met onze software helpen we de energietransitie te versnellen." },
];

const OverOns = () => {
  const navigate = useNavigate();

  return (
    <>
      {/* Hero */}
      <section className="relative py-32 bg-foreground overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-primary/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-background leading-tight">
            Wij bouwen software voor de <span className="text-primary">energietransitie</span>
          </h1>
          <p className="mt-6 text-lg text-background/70 max-w-2xl mx-auto leading-relaxed">
            mijnhuis.nu is opgericht met één missie: installateurs en adviseurs in de verduurzamingsbranche
            voorzien van de beste tools om hun werk efficiënter en professioneler te doen.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 -mt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s) => (
              <Card key={s.label} className="border-0 shadow-md rounded-2xl text-center">
                <CardContent className="py-8">
                  <p className="text-3xl font-bold text-primary">{s.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Verhaal */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-6">Ons verhaal</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            De verduurzamingsbranche groeit razendsnel. Steeds meer huiseigenaren investeren in zonnepanelen,
            warmtepompen en isolatie. Maar achter de schermen werken veel installateurs en adviseurs nog met
            losse spreadsheets, papieren formulieren en e-mails. Dat kan beter.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            mijnhuis.nu ontstond uit frustratie met precies dat probleem. We spraken met tientallen
            installateurs en adviseurs en ontdekten dat ze allemaal dezelfde uitdagingen hadden: te veel
            administratie, geen overzicht en verloren leads door trage opvolging.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Daarom bouwden we een alles-in-één platform dat specifiek is ontworpen voor de
            verduurzamingsbranche. Van het eerste klantcontact tot de oplevering van een installatie — alles
            in één systeem. Geen dure maatwerksoftware, maar een betaalbaar platform dat direct klaar is
            voor gebruik.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Vandaag gebruiken meer dan 500 professionals dagelijks mijnhuis.nu om hun bedrijf efficiënter te
            runnen. En we zijn nog maar net begonnen.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">Onze waarden</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((v) => (
              <Card key={v.title} className="border-0 shadow-sm rounded-2xl">
                <CardContent className="p-8 text-center">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <v.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{v.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{v.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">Word onderdeel van ons verhaal</h2>
          <p className="text-primary-foreground/80 text-lg mb-8">
            Sluit je aan bij 500+ professionals die mijnhuis.nu gebruiken om hun verduurzamingsbedrijf te laten groeien.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="rounded-full px-8 h-12 font-semibold" onClick={() => navigate("/signup")}>
              Gratis proberen <ArrowRight size={18} />
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8 h-12 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <Link to="/partners-worden">Partners worden</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default OverOns;
