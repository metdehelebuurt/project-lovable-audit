import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Camera, Calculator } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { uploadOpleverFile } from "./api/opleverApi";
import {
  ISOLATIE_MATERIALEN,
  ISOLATIE_VERWERKING,
  ISOLATIE_VLAK_TYPES,
  berekenRd,
  gemiddeldeRd,
  toetsIsde,
  totaalOppervlakte,
} from "./isolatieConfig";
import type { IsolatieVlak, Opleverrapport } from "./types";

interface Props {
  rapportId: string;
  partnerId: string;
  draft: Partial<Opleverrapport>;
  onChange: (patch: Partial<Opleverrapport>) => void;
}

const leegVlak = (): IsolatieVlak => ({
  id: crypto.randomUUID(),
  vlak_type: ISOLATIE_VLAK_TYPES[0],
  oppervlakte_m2: null,
  materiaal: "",
  verwerking: ISOLATIE_VERWERKING[0],
  dikte_mm: null,
  lambda: null,
  rd_waarde: null,
  dampremmer: false,
  fotos_voor: [],
  fotos_na: [],
});

export default function StepIsolatieVlakken({ rapportId, partnerId, draft, onChange }: Props) {
  const vlakken = draft.extra_velden?.isolatie_vlakken ?? [];

  const setVlakken = (next: IsolatieVlak[]) =>
    onChange({ extra_velden: { ...draft.extra_velden, isolatie_vlakken: next } });

  const updateVlak = (id: string, patch: Partial<IsolatieVlak>) =>
    setVlakken(vlakken.map((v) => (v.id === id ? { ...v, ...patch } : v)));

  const totaal = totaalOppervlakte(vlakken);
  const gemRd = gemiddeldeRd(vlakken);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold">Geïsoleerde vlakken</h3>
          <p className="text-sm text-muted-foreground">
            Leg per bouwdeel vast wat is toegepast. Deze gegevens vormen de basis voor de ISDE-verantwoording.
          </p>
        </div>
        <Button type="button" size="sm" onClick={() => setVlakken([...vlakken, leegVlak()])}>
          <Plus className="h-4 w-4 mr-1" /> Vlak toevoegen
        </Button>
      </div>

      {vlakken.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Nog geen vlakken vastgelegd. Voeg het eerste geïsoleerde bouwdeel toe.
        </p>
      ) : (
        <div className="rounded-xl border bg-muted/40 px-3 py-2 text-sm flex flex-wrap gap-x-6 gap-y-1">
          <span>
            Totaal oppervlak: <strong>{totaal.toFixed(1)} m²</strong>
          </span>
          <span>
            Gewogen gemiddelde Rd: <strong>{gemRd != null ? `${gemRd} m²K/W` : "—"}</strong>
          </span>
          <span>
            Aantal vlakken: <strong>{vlakken.length}</strong>
          </span>
        </div>
      )}

      {vlakken.map((vlak, idx) => (
        <VlakKaart
          key={vlak.id}
          index={idx}
          vlak={vlak}
          rapportId={rapportId}
          partnerId={partnerId}
          onChange={(patch) => updateVlak(vlak.id, patch)}
          onRemove={() => setVlakken(vlakken.filter((v) => v.id !== vlak.id))}
        />
      ))}
    </div>
  );
}

interface VlakProps {
  index: number;
  vlak: IsolatieVlak;
  rapportId: string;
  partnerId: string;
  onChange: (patch: Partial<IsolatieVlak>) => void;
  onRemove: () => void;
}

