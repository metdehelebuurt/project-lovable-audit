import { ArrowRight, Handshake, TrendingUp, Users, HeadphonesIcon, Gift, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const benefits = [
  { icon: TrendingUp, title: "Meer omzet", text: "Partners rapporteren gemiddeld 30% meer conversie dankzij snellere offertes en opvolging." },
  { icon: Users, title: "Onbeperkt groeien", text: "Voeg adviseurs, installateurs en kantoormedewerkers toe naarmate je bedrijf groeit." },
  { icon: HeadphonesIcon, title: "Dedicated support", text: "Krijg een persoonlijke accountmanager die je helpt het maximale uit het platform te halen." },
  { icon: Gift, title: "Exclusieve features", text: "Partners krijgen als eerste toegang tot nieuwe functies en kunnen meedenken over de roadmap." },
  { icon: ShieldCheck, title: "Data-eigenaarschap", text: "Jouw data is en blijft van jou. Exporteer alles op elk moment. Geen vendor lock-in." },
  { icon: Handshake, title: "Co-marketing", text: "Profiteer van gezamenlijke marketingacties en vergroot je zichtbaarheid in de markt." },
];

const steps = [
  { nr: "1", title: "Aanmelden", text: "Maak een gratis proefaccount aan en ontdek alle mogelijkheden 30 dagen lang." },
  { nr: "2", title: "Onboarding", text: "Ons team helpt je met de inrichting: producten, templates en teamaccounts." },
  { nr: "3", title: "Live gaan", text: "Start met het maken van offertes, schouwen en het beheren van je leads en klanten." },
];

const PartnersWorden = () => {
  const navigate = useNavigate();

  return (
    <>
      {/* Hero */}
      <section
        className="relative min-h-[55vh] flex items-center overflow-hidden"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1920&q=80&fm=webp')",
          backgroundAttachment: "fixed",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-foreground/80" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-primary/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-bold text-background leading-tight">
              Word partner van <span className="text-primary">mijnhuis.nu</span>
            </h1>
            <p className="mt-6 text-lg text-background/70 max-w-2xl leading-relaxed">
              Sluit je aan bij een groeiend netwerk van installateurs en adviseurs die hun bedrijf naar een
              hoger niveau tillen met ons platform.
            </p>
            <Button size="lg" className="mt-10 rounded-full px-8 h-12 text-base shadow-lg shadow-primary/25" onClick={() => navigate("/signup")}>
              Start gratis proefperiode <ArrowRight size={18} />
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground text-center mb-4">Voordelen van partnerschap</h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-14">
            Als partner profiteer je van exclusieve voordelen die je helpen sneller te groeien.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((b) => (
              <Card key={b.title} className="border-0 shadow-sm rounded-2xl hover:shadow-md transition-shadow">
                <CardContent className="p-8">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                    <b.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{b.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{b.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20 bg-muted/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">Hoe word je partner?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div key={s.nr} className="text-center">
                <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {s.nr}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <blockquote className="text-xl text-foreground italic leading-relaxed mb-6">
            "Sinds we mijnhuis.nu gebruiken is onze omzet met 35% gegroeid. De snelheid waarmee we offertes
            kunnen maken en opvolgen heeft ons een duidelijk concurrentievoordeel gegeven."
          </blockquote>
          <p className="text-muted-foreground font-medium">— Mark de Vries, Directeur SolarPro BV</p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">Klaar om partner te worden?</h2>
          <p className="text-primary-foreground/80 text-lg mb-8">
            Start vandaag nog met je gratis proefperiode van 30 dagen. Ons team helpt je op weg.
          </p>
          <Button size="lg" variant="secondary" className="rounded-full px-8 h-12 font-semibold shadow-lg" onClick={() => navigate("/signup")}>
            Start gratis proefperiode <ArrowRight size={18} />
          </Button>
        </div>
      </section>
    </>
  );
};

export default PartnersWorden;
