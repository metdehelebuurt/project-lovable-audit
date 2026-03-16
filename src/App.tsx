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
import Offertes from "@/pages/Offertes";
import Installaties from "@/pages/Installaties";
import Planning from "@/pages/Planning";
import Analytics from "@/pages/Analytics";
import Berichten from "@/pages/Berichten";
import Documenten from "@/pages/Documenten";
import Instellingen from "@/pages/Instellingen";
import OffertePDF from "@/pages/OffertePDF";
import Home from "@/pages/Home";
import Signup from "@/pages/Signup";
import Energieadvies from "@/pages/Energieadvies";
import OfferteNieuw from "@/pages/OfferteNieuw";
import Tools from "@/pages/Tools";
import ThuisbatterijSelector from "@/pages/ThuisbatterijSelector";
import WebTools from "@/pages/WebTools";
import Affiliates from "@/pages/Affiliates";
import AffiliateBeheer from "@/pages/AffiliateBeheer";
import NotFound from "@/pages/NotFound";

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
            <Route path="/embed/contact/:widgetId" element={<EmbedContact />} />
            <Route path="/embed/calculator/:widgetId" element={<EmbedCalculator />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Public website pages with shared layout */}
            <Route element={<WebsiteLayout />}>
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
              <Route path="/producten" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "partner_staff", "adviseur", "installateur"]}><Producten /></ProtectedRoute>
              } />
              <Route path="/schouwen" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "partner_staff", "adviseur", "installateur", "consument"]}><Schouwen /></ProtectedRoute>
              } />
              <Route path="/offertes" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "partner_staff", "adviseur", "consument"]}><Offertes /></ProtectedRoute>
              } />
              <Route path="/installaties" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "partner_staff", "installateur"]}><Installaties /></ProtectedRoute>
              } />
              <Route path="/planning" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "partner_staff", "adviseur", "installateur", "consument"]}><Planning /></ProtectedRoute>
              } />
              <Route path="/analytics" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "partner_staff"]}><Analytics /></ProtectedRoute>
              } />
              <Route path="/berichten" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "partner_staff", "consument"]}><Berichten /></ProtectedRoute>
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
              <Route path="/instellingen" element={<Instellingen />} />
              <Route path="/affiliates" element={
                <ProtectedRoute allowedRoles={["affiliate"]}><Affiliates /></ProtectedRoute>
              } />
              <Route path="/affiliate-beheer" element={
                <ProtectedRoute allowedRoles={["superadmin"]}><AffiliateBeheer /></ProtectedRoute>
              } />
              <Route path="/offertes/:id/pdf" element={<OffertePDF />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
          <CookieConsent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
