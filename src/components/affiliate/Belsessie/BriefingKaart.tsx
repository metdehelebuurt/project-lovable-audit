import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { useBelBriefing, type BelBriefing } from "@/hooks/affiliate/useBelBriefing";

interface Props {
  leadId: string;
}

export function BriefingKaart({ leadId }: Props) {
  const briefing = useBelBriefing();
  const [data, setData] = useState<BelBriefing | null>(null);
  const [open, setOpen] = useState(true);

  const genereer = async () => {
    setData(null);
    const result = await briefing.mutateAsync(leadId);
    setData(result);
    setOpen(true);
  };

  return (
    <div className="rounded-md border border-primary/20 bg-primary/5 p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-wide text-primary font-medium flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" /> AI Gespreksbriefing
        </p>
        <div className="flex items-center gap-1">
          {data && (
            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setOpen((o) => !o)}>
              {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={genereer}
            disabled={briefing.isPending}
          >
            <Sparkles className="h-3 w-3 mr-1" />
            {briefing.isPending ? "Bezig..." : data ? "Opnieuw" : "Genereer briefing"}
          </Button>
        </div>
      </div>

      {data && open && (
        <div className="space-y-3 text-sm">
          <Sectie titel="Samenvatting">
            <p className="whitespace-pre-wrap">{data.samenvatting}</p>
          </Sectie>
          <Sectie titel="Gesprekspunten">
            <Lijst items={data.gesprekspunten} />
          </Sectie>
          <Sectie titel="Mogelijke bezwaren">
            <Lijst items={data.mogelijke_bezwaren} />
          </Sectie>
          <Sectie titel="USP's voor deze lead">
            <Lijst items={data.usps} />
          </Sectie>
          <Sectie titel="Aanbevolen volgende actie">
            <p>{data.aanbevolen_volgende_actie}</p>
          </Sectie>
        </div>
      )}

      {!data && !briefing.isPending && (
        <p className="text-xs text-muted-foreground">
          Klik op "Genereer briefing" voor een AI-voorbereiding op basis van lead-data en eerdere contactmomenten.
        </p>
      )}
    </div>
  );
}

function Sectie({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium mb-1">{titel}</p>
      {children}
    </div>
  );
}

function Lijst({ items }: { items: string[] }) {
  if (!items?.length) return <p className="text-xs text-muted-foreground">—</p>;
  return (
    <ul className="list-disc list-inside space-y-1 text-sm">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );
}