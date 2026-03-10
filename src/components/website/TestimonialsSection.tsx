import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Mark van den Berg",
    role: "Eigenaar, SolarTech Installaties",
    text: "Sinds we mijnhuis.nu gebruiken maken we offertes in de helft van de tijd. De digitale schouwen besparen ons enorm veel administratie.",
    rating: 5,
  },
  {
    name: "Lisa Jansen",
    role: "Adviseur, GreenHome Advies",
    text: "Het platform is intuïtief en mijn klanten zijn onder de indruk van de professionele offertes. Mijn conversie is met 40% gestegen.",
    rating: 5,
  },
  {
    name: "Peter & Ko Installatietechniek",
    role: "Installatiebedrijf, Rotterdam",
    text: "Planning, klantbeheer en offertes — alles op één plek. We kunnen ons eindelijk focussen op waar we goed in zijn: installeren.",
    rating: 5,
  },
];

const TestimonialsSection = () => (
  <section className="py-20 lg:py-28 bg-background">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">
          Ervaringen
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
          Wat professionals zeggen
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {testimonials.map((t) => (
          <div
            key={t.name}
            className="p-6 rounded-2xl bg-card border border-border/50 flex flex-col"
          >
            <div className="flex gap-1 mb-4">
              {Array.from({ length: t.rating }).map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className="fill-warning text-warning"
                />
              ))}
            </div>
            <p className="text-foreground/80 leading-relaxed flex-1 italic">
              "{t.text}"
            </p>
            <div className="mt-5 pt-4 border-t border-border">
              <p className="font-semibold text-foreground text-sm">{t.name}</p>
              <p className="text-xs text-muted-foreground">{t.role}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default TestimonialsSection;
