import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ErrorLogTabel } from "./ErrorLogTabel";
import { AuditLogTabel } from "./AuditLogTabel";
import { EntiteitHistorieTabel } from "./EntiteitHistorieTabel";

/**
 * Superadmin systeemlogs: gelogde frontend/edge errors + audit trail uit eigen DB.
 *
 * Let op: Lovable Cloud geeft geen toegang tot de Supabase Management API,
 * dus ruwe edge/auth/postgres logs zijn niet beschikbaar. We laten alleen
 * data zien die via triggers in onze eigen tabellen wordt vastgelegd.
 */
export default function SystemLogs() {
  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Systeemlogs</h1>
        <p className="text-sm text-muted-foreground">
          Centraal overzicht van fouten en gevoelige acties, opgehaald uit onze eigen audit-tabellen.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Foutanalyse</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="errors" className="w-full">
            <TabsList className="grid grid-cols-1 md:grid-cols-3 h-auto">
              <TabsTrigger value="errors">Gelogde errors</TabsTrigger>
              <TabsTrigger value="audit">Audit log (gevoelige acties)</TabsTrigger>
              <TabsTrigger value="entiteit">Wijzigingen (leads/offertes/…)</TabsTrigger>
            </TabsList>

            <TabsContent value="errors" className="mt-4">
              <ErrorLogTabel />
            </TabsContent>
            <TabsContent value="audit" className="mt-4">
              <AuditLogTabel />
            </TabsContent>
            <TabsContent value="entiteit" className="mt-4">
              <EntiteitHistorieTabel />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}