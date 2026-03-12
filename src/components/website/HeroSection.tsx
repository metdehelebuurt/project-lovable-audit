import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();
  const scrollTo = (id: string) => {
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="hero"
      className="relative min-h-[90vh] flex items-center overflow-hidden"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1920&q=80&fm=webp')",
        backgroundAttachment: "fixed",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-foreground/80" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-primary/10" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-primary/20 text-primary-foreground border border-primary/30 rounded-pill px-4 py-1.5 text-sm font-medium mb-6 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Nu beschikbaar voor installateurs & adviseurs
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-background leading-tight tracking-tight">
            Software die je verduurzamings­bedrijf{" "}
            <span className="text-primary">laat groeien</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-background/70 max-w-2xl leading-relaxed">
            Maak offertes op locatie, voer digitale schouwen uit, beheer je
            planning en klanten — alles vanuit één platform. Gebouwd voor
            installateurs en adviseurs.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              className="rounded-pill px-8 text-base h-12 shadow-lg shadow-primary/25"
              onClick={() => navigate("/signup")}
            >
              Start gratis proefperiode
              <ArrowRight size={18} />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-pill px-8 text-base h-12 border-background/30 text-background hover:bg-background/10 hover:text-background"
              onClick={() => scrollTo("#features")}
            >
              <Play size={16} />
              Bekijk demo
            </Button>
          </div>

          {/* Social proof */}
          <div className="mt-14 flex items-center gap-6 text-sm text-background/60">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-primary/40 border-2 border-background/20 flex items-center justify-center text-xs font-medium text-background backdrop-blur-sm"
                >
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <span>
              <strong className="text-background">500+</strong> professionals
              gebruiken mijnhuis.nu
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
