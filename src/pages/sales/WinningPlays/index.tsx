import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Sparkles, Save, RefreshCw } from "lucide-react";
import { useWinningPlays, useGenerateWinningPlay, useSaveWinningPlaySnippet, type WinningPlayLead } from "@/hooks/sales/useWinningPlays";
import { euro } from "@/lib/sales/forecast";

export default function WinningPlays() {
  const { data, isLoading } = useWinningPlays(90);

  return (
    <div className="space-y-4" data-testid="winning-plays">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Trophy className="h-4 w-4 text-amber-500" /> Leer van je gewonnen deals — laat AI vatten waarom en deel het als snippet.
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : (data ?? []).length === 0 ? (
        <Card><CardContent className="p-6 text-sm text-muted-foreground">
          Nog geen gewonnen deals in de laatste 90 dagen.
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(data ?? []).map((lead) => <PlayKaart key={lead.id} lead={lead} />)}
        </div>
      )}
    </div>
  );
}

function PlayKaart({ lead }: { lead: WinningPlayLead }) {
  const gen = useGenerateWinningPlay();
  const opslaan = useSaveWinningPlaySnippet();
  const [samenvatting, setSamenvatting] = useState<string | null>(lead.winning_play_samenvatting);
  const [hoogtepunten, setHoogtepunten] = useState<string[] | null>(lead.winning_play_hoogtepunten);

  const draai = async (force = false) => {
    const res = await gen.mutateAsync({ lead_id: lead.id, force });
    setSamenvatting(res.samenvatting);
    setHoogtepunten(res.hoogtepunten);
  };

  const bewaarAlsSnippet = () => {
    if (!samenvatting) return;
    const body = `Winning play – ${lead.bedrijfsnaam}\n\n${samenvatting}\n\n${(hoogtepunten ?? []).map((h) => `• ${h}`).join("\n")}`;
    opslaan.mutate({ titel: `Winning play: ${lead.bedrijfsnaam}`, body });
  };

  return (
    <Card data-testid="winning-play-kaart">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between gap-2">
          <span className="truncate">{lead.bedrijfsnaam}</span>
          {lead.geschatte_waarde ? <Badge variant="outline">{euro(Number(lead.geschatte_waarde))}</Badge> : null}
        </CardTitle>
        <p className="text-[11px] text-muted-foreground">
          Gewonnen {new Date(lead.updated_at).toLocaleDateString("nl-NL")}
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {samenvatting ? (
          <>
            <p className="text-sm" data-testid="wp-samenvatting">{samenvatting}</p>
            {hoogtepunten && hoogtepunten.length > 0 && (
              <ul className="list-disc pl-4 text-xs space-y-0.5 text-muted-foreground">
                {hoogtepunten.map((h, i) => <li key={i}>{h}</li>)}
              </ul>
            )}
            <div className="flex flex-wrap gap-1 pt-1">
              <Button size="sm" variant="outline" className="gap-1" onClick={() => draai(true)} disabled={gen.isPending} data-testid="wp-vernieuwen">
                <RefreshCw className={`h-3 w-3 ${gen.isPending ? "animate-spin" : ""}`} /> Vernieuwen
              </Button>
              <Button size="sm" className="gap-1" onClick={bewaarAlsSnippet} disabled={opslaan.isPending} data-testid="wp-snippet-opslaan">
                <Save className="h-3 w-3" /> Snippet maken
              </Button>
            </div>
          </>
        ) : (
          <Button size="sm" variant="outline" className="gap-1" onClick={() => draai(false)} disabled={gen.isPending} data-testid="wp-genereer">
            <Sparkles className="h-3.5 w-3.5" /> Genereer waarom-gewonnen
          </Button>
        )}
      </CardContent>
    </Card>
  );
}