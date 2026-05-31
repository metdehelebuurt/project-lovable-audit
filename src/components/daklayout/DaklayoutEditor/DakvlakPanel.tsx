import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Zap } from "lucide-react";
import type { Dakvlak } from "../types";

interface Props {
  dakvlak: Dakvlak;
  aantalPanelen: number;
  geselecteerd: boolean;
  index: number;
  onSelect: () => void;
  onChange: (patch: Partial<Dakvlak>) => void;
  onAutoVul: () => void;
  onLeegmaken: () => void;
  onVerwijder: () => void;
}

const DAKVLAK_KLEUREN = ["#9333ea", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

const DakvlakPanel = ({
  dakvlak,
  aantalPanelen,
  geselecteerd,
  index,
  onSelect,
  onChange,
  onAutoVul,
  onLeegmaken,
  onVerwijder,
}: Props) => {
  const kleur = DAKVLAK_KLEUREN[index % DAKVLAK_KLEUREN.length];
  return (
    <Card
      className={`cursor-pointer transition border-l-4 ${
        geselecteerd ? "ring-2 ring-primary" : ""
      }`}
      style={{ borderLeftColor: kleur }}
      onClick={onSelect}
    >
      <CardContent className="p-3 space-y-3">
        <div className="flex items-center justify-between">
          <Input
            value={dakvlak.naam}
            onChange={(e) => onChange({ naam: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            className="h-7 text-sm font-medium border-0 px-1"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onVerwijder();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Oriëntatie</Label>
            <Select
              value={String(dakvlak.orientatieDeg)}
              onValueChange={(v) => onChange({ orientatieDeg: Number(v) })}
            >
              <SelectTrigger className="h-8" onClick={(e) => e.stopPropagation()}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">N (0°)</SelectItem>
                <SelectItem value="45">NO (45°)</SelectItem>
                <SelectItem value="90">O (90°)</SelectItem>
                <SelectItem value="135">ZO (135°)</SelectItem>
                <SelectItem value="180">Z (180°)</SelectItem>
                <SelectItem value="225">ZW (225°)</SelectItem>
                <SelectItem value="270">W (270°)</SelectItem>
                <SelectItem value="315">NW (315°)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Helling (°)</Label>
            <Input
              type="number"
              min={0}
              max={60}
              value={dakvlak.hellingshoekDeg}
              onChange={(e) => onChange({ hellingshoekDeg: Number(e.target.value) || 0 })}
              onClick={(e) => e.stopPropagation()}
              className="h-8"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Modus</Label>
            <Select value={dakvlak.modus} onValueChange={(v) => onChange({ modus: v as "portret" | "landschap" })}>
              <SelectTrigger className="h-8" onClick={(e) => e.stopPropagation()}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="portret">Portret</SelectItem>
                <SelectItem value="landschap">Landschap</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Marge (mm)</Label>
            <Input
              type="number"
              min={0}
              value={dakvlak.margeMm}
              onChange={(e) => onChange({ margeMm: Number(e.target.value) || 0 })}
              onClick={(e) => e.stopPropagation()}
              className="h-8"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Zap className="h-3 w-3" /> {aantalPanelen} panelen
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onLeegmaken();
              }}
            >
              Leeg
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onAutoVul();
              }}
            >
              Auto-vul
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DakvlakPanel;