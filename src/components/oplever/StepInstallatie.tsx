import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef } from "react";
import type { Opleverrapport } from "./types";
import { uploadOpleverFile } from "./api/opleverApi";
import { toast } from "@/hooks/use-toast";
import SerienummerLijstInput from "./SerienummerLijstInput";

interface Props {
  rapportId: string;
  partnerId: string;
  draft: Partial<Opleverrapport>;
  onChange: (patch: Partial<Opleverrapport>) => void;
}

const OPSTELLING_OPTIES = [
  { key: "droog", label: "Droge omgeving" },
  { key: "geventileerd", label: "Goed geventileerd" },
  { key: "stevige_ondergrond", label: "Stevige ondergrond" },
  { key: "geen_leefruimte", label: "Niet in leefruimte" },
  { key: "vrije_werkruimte", label: "Voldoende vrije werkruimte" },
] as const;

export default function StepInstallatie({ rapportId, partnerId, draft, onChange }: Props) {
  const batterijRef = useRef<HTMLInputElement>(null);
  const omvormerRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File, target: "batterij" | "omvormer") => {
    try {
      const path = await uploadOpleverFile(partnerId, rapportId, file, file.name);
      if (target === "batterij") {
        onChange({ batterij_spec: { ...(draft.batterij_spec ?? {}), typeplaatje_url: path } });
      } else {
        onChange({ omvormer_spec: { ...(draft.omvormer_spec ?? {}), typeplaatje_url: path } });
      }
      toast({ title: "Foto geüpload" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Upload mislukt";
      toast({ title: "Upload mislukt", description: msg, variant: "destructive" });
    }
  };

  const bat = draft.batterij_spec ?? {};
  const omv = draft.omvormer_spec ?? {};
  const ops = draft.opstelling ?? {};
  const extra = draft.extra_velden ?? {};

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="font-semibold">Systeem & aansluiting</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Label>Type systeem</Label>
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={extra.systeem_type ?? ""}
              onChange={(e) =>
                onChange({
                  extra_velden: {
                    ...extra,
                    systeem_type: (e.target.value || undefined) as "AC" | "DC" | undefined,
                  },
                })
              }
            >
              <option value="">—</option>
              <option value="AC">AC-gekoppeld</option>
              <option value="DC">DC-gekoppeld</option>
            </select>
          </div>
          <div>
            <Label>Aansluitwaarde woning</Label>
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={extra.aansluitwaarde ?? ""}
              onChange={(e) => onChange({ extra_velden: { ...extra, aansluitwaarde: e.target.value || undefined } })}
            >
              <option value="">—</option>
              <option value="1x25A">1×25A</option>
              <option value="1x35A">1×35A</option>
              <option value="1x40A">1×40A</option>
              <option value="3x25A">3×25A</option>
              <option value="3x35A">3×35A</option>
              <option value="3x40A">3×40A</option>
              <option value="3x50A">3×50A</option>
              <option value="3x63A">3×63A</option>
              <option value="3x80A">3×80A</option>
            </select>
          </div>
          <div>
            <Label>Gateway / ATS serienummer</Label>
            <Input
              value={extra.gateway_serienummer ?? ""}
              onChange={(e) => onChange({ extra_velden: { ...extra, gateway_serienummer: e.target.value } })}
              placeholder="Optioneel"
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold">Batterij</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><Label>Merk</Label><Input value={bat.merk ?? ""} onChange={(e) => onChange({ batterij_spec: { ...bat, merk: e.target.value } })} /></div>
          <div><Label>Type</Label><Input value={bat.type ?? ""} onChange={(e) => onChange({ batterij_spec: { ...bat, type: e.target.value } })} /></div>
          <div><Label>Capaciteit (kWh)</Label><Input type="number" inputMode="decimal" step="0.1" value={bat.capaciteit_kwh ?? ""} onChange={(e) => onChange({ batterij_spec: { ...bat, capaciteit_kwh: e.target.value === "" ? undefined : Number(e.target.value) } })} /></div>
          <div><Label>Serienummer</Label><Input value={bat.serienummer ?? ""} onChange={(e) => onChange({ batterij_spec: { ...bat, serienummer: e.target.value } })} /></div>
        </div>
        <div className="flex items-center gap-3">
          <input ref={batterijRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "batterij")} />
          <Button type="button" variant="outline" size="sm" onClick={() => batterijRef.current?.click()}>
            <Camera className="h-4 w-4" /> Foto typeplaatje {bat.typeplaatje_url ? "(geüpload)" : "(verplicht)"}
          </Button>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={Boolean(bat.ce_markering)} onCheckedChange={(v) => onChange({ batterij_spec: { ...bat, ce_markering: Boolean(v) } })} /> CE-markering
          </label>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold">Omvormer</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><Label>Merk</Label><Input value={omv.merk ?? ""} onChange={(e) => onChange({ omvormer_spec: { ...omv, merk: e.target.value } })} /></div>
          <div><Label>Type</Label><Input value={omv.type ?? ""} onChange={(e) => onChange({ omvormer_spec: { ...omv, type: e.target.value } })} /></div>
          <div><Label>Vermogen (kW)</Label><Input type="number" inputMode="decimal" step="0.1" value={omv.vermogen_kw ?? ""} onChange={(e) => onChange({ omvormer_spec: { ...omv, vermogen_kw: e.target.value === "" ? undefined : Number(e.target.value) } })} /></div>
          <div>
            <Label>Fasen</Label>
            <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={omv.fasen ?? 1} onChange={(e) => onChange({ omvormer_spec: { ...omv, fasen: Number(e.target.value) as 1 | 3 } })}>
              <option value={1}>1-fase</option>
              <option value={3}>3-fase</option>
            </select>
          </div>
          <div><Label>Serienummer</Label><Input value={omv.serienummer ?? ""} onChange={(e) => onChange({ omvormer_spec: { ...omv, serienummer: e.target.value } })} /></div>
          <div>
            <Label>RfG-klasse</Label>
            <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={omv.rfg_klasse ?? ""} onChange={(e) => onChange({ omvormer_spec: { ...omv, rfg_klasse: (e.target.value || undefined) as "A" | "B" | "C" | "D" | undefined } })}>
              <option value="">—</option>
              <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input ref={omvormerRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "omvormer")} />
          <Button type="button" variant="outline" size="sm" onClick={() => omvormerRef.current?.click()}>
            <Camera className="h-4 w-4" /> Foto typeplaatje {omv.typeplaatje_url ? "(geüpload)" : "(verplicht)"}
          </Button>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={Boolean(omv.ce_markering)} onCheckedChange={(v) => onChange({ omvormer_spec: { ...omv, ce_markering: Boolean(v) } })} /> CE-markering
          </label>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold">Opstelling</h3>
        <div>
          <Label>Locatie</Label>
          <Input value={ops.locatie ?? ""} onChange={(e) => onChange({ opstelling: { ...ops, locatie: e.target.value } })} placeholder="Bijv. technische ruimte / schuur" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {OPSTELLING_OPTIES.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <Checkbox checked={Boolean(ops[key])} onCheckedChange={(v) => onChange({ opstelling: { ...ops, [key]: Boolean(v) } })} />
              {label}
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}