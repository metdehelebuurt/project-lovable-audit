import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/website/Navbar";
import Footer from "@/components/website/Footer";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, LayoutDashboard, ShieldCheck, Users, UserCheck2, MessageSquare,
  Inbox, ClipboardList, FileText, ClipboardCheck, Wrench, Calendar, Package,
  ShoppingCart, RotateCcw, Truck, Receipt, CreditCard, Building2, UserCheck,
  Handshake, FolderOpen, BarChart3, PenTool, Stethoscope, LifeBuoy, BookOpen,
  MessageSquareHeart, Lightbulb, Link2, Settings, Home as HomeIcon, ScrollText,
  ShieldAlert, Sparkles, Mail, Smartphone, Globe, type LucideIcon,
} from "lucide-react";
import { useDocumentSeo } from "@/lib/seo/useDocumentSeo";

interface Functie { icon: LucideIcon; title: string; body: string; }
interface FunctieCategorie { id: string; label: string; beschrijving: string; items: Functie[]; }

const CATEGORIEEN: FunctieCategorie[] = [
  {
    id: "werk", label: "Werk & overzicht",
    beschrijving: "Begin elke dag met focus en grip op je werk.",
    items: [
      { icon: LayoutDashboard, title: "Vandaag", body: "Persoonlijke dagstart met afspraken, taken en recente activiteit." },
      { icon: BarChart3, title: "Dashboard", body: "Realtime KPI's over leads, offertes, omzet en uitvoering." },
      { icon: Inbox, title: "Actiecentrum", body: "Centrale inbox met taken, terugbelverzoeken, notificaties en aandachtspunten." },
      { icon: MessageSquare, title: "Berichten", body: "Geïntegreerde inbox met Gmail/Outlook OAuth-koppeling per gebruiker." },
    ],
  },
  {
    id: "verkoop", label: "Klant & verkoop",
    beschrijving: "Van eerste contact tot getekende offerte, in één flow.",
    items: [
      { icon: Users, title: "Leads", body: "Kanban-bord met 5 fases en 10 statussen, AI-koopsignalen en eigen leadbronnen." },
      { icon: UserCheck2, title: "Klanten", body: "Volledige klantkaart met dossier, woninggegevens en communicatiehistorie." },
      { icon: FileText, title: "Offertes", body: "Professionele offertes met digitale ondertekening, productdatasheets en PDF-export." },
      { icon: ClipboardCheck, title: "Verkooporders", body: "Geaccepteerde offertes worden vergrendelde orderbevestigingen voor uitvoering." },
      { icon: ClipboardList, title: "Schouwen", body: "Digitale schouwwizard in 6 stappen met foto's, video, metingen en handtekening." },
      { icon: Sparkles, title: "AI-introteksten", body: "Automatisch gegenereerde offerte-introteksten die leren van klantfeedback." },
    ],
  },
  {
    id: "uitvoering", label: "Uitvoering",
    beschrijving: "Plan, voer uit en lever op — met monteur en klant in sync.",
    items: [
      { icon: Calendar, title: "Planning", body: "Agenda voor schouwen (blauw) en installaties (geel) met iCal-feed per monteur." },
      { icon: Wrench, title: "Installaties", body: "Workflow met monteurplanning, klantbevestiging en mobiel werkscherm." },
      { icon: ShieldCheck, title: "Opleveringen", body: "NEN 1010-rapportage, dubbele ondertekening en gehashte archivering." },
      { icon: Stethoscope, title: "Keuringen", body: "Periodieke keuringen Scope 12, NEN 3140, inspectie PV en thuisbatterij." },
      { icon: Package, title: "Voorraad", body: "Voorraadbeheer met serienummerregistratie en zendingen." },
      { icon: ShoppingCart, title: "Inkoop", body: "Inkooporders, ontvangstcontrole, voorstellen en factuurmatching." },
      { icon: RotateCcw, title: "Retouren", body: "RMA-afhandeling met statusvolg en koppeling aan installaties." },
    ],
  },
  {
    id: "financieel", label: "Financieel",
    beschrijving: "Factureer en bewaak je geldstromen.",
    items: [
      { icon: Receipt, title: "Facturen", body: "Facturen genereren vanuit offertes met flexibele termijnschema's en BTW per regel." },
      { icon: Truck, title: "Leveranciers", body: "Leveranciersbeheer met artikellijsten en inkoopvoorwaarden." },
      { icon: CreditCard, title: "Abonnementen", body: "Mollie-integratie voor abonnementen, add-ons en proefperiodes." },
    ],
  },
  {
    id: "catalogus", label: "Catalogus & data",
    beschrijving: "Eén productcatalogus, overal inzetbaar.",
    items: [
      { icon: Package, title: "Producten", body: "Globale en partner-producten met AI-import (Gemini), CSV/Excel en datasheet-snapshots." },
      { icon: FolderOpen, title: "Documenten", body: "Centrale documentenopslag per partner met WebP-optimalisatie en RLS-beveiliging." },
      { icon: BarChart3, title: "Analytics", body: "Rapportages over leads, conversie, omzet en uitvoering." },
    ],
  },
  {
    id: "tools", label: "Tools & service",
    beschrijving: "Slimme tools voor verkoop, advies en support.",
    items: [
      { icon: PenTool, title: "Webtools & widgets", body: "Embeddable energieadvies, batterijselector en contactformulier per partner." },
      { icon: Sparkles, title: "Energieadvies-wizard", body: "Adviestool met PDF-rapport voor besparing en CO₂-reductie." },
      { icon: LifeBuoy, title: "Helpdesk & tickets", body: "Tickets met chat-threads, prioriteiten, AI-troubleshooter en planning." },
      { icon: BookOpen, title: "Kennisbank", body: "Interne kennisbank met AI-gegenereerde artikelen vanuit opgeloste tickets." },
    ],
  },
  {
    id: "klantportaal", label: "Klantportaal",
    beschrijving: "Een eigen omgeving voor de consument.",
    items: [
      { icon: HomeIcon, title: "Mijn woning", body: "Publiek consumentportaal met dossier, schouwdata en afspraken." },
      { icon: MessageSquare, title: "Realtime chat", body: "Direct communiceren met de klant per offerte via offerte-berichten." },
      { icon: Mail, title: "Transactionele e-mails", body: "Gepersonaliseerde e-mails via SendGrid met onderdrukking en unsubscribe-flow." },
    ],
  },
  {
    id: "beheer", label: "Beheer & multi-tenancy",
    beschrijving: "Schaalbaar voor partners, adviseurs en wederverkopers.",
    items: [
      { icon: Building2, title: "Partners", body: "Multi-tenancy via partner_id met data-isolatie per organisatie." },
      { icon: UserCheck, title: "Adviseurs", body: "Beheer van adviseurs met eigen leads, offertes en planning." },
      { icon: Users, title: "Gebruikers", body: "RBAC met 7 rollen, initiële wachtwoordwijziging en sessiebeheer (30 min)." },
      { icon: Handshake, title: "Affiliate beheer", body: "Wederverkoperdashboard met conversies via affiliate referrals." },
      { icon: Link2, title: "Affiliate links", body: "Genereer trackbare links en volg commissies per partner." },
    ],
  },
  {
    id: "platform", label: "Platform & integraties",
    beschrijving: "Veilig, geïntegreerd en uitbreidbaar.",
    items: [
      { icon: Globe, title: "Google Maps & Solar API", body: "Adresvalidatie en zonnepaneel-potentieel via beveiligde proxy edge function." },
      { icon: Mail, title: "E-mail OAuth", body: "Gmail en Microsoft Graph OAuth voor 1-op-1 inbox-synchronisatie." },
      { icon: Sparkles, title: "AI-functies", body: "Lovable AI Gateway: leadanalyse, offerte-feedback en productspec-verificatie (Firecrawl + Gemini)." },
      { icon: ShieldAlert, title: "Platformtoegang", body: "Break-glass access grants voor superadmins met audittrail." },
      { icon: ScrollText, title: "Systeem- & e-maillogs", body: "Centrale logging van fouten, edge-functies en e-mailverzendingen." },
      { icon: Smartphone, title: "Mobiel-first", body: "Offcanvas-sidebar, gestackte kaarten en quick-create FAB op mobiel." },
    ],
  },
  {
    id: "support", label: "Support & feedback",
    beschrijving: "Continu verbeteren met je gebruikers.",
    items: [
      { icon: MessageSquareHeart, title: "Feedback", body: "Feedbackwizard met AI-interview en centrale superadmin-analyse." },
      { icon: Lightbulb, title: "Functieverzoeken", body: "Verzamel en prioriteer wensen vanuit alle rollen." },
      { icon: Settings, title: "Instellingen", body: "Per-gebruiker voorkeuren, notificaties, branding en checklist-templates." },
    ],
  },
];

