import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNextBestActions } from "@/hooks/sales/useNextBestActions";
import RisicoBadge from "@/components/sales/RisicoBadge";

export default function NextBestActionLijst() {
  const navigate = useNavigate();
  const { acties, isLoading } = useNextBestActions(10);

  return (
    <Card data-testid="nba-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-500" /> Volgende beste acties
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading && <div className="p-4 text-sm text-muted-foreground">Laden…</div>}
        {!isLoading && acties.length === 0 && (
          <div className="p-4 text-sm text-muted-foreground">Geen dringende acties gevonden. Alles onder controle.</div>
        )}
        <ul className="divide-y">
          {acties.map((a) => (
            <li key={a.lead.id} data-testid="nba-item">
              <button
                type="button"
                onClick={() => navigate(`/sales/leads/${a.lead.id}`)}
                className="w-full text-left px-4 py-2.5 hover:bg-muted/40 flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{a.lead.bedrijfsnaam}</span>
                    <RisicoBadge score={a.lead.risico_score} compact />
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{a.reden}</div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}