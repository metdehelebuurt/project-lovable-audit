import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Users, FileText, Percent, BarChart3, Ban } from "lucide-react";
import AdministratieOverzicht from "@/components/administratie/AdministratieOverzicht";
import PlanConfigurator from "@/components/abonnementen/PlanConfigurator";
import AbonnementOverzicht from "@/components/abonnementen/AbonnementOverzicht";
import FactuurBeheer from "@/components/abonnementen/FactuurBeheer";
import KortingenAffiliates from "@/components/abonnementen/KortingenAffiliates";
import RevenueAnalytics from "@/components/abonnementen/RevenueAnalytics";

const AdminAbonnementen = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Abonnementenbeheer</h1>
        <p className="text-muted-foreground mt-1">Beheer plannen, abonnementen, facturering en affiliates</p>
      </div>

      <Tabs defaultValue="plannen" className="space-y-4">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="plannen" className="flex items-center gap-1.5">
            <Settings className="h-3.5 w-3.5" />Plannen
          </TabsTrigger>
          <TabsTrigger value="abonnementen" className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />Abonnementen
          </TabsTrigger>
          <TabsTrigger value="facturen" className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />Facturering
          </TabsTrigger>
          <TabsTrigger value="kortingen" className="flex items-center gap-1.5">
            <Percent className="h-3.5 w-3.5" />Kortingen & Affiliates
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />Revenue
          </TabsTrigger>
          <TabsTrigger value="administratie" className="flex items-center gap-1.5">
            <Ban className="h-3.5 w-3.5" />Administratie
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plannen"><PlanConfigurator /></TabsContent>
        <TabsContent value="abonnementen"><AbonnementOverzicht /></TabsContent>
        <TabsContent value="facturen"><FactuurBeheer /></TabsContent>
        <TabsContent value="kortingen"><KortingenAffiliates /></TabsContent>
        <TabsContent value="analytics"><RevenueAnalytics /></TabsContent>
        <TabsContent value="administratie"><AdministratieOverzicht /></TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAbonnementen;
