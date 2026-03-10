import { ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  const scrollTo = (id: string) => {
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="hero"
      className="relative min-h-[90vh] flex items-center overflow-hidden"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/30" />
      <div className="absolute top-20 right-0 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-accent/40 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-pill px-4 py-1.5 text-sm font-medium mb-6 animate-fade-in">
            <Zap size={14} />
            Duurzaam wonen begint hier
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight animate-fade-in">
            Jouw huis,{" "}
            <span className="text-primary">toekomstbestendig</span>
            <br />
            verduurzaamd
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed animate-fade-in">
            Van zonnepanelen tot warmtepompen — wij begeleiden je van advies tot
            installatie. Persoonlijk, transparant en met gecertificeerde
            vakmensen.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 animate-fade-in">
            <Button
              size="lg"
              className="rounded-pill px-8 text-base h-12 shadow-lg shadow-primary/25"
              onClick={() => scrollTo("#cta")}
            >
              Start je verduurzaming
              <ArrowRight size={18} />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-pill px-8 text-base h-12"
              onClick={() => scrollTo("#hoe-het-werkt")}
            >
              Hoe het werkt
            </Button>
          </div>

          {/* Social proof strip */}
          <div className="mt-14 flex items-center gap-6 text-sm text-muted-foreground animate-fade-in">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-primary/20 border-2 border-card flex items-center justify-center text-xs font-medium text-primary"
                >
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <span>
              <strong className="text-foreground">2.500+</strong> huishoudens
              verduurzaamd
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
