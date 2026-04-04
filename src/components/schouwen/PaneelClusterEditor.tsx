import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

export interface PaneelCluster {
  naam: string;
  orientatie: string;
  hellingshoek: string;
  aantal_panelen: string;
  vermogen_per_paneel_wp: string;
  schaduw: string;
  schaduw_bron: string;
  daktype: string;
}

const emptyCluster: PaneelCluster = {
  naam: "",
  orientatie: "",
  hellingshoek: "",
  aantal_panelen: "",
  vermogen_per_paneel_wp: "",
  schaduw: "",
  schaduw_bron: "",
  daktype: "",
};

const orientaties = ["N", "NO", "O", "ZO", "Z", "ZW", "W", "NW"];
const schaduwOpties = ["geen", "licht", "matig", "veel"];
const daktypen = ["schuin", "plat"];

interface Props {
  clusters: PaneelCluster[];
  onChange: (clusters: PaneelCluster[]) => void;
  readOnly?: boolean;
}

const PaneelClusterEditor = ({ clusters, onChange, readOnly }: Props) => {
  const addCluster = () => onChange([...clusters, { ...emptyCluster, naam: `Dakvlak ${clusters.length + 1}` }]);
  const removeCluster = (i: number) => onChange(clusters.filter((_, idx) => idx !== i));
  const update = (i: number, key: keyof PaneelCluster, value: string) => {
    const updated = [...clusters];
    updated[i] = { ...updated[i], [key]: value };
    onChange(updated);
  };

  if (readOnly) {
    if (clusters.length === 0) return <p className="text-sm text-muted-foreground">Geen paneel clusters vastgelegd</p>;
    return (
      <div className="space-y-3">
        {clusters.map((c, i) => (
          <div key={i} className="bg-muted/50 rounded-xl p-3 text-sm space-y-1">
            <p className="font-medium">{c.naam || `Cluster ${i + 1}`}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-muted-foreground">
              {c.orientatie && <span>Oriëntatie: {c.orientatie}</span>}
              {c.hellingshoek && <span>Helling: {c.hellingshoek}°</span>}
              {c.aantal_panelen && <span>Panelen: {c.aantal_panelen}</span>}
              {c.vermogen_per_paneel_wp && <span>Vermogen: {c.vermogen_per_paneel_wp} Wp</span>}
              {c.schaduw && <span>Schaduw: {c.schaduw}</span>}
              {c.schaduw_bron && <span>Bron: {c.schaduw_bron}</span>}
              {c.daktype && <span>Daktype: {c.daktype}</span>}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {clusters.map((cluster, i) => (
        <Card key={i} className="rounded-xl border shadow-sm">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">{cluster.naam || `Cluster ${i + 1}`}</CardTitle>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeCluster(i)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs">Naam dakvlak</Label>
                <Input value={cluster.naam} onChange={e => update(i, "naam", e.target.value)} placeholder="Bijv. Zuid-dak" />
              </div>
              <div>
                <Label className="text-xs">Oriëntatie</Label>
                <Select value={cluster.orientatie} onValueChange={v => update(i, "orientatie", v)}>
                  <SelectTrigger><SelectValue placeholder="Kies..." /></SelectTrigger>
                  <SelectContent>
                    {orientaties.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Hellingshoek (°)</Label>
                <Input type="number" value={cluster.hellingshoek} onChange={e => update(i, "hellingshoek", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Aantal panelen</Label>
                <Input type="number" value={cluster.aantal_panelen} onChange={e => update(i, "aantal_panelen", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Vermogen per paneel (Wp)</Label>
                <Input type="number" value={cluster.vermogen_per_paneel_wp} onChange={e => update(i, "vermogen_per_paneel_wp", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Schaduw</Label>
                <Select value={cluster.schaduw} onValueChange={v => update(i, "schaduw", v)}>
                  <SelectTrigger><SelectValue placeholder="Kies..." /></SelectTrigger>
                  <SelectContent>
                    {schaduwOpties.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Schaduwbron</Label>
                <Input value={cluster.schaduw_bron} onChange={e => update(i, "schaduw_bron", e.target.value)} placeholder="Bijv. boom, schoorsteen" />
              </div>
              <div>
                <Label className="text-xs">Daktype</Label>
                <Select value={cluster.daktype} onValueChange={v => update(i, "daktype", v)}>
                  <SelectTrigger><SelectValue placeholder="Kies..." /></SelectTrigger>
                  <SelectContent>
                    {daktypen.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      <Button variant="outline" size="sm" onClick={addCluster} className="gap-2">
        <Plus className="h-4 w-4" /> Dakvlak toevoegen
      </Button>
    </div>
  );
};

export default PaneelClusterEditor;
