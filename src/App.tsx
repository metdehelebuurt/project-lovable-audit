import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import { CookieConsent } from "@/components/CookieConsent";
import { SessionTimeout } from "@/components/SessionTimeout";
import Login from "@/pages/Login";
import OAuthConsent from "@/pages/OAuthConsent";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import Vandaag from "@/pages/Vandaag";
import Partners from "@/pages/Partners";
import PartnerDetail from "@/pages/PartnerDetail";
import AccessGrants from "@/pages/Superadmin/AccessGrants";
import SystemLogs from "@/pages/Superadmin/SystemLogs";
import EmailLogs from "@/pages/Superadmin/EmailLogs";
import Unsubscribe from "@/pages/Unsubscribe";
import Gebruikers from "@/pages/Gebruikers";
import GebruikerDetail from "@/pages/GebruikerDetail";
import Adviseurs from "@/pages/Adviseurs";
import Leads from "@/pages/Leads";
import Producten from "@/pages/Producten";
import Assemblages from "@/pages/Assemblages";
import AssemblageEditor from "@/pages/AssemblageEditor";
import Voorraad from "@/pages/Voorraad";
import Schouwen from "@/pages/Schouwen";
import SchouwSnelstart from "@/pages/SchouwSnelstart";
import SchouwDetail from "@/pages/SchouwDetail";
import SchouwNieuw from "@/pages/SchouwNieuw";
import SchouwUitvoeren from "@/pages/SchouwUitvoeren";
import Offertes from "@/pages/Offertes";
import OfferteDetail from "@/pages/OfferteDetail";
import Opdrachten from "@/pages/Opdrachten";
import OpdrachtDetail from "@/pages/OpdrachtDetail";
import OpdrachtNieuw from "@/pages/OpdrachtNieuw";
import Installaties from "@/pages/Installaties";
import InstallatieDetail from "@/pages/InstallatieDetail";
import InstallatieNieuw from "@/pages/InstallatieNieuw";
import InstallatieMonteurView from "@/pages/InstallatieMonteurView";
import Planning from "@/pages/Planning";
import Analytics from "@/pages/Analytics";
import Berichten from "@/pages/Berichten";
import Documenten from "@/pages/Documenten";
import Instellingen from "@/pages/Instellingen";
import OffertePDF from "@/pages/OffertePDF";
import OffertePDFPrint from "@/pages/OffertePDFPrint";
import Home from "@/pages/Home";
import Signup from "@/pages/Signup";
import Energieadvies from "@/pages/Energieadvies";
import OAuthReturn from "@/pages/OAuthReturn";
import OfferteNieuw from "@/pages/OfferteNieuw";
import OfferteTemplatePage from "@/pages/OfferteTemplatePage";
import Tools from "@/pages/Tools";
import ThuisbatterijSelector from "@/pages/ThuisbatterijSelector";
import Daklayout from "@/pages/Daklayout";
import ProductDatasheetPage from "@/pages/ProductDatasheetPage";
import ProductDetail from "@/pages/ProductDetail";
import ProductWebsite from "@/pages/ProductWebsite";
import WebTools from "@/pages/WebTools";
import Affiliates from "@/pages/Affiliates";
import AffiliateBeheer from "@/pages/AffiliateBeheer";
import AffiliatePipeline from "@/pages/affiliate/AffiliatePipeline";
import AffiliateLeadDetail from "@/pages/affiliate/AffiliateLeadDetail";
import AffiliateBellen from "@/pages/affiliate/AffiliateBellen";
import AffiliatePool from "@/pages/affiliate/AffiliatePool";
import AffiliateMijnKlanten from "@/pages/affiliate/AffiliateMijnKlanten";
import AffiliateTrials from "@/pages/affiliate/AffiliateTrials";
import AffiliateAgenda from "@/pages/affiliate/AffiliateAgenda";
import LostReviewPage from "@/pages/affiliate/LostReview";
import MailtemplatesPage from "@/pages/affiliate/instellingen/Mailtemplates";
import AffiliatePijplijnInstellingen from "@/pages/affiliate/instellingen/Pijplijn";
import AffiliateInstellingen from "@/pages/affiliate/instellingen";
import AffiliateNotificatieVoorkeuren from "@/pages/affiliate/instellingen/Notificaties";
import AffiliateOffertes from "@/pages/affiliate/AffiliateOffertes";
import AffiliateAnalytics from "@/pages/affiliate/AffiliateAnalytics";
import AffiliateOpvolging from "@/pages/affiliate/AffiliateOpvolging";
import Sales from "@/pages/sales";
import SalesLeadDetail from "@/pages/sales/LeadDetail";
import SalesAgenda from "@/pages/sales/SalesAgenda";
import SalesAffiliates from "@/pages/sales/Affiliates";
import SalesDemoPlanning from "@/pages/sales/DemoPlanning";
import LeadDetail from "@/pages/LeadDetail";
import OfferteFeedback from "@/pages/OfferteFeedback";
import AfspraakNieuw from "@/pages/AfspraakNieuw";
import Klanten from "@/pages/Klanten";
import KlantDetail from "@/pages/KlantDetail";
import NotFound from "@/pages/NotFound";
import OffertePublic from "@/pages/OffertePublic";
import FeedbackNieuw from "@/pages/FeedbackNieuw";
import FeedbackOverzicht from "@/pages/FeedbackOverzicht";
import FeedbackAdmin from "@/pages/FeedbackAdmin";
import FeedbackDetail from "@/pages/FeedbackDetail";
import FeedbackNotificatieInstellingen from "@/pages/FeedbackNotificatieInstellingen";
import FeedbackRoadmap from "@/pages/FeedbackRoadmap";
import AdminAbonnementen from "@/pages/AdminAbonnementen";
import Financieel from "@/pages/Financieel";
import FactuurNieuw from "@/pages/FactuurNieuw";
import FactuurDetail from "@/pages/FactuurDetail";
import Leveranciers from "@/pages/Leveranciers";
import Retouren from "@/pages/Retouren";
import RetourDetail from "@/pages/RetourDetail";
import Inkoop from "@/pages/Inkoop";
import InkoopNieuw from "@/pages/InkoopNieuw";
import OntvangstRegistreren from "@/pages/OntvangstRegistreren";
import HelpdeskDashboard from "@/pages/helpdesk/Dashboard";
import TicketsOverzicht from "@/pages/helpdesk/TicketsOverzicht";
import TicketNieuw from "@/pages/helpdesk/TicketNieuw";
import TicketDetail from "@/pages/helpdesk/TicketDetail";
import Kennisbank from "@/pages/helpdesk/Kennisbank";
import KennisArtikel from "@/pages/helpdesk/KennisArtikel";
import HelpdeskPlanning from "@/pages/helpdesk/Planning";
import NotificatieVoorkeuren from "@/pages/instellingen/NotificatieVoorkeuren";
import ChecklistTemplates from "@/pages/instellingen/ChecklistTemplates";
import AbonnementSelfService from "@/pages/instellingen/Abonnement";
import AgendaInstellingen from "@/pages/instellingen/Agendas";
import Actiecentrum from "@/pages/Actiecentrum";
import Opleveringen from "@/pages/Opleveringen";
import OpleverNieuw from "@/pages/OpleverNieuw";
import OpleverDetail from "@/pages/OpleverDetail";
import OpleverKlantOndertekenen from "@/pages/OpleverKlantOndertekenen";
import OpleverKlantView from "@/pages/OpleverKlantView";
import ConsumerSchouw from "@/pages/public/ConsumerSchouw";
import Keuringen from "@/pages/Keuringen";
import KeuringNieuw from "@/pages/KeuringNieuw";
import KeuringDetail from "@/pages/KeuringDetail";

import EmbedContact from "@/pages/embed/EmbedContact";
import EmbedCalculator from "@/pages/embed/EmbedCalculator";
import EmbedCatalogus from "@/pages/embed/EmbedCatalogus";
import PublicCatalogus from "@/pages/public/PublicCatalogus";
import MerkenBeheer from "@/pages/MerkenBeheer";

import WebsiteLayout from "@/components/website/WebsiteLayout";
import { websiteRoutes } from "@/website/routes";
import Privacy from "@/pages/website/Privacy";
import Voorwaarden from "@/pages/website/Voorwaarden";
import CookieBeleid from "@/pages/website/CookieBeleid";
import Onboarding from "@/pages/Onboarding";
import { OnboardingGate } from "@/components/onboarding/OnboardingGate";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SessionTimeout />
          <Routes>
            {/* Publieke website */}
            {websiteRoutes}
            <Route path="/login" element={<Login />} />
            <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />

            {/* Public embed routes — no auth, no layout */}
            <Route path="/offerte/:token" element={<OffertePublic />} />
            <Route path="/oplevering/:token" element={<OpleverKlantOndertekenen />} />
            <Route path="/oplevering/:token/bekijken" element={<OpleverKlantView />} />
            <Route path="/public/schouw/:token" element={<ConsumerSchouw />} />
            <Route path="/roadmap" element={<FeedbackRoadmap />} />
            <Route path="/embed/contact/:widgetId" element={<EmbedContact />} />
            <Route path="/embed/calculator/:widgetId" element={<EmbedCalculator />} />
            <Route path="/embed/catalogus/:widgetId" element={<EmbedCatalogus />} />
            {/* Public SEO-friendly catalog: /c/:partnerSlug and /c/:partnerSlug/:productSlug */}
            <Route path="/c/:partnerSlug" element={<PublicCatalogus />} />
            <Route path="/c/:partnerSlug/:productSlug" element={<PublicCatalogus />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/oauth-return" element={<OAuthReturn />} />

            {/* Onboarding-wizard — protected, geen AppLayout */}
            <Route path="/onboarding" element={
              <ProtectedRoute><Onboarding /></ProtectedRoute>
            } />

            {/* Juridische pagina's met gedeelde layout */}
            <Route element={<WebsiteLayout />}>
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/voorwaarden" element={<Voorwaarden />} />
              <Route path="/cookies" element={<CookieBeleid />} />
            </Route>

            <Route element={<ProtectedRoute><OnboardingGate /></ProtectedRoute>}>
              <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/vandaag" element={<Vandaag />} />
              <Route path="/partners" element={
                <ProtectedRoute allowedRoles={["superadmin"]}><Partners /></ProtectedRoute>
              } />
              <Route path="/partners/:id" element={
                <ProtectedRoute allowedRoles={["superadmin", "sales_manager"]}><PartnerDetail /></ProtectedRoute>
              } />
              <Route path="/superadmin/access-grants" element={
                <ProtectedRoute allowedRoles={["superadmin"]}><AccessGrants /></ProtectedRoute>
              } />
              <Route path="/superadmin/logs" element={
                <ProtectedRoute allowedRoles={["superadmin"]}><SystemLogs /></ProtectedRoute>
              } />
              <Route path="/superadmin/email-logs" element={
                <ProtectedRoute allowedRoles={["superadmin"]}><EmailLogs /></ProtectedRoute>
              } />
              <Route path="/adviseurs" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin"]}><Adviseurs /></ProtectedRoute>
              } />
              <Route path="/gebruikers" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin"]}><Gebruikers /></ProtectedRoute>
              } />
              <Route path="/gebruikers/:id" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin"]}><GebruikerDetail /></ProtectedRoute>
              } />
              <Route path="/leads" element={
                <ProtectedRoute moduleKey="leads" allowedRoles={["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur"]}><Leads /></ProtectedRoute>
              } />
              <Route path="/leads/:id" element={
                <ProtectedRoute moduleKey="leads" allowedRoles={["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur"]}><LeadDetail /></ProtectedRoute>
              } />
              <Route path="/klanten" element={
                <ProtectedRoute moduleKey="klanten" allowedRoles={["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur"]}><Klanten /></ProtectedRoute>
              } />
              <Route path="/klanten/:id" element={
                <ProtectedRoute moduleKey="klanten" allowedRoles={["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur"]}><KlantDetail /></ProtectedRoute>
              } />
              <Route path="/producten" element={
                <ProtectedRoute moduleKey="producten" allowedRoles={["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur"]}><Producten /></ProtectedRoute>
              } />
              <Route path="/producten/:id" element={
                <ProtectedRoute moduleKey="producten" allowedRoles={["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur"]}><ProductDetail /></ProtectedRoute>
              } />
              <Route path="/producten/:id/website" element={
                <ProtectedRoute moduleKey="producten" allowedRoles={["superadmin", "partner_admin", "backoffice", "partner_staff"]}><ProductWebsite /></ProtectedRoute>
              } />
              <Route path="/producten/merken" element={
                <ProtectedRoute moduleKey="producten" allowedRoles={["superadmin", "partner_admin", "backoffice", "partner_staff"]}><MerkenBeheer /></ProtectedRoute>
              } />
              <Route path="/producten/assemblages" element={
                <ProtectedRoute moduleKey="assemblages" allowedRoles={["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur"]}><Assemblages /></ProtectedRoute>
              } />
              <Route path="/producten/assemblages/nieuw" element={
                <ProtectedRoute moduleKey="assemblages" allowedRoles={["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur"]}><AssemblageEditor /></ProtectedRoute>
              } />
              <Route path="/producten/assemblages/:id" element={
                <ProtectedRoute moduleKey="assemblages" allowedRoles={["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur"]}><AssemblageEditor /></ProtectedRoute>
              } />
              <Route path="/voorraad" element={
                <ProtectedRoute moduleKey="voorraad" allowedRoles={["superadmin", "partner_admin", "backoffice", "partner_staff", "installateur"]}><Voorraad /></ProtectedRoute>
              } />
              <Route path="/schouwen" element={
                <ProtectedRoute moduleKey="schouwen" allowedRoles={["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur", "consument"]}><Schouwen /></ProtectedRoute>
              } />
              <Route path="/schouwen/nieuw" element={
                <ProtectedRoute moduleKey="schouwen" allowedRoles={["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur"]}><SchouwNieuw /></ProtectedRoute>
              } />
              <Route path="/schouwen/snelstart" element={
                <ProtectedRoute moduleKey="schouwen" allowedRoles={["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur"]}><SchouwSnelstart /></ProtectedRoute>
              } />
              <Route path="/schouwen/:id" element={
                <ProtectedRoute moduleKey="schouwen" allowedRoles={["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur", "consument"]}><SchouwDetail /></ProtectedRoute>
              } />
              <Route path="/schouwen/:id/uitvoeren" element={
                <ProtectedRoute moduleKey="schouwen" allowedRoles={["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur"]}><SchouwUitvoeren /></ProtectedRoute>
              } />
              <Route path="/offertes" element={
                <ProtectedRoute moduleKey="offertes" allowedRoles={["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "consument", "affiliate", "sales_manager"]}><Offertes /></ProtectedRoute>
              } />
              <Route path="/offertes/:id" element={
                <ProtectedRoute moduleKey="offertes" allowedRoles={["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "consument", "affiliate", "sales_manager"]}><OfferteDetail /></ProtectedRoute>
              } />
              <Route path="/opdrachten" element={
                <ProtectedRoute moduleKey="opdrachten" allowedRoles={["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur"]}><Opdrachten /></ProtectedRoute>
              } />
              <Route path="/opdrachten/nieuw" element={
                <ProtectedRoute moduleKey="opdrachten" allowedRoles={["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur"]}><OpdrachtNieuw /></ProtectedRoute>
              } />
              <Route path="/opdrachten/:id" element={
                <ProtectedRoute moduleKey="opdrachten" allowedRoles={["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur"]}><OpdrachtDetail /></ProtectedRoute>
              } />
              <Route path="/installaties" element={
                <ProtectedRoute moduleKey="installaties" allowedRoles={["superadmin", "partner_admin", "backoffice", "partner_staff", "installateur"]}><Installaties /></ProtectedRoute>
              } />
              <Route path="/installaties/nieuw" element={
                <ProtectedRoute moduleKey="installaties" allowedRoles={["superadmin", "partner_admin", "backoffice", "partner_staff"]}><InstallatieNieuw /></ProtectedRoute>
              } />
              <Route path="/installaties/:id" element={
                <ProtectedRoute moduleKey="installaties" allowedRoles={["superadmin", "partner_admin", "backoffice", "partner_staff", "installateur"]}><InstallatieDetail /></ProtectedRoute>
              } />
              <Route path="/installaties/:id/werk" element={
                <ProtectedRoute moduleKey="installaties" allowedRoles={["superadmin", "partner_admin", "backoffice", "installateur"]}><InstallatieMonteurView /></ProtectedRoute>
              } />
              <Route path="/planning" element={
                <ProtectedRoute moduleKey="planning" allowedRoles={["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur", "consument"]}><Planning /></ProtectedRoute>
              } />
              <Route path="/planning/nieuw" element={
                <ProtectedRoute moduleKey="planning" allowedRoles={["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur"]}><AfspraakNieuw /></ProtectedRoute>
              } />
              <Route path="/analytics" element={
                <ProtectedRoute moduleKey="analytics" allowedRoles={["superadmin", "partner_admin", "backoffice"]}><Analytics /></ProtectedRoute>
              } />
              <Route path="/berichten" element={
                <ProtectedRoute moduleKey="berichten_inbox" allowedRoles={["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur", "consument", "affiliate"]}><Berichten /></ProtectedRoute>
              } />
              <Route path="/documenten" element={
                <ProtectedRoute moduleKey="documenten" allowedRoles={["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur"]}><Documenten /></ProtectedRoute>
              } />
              <Route path="/energieadvies" element={
                <ProtectedRoute moduleKey="energieadvies" allowedRoles={["superadmin", "partner_admin", "partner_staff", "adviseur"]}><Energieadvies /></ProtectedRoute>
              } />
              <Route path="/tools" element={
                <ProtectedRoute moduleKey="tools" allowedRoles={["superadmin", "partner_admin", "partner_staff", "adviseur"]}><Tools /></ProtectedRoute>
              } />
              <Route path="/tools/energieadvies" element={
                <ProtectedRoute moduleKey="energieadvies" allowedRoles={["superadmin", "partner_admin", "partner_staff", "adviseur"]}><Energieadvies /></ProtectedRoute>
              } />
              <Route path="/tools/thuisbatterij" element={
                <ProtectedRoute moduleKey="tools" allowedRoles={["superadmin", "partner_admin", "partner_staff", "adviseur"]}><ThuisbatterijSelector /></ProtectedRoute>
              } />
              <Route path="/tools/daklayout" element={
                <ProtectedRoute moduleKey="tools" allowedRoles={["superadmin", "partner_admin", "partner_staff", "adviseur", "installateur"]}><Daklayout /></ProtectedRoute>
              } />
              {/* /tools/webtools now redirects to /tools — webtools are integrated */}
              <Route path="/offertes/nieuw" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "partner_staff", "adviseur", "affiliate", "sales_manager"]}><OfferteNieuw /></ProtectedRoute>
              } />
              <Route path="/offertes/template" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "partner_staff", "adviseur"]}><OfferteTemplatePage /></ProtectedRoute>
              } />
              <Route path="/offertes/feedback" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "partner_staff"]}><OfferteFeedback /></ProtectedRoute>
              } />
              <Route path="/feedback" element={<FeedbackOverzicht />} />
              <Route path="/feedback/nieuw" element={<FeedbackNieuw />} />
              <Route path="/feedback/:id" element={<FeedbackDetail />} />
              <Route path="/feedback/admin" element={
                <ProtectedRoute allowedRoles={["superadmin"]}><FeedbackAdmin /></ProtectedRoute>
              } />
              <Route path="/feedback/admin/:id" element={
                <ProtectedRoute allowedRoles={["superadmin"]}><FeedbackDetail /></ProtectedRoute>
              } />
              <Route path="/feedback/notificatie-instellingen" element={
                <ProtectedRoute allowedRoles={["superadmin"]}><FeedbackNotificatieInstellingen /></ProtectedRoute>
              } />
              <Route path="/instellingen" element={<Instellingen />} />
              <Route path="/affiliates" element={
                <ProtectedRoute allowedRoles={["affiliate","sales_manager"]}><Affiliates /></ProtectedRoute>
              } />
              <Route path="/affiliates/links" element={
                <ProtectedRoute allowedRoles={["affiliate","superadmin","sales_manager"]}><Affiliates /></ProtectedRoute>
              } />
              <Route path="/affiliates/pipeline" element={
                <ProtectedRoute allowedRoles={["affiliate","superadmin","sales_manager"]}><AffiliatePipeline /></ProtectedRoute>
              } />
              <Route path="/affiliates/leads/:id" element={
                <ProtectedRoute allowedRoles={["affiliate","superadmin","sales_manager"]}><AffiliateLeadDetail /></ProtectedRoute>
              } />
              <Route path="/affiliates/bellen" element={
                <ProtectedRoute allowedRoles={["affiliate","superadmin","sales_manager"]}><AffiliateBellen /></ProtectedRoute>
              } />
              <Route path="/affiliates/pool" element={
                <ProtectedRoute allowedRoles={["affiliate","superadmin","sales_manager"]}><AffiliatePool /></ProtectedRoute>
              } />
              <Route path="/affiliates/klanten" element={
                <ProtectedRoute allowedRoles={["affiliate","superadmin","sales_manager"]}><AffiliateMijnKlanten /></ProtectedRoute>
              } />
              <Route path="/affiliates/trials" element={
                <ProtectedRoute allowedRoles={["affiliate","superadmin","sales_manager"]}><AffiliateTrials /></ProtectedRoute>
              } />
              <Route path="/affiliates/agenda" element={
                <ProtectedRoute allowedRoles={["affiliate","superadmin","sales_manager"]}><AffiliateAgenda /></ProtectedRoute>
              } />
              <Route path="/affiliates/verloren-review" element={
                <ProtectedRoute allowedRoles={["affiliate","superadmin","sales_manager"]}><LostReviewPage /></ProtectedRoute>
              } />
              <Route path="/affiliates/instellingen/mailtemplates" element={
                <ProtectedRoute allowedRoles={["affiliate","superadmin","sales_manager"]}><MailtemplatesPage /></ProtectedRoute>
              } />
              <Route path="/affiliates/instellingen/pijplijn" element={
                <ProtectedRoute allowedRoles={["affiliate","superadmin","sales_manager","partner_admin"]}><AffiliatePijplijnInstellingen /></ProtectedRoute>
              } />
              <Route path="/affiliates/instellingen/notificaties" element={
                <ProtectedRoute allowedRoles={["affiliate","superadmin","sales_manager","partner_admin"]}><AffiliateNotificatieVoorkeuren /></ProtectedRoute>
              } />
              <Route path="/affiliates/instellingen" element={
                <ProtectedRoute allowedRoles={["affiliate","superadmin","sales_manager","partner_admin"]}><AffiliateInstellingen /></ProtectedRoute>
              } />
              <Route path="/affiliates/offertes" element={
                <ProtectedRoute allowedRoles={["affiliate","superadmin","sales_manager"]}><AffiliateOffertes /></ProtectedRoute>
              } />
              <Route path="/affiliates/opvolging" element={
                <ProtectedRoute allowedRoles={["affiliate","superadmin","sales_manager"]}><AffiliateOpvolging /></ProtectedRoute>
              } />
              <Route path="/affiliates/analytics" element={
                <ProtectedRoute allowedRoles={["affiliate","superadmin","sales_manager"]}><AffiliateAnalytics /></ProtectedRoute>
              } />
              <Route path="/affiliate-beheer" element={
                <ProtectedRoute allowedRoles={["superadmin","sales_manager"]}><AffiliateBeheer /></ProtectedRoute>
              } />
              <Route path="/sales" element={
                <ProtectedRoute allowedRoles={["superadmin","sales_manager"]}><Sales /></ProtectedRoute>
              } />
              <Route path="/sales/leads/:id" element={
                <ProtectedRoute allowedRoles={["superadmin","sales_manager"]}><SalesLeadDetail /></ProtectedRoute>
              } />
              <Route path="/sales/agenda" element={
                <ProtectedRoute allowedRoles={["superadmin","sales_manager"]}><SalesAgenda /></ProtectedRoute>
              } />
              <Route path="/sales/affiliates" element={
                <ProtectedRoute allowedRoles={["superadmin","sales_manager"]}><SalesAffiliates /></ProtectedRoute>
              } />
              <Route path="/sales/demo-planning" element={
                <ProtectedRoute allowedRoles={["superadmin","sales_manager"]}><SalesDemoPlanning /></ProtectedRoute>
              } />
              <Route path="/admin/abonnementen" element={
                <ProtectedRoute allowedRoles={["superadmin"]}><AdminAbonnementen /></ProtectedRoute>
              } />
              <Route path="/financieel" element={
                <ProtectedRoute moduleKey="financieel_verkoop" allowedRoles={["superadmin", "partner_admin", "backoffice"]}><Financieel /></ProtectedRoute>
              } />
              <Route path="/financieel/nieuw/:type" element={
                <ProtectedRoute moduleKey="financieel_verkoop" allowedRoles={["superadmin", "partner_admin", "backoffice"]}><FactuurNieuw /></ProtectedRoute>
              } />
              <Route path="/financieel/bewerken/:type/:id" element={
                <ProtectedRoute moduleKey="financieel_verkoop" allowedRoles={["superadmin", "partner_admin", "backoffice"]}><FactuurNieuw /></ProtectedRoute>
              } />
              <Route path="/financieel/:id" element={
                <ProtectedRoute moduleKey="financieel_verkoop" allowedRoles={["superadmin", "partner_admin", "backoffice"]}><FactuurDetail /></ProtectedRoute>
              } />
              <Route path="/leveranciers" element={
                <ProtectedRoute moduleKey="leveranciers" allowedRoles={["superadmin", "partner_admin", "backoffice"]}><Leveranciers /></ProtectedRoute>
              } />
              <Route path="/inkoop" element={
                <ProtectedRoute moduleKey="inkoop" allowedRoles={["superadmin", "partner_admin", "backoffice"]}><Inkoop /></ProtectedRoute>
              } />
              <Route path="/inkoop/nieuw" element={
                <ProtectedRoute moduleKey="inkoop" allowedRoles={["superadmin", "partner_admin", "backoffice"]}><InkoopNieuw /></ProtectedRoute>
              } />
              <Route path="/inkoop/:id/ontvangst" element={
                <ProtectedRoute moduleKey="inkoop" allowedRoles={["superadmin", "partner_admin", "backoffice"]}><OntvangstRegistreren /></ProtectedRoute>
              } />
              <Route path="/helpdesk" element={
                <ProtectedRoute moduleKey="helpdesk" allowedRoles={["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur"]}><HelpdeskDashboard /></ProtectedRoute>
              } />
              <Route path="/helpdesk/tickets" element={
                <ProtectedRoute moduleKey="helpdesk" allowedRoles={["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur"]}><TicketsOverzicht /></ProtectedRoute>
              } />
              <Route path="/helpdesk/tickets/nieuw" element={
                <ProtectedRoute moduleKey="helpdesk" allowedRoles={["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur"]}><TicketNieuw /></ProtectedRoute>
              } />
              <Route path="/helpdesk/tickets/:id" element={
                <ProtectedRoute moduleKey="helpdesk" allowedRoles={["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur"]}><TicketDetail /></ProtectedRoute>
              } />
              <Route path="/helpdesk/planning" element={
                <ProtectedRoute moduleKey="helpdesk" allowedRoles={["superadmin", "partner_admin", "backoffice", "partner_staff"]}><HelpdeskPlanning /></ProtectedRoute>
              } />
              <Route path="/helpdesk/kennisbank" element={
                <ProtectedRoute moduleKey="helpdesk" allowedRoles={["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur"]}><Kennisbank /></ProtectedRoute>
              } />
              <Route path="/helpdesk/kennisbank/:id" element={
                <ProtectedRoute moduleKey="helpdesk" allowedRoles={["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur"]}><KennisArtikel /></ProtectedRoute>
              } />
              <Route path="/instellingen/notificaties" element={<NotificatieVoorkeuren />} />
              <Route path="/instellingen/abonnement" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin"]}><AbonnementSelfService /></ProtectedRoute>
              } />
              <Route path="/instellingen/checklist-templates" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin"]}><ChecklistTemplates /></ProtectedRoute>
              } />
              <Route path="/instellingen/agendas" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur", "sales_manager", "affiliate"]}><AgendaInstellingen /></ProtectedRoute>
              } />
              <Route path="/actiecentrum" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur"]}><Actiecentrum /></ProtectedRoute>
              } />
              <Route path="/offertes/:id/pdf" element={<OffertePDF />} />
              <Route path="/producten/:id/datasheet" element={<ProductDatasheetPage />} />
              <Route path="/opleveringen" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "backoffice", "partner_staff", "installateur"]}><Opleveringen /></ProtectedRoute>
              } />
              <Route path="/opleveringen/nieuw" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "backoffice", "partner_staff", "installateur"]}><OpleverNieuw /></ProtectedRoute>
              } />
              <Route path="/opleveringen/:id" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "backoffice", "partner_staff", "installateur"]}><OpleverDetail /></ProtectedRoute>
              } />
              <Route path="/keuringen" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur"]}><Keuringen /></ProtectedRoute>
              } />
              <Route path="/keuringen/nieuw" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur"]}><KeuringNieuw /></ProtectedRoute>
              } />
              <Route path="/keuringen/:id" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur"]}><KeuringDetail /></ProtectedRoute>
              } />
              <Route path="/retouren" element={
                <ProtectedRoute moduleKey="retouren" allowedRoles={["superadmin", "partner_admin", "backoffice", "partner_staff"]}><Retouren /></ProtectedRoute>
              } />
              <Route path="/retouren/:id" element={
                <ProtectedRoute moduleKey="retouren" allowedRoles={["superadmin", "partner_admin", "backoffice", "partner_staff"]}><RetourDetail /></ProtectedRoute>
              } />
            </Route>
            </Route>
            <Route path="/offertes/:id/pdf/print" element={<OffertePDFPrint />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
          <CookieConsent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
