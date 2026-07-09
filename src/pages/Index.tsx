import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Logo from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { useDocumentSeo } from "@/lib/seo/useDocumentSeo";
import { Users, FileText, Wrench, ArrowRight, CheckCircle2 } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Leads & CRM",
    text: "Beheer je pipeline, automatiseer opvolging en zie direct waar je omzet vandaan komt.",
  },
  {
    icon: FileText,
    title: "Offertes & Facturen",
    text: "Maak in minuten professionele offertes met digitale ondertekening en automatische facturatie.",
  },
  {
    icon: Wrench,
    title: "Schouw & Installatie",
    text: "Van schouw tot oplevering: één werkbon voor kantoor én monteur, altijd up-to-date.",
  },
];

const pluspunten = [
  "30 dagen gratis proberen, geen creditcard nodig",
  "Volledig Nederlandstalig, gemaakt voor verduurzamingsprofessionals",
  "Inclusief demo-data zodat je direct aan de slag kunt",
];

const Index = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  useDocumentSeo({
    title: "mijnhuis.nu — Alle software voor je verduurzamingsbedrijf",
    description:
      "Leads, offertes, schouw en installatie in één platform. Start 30 dagen gratis — speciaal voor installateurs en adviseurs in verduurzaming.",
    type: "website",
  });

  useEffect(() => {
    if (!loading && user && profile) navigate("/dashboard", { replace: true });
  }, [loading, user, profile, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-4">
          <Logo />
          <nav className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate("/login")}>
              Inloggen
            </Button>
            <Button onClick={() => navigate("/signup")}>Start gratis</Button>
          </nav>
        </div>
      </header>

      <main>
        <section className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl">
            <span className="inline-block text-xs font-medium uppercase tracking-wide text-primary bg-primary/10 rounded-full px-3 py-1 mb-6">
              Voor installateurs en adviseurs
            </span>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
              Alle software voor je verduurzamingsbedrijf op één plek
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Van eerste lead tot opgeleverde installatie. Werk sneller, oogt professioneler en houd
              overzicht — zonder losse tools aan elkaar te knopen.
            </p>
            <div className="flex flex-wrap gap-3 mb-8">
              <Button size="lg" onClick={() => navigate("/signup")} className="gap-2">
                Start 30 dagen gratis <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/login")}>
                Inloggen
              </Button>
            </div>
            <ul className="space-y-2">
              {pluspunten.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 pb-16 md:pb-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, title, text }) => (
              <Card key={title} className="p-6">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold mb-2">{title}</h2>
                <p className="text-sm text-muted-foreground">{text}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-muted/40 border-y border-border">
          <div className="max-w-6xl mx-auto px-4 py-12 md:py-16 text-center">
            <h2 className="text-2xl md:text-3xl font-semibold mb-3">
              Vandaag nog aan de slag
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Binnen twee minuten heb je een werkende omgeving met demo-data om alles rustig uit te proberen.
            </p>
            <Button size="lg" onClick={() => navigate("/signup")} className="gap-2">
              Start 30 dagen gratis <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} mijnhuis.nu</span>
          <nav className="flex items-center gap-4">
            <Link to="/voorwaarden" className="hover:text-foreground">Voorwaarden</Link>
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/cookiebeleid" className="hover:text-foreground">Cookies</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default Index;
