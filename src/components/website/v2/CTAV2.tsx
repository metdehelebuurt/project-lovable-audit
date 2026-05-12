import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const CTAV2 = () => (
  <section
    className="relative py-24 lg:py-32 text-background"
    style={{
      backgroundImage:
        "linear-gradient(180deg, hsl(var(--ink) / 0.92) 0%, hsl(var(--ink) / 0.96) 100%), url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2400&q=80')",
      backgroundAttachment: "fixed",
      backgroundSize: "cover",
      backgroundPosition: "center",
    }}
  >
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute -right-20 top-10 h-96 w-96 rounded-full bg-primary/20 blur-[120px]" />
      <div className="absolute -left-20 bottom-10 h-72 w-72 rounded-full bg-ochre/15 blur-[120px]" />
    </div>

    <div className="relative max-w-7xl mx-auto px-6 lg:px-10">
      <div className="max-w-3xl">
        <span className="text-[11px] uppercase tracking-[0.22em] text-background/60">Begin vandaag</span>
        <h2 className="font-display text-4xl lg:text-6xl mt-4 leading-[1.02]">
          Eén platform. Eindelijk overzicht.
        </h2>
        <p className="mt-6 text-base lg:text-lg text-background/70 max-w-xl leading-relaxed">
          30 dagen gratis, geen creditcard nodig. Inclusief demo-data zodat
          je direct kunt ervaren hoe je bedrijf eruit kan zien.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Button size="lg" className="rounded-full px-7 h-12 text-sm font-medium bg-background text-ink hover:bg-background/90" asChild>
            <Link to="/signup">
              Start gratis proefperiode
              <ArrowRight size={16} />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="rounded-full px-6 h-12 text-sm text-background hover:bg-background/10 hover:text-background"
            asChild
          >
            <Link to="/prijzen">Bekijk prijzen →</Link>
          </Button>
        </div>
      </div>
    </div>
  </section>
);

export default CTAV2;
