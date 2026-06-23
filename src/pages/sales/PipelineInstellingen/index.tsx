import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Save, Settings } from "lucide-react";
import {
  useMyPipeline,
  useUpsertFase,
  useHerordenFases,
} from "@/hooks/sales/usePipelineConfig";
import { PIPELINE_KLEUREN, slugify } from "@/lib/sales/pipeline";
import { TEMPERATUREN, TEMP_LABEL, type Temperatuur } from "@/lib/sales/temperatuur";
import FaseRij from "./FaseRij";
import { toast } from "sonner";

export default function PipelineInstellingen() {
  const { data: fases, isLoading } = useMyPipeline();
  const upsert = useUpsertFase();
  const heroden = useHerordenFases();
  const [nieuwLabel, setNieuwLabel] = useState("");
  const [nieuwKleur, setNieuwKleur] = useState<string>("slate");
  const [nieuwTemp, setNieuwTemp] = useState<Temperatuur>("lauw");

  if (isLoading) return <Skeleton className="h-64" />;

  const lijst = fases ?? [];

  const verplaats = (id: string, richting: -1 | 1) => {
    const idx = lijst.findIndex((f) => f.id === id);
    if (idx < 0) return;
    const nieuw = [...lijst];
    const target = idx + richting;
    if (target < 0 || target >= nieuw.length) return;
    [nieuw[idx], nieuw[target]] = [nieuw[target], nieuw[idx]];
    heroden.mutate(nieuw.map((f, i) => ({ id: f.id, volgorde: (i + 1) * 10 })));
  };

  const voegToe = () => {
    if (!nieuwLabel.trim()) return;
    const key = slugify(nieuwLabel);
    if (lijst.some((f) => f.fase_key === key)) {
      toast.error("Een fase met deze naam bestaat al");
      return;
    }
    const maxVolgorde = lijst.reduce((m, f) => Math.max(m, f.volgorde), 0);
    upsert.mutate(
      {
        fase_key: key,
        label: nieuwLabel.trim(),
        kleur: nieuwKleur,
        volgorde: maxVolgorde + 10,
        default_temperatuur: nieuwTemp,
        is_eindfase: false,
        is_won: false,
      },
      {
        onSuccess: () => {
          setNieuwLabel("");
          toast.success("Fase toegevoegd");
        },
      },
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Pipeline-instellingen</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Beheer jouw eigen pipeline-fases. Wijzigingen zijn alleen zichtbaar in jouw pipeline en lijstweergave.
      </p>

      <Card className="p-4">
        <h3 className="text-sm font-medium mb-3">Fases</h3>
        <div className="space-y-2">
          {lijst.map((f, i) => (
            <FaseRij
              key={f.id}
              fase={f}
              kanOmhoog={i > 0}
              kanOmlaag={i < lijst.length - 1}
              onOmhoog={() => verplaats(f.id, -1)}
              onOmlaag={() => verplaats(f.id, 1)}
            />
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-medium mb-3">Nieuwe fase toevoegen</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <div>
            <Label>Naam</Label>
            <Input
              value={nieuwLabel}
              onChange={(e) => setNieuwLabel(e.target.value)}
              placeholder="Bijv. Demo gegeven"
              maxLength={40}
            />
          </div>
          <div>
            <Label>Kleur</Label>
            <Select value={nieuwKleur} onValueChange={setNieuwKleur}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PIPELINE_KLEUREN.map((k) => (
                  <SelectItem key={k} value={k}>{k}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Standaard temperatuur</Label>
            <Select value={nieuwTemp} onValueChange={(v) => setNieuwTemp(v as Temperatuur)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TEMPERATUREN.map((t) => (
                  <SelectItem key={t} value={t}>{TEMP_LABEL[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={voegToe} disabled={upsert.isPending || !nieuwLabel.trim()} className="gap-1">
            <Plus className="h-4 w-4" /> Toevoegen
          </Button>
        </div>
      </Card>
    </div>
  );
}