function VlakKaart({ index, vlak, rapportId, partnerId, onChange, onRemove }: VlakProps) {
  const toets = toetsIsde(vlak);
  const isGlas = toets.categorie === "Glas";

  const berekenEnVul = () => {
    const rd = berekenRd(vlak.dikte_mm, vlak.lambda);
    if (rd == null) {
      toast({ title: "Onvoldoende gegevens", description: "Vul eerst dikte en lambda-waarde in." });
      return;
    }
    onChange({ rd_waarde: rd });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-medium">Vlak {index + 1}</h4>
          {toets.voldoet === true && <Badge className="bg-success text-success-foreground">Voldoet aan ISDE</Badge>}
          {toets.voldoet === false && <Badge variant="destructive">Voldoet niet aan {toets.eis}</Badge>}
          {toets.voldoet === null && toets.categorie && <Badge variant="outline">{toets.eis}</Badge>}
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove} aria-label={`Vlak ${index + 1} verwijderen`}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`type-${vlak.id}`}>Type bouwdeel</Label>
          <Select value={vlak.vlak_type} onValueChange={(v) => onChange({ vlak_type: v })}>
            <SelectTrigger id={`type-${vlak.id}`}>
              <SelectValue placeholder="Kies bouwdeel" />
            </SelectTrigger>
            <SelectContent>
              {ISOLATIE_VLAK_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`omschr-${vlak.id}`}>Locatie / omschrijving</Label>
          <Input
            id={`omschr-${vlak.id}`}
            value={vlak.omschrijving ?? ""}
            onChange={(e) => onChange({ omschrijving: e.target.value })}
            placeholder="Bijv. voorgevel begane grond"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`opp-${vlak.id}`}>Oppervlakte (m²)</Label>
          <Input
            id={`opp-${vlak.id}`}
            type="number"
            inputMode="decimal"
            value={vlak.oppervlakte_m2 ?? ""}
            onChange={(e) => onChange({ oppervlakte_m2: e.target.value === "" ? null : Number(e.target.value) })}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`mat-${vlak.id}`}>Materiaal</Label>
          <Select value={vlak.materiaal || undefined} onValueChange={(v) => onChange({ materiaal: v })}>
            <SelectTrigger id={`mat-${vlak.id}`}>
              <SelectValue placeholder="Kies materiaal" />
            </SelectTrigger>
            <SelectContent>
              {ISOLATIE_MATERIALEN.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`merk-${vlak.id}`}>Merk en type</Label>
          <Input
            id={`merk-${vlak.id}`}
            value={vlak.merk_type ?? ""}
            onChange={(e) => onChange({ merk_type: e.target.value })}
            placeholder="Bijv. Knauf Ecose 035"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`verw-${vlak.id}`}>Verwerkingsmethode</Label>
          <Select value={vlak.verwerking || undefined} onValueChange={(v) => onChange({ verwerking: v })}>
            <SelectTrigger id={`verw-${vlak.id}`}>
              <SelectValue placeholder="Kies methode" />
            </SelectTrigger>
            <SelectContent>
              {ISOLATIE_VERWERKING.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`dikte-${vlak.id}`}>Dikte (mm)</Label>
          <Input
            id={`dikte-${vlak.id}`}
            type="number"
            inputMode="numeric"
            value={vlak.dikte_mm ?? ""}
            onChange={(e) => onChange({ dikte_mm: e.target.value === "" ? null : Number(e.target.value) })}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`lambda-${vlak.id}`}>Lambda λD (W/mK)</Label>
          <Input
            id={`lambda-${vlak.id}`}
            type="number"
            step="0.001"
            inputMode="decimal"
            value={vlak.lambda ?? ""}
            onChange={(e) => onChange({ lambda: e.target.value === "" ? null : Number(e.target.value) })}
          />
        </div>

        {isGlas ? (
          <div className="space-y-1.5">
            <Label htmlFor={`u-${vlak.id}`}>U-waarde (W/m²K)</Label>
            <Input
              id={`u-${vlak.id}`}
              type="number"
              step="0.01"
              inputMode="decimal"
              value={vlak.u_waarde ?? ""}
              onChange={(e) => onChange({ u_waarde: e.target.value === "" ? null : Number(e.target.value) })}
            />
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label htmlFor={`rd-${vlak.id}`}>Rd-waarde (m²K/W)</Label>
            <div className="flex gap-2">
              <Input
                id={`rd-${vlak.id}`}
                type="number"
                step="0.01"
                inputMode="decimal"
                value={vlak.rd_waarde ?? ""}
                onChange={(e) => onChange({ rd_waarde: e.target.value === "" ? null : Number(e.target.value) })}
              />
              <Button type="button" variant="outline" onClick={berekenEnVul} aria-label="Rd berekenen uit dikte en lambda">
                <Calculator className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor={`batch-${vlak.id}`}>Batch-/chargenummer</Label>
          <Input
            id={`batch-${vlak.id}`}
            value={vlak.charge_batchnummer ?? ""}
            onChange={(e) => onChange({ charge_batchnummer: e.target.value })}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border px-3 py-2 sm:col-span-2">
          <Label htmlFor={`damp-${vlak.id}`} className="cursor-pointer">Dampremmende laag aangebracht</Label>
          <Switch
            id={`damp-${vlak.id}`}
            checked={!!vlak.dampremmer}
            onCheckedChange={(c) => onChange({ dampremmer: c })}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <FotoVak
          label="Foto's vóór"
          urls={vlak.fotos_voor ?? []}
          rapportId={rapportId}
          partnerId={partnerId}
          onChange={(urls) => onChange({ fotos_voor: urls })}
        />
        <FotoVak
          label="Foto's ná"
          urls={vlak.fotos_na ?? []}
          rapportId={rapportId}
          partnerId={partnerId}
          onChange={(urls) => onChange({ fotos_na: urls })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`opm-${vlak.id}`}>Opmerkingen</Label>
        <Textarea
          id={`opm-${vlak.id}`}
          rows={2}
          value={vlak.opmerking ?? ""}
          onChange={(e) => onChange({ opmerking: e.target.value })}
        />
      </div>
    </div>
  );
}

interface FotoProps {
  label: string;
  urls: string[];
  rapportId: string;
  partnerId: string;
  onChange: (urls: string[]) => void;
}

function FotoVak({ label, urls, rapportId, partnerId, onChange }: FotoProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      const paden: string[] = [];
      for (const file of Array.from(files)) {
        paden.push(await uploadOpleverFile(partnerId, rapportId, file, file.name));
      }
      onChange([...urls, ...paden]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload mislukt";
      toast({ title: "Upload mislukt", description: msg, variant: "destructive" });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
          <Camera className="h-4 w-4 mr-1" /> {busy ? "Bezig…" : "Foto toevoegen"}
        </Button>
        {urls.length > 0 && <span className="text-xs text-muted-foreground">{urls.length} foto&apos;s</span>}
        {urls.map((u, i) => (
          <Button
            key={u}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(urls.filter((x) => x !== u))}
            aria-label={`Foto ${i + 1} verwijderen`}
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        ))}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        aria-label={`${label} uploaden`}
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
