import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Kanban, List, Upload, BarChart3, Settings, Tag, FileText, Rocket, Users, TrendingUp, CalendarDays, Sparkles } from "lucide-react";
import SalesPipeline from "./SalesPipeline";
import SalesLeads from "./SalesLeads";
import SalesImport from "./SalesImport";
import SalesAnalytics from "./SalesAnalytics";
import PipelineInstellingen from "./PipelineInstellingen";
import BronnenBeheer from "./BronnenBeheer";
import SnippetsBeheer from "./SnippetsBeheer";
import SalesTrials from "./Trials";
import TeamCockpit from "./TeamCockpit";
import SalesForecast from "./Forecast";
import TrialLifecycle from "./TrialLifecycle";
import TeamAgenda from "./TeamAgenda";

export default function Sales() {
  return (
    <div className="w-full px-4 md:px-6 py-4 md:py-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Sales CRM</h1>
        <p className="text-sm text-muted-foreground">
          Beheer al je leads — koud tot heet — en zet ze door naar de juiste affiliate.
        </p>
      </div>
      <Tabs defaultValue="team">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="team" className="gap-2"><Users className="h-4 w-4" />Team</TabsTrigger>
          <TabsTrigger value="forecast" className="gap-2"><TrendingUp className="h-4 w-4" />Forecast</TabsTrigger>
          <TabsTrigger value="pipeline" className="gap-2"><Kanban className="h-4 w-4" />Pipeline</TabsTrigger>
          <TabsTrigger value="leads" className="gap-2"><List className="h-4 w-4" />Alle leads</TabsTrigger>
          <TabsTrigger value="trials" className="gap-2"><Rocket className="h-4 w-4" />Trials</TabsTrigger>
          <TabsTrigger value="trial-lifecycle" className="gap-2"><Sparkles className="h-4 w-4" />Trial-fases</TabsTrigger>
          <TabsTrigger value="agenda" className="gap-2"><CalendarDays className="h-4 w-4" />Team-agenda</TabsTrigger>
          <TabsTrigger value="import" className="gap-2"><Upload className="h-4 w-4" />Importeren</TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2"><BarChart3 className="h-4 w-4" />Analytics</TabsTrigger>
          <TabsTrigger value="instellingen" className="gap-2"><Settings className="h-4 w-4" />Pipeline</TabsTrigger>
          <TabsTrigger value="bronnen" className="gap-2"><Tag className="h-4 w-4" />Bronnen</TabsTrigger>
          <TabsTrigger value="snippets" className="gap-2"><FileText className="h-4 w-4" />Snippets</TabsTrigger>
        </TabsList>
        <TabsContent value="team" className="mt-4"><TeamCockpit /></TabsContent>
        <TabsContent value="forecast" className="mt-4"><SalesForecast /></TabsContent>
        <TabsContent value="pipeline" className="mt-4"><SalesPipeline /></TabsContent>
        <TabsContent value="leads" className="mt-4"><SalesLeads /></TabsContent>
        <TabsContent value="trials" className="mt-4"><SalesTrials /></TabsContent>
        <TabsContent value="trial-lifecycle" className="mt-4"><TrialLifecycle /></TabsContent>
        <TabsContent value="agenda" className="mt-4"><TeamAgenda /></TabsContent>
        <TabsContent value="import" className="mt-4"><SalesImport /></TabsContent>
        <TabsContent value="analytics" className="mt-4"><SalesAnalytics /></TabsContent>
        <TabsContent value="instellingen" className="mt-4"><PipelineInstellingen /></TabsContent>
        <TabsContent value="bronnen" className="mt-4"><BronnenBeheer /></TabsContent>
        <TabsContent value="snippets" className="mt-4"><SnippetsBeheer /></TabsContent>
      </Tabs>
    </div>
  );
}