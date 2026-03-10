import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Familie De Vries",
    location: "Utrecht",
    text: "Binnen twee weken hadden we zonnepanelen op het dak. Het hele proces was soepel en transparant. Aanrader!",
    rating: 5,
  },
  {
    name: "Jan Bakker",
    location: "Amsterdam",
    text: "De adviseur nam uitgebreid de tijd voor de schouw. De warmtepomp draait nu een jaar en we zijn supertevreden.",
    rating: 5,
  },
  {
    name: "Sandra & Pieter",
    location: "Eindhoven",
    text: "Fijn dat ze ook de subsidieaanvraag regelden. Scheelde ons ruim €2.000. Top service van begin tot eind.",
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
          Wat onze klanten zeggen
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
              <p className="text-xs text-muted-foreground">{t.location}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default TestimonialsSection;
