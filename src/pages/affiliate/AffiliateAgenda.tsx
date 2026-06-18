import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Calendar, Phone } from "lucide-react";
import { AffiliateSubnav } from "@/components/affiliate/AffiliateSubnav";
import { useTerugbelAfspraken, useAfvinkenTerugbel } from "@/hooks/affiliate/useTerugbelAfspraken";
import { useAffiliateLeads } from "@/hooks/affiliate/useAffiliateLeads";
import { telLink, whatsappLink } from "@/lib/affiliate/contact";

const AffiliateAgenda = () => {
  const { data: afspraken = [], isLoading } = useTerugbelAfspraken("open");
  const { data: leads = [] } = useAffiliateLeads("mine");
  const afvink = useAfvinkenTerugbel();

  const leadById = useMemo(() => new Map(leads.map((l) => [l.id, l])), [leads]);

  const groepen = useMemo(() => {
    const vandaag = new Date(); vandaag.setHours(23, 59, 59, 999);
    const overmorgen = new Date(Date.now() + 2 * 86400000); overmorgen.setHours(23, 59, 59, 999);
    const out = { achterstallig: [] as typeof afspraken, vandaag: [] as typeof afspraken, deze_week: [] as typeof afspraken, later: [] as typeof afspraken };
    const nu = new Date();
    for (const a of afspraken) {
      const d = new Date(a.geplande_op);
      if (d < nu) out.achterstallig.push(a);
      else if (d <= vandaag) out.vandaag.push(a);
      else if (d <= overmorgen) out.deze_week.push(a);
      else out.later.push(a);
    }
    return out;
  }, [afspraken]);

  const sectie = (label: string, items: typeof afspraken, kleur: string) => {
    if (items.length === 0) return null;
    return (
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center justify-between"><span>{label}</span><Badge variant="outline" className={kleur}>{items.length}</Badge></CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {items.map((a) => {
            const lead = leadById.get(a.lead_id);
            const tel = telLink(lead?.telefoon);
            const wa = whatsappLink(lead?.telefoon);
            return (
              <div key={a.id} className="flex items-center gap-3 border rounded-md p-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{lead?.bedrijfsnaam ?? "Lead"}</p>
                  <p className="text-xs text-muted-foreground">{new Date(a.geplande_op).toLocaleString("nl-NL")}{a.notitie ? ` · ${a.notitie}` : ""}</p>
                </div>
                {tel && <Button asChild size="sm" variant="outline"><a href={tel}><Phone className="h-3 w-3 mr-1" /> Bel</a></Button>}
                {wa && <Button asChild size="sm" variant="outline" className="text-emerald-700 border-emerald-300"><a href={wa} target="_blank" rel="noreferrer">WhatsApp</a></Button>}
                <Button size="sm" variant="ghost" onClick={() => afvink.mutate(a.id)}><CheckCircle2 className="h-4 w-4" /></Button>
              </div>
            );
          })}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-6 space-y-4">
      <AffiliateSubnav />
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Calendar className="h-6 w-6" /> Terugbelagenda</h1>
        <p className="text-sm text-muted-foreground">{afspraken.length} openstaande terugbelafspraken</p>
      </div>
      {isLoading && <p className="text-sm text-muted-foreground">Laden…</p>}
      {!isLoading && afspraken.length === 0 && (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Geen openstaande afspraken.</CardContent></Card>
      )}
      {sectie("Achterstallig", groepen.achterstallig, "bg-rose-100 text-rose-800 border-rose-300")}
      {sectie("Vandaag", groepen.vandaag, "bg-amber-100 text-amber-800 border-amber-300")}
      {sectie("Komende dagen", groepen.deze_week, "bg-blue-100 text-blue-800 border-blue-300")}
      {sectie("Later", groepen.later, "bg-slate-100 text-slate-700 border-slate-300")}
    </div>
  );
};

export default AffiliateAgenda;
