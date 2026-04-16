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
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import Partners from "@/pages/Partners";
import Gebruikers from "@/pages/Gebruikers";
import Adviseurs from "@/pages/Adviseurs";
import Leads from "@/pages/Leads";
import Producten from "@/pages/Producten";
import Schouwen from "@/pages/Schouwen";
import SchouwSnelstart from "@/pages/SchouwSnelstart";
import SchouwDetail from "@/pages/SchouwDetail";
import SchouwNieuw from "@/pages/SchouwNieuw";
import SchouwUitvoeren from "@/pages/SchouwUitvoeren";
import Offertes from "@/pages/Offertes";
import OfferteDetail from "@/pages/OfferteDetail";
import Opdrachten from "@/pages/Opdrachten";
import OpdrachtDetail from "@/pages/OpdrachtDetail";
import Installaties from "@/pages/Installaties";
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
import OfferteNieuw from "@/pages/OfferteNieuw";
import OfferteTemplatePage from "@/pages/OfferteTemplatePage";
import Tools from "@/pages/Tools";
import ThuisbatterijSelector from "@/pages/ThuisbatterijSelector";
import ProductDatasheetPage from "@/pages/ProductDatasheetPage";
import ProductDetail from "@/pages/ProductDetail";
import WebTools from "@/pages/WebTools";
import Affiliates from "@/pages/Affiliates";
import AffiliateBeheer from "@/pages/AffiliateBeheer";
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
import AdminAbonnementen from "@/pages/AdminAbonnementen";
import Financieel from "@/pages/Financieel";
import FactuurNieuw from "@/pages/FactuurNieuw";
import FactuurDetail from "@/pages/FactuurDetail";
import Leveranciers from "@/pages/Leveranciers";

import EmbedContact from "@/pages/embed/EmbedContact";
import EmbedCalculator from "@/pages/embed/EmbedCalculator";

import WebsiteLayout from "@/components/website/WebsiteLayout";
import FeatureOffertes from "@/pages/website/FeatureOffertes";
import FeatureSchouwen from "@/pages/website/FeatureSchouwen";
import FeaturePlanning from "@/pages/website/FeaturePlanning";
import FeatureLeadbeheer from "@/pages/website/FeatureLeadbeheer";
import FeatureRapportages from "@/pages/website/FeatureRapportages";
import FeatureWebtools from "@/pages/website/FeatureWebtools";
import FeatureEnergieadvies from "@/pages/website/FeatureEnergieadvies";
import OverOns from "@/pages/website/OverOns";
import Prijzen from "@/pages/website/Prijzen";
import PartnersWorden from "@/pages/website/PartnersWorden";
import FAQ from "@/pages/website/FAQ";
import Privacy from "@/pages/website/Privacy";
import Voorwaarden from "@/pages/website/Voorwaarden";
import CookieBeleid from "@/pages/website/CookieBeleid";
import Features from "@/pages/website/Features";
import HoeHetWerkt from "@/pages/website/HoeHetWerkt";
import Voordelen from "@/pages/website/Voordelen";

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
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />

            {/* Public embed routes — no auth, no layout */}
            <Route path="/offerte/:token" element={<OffertePublic />} />
            <Route path="/embed/contact/:widgetId" element={<EmbedContact />} />
            <Route path="/embed/calculator/:widgetId" element={<EmbedCalculator />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Public website pages with shared layout */}
            <Route element={<WebsiteLayout />}>
              <Route path="/features" element={<Features />} />
              <Route path="/hoe-het-werkt" element={<HoeHetWerkt />} />
              <Route path="/voordelen" element={<Voordelen />} />
              <Route path="/features/offertes" element={<FeatureOffertes />} />
              <Route path="/features/digitale-schouwen" element={<FeatureSchouwen />} />
              <Route path="/features/planning" element={<FeaturePlanning />} />
              <Route path="/features/leadbeheer" element={<FeatureLeadbeheer />} />
              <Route path="/features/rapportages" element={<FeatureRapportages />} />
              <Route path="/features/webtools" element={<FeatureWebtools />} />
              <Route path="/features/energieadvies" element={<FeatureEnergieadvies />} />
              <Route path="/over-ons" element={<OverOns />} />
              <Route path="/prijzen" element={<Prijzen />} />
              <Route path="/partners-worden" element={<PartnersWorden />} />
              <Route path="/veelgestelde-vragen" element={<FAQ />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/voorwaarden" element={<Voorwaarden />} />
              <Route path="/cookies" element={<CookieBeleid />} />
            </Route>

            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/partners" element={
                <ProtectedRoute allowedRoles={["superadmin"]}><Partners /></ProtectedRoute>
              } />
              <Route path="/adviseurs" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "partner_staff"]}><Adviseurs /></ProtectedRoute>
              } />
              <Route path="/gebruikers" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin"]}><Gebruikers /></ProtectedRoute>
              } />
              <Route path="/leads" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "partner_staff", "adviseur"]}><Leads /></ProtectedRoute>
              } />
              <Route path="/leads/:id" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "partner_staff", "adviseur"]}><LeadDetail /></ProtectedRoute>
              } />
              <Route path="/klanten" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "partner_staff", "adviseur"]}><Klanten /></ProtectedRoute>
              } />
              <Route path="/klanten/:id" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "partner_staff", "adviseur"]}><KlantDetail /></ProtectedRoute>
              } />
              <Route path="/producten" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "partner_staff", "adviseur", "installateur"]}><Producten /></ProtectedRoute>
              } />
              <Route path="/producten/:id" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "partner_staff", "adviseur", "installateur"]}><ProductDetail /></ProtectedRoute>
              } />
              <Route path="/schouwen" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "partner_staff", "adviseur", "installateur", "consument"]}><Schouwen /></ProtectedRoute>
              } />
              <Route path="/schouwen/nieuw" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "partner_staff", "adviseur"]}><SchouwNieuw /></ProtectedRoute>
              } />
              <Route path="/schouwen/snelstart" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "partner_staff", "adviseur"]}><SchouwSnelstart /></ProtectedRoute>
              } />
              <Route path="/schouwen/:id" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "partner_staff", "adviseur", "installateur", "consument"]}><SchouwDetail /></ProtectedRoute>
              } />
              <Route path="/schouwen/:id/uitvoeren" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "partner_staff", "adviseur"]}><SchouwUitvoeren /></ProtectedRoute>
              } />
              <Route path="/offertes" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "partner_staff", "adviseur", "consument", "affiliate"]}><Offertes /></ProtectedRoute>
              } />
              <Route path="/offertes/:id" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "partner_staff", "adviseur", "consument", "affiliate"]}><OfferteDetail /></ProtectedRoute>
              } />
              <Route path="/opdrachten" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "partner_staff", "adviseur", "installateur"]}><Opdrachten /></ProtectedRoute>
              } />
              <Route path="/opdrachten/:id" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "partner_staff", "adviseur", "installateur"]}><OpdrachtDetail /></ProtectedRoute>
              } />
              <Route path="/installaties" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "partner_staff", "installateur"]}><Installaties /></ProtectedRoute>
              } />
              <Route path="/planning" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "partner_staff", "adviseur", "installateur", "consument"]}><Planning /></ProtectedRoute>
              } />
              <Route path="/planning/nieuw" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "partner_staff", "adviseur"]}><AfspraakNieuw /></ProtectedRoute>
              } />
              <Route path="/analytics" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "partner_staff"]}><Analytics /></ProtectedRoute>
              } />
              <Route path="/berichten" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "partner_staff", "adviseur", "consument"]}><Berichten /></ProtectedRoute>
              } />
              <Route path="/documenten" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "partner_staff"]}><Documenten /></ProtectedRoute>
              } />
              <Route path="/energieadvies" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "partner_staff", "adviseur"]}><Energieadvies /></ProtectedRoute>
              } />
              <Route path="/tools" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "partner_staff", "adviseur"]}><Tools /></ProtectedRoute>
              } />
              <Route path="/tools/energieadvies" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "partner_staff", "adviseur"]}><Energieadvies /></ProtectedRoute>
              } />
              <Route path="/tools/thuisbatterij" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "partner_staff", "adviseur"]}><ThuisbatterijSelector /></ProtectedRoute>
              } />
              {/* /tools/webtools now redirects to /tools — webtools are integrated */}
              <Route path="/offertes/nieuw" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "partner_staff", "adviseur"]}><OfferteNieuw /></ProtectedRoute>
              } />
              <Route path="/offertes/template" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "partner_staff", "adviseur"]}><OfferteTemplatePage /></ProtectedRoute>
              } />
              <Route path="/offertes/feedback" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "partner_staff"]}><OfferteFeedback /></ProtectedRoute>
              } />
              <Route path="/feedback" element={<FeedbackOverzicht />} />
              <Route path="/feedback/nieuw" element={<FeedbackNieuw />} />
              <Route path="/feedback/admin" element={
                <ProtectedRoute allowedRoles={["superadmin"]}><FeedbackAdmin /></ProtectedRoute>
              } />
              <Route path="/instellingen" element={<Instellingen />} />
              <Route path="/affiliates" element={
                <ProtectedRoute allowedRoles={["affiliate"]}><Affiliates /></ProtectedRoute>
              } />
              <Route path="/affiliate-beheer" element={
                <ProtectedRoute allowedRoles={["superadmin"]}><AffiliateBeheer /></ProtectedRoute>
              } />
              <Route path="/admin/abonnementen" element={
                <ProtectedRoute allowedRoles={["superadmin"]}><AdminAbonnementen /></ProtectedRoute>
              } />
              <Route path="/financieel" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "partner_staff", "adviseur"]}><Financieel /></ProtectedRoute>
              } />
              <Route path="/financieel/nieuw/:type" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "partner_staff", "adviseur"]}><FactuurNieuw /></ProtectedRoute>
              } />
              <Route path="/financieel/:id" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "partner_staff", "adviseur"]}><FactuurDetail /></ProtectedRoute>
              } />
              <Route path="/leveranciers" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "partner_staff"]}><Leveranciers /></ProtectedRoute>
              } />
              <Route path="/offertes/:id/pdf" element={<OffertePDF />} />
              <Route path="/producten/:id/datasheet" element={<ProductDatasheetPage />} />
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
