import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { ArrowUp, ArrowDown, Trash2, Check } from "lucide-react";
import { kleurClasses, PIPELINE_KLEUREN, type PipelineFase } from "@/lib/sales/pipeline";
import { TEMPERATUREN, TEMP_LABEL, type Temperatuur } from "@/lib/sales/temperatuur";
import { useDeleteFase, useUpdateFase } from "@/hooks/sales/usePipelineConfig";

interface Props {
  fase: PipelineFase;
  kanOmhoog: boolean;
  kanOmlaag: boolean;
  onOmhoog: () => void;
  onOmlaag: () => void;
}

export default function FaseRij({ fase, kanOmhoog, kanOmlaag, onOmhoog, onOmlaag }: Props) {
  const [label, setLabel] = useState(fase.label);
  const [kleur, setKleur] = useState(fase.kleur);
  const [temp, setTemp] = useState<Temperatuur>((fase.default_temperatuur ?? "lauw") as Temperatuur);
  const [isEind, setIsEind] = useState(fase.is_eindfase);
  const [isWon, setIsWon] = useState(fase.is_won);
  const [vereistVa, setVereistVa] = useState(fase.vereist_volgende_actie);
  const [slaDagen, setSlaDagen] = useState<number | "">(fase.sla_dagen ?? "");
  const upd = useUpdateFase();
  const del = useDeleteFase();

  const gewijzigd =
    label !== fase.label ||
    kleur !== fase.kleur ||
    temp !== (fase.default_temperatuur ?? "lauw") ||
    isEind !== fase.is_eindfase ||
    isWon !== fase.is_won ||
    vereistVa !== fase.vereist_volgende_actie ||
    (slaDagen === "" ? null : slaDagen) !== fase.sla_dagen;

  const opslaan = () => {
    upd.mutate({
      id: fase.id,
      patch: {
        label: label.trim() || fase.label,
        kleur,
        default_temperatuur: temp,
        is_eindfase: isEind,
        is_won: isWon && isEind,
        vereist_volgende_actie: vereistVa && !isEind,
        sla_dagen: slaDagen === "" ? null : Number(slaDagen),
      },
    });
  };

  return (
    <div className="grid grid-cols-12 gap-2 items-center border rounded-md p-2">
      <div className="col-span-12 sm:col-span-3 flex items-center gap-2">
        <span className={`inline-block w-2 h-6 rounded ${kleurClasses(kleur).split(" ")[0]}`} aria-hidden />
        <Input value={label} onChange={(e) => setLabel(e.target.value)} className="h-8" />
      </div>
      <div className="col-span-6 sm:col-span-1">
        <Select value={kleur} onValueChange={setKleur}>
          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            {PIPELINE_KLEUREN.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="col-span-6 sm:col-span-2">
        <Select value={temp} onValueChange={(v) => setTemp(v as Temperatuur)}>
          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            {TEMPERATUREN.map((t) => <SelectItem key={t} value={t}>{TEMP_LABEL[t]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <label className="col-span-6 sm:col-span-1 flex items-center gap-1 text-xs">
        <Checkbox checked={isEind} onCheckedChange={(v) => setIsEind(!!v)} /> Eind
      </label>
      <label className="col-span-6 sm:col-span-1 flex items-center gap-1 text-xs">
        <Checkbox checked={isWon} onCheckedChange={(v) => setIsWon(!!v)} disabled={!isEind} /> Won
      </label>
      <label className="col-span-6 sm:col-span-1 flex items-center gap-1 text-xs" title="Verplicht volgende-actie bij deze fase">
        <Switch checked={vereistVa && !isEind} onCheckedChange={setVereistVa} disabled={isEind} /> VA
      </label>
      <div className="col-span-6 sm:col-span-1">
        <Input
          type="number"
          min={0}
          value={slaDagen}
          onChange={(e) => setSlaDagen(e.target.value === "" ? "" : Number(e.target.value))}
          className="h-8"
          placeholder="SLA"
          title="SLA (dagen) — leeg = default"
        />
      </div>
      <div className="col-span-12 sm:col-span-2 flex items-center justify-end gap-1">
        <Button size="icon" variant="ghost" disabled={!kanOmhoog} onClick={onOmhoog} aria-label="Omhoog">
          <ArrowUp className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" disabled={!kanOmlaag} onClick={onOmlaag} aria-label="Omlaag">
          <ArrowDown className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant={gewijzigd ? "default" : "outline"}
          disabled={!gewijzigd || upd.isPending}
          onClick={opslaan}
          className="gap-1"
        >
          <Check className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="text-destructive"
          onClick={() => confirm(`Fase "${fase.label}" verwijderen?`) && del.mutate(fase.id)}
          aria-label="Verwijderen"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}