import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PhoneCall, Mail, ListChecks, ArrowRight, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAffiliateLeadSignals, totaalSignalen } from "@/hooks/affiliate/useLeadSignals";
import { useAffiliateLeads } from "@/hooks/affiliate/useAffiliateLeads";
import { formatDistanceToNowStrict } from "date-fns";
import { nl } from "date-fns/locale";

/**
 * "Wat moet ik nu doen"-widget voor de affiliate.
 * Combineert openstaande taken, aankomende terugbelafspraken en ongelezen e-mails
 * per lead in één actiegerichte lijst.
 */
export function ActieVandaagKaart() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: signals } = useAffiliateLeadSignals();
  const { data: leads = [] } = useAffiliateLeads("mine");

  const rijen = leads
    .map((l) => ({ lead: l, signal: signals?.[l.id] }))
    .filter((r) => r.signal && totaalSignalen(r.signal) > 0)
    .sort((a, b) => {
      // terugbel > taken > mails, en verder oplopend op laatste_signaal
      const scoreA = (a.signal!.aankomende_terugbel ?? 0) * 100 + (a.signal!.openstaande_taken ?? 0) * 10 + (a.signal!.ongelezen_mails ?? 0);
      const scoreB = (b.signal!.aankomende_terugbel ?? 0) * 100 + (b.signal!.openstaande_taken ?? 0) * 10 + (b.signal!.ongelezen_mails ?? 0);
      return scoreB - scoreA;
    })
    .slice(0, 8);

  if (!user) return null;

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" /> Actie vandaag
          {rijen.length > 0 && <Badge variant="secondary" className="ml-1">{rijen.length}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2 space-y-1">
        {rijen.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">Alles bijgewerkt. Geen openstaande signalen.</p>
        ) : (
          rijen.map(({ lead, signal }) => (
            <button
              key={lead.id}
              onClick={() => navigate(`/affiliates/leads/${lead.id}`)}
              className="w-full text-left p-2 rounded-lg hover:bg-muted/40 transition-colors flex items-center gap-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{lead.bedrijfsnaam ?? "—"}</p>
                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                  {signal!.aankomende_terugbel > 0 && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700">
                      <PhoneCall className="h-3 w-3" /> {signal!.aankomende_terugbel} terugbel
                    </span>
                  )}
                  {signal!.openstaande_taken > 0 && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700">
                      <ListChecks className="h-3 w-3" /> {signal!.openstaande_taken} taak
                    </span>
                  )}
                  {signal!.ongelezen_mails > 0 && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700">
                      <Mail className="h-3 w-3" /> {signal!.ongelezen_mails} mail
                    </span>
                  )}
                  {signal!.laatste_signaal && (
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNowStrict(new Date(signal!.laatste_signaal), { locale: nl, addSuffix: true })}
                    </span>
                  )}
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          ))
        )}
      </CardContent>
    </Card>
  );
}