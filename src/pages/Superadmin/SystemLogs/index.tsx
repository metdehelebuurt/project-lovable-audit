import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ErrorLogTabel } from "./ErrorLogTabel";
import { LiveLogTabel } from "./LiveLogTabel";

/**
 * Superadmin systeemlogs: gelogde frontend/edge errors + live Supabase logs.
 */
export default function SystemLogs() {
  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Systeemlogs</h1>
        <p className="text-sm text-muted-foreground">
          Centraal overzicht van alle frontend-, edge function- en infrastructuurfouten.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Foutanalyse</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="errors" className="w-full">
            <TabsList className="grid grid-cols-2 md:grid-cols-5 h-auto">
              <TabsTrigger value="errors">Gelogde errors</TabsTrigger>
              <TabsTrigger value="edge">Edge logs</TabsTrigger>
              <TabsTrigger value="function">Function logs</TabsTrigger>
              <TabsTrigger value="auth">Auth logs</TabsTrigger>
              <TabsTrigger value="postgres">Postgres logs</TabsTrigger>
            </TabsList>

            <TabsContent value="errors" className="mt-4">
              <ErrorLogTabel />
            </TabsContent>
            <TabsContent value="edge" className="mt-4">
              <LiveLogTabel type="edge" />
            </TabsContent>
            <TabsContent value="function" className="mt-4">
              <LiveLogTabel type="function" />
            </TabsContent>
            <TabsContent value="auth" className="mt-4">
              <LiveLogTabel type="auth" />
            </TabsContent>
            <TabsContent value="postgres" className="mt-4">
              <LiveLogTabel type="postgres" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}