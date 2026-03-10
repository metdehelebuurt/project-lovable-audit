import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import Login from "@/pages/Login";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import PlaceholderPage from "@/pages/PlaceholderPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/partners" element={<PlaceholderPage title="Partners" description="Beheer partnerorganisaties." />} />
              <Route path="/adviseurs" element={<PlaceholderPage title="Adviseurs" description="Beheer energieadviseurs." />} />
              <Route path="/gebruikers" element={<PlaceholderPage title="Gebruikers" description="Beheer alle gebruikers." />} />
              <Route path="/producten" element={<PlaceholderPage title="Producten" description="Productcatalogus beheren." />} />
              <Route path="/schouwen" element={<PlaceholderPage title="Schouwen" description="Woninginspecties beheren." />} />
              <Route path="/offertes" element={<PlaceholderPage title="Offertes" description="Offertes beheren." />} />
              <Route path="/leads" element={<PlaceholderPage title="Leads" description="Leads beheren." />} />
              <Route path="/installaties" element={<PlaceholderPage title="Installaties" description="Installaties beheren." />} />
              <Route path="/planning" element={<PlaceholderPage title="Planning" description="Kalenderweergave." />} />
              <Route path="/analytics" element={<PlaceholderPage title="Analytics" description="Rapportages en analyses." />} />
              <Route path="/berichten" element={<PlaceholderPage title="Berichten" description="Support berichten." />} />
              <Route path="/instellingen" element={<PlaceholderPage title="Instellingen" description="Profiel en instellingen." />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