const Home = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && profile) {
      navigate("/dashboard", { replace: true });
    }
  }, [loading, user, profile, navigate]);

  useDocumentSeo({
    title: "mijnhuis.nu — Platform voor verduurzamingsprofessionals",
    description:
      "Het complete platform voor leads, schouwen, offertes, planning, installaties en klantportaal. Bekijk alle functies en start gratis.",
    canonical: "https://app.mijnhuis.nu/",
    type: "website",
  });

  const isLoggedIn = !!user && !!profile;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main>
        {/* Hero */}
        <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
              app.mijnhuis.nu
            </span>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-semibold text-foreground tracking-tight mb-6 break-words hyphens-auto" lang="nl">
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
                  <Button size="lg" variant="outline" className="rounded-pill px-8" asChild>
                    <Link to="/signup">Gratis proefperiode starten</Link>
                  </Button>
                </>
              )}
            </div>

            <p className="text-xs text-muted-foreground mt-6 flex items-center justify-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5" />
              14 dagen gratis — geen creditcard nodig
            </p>
          </div>
        </section>

        {/* Volledig functie-overzicht */}
        <section className="pb-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14 max-w-2xl mx-auto">
              <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
                Volledig platform
              </span>
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight mb-4">
                Alle functies van mijnhuis.nu
              </h2>
              <p className="text-muted-foreground">
                Van lead tot oplevering, van schouw tot factuur — een compleet
                overzicht van wat het platform voor jouw organisatie doet.
              </p>
            </div>

            <div className="space-y-16">
              {CATEGORIEEN.map((cat) => (
                <div key={cat.id}>
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-foreground mb-1">{cat.label}</h3>
                    <p className="text-sm text-muted-foreground">{cat.beschrijving}</p>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cat.items.map(({ icon: Icon, title, body }) => (
                      <div
                        key={title}
                        className="rounded-2xl border border-border bg-card p-5 hover:border-primary/40 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-foreground mb-1">{title}</h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {!isLoggedIn && (
              <div className="mt-20 text-center rounded-3xl border border-border bg-card p-10">
                <h3 className="text-2xl font-semibold text-foreground mb-3">
                  Klaar om mijnhuis.nu te proberen?
                </h3>
                <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                  Start een gratis proefperiode van 14 dagen — inclusief
                  demo-data om alle functies direct te kunnen verkennen.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button size="lg" className="rounded-pill px-8 gap-2" asChild>
                    <Link to="/signup">
                      Gratis proefperiode starten
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="rounded-pill px-8" asChild>
                    <Link to="/login">Inloggen</Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
