import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, ArrowUp, ArrowDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { AffiliateSubnav } from "@/components/affiliate/AffiliateSubnav";
import {
  useAffiliatePipelineConfig,
  useUpdatePipelineFase,
  useHerordenPipelineFases,
  type PipelineFaseConfig,
} from "@/hooks/affiliate/useAffiliatePipelineConfig";
import { PIPELINE_KLEUREN, kleurBadge, kleurDot } from "@/lib/affiliate/pipelineKleur";
import { useState, useEffect } from "react";

export default function AffiliatePijplijnInstellingen() {
  const { data: fases, isLoading } = useAffiliatePipelineConfig();
  const heroden = useHerordenPipelineFases();

  const verplaats = (id: string, richting: -1 | 1) => {
    if (!fases) return;
    const idx = fases.findIndex((f) => f.id === id);
    if (idx < 0) return;
    const nieuw = [...fases];
    const target = idx + richting;
    if (target < 0 || target >= nieuw.length) return;
    [nieuw[idx], nieuw[target]] = [nieuw[target], nieuw[idx]];
    heroden.mutate(nieuw.map((f, i) => ({ id: f.id, volgorde: (i + 1) * 10 })));
  };

  return (
    <div className="p-6 space-y-4">
      <AffiliateSubnav />
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <Settings className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold leading-tight">Pijplijn-instellingen</h1>
          <p className="text-sm text-muted-foreground">
            Kleur, label en volgorde van fases in jouw affiliate-pijplijn.
          </p>
        </div>
      </div>

      {isLoading || !fases ? (
        <Skeleton className="h-96" />
      ) : (
        <Card className="p-4 space-y-2">
          <div className="grid grid-cols-12 gap-2 text-[11px] uppercase tracking-wide text-muted-foreground px-2">
            <div className="col-span-5">Label</div>
            <div className="col-span-3">Kleur</div>
            <div className="col-span-2 text-center">Zichtbaar</div>
            <div className="col-span-2 text-right">Volgorde</div>
          </div>
          {fases.map((fase, i) => (
            <FaseRij
              key={fase.id}
              fase={fase}
              kanOmhoog={i > 0}
              kanOmlaag={i < fases.length - 1}
              onOmhoog={() => verplaats(fase.id, -1)}
              onOmlaag={() => verplaats(fase.id, 1)}
            />
          ))}
        </Card>
      )}
    </div>
  );
}

function FaseRij({
  fase,
  kanOmhoog,
  kanOmlaag,
  onOmhoog,
  onOmlaag,
}: {
  fase: PipelineFaseConfig;
  kanOmhoog: boolean;
  kanOmlaag: boolean;
  onOmhoog: () => void;
  onOmlaag: () => void;
}) {
  const upd = useUpdatePipelineFase();
  const [label, setLabel] = useState(fase.label);
  const [kleur, setKleur] = useState(fase.kleur);
  const [zichtbaar, setZichtbaar] = useState(fase.zichtbaar);

  useEffect(() => {
    setLabel(fase.label);
    setKleur(fase.kleur);
    setZichtbaar(fase.zichtbaar);
  }, [fase.label, fase.kleur, fase.zichtbaar]);

  const gewijzigd = label !== fase.label || kleur !== fase.kleur || zichtbaar !== fase.zichtbaar;

  const opslaan = () => {
    upd.mutate({
      id: fase.id,
      patch: { label: label.trim() || fase.label, kleur, zichtbaar },
    });
  };

  return (
    <div className="grid grid-cols-12 gap-2 items-center border rounded-md p-2 bg-card">
      <div className="col-span-5 flex items-center gap-2 min-w-0">
        <span className={`h-3 w-3 rounded-full shrink-0 ${kleurDot(kleur)}`} />
        <Input value={label} onChange={(e) => setLabel(e.target.value)} className="h-8" />
        {fase.is_systeem && (
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">sys</span>
        )}
      </div>
      <div className="col-span-3">
        <Select value={kleur} onValueChange={setKleur}>
          <SelectTrigger className="h-8">
            <SelectValue>
              <span className={`inline-flex items-center gap-2 px-2 py-0.5 rounded ${kleurBadge(kleur)}`}>
                <span className={`h-2 w-2 rounded-full ${kleurDot(kleur)}`} />
                {kleur}
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {PIPELINE_KLEUREN.map((k) => (
              <SelectItem key={k} value={k}>
                <span className="inline-flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${kleurDot(k)}`} />
                  {k}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="col-span-2 flex justify-center">
        <Switch checked={zichtbaar} onCheckedChange={setZichtbaar} />
      </div>
      <div className="col-span-2 flex items-center justify-end gap-1">
        <Button size="icon" variant="ghost" className="h-7 w-7" disabled={!kanOmhoog} onClick={onOmhoog} aria-label="Omhoog">
          <ArrowUp className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" disabled={!kanOmlaag} onClick={onOmlaag} aria-label="Omlaag">
          <ArrowDown className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="sm"
          variant={gewijzigd ? "default" : "outline"}
          disabled={!gewijzigd || upd.isPending}
          onClick={opslaan}
          className="h-7 text-xs"
        >
          Opslaan
        </Button>
      </div>
    </div>
  );
}