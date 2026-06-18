import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sparkles, CheckCircle2, Clock, ChevronRight, Phone, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { AffiliateSubnav } from "@/components/affiliate/AffiliateSubnav";
import { useOpvolgTaken, useVoltooiOpvolgTaak, useVerzetOpvolgTaak, type OpvolgTaak } from "@/hooks/affiliate/useOpvolgTaken";
import { useAffiliateLeads } from "@/hooks/affiliate/useAffiliateLeads";
import { telLink } from "@/lib/affiliate/contact";

const prioKleur: Record<string, string> = {
  hoog: "bg-rose-100 text-rose-800 border-rose-300",
  normaal: "bg-blue-100 text-blue-800 border-blue-300",
  laag: "bg-slate-100 text-slate-700 border-slate-300",
};

const typeIcoon: Record<string, JSX.Element> = {
  bel: <Phone className="h-3.5 w-3.5" />,
  mail: <Mail className="h-3.5 w-3.5" />,
  demo: <Sparkles className="h-3.5 w-3.5" />,
  trial_check: <CheckCircle2 className="h-3.5 w-3.5" />,
  whatsapp: <Phone className="h-3.5 w-3.5" />,
  anders: <Clock className="h-3.5 w-3.5" />,
};

const AffiliateOpvolging = () => {
  const { data: taken = [], isLoading } = useOpvolgTaken("open");
  const { data: leads = [] } = useAffiliateLeads("mine");
  const voltooi = useVoltooiOpvolgTaak();
  const verzet = useVerzetOpvolgTaak();
  const [tab, setTab] = useState("vandaag");

  const leadById = useMemo(() => new Map(leads.map((l) => [l.id, l])), [leads]);

  const groepen = useMemo(() => {
    const nu = new Date();
    const vandaagEnd = new Date(); vandaagEnd.setHours(23, 59, 59, 999);
    const overWeek = new Date(Date.now() + 7 * 86400000);
    const out = { achterstallig: [] as OpvolgTaak[], vandaag: [] as OpvolgTaak[], week: [] as OpvolgTaak[] };
    for (const t of taken) {
      const d = new Date(t.due_op);
      if (d < nu) out.achterstallig.push(t);
      else if (d <= vandaagEnd) out.vandaag.push(t);
      else if (d <= overWeek) out.week.push(t);
    }
    return out;
  }, [taken]);

  const renderTaak = (t: OpvolgTaak) => {
    const lead = t.lead_id ? leadById.get(t.lead_id) : undefined;
    const tel = telLink(lead?.telefoon);
    return (
      <div key={t.id} className="flex items-start gap-3 border rounded-md p-3 hover:bg-muted/30 transition-colors">
        <div className="mt-0.5">
          <Badge variant="outline" className={prioKleur[t.prioriteit] ?? ""}>{t.prioriteit}</Badge>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{t.titel}</span>
            <Badge variant="outline" className="gap-1 text-xs">{typeIcoon[t.type] ?? null}{t.type}</Badge>
            {t.bron === "ai" && <Badge variant="secondary" className="gap-1 text-xs"><Sparkles className="h-3 w-3" /> AI</Badge>}
          </div>
          {t.notitie && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{t.notitie}</p>}
          <p className="text-xs text-muted-foreground mt-1">
            {lead && (
              <Link to={`/affiliates/leads/${lead.id}`} className="hover:underline">
                {lead.bedrijfsnaam}
              </Link>
            )}
            {lead && " · "}
            {new Date(t.due_op).toLocaleString("nl-NL", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <div className="flex gap-1">
          {tel && <Button asChild size="sm" variant="outline"><a href={tel}><Phone className="h-3.5 w-3.5" /></a></Button>}
          <Button size="sm" variant="outline" onClick={() => verzet.mutate({ id: t.id, dagen: 1 })}>+1d</Button>
          <Button size="sm" variant="ghost" onClick={() => voltooi.mutate(t.id)}><CheckCircle2 className="h-4 w-4" /></Button>
        </div>
      </div>
    );
  };

  const sectie = (lijst: OpvolgTaak[], leeg: string) =>
    lijst.length === 0
      ? <p className="text-sm text-muted-foreground py-6 text-center">{leeg}</p>
      : <div className="space-y-2">{lijst.map(renderTaak)}</div>;

  return (
    <div className="p-6 space-y-4">
      <AffiliateSubnav />
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Sparkles className="h-6 w-6 text-primary" /> Opvolging</h1>
        <p className="text-sm text-muted-foreground">{taken.length} openstaande taken · AI helpt je prioriteren en plannen.</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Laden…</p>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList>
                <TabsTrigger value="achterstallig">
                  Achterstallig {groepen.achterstallig.length > 0 && <Badge variant="destructive" className="ml-2">{groepen.achterstallig.length}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="vandaag">
                  Vandaag <Badge variant="secondary" className="ml-2">{groepen.vandaag.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="week">
                  Komende 7 dagen <Badge variant="outline" className="ml-2">{groepen.week.length}</Badge>
                </TabsTrigger>
              </TabsList>
              <TabsContent value="achterstallig" className="mt-4">{sectie(groepen.achterstallig, "Niets achterstallig — top!")}</TabsContent>
              <TabsContent value="vandaag" className="mt-4">{sectie(groepen.vandaag, "Niets voor vandaag.")}</TabsContent>
              <TabsContent value="week" className="mt-4">{sectie(groepen.week, "Geen taken in de komende 7 dagen.")}</TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Hulp van de AI</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>Open een lead om de AI een score en concreet opvolgplan te laten maken.</p>
          <Link to="/affiliates/pipeline" className="inline-flex items-center text-primary hover:underline">Naar pipeline <ChevronRight className="h-3 w-3" /></Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default AffiliateOpvolging;