import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Trash2, Sparkles, Check, X, ChevronDown } from "lucide-react";

export interface PaneelCluster {
  naam: string;
  orientatie: string;
  hellingshoek: string;
  aantal_panelen: string;
  vermogen_per_paneel_wp: string;
  schaduw: string;
  schaduw_bron: string;
  daktype: string;
  oppervlakte_m2?: number;
  zonuren_per_jaar?: number;
}

const emptyCluster: PaneelCluster = {
  naam: "", orientatie: "", hellingshoek: "", aantal_panelen: "",
  vermogen_per_paneel_wp: "", schaduw: "", schaduw_bron: "", daktype: "",
};

const orientaties = ["N", "NO", "O", "ZO", "Z", "ZW", "W", "NW"];
const schaduwOpties = ["geen", "licht", "matig", "veel"];
const daktypen = ["schuin", "plat"];

interface Props {
  clusters: PaneelCluster[];
  onChange: (clusters: PaneelCluster[]) => void;
  readOnly?: boolean;
  solarSuggestions?: PaneelCluster[];
  onAcceptSuggestions?: () => void;
  onDismissSuggestions?: () => void;
}

const PaneelClusterEditor = ({ clusters, onChange, readOnly, solarSuggestions, onAcceptSuggestions, onDismissSuggestions }: Props) => {
  const addCluster = () => onChange([...clusters, { ...emptyCluster, naam: `Dakvlak ${clusters.length + 1}` }]);
  const removeCluster = (i: number) => onChange(clusters.filter((_, idx) => idx !== i));
  const update = (i: number, key: keyof PaneelCluster, value: string) => {
    const updated = [...clusters];
    updated[i] = { ...updated[i], [key]: value };
    onChange(updated);
  };

  if (solarSuggestions && solarSuggestions.length > 0 && onAcceptSuggestions) {
    return (
      <div className="space-y-4">
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Solar API suggesties ({solarSuggestions.length} dakvlakken)
            </h4>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onDismissSuggestions} className="gap-1">
                <X className="h-3 w-3" /> Negeren
              </Button>
              <Button size="sm" onClick={onAcceptSuggestions} className="gap-1">
                <Check className="h-3 w-3" /> Overnemen
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            {solarSuggestions.map((c, i) => (
              <div key={i} className="bg-background rounded-lg p-3 text-sm space-y-1">
                <p className="font-medium">{c.naam}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-muted-foreground text-xs">
                  <span>Oriëntatie: {c.orientatie}</span>
                  <span>Helling: {c.hellingshoek}°</span>
                  <span>Max panelen: ~{c.aantal_panelen}</span>
                  <span>Type: {c.daktype}</span>
                  {c.oppervlakte_m2 && <span>Opp: {c.oppervlakte_m2} m²</span>}
                  {c.zonuren_per_jaar && <span>Zonuren: {c.zonuren_per_jaar}/jr</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {clusters.length > 0 && (
          <>
            <p className="text-xs text-muted-foreground">Huidige clusters:</p>
            {renderClusters(clusters, update, removeCluster)}
          </>
        )}
        <Button variant="outline" size="sm" onClick={addCluster} className="gap-2">
          <Plus className="h-4 w-4" /> Dakvlak toevoegen
        </Button>
      </div>
    );
  }

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
              {c.oppervlakte_m2 && <span>Opp: {c.oppervlakte_m2} m²</span>}
              {c.zonuren_per_jaar && <span>Zonuren: {c.zonuren_per_jaar}/jr</span>}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {renderClusters(clusters, update, removeCluster)}
      <Button variant="outline" size="sm" onClick={addCluster} className="gap-2 min-h-[44px]">
        <Plus className="h-4 w-4" /> Dakvlak toevoegen
      </Button>
    </div>
  );
};

function renderClusters(
  clusters: PaneelCluster[],
  update: (i: number, key: keyof PaneelCluster, value: string) => void,
  removeCluster: (i: number) => void,
) {
  return clusters.map((cluster, i) => (
    <Collapsible key={i} defaultOpen={i === 0 || clusters.length <= 3}>
      <Card className="rounded-xl border shadow-sm">
        <CollapsibleTrigger asChild>
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {cluster.naam || `Cluster ${i + 1}`}
              {cluster.orientatie && <Badge variant="outline" className="text-xs">{cluster.orientatie}</Badge>}
              {cluster.zonuren_per_jaar && (
                <Badge variant="outline" className="text-xs">{cluster.zonuren_per_jaar} zonuren/jr</Badge>
              )}
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform" />
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); removeCluster(i); }}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
        </CollapsibleContent>
      </Card>
    </Collapsible>
  ));
}

export default PaneelClusterEditor;
