import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const CTASection = () => (
  <section id="cta" className="py-20 lg:py-28">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="relative rounded-3xl bg-gradient-to-br from-primary to-primary/80 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
        <div className="relative px-8 py-16 sm:px-16 sm:py-20 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-4">
            Klaar om je huis te verduurzamen?
          </h2>
          <p className="text-primary-foreground/80 text-lg max-w-xl mx-auto mb-8">
            Vraag vandaag nog een gratis en vrijblijvende offerte aan. Onze
            adviseurs staan voor je klaar.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="rounded-pill px-8 h-12 text-base font-semibold shadow-lg"
          >
            Vraag een offerte aan
            <ArrowRight size={18} />
          </Button>
        </div>
      </div>
    </div>
  </section>
);

export default CTASection;
