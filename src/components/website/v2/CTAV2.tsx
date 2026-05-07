import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const CTAV2 = () => (
  <section className="py-24 lg:py-32 bg-background">
    <div className="max-w-7xl mx-auto px-6 lg:px-10">
      <div className="rounded-3xl bg-ink text-background p-12 lg:p-20 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-ochre/20 blur-3xl" />
        <div className="relative max-w-3xl">
          <span className="text-xs uppercase tracking-[0.2em] text-background/60">Begin vandaag</span>
          <h2 className="font-display text-4xl lg:text-6xl mt-4 leading-[1.05]">
            Eén platform.<br />
            <span className="italic text-ochre">Eindelijk overzicht.</span>
          </h2>
          <p className="mt-6 text-lg text-background/70 max-w-xl leading-relaxed">
            30 dagen gratis, geen creditcard nodig. Inclusief demo-data zodat
            je direct kunt ervaren hoe je bedrijf eruit kan zien.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="rounded-full px-8 h-12 text-base bg-background text-ink hover:bg-background/90" asChild>
              <Link to="/signup">
                Start gratis proefperiode
                <ArrowRight size={18} />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="rounded-full px-6 h-12 text-base text-background hover:bg-background/10 hover:text-background"
              asChild
            >
              <Link to="/prijzen">Bekijk prijzen →</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default CTAV2;