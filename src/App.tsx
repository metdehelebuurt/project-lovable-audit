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
import Instellingen from "@/pages/Instellingen";
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
              <Route path="/partners" element={
                <ProtectedRoute allowedRoles={["superadmin"]}>
                  <Partners />
                </ProtectedRoute>
              } />
              <Route path="/adviseurs" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "partner_staff"]}>
                  <Adviseurs />
                </ProtectedRoute>
              } />
              <Route path="/gebruikers" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin"]}>
                  <Gebruikers />
                </ProtectedRoute>
              } />
              <Route path="/leads" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "partner_staff", "adviseur"]}>
                  <Leads />
                </ProtectedRoute>
              } />
              <Route path="/producten" element={<Producten />} />
              <Route path="/schouwen" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "partner_staff", "adviseur", "installateur", "consument"]}>
                  <Schouwen />
                </ProtectedRoute>
              } />
              <Route path="/offertes" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "partner_staff", "adviseur", "consument"]}>
                  <Offertes />
                </ProtectedRoute>
              } />
              <Route path="/installaties" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "partner_staff", "installateur"]}>
                  <Installaties />
                </ProtectedRoute>
              } />
              <Route path="/planning" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "partner_staff", "adviseur", "installateur", "consument"]}>
                  <Planning />
                </ProtectedRoute>
              } />
              <Route path="/analytics" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "partner_staff"]}>
                  <Analytics />
                </ProtectedRoute>
              } />
              <Route path="/berichten" element={
                <ProtectedRoute allowedRoles={["superadmin", "partner_admin", "partner_staff", "consument"]}>
                  <Berichten />
                </ProtectedRoute>
              } />
              <Route path="/instellingen" element={<Instellingen />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
