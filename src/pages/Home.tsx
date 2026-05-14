import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/website/Navbar";
import Footer from "@/components/website/Footer";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CalendarCheck,
  ClipboardList,
  FileText,
  LayoutDashboard,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useDocumentSeo } from "@/lib/seo/useDocumentSeo";

const FEATURES = [
  {
    icon: Users,
    title: "Lead- & klantbeheer",
    body: "Centrale plek voor alle leads, klanten en communicatie.",
  },
  {
    icon: ClipboardList,
    title: "Digitale schouwen",
    body: "Schouwen op locatie met foto's, metingen en automatische rapporten.",
  },
  {
    icon: FileText,
    title: "Offertes op locatie",
    body: "Genereer professionele offertes direct bij de klant thuis.",
  },
  {
    icon: CalendarCheck,
    title: "Planning & installaties",
    body: "Plan schouwen en installaties, koppel monteurs en volg de uitvoering.",
  },
] as const;

const Home = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && profile) {
      navigate("/dashboard", { replace: true });
    }
  }, [loading, user, profile, navigate]);

  useDocumentSeo({
    title: "mijnhuis.nu — Inloggen op het platform",
    description:
      "Log in op mijnhuis.nu — het platform voor leads, schouwen, offertes en planning voor verduurzamingsprofessionals.",
    canonical: "https://app.mijnhuis.nu/",
    type: "website",
  });

  const isLoggedIn = !!user && !!profile;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main>
        {/* Hero */}
        <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
              app.mijnhuis.nu
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-foreground tracking-tight mb-6">
              Het platform voor verduurzamingsprofessionals
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
              Leads, digitale schouwen, offertes, planning en klantportaal —
              alles in één werkomgeving voor installateurs en adviseurs.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {isLoggedIn ? (
                <Button size="lg" className="rounded-pill px-8 gap-2" asChild>
                  <Link to="/dashboard">
                    <LayoutDashboard className="h-4 w-4" />
                    Naar dashboard
                  </Link>
                </Button>
              ) : (
                <>
                  <Button size="lg" className="rounded-pill px-8 gap-2" asChild>
                    <Link to="/login">
                      Inloggen
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-pill px-8"
                    asChild
                  >
                    <Link to="/signup">Gratis proefperiode starten</Link>
                  </Button>
                </>
              )}
            </div>

            <p className="text-xs text-muted-foreground mt-6 flex items-center justify-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5" />
              30 dagen gratis — geen creditcard nodig
            </p>
          </div>
        </section>

        {/* Korte feature-uitleg */}
        <section className="pb-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-base font-semibold text-foreground mb-1">
                  {title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
