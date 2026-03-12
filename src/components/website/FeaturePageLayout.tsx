import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface RelatedPage {
  label: string;
  href: string;
}

interface FeaturePageLayoutProps {
  badge: string;
  title: string;
  highlight: string;
  subtitle: string;
  heroImage: string;
  features: Feature[];
  detailTitle: string;
  detailText: string[];
  relatedPages: RelatedPage[];
}

const FeaturePageLayout = ({
  badge,
  title,
  highlight,
  subtitle,
  heroImage,
  features,
  detailTitle,
  detailText,
  relatedPages,
}: FeaturePageLayoutProps) => {
  const navigate = useNavigate();

  return (
    <>
      {/* Hero */}
      <section
        className="relative min-h-[60vh] flex items-center overflow-hidden"
        style={{
          backgroundImage: `url('${heroImage}')`,
          backgroundAttachment: "fixed",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-foreground/80" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-primary/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-primary/20 text-primary-foreground border border-primary/30 rounded-full px-4 py-1.5 text-sm font-medium mb-6 backdrop-blur-sm">
              {badge}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-background leading-tight tracking-tight">
              {title} <span className="text-primary">{highlight}</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-background/70 max-w-2xl leading-relaxed">
              {subtitle}
            </p>
            <div className="mt-10">
              <Button
                size="lg"
                className="rounded-full px-8 text-base h-12 shadow-lg shadow-primary/25"
                onClick={() => navigate("/signup")}
              >
                Gratis proberen <ArrowRight size={18} />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground text-center mb-4">Wat kun je ermee?</h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-14">
            Ontdek de mogelijkheden die jouw werkproces sneller, slimmer en efficiënter maken.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow rounded-2xl">
                <CardContent className="p-8">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                    <f.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Detail text (SEO) */}
      <section className="py-16 bg-muted/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">{detailTitle}</h2>
          {detailText.map((p, i) => (
            <p key={i} className="text-muted-foreground leading-relaxed mb-4">{p}</p>
          ))}
        </div>
      </section>

      {/* Related features */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-foreground mb-8 text-center">Ontdek ook</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {relatedPages.map((r) => (
              <Button key={r.href} variant="outline" asChild className="rounded-full">
                <Link to={r.href}>{r.label}</Link>
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">
            Klaar om te starten?
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8">
            Probeer mijnhuis.nu 30 dagen gratis. Geen creditcard nodig.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="rounded-full px-8 h-12 text-base font-semibold shadow-lg"
            onClick={() => navigate("/signup")}
          >
            Start gratis proefperiode <ArrowRight size={18} />
          </Button>
        </div>
      </section>
    </>
  );
};

export default FeaturePageLayout;
