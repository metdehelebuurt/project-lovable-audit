import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section
      id="cta"
      className="py-20 lg:py-28 relative"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=80')",
        backgroundAttachment: "fixed",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-primary/90" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-4">
            Klaar om je bedrijf te laten groeien?
          </h2>
          <p className="text-primary-foreground/80 text-lg max-w-xl mx-auto mb-8">
            Start vandaag nog met mijnhuis.nu. 30 dagen gratis proberen, geen
            creditcard nodig.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="rounded-pill px-8 h-12 text-base font-semibold shadow-lg"
            onClick={() => navigate("/signup")}
          >
            Start gratis proefperiode
            <ArrowRight size={18} />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
