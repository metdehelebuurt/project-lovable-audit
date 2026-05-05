import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Filters } from "./Filters";
import { StatCards } from "./StatCards";
import { EmailLogTabel } from "./EmailLogTabel";
import { EmailDetailDrawer } from "./EmailDetailDrawer";
import {
  useInboxLogs, usePartnerLogs, usePlatformLogs,
  type EmailRow, type FilterState,
} from "./useEmailLogs";

const defaultFilter: FilterState = { range: "7d", type: "all", status: "all", search: "" };

export default function EmailLogs() {
  const [tab, setTab] = useState<"platform" | "partner" | "inbox">("platform");
  const [filter, setFilter] = useState<FilterState>(defaultFilter);
  const [selected, setSelected] = useState<EmailRow | null>(null);

  const platform = usePlatformLogs(filter);
  const partner = usePartnerLogs(filter);
  const inbox = useInboxLogs(filter);

  const huidig = tab === "platform" ? platform : tab === "partner" ? partner : inbox;

  const typeOpties = useMemo(() => {
    const set = new Set<string>();
    (huidig.data ?? []).forEach((r) => r.type && set.add(r.type));
    return Array.from(set).sort();
  }, [huidig.data]);

  const statusOpties = useMemo(() => {
    const set = new Set<string>();
    (huidig.data ?? []).forEach((r) => r.status && set.add(r.status));
    return Array.from(set).sort();
  }, [huidig.data]);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">E-maillogs</h1>
        <p className="text-sm text-muted-foreground">
          Centraal overzicht van alle uitgaande mail. Per stroom zie je wie de afzender was —
          het platform zelf, een partner-organisatie via SMTP, of een individuele gebruiker via zijn eigen Gmail/Outlook.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Verzendlogs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={tab} onValueChange={(v) => { setTab(v as typeof tab); setFilter(defaultFilter); }}>
            <TabsList>
              <TabsTrigger value="platform">Platform-mails</TabsTrigger>
              <TabsTrigger value="partner">Partner-mails</TabsTrigger>
              <TabsTrigger value="inbox">Gebruiker-inbox</TabsTrigger>
            </TabsList>

            <div className="mt-4 space-y-4">
              <Filters
                value={filter}
                onChange={setFilter}
                typeOptions={typeOpties}
                statusOptions={statusOpties}
              />
              <StatCards rows={huidig.data} />

              <TabsContent value="platform" className="mt-0">
                <EmailLogTabel rows={platform.data} isLoading={platform.isLoading} onSelect={setSelected} />
              </TabsContent>
              <TabsContent value="partner" className="mt-0">
                <EmailLogTabel rows={partner.data} isLoading={partner.isLoading} onSelect={setSelected} />
              </TabsContent>
              <TabsContent value="inbox" className="mt-0">
                <EmailLogTabel rows={inbox.data} isLoading={inbox.isLoading} onSelect={setSelected} />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      <EmailDetailDrawer row={selected} onClose={() => setSelected(null)} />
    </div>
  );
}