import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Kanban, List, Upload, BarChart3 } from "lucide-react";
import SalesPipeline from "./SalesPipeline";
import SalesLeads from "./SalesLeads";
import SalesImport from "./SalesImport";
import SalesAnalytics from "./SalesAnalytics";

export default function Sales() {
  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Sales CRM</h1>
        <p className="text-sm text-muted-foreground">
          Beheer koude en warme leads en zet ze door naar affiliates.
        </p>
      </div>
      <Tabs defaultValue="pipeline">
        <TabsList>
          <TabsTrigger value="pipeline" className="gap-2"><Kanban className="h-4 w-4" />Pipeline</TabsTrigger>
          <TabsTrigger value="leads" className="gap-2"><List className="h-4 w-4" />Alle leads</TabsTrigger>
          <TabsTrigger value="import" className="gap-2"><Upload className="h-4 w-4" />Importeren</TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2"><BarChart3 className="h-4 w-4" />Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="pipeline" className="mt-4"><SalesPipeline /></TabsContent>
        <TabsContent value="leads" className="mt-4"><SalesLeads /></TabsContent>
        <TabsContent value="import" className="mt-4"><SalesImport /></TabsContent>
        <TabsContent value="analytics" className="mt-4"><SalesAnalytics /></TabsContent>
      </Tabs>
    </div>
  );
}