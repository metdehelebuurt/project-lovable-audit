import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Trash2, Plus } from "lucide-react";
import { uploadOpleverFile } from "./api/opleverApi";
import { toast } from "@/hooks/use-toast";
import type { CircuitGroep, OpleverDocument, Opleverrapport } from "./types";
import ChecklistSection from "./ChecklistSection";
import { DOC_LABELS_CHECKLIST } from "./GrenswaardenLogic";

interface Props {
  rapportId: string;
  partnerId: string;
  draft: Partial<Opleverrapport>;
  onChange: (patch: Partial<Opleverrapport>) => void;
}

const DOC_TYPES: { type: OpleverDocument["type"]; label: string }[] = [
  { type: "installatieschema", label: "Installatieschema" },
  { type: "meterkasttekening", label: "Meterkasttekening" },
  { type: "netbeheerder_aanmelding", label: "Aanmelding netbeheerder (verplicht)" },
  { type: "scios", label: "SCIOS Scope 12 (optioneel)" },
];

export default function StepDocumentatie({ rapportId, partnerId, draft, onChange }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const docs = draft.documenten ?? [];
  const groepen = draft.groepenverdeling ?? [];
  const extra = draft.extra_velden ?? {};

  const handleUpload = async (file: File, type: OpleverDocument["type"]) => {
    try {
      const path = await uploadOpleverFile(partnerId, rapportId, file, file.name);
      onChange({ documenten: [...docs, { type, url: path, naam: file.name, uploaded_at: new Date().toISOString() }] });
      toast({ title: "Document geüpload" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Upload mislukt";
      toast({ title: "Upload mislukt", description: msg, variant: "destructive" });
    }
  };

  const addGroep = () => onChange({ groepenverdeling: [...groepen, { nummer: String(groepen.length + 1), functie: "" }] });
  const updateGroep = (idx: number, g: CircuitGroep) => {
    const next = [...groepen]; next[idx] = g; onChange({ groepenverdeling: next });
  };
  const removeGroep = (idx: number) => onChange({ groepenverdeling: groepen.filter((_, i) => i !== idx) });

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="font-semibold">Documenten & labels op locatie</h3>
        <ChecklistSection
          items={extra.doc_labels}
          preset={DOC_LABELS_CHECKLIST}
          onChange={(items) => onChange({ extra_velden: { ...extra, doc_labels: items } })}
        />
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold">Te uploaden documenten</h3>
        {DOC_TYPES.map((dt) => (
          <div key={dt.type} className="flex items-center justify-between gap-2 rounded-lg border border-border p-2">
            <div>
              <p className="text-sm font-medium">{dt.label}</p>
              <p className="text-xs text-muted-foreground">
                {docs.filter((d) => d.type === dt.type).map((d) => d.naam).join(", ") || "Nog niet geüpload"}
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => {
              const input = document.createElement("input");
              input.type = "file"; input.accept = "application/pdf,image/*";
              input.onchange = () => input.files?.[0] && handleUpload(input.files[0], dt.type);
              input.click();
            }}>
              <Upload className="h-4 w-4" /> Upload
            </Button>
          </div>
        ))}
        <input ref={ref} type="file" className="hidden" />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Groepenverdeling</h3>
          <Button type="button" variant="outline" size="sm" onClick={addGroep}><Plus className="h-4 w-4" /> Groep</Button>
        </div>
        <div className="space-y-2">
          {groepen.map((g, idx) => (
            <div key={idx} className="grid grid-cols-2 sm:grid-cols-7 gap-2 items-end rounded-lg border border-border p-2">
              <div><Label className="text-xs">Nr.</Label><Input value={g.nummer} onChange={(e) => updateGroep(idx, { ...g, nummer: e.target.value })} /></div>
              <div className="col-span-2"><Label className="text-xs">Functie</Label><Input value={g.functie} onChange={(e) => updateGroep(idx, { ...g, functie: e.target.value })} /></div>
              <div><Label className="text-xs">Kabeltype</Label><Input value={g.kabeltype ?? ""} onChange={(e) => updateGroep(idx, { ...g, kabeltype: e.target.value || undefined })} placeholder="YMvK" /></div>
              <div><Label className="text-xs">mm²</Label><Input type="number" value={g.diameter_mm2 ?? ""} onChange={(e) => updateGroep(idx, { ...g, diameter_mm2: e.target.value ? Number(e.target.value) : undefined })} /></div>
              <div><Label className="text-xs">A</Label><Input type="number" value={g.beveiliging_a ?? ""} onChange={(e) => updateGroep(idx, { ...g, beveiliging_a: e.target.value ? Number(e.target.value) : undefined })} /></div>
              <div className="flex items-end gap-1">
                <Input type="number" placeholder="mA" value={g.aardlek_ma ?? ""} onChange={(e) => updateGroep(idx, { ...g, aardlek_ma: e.target.value ? Number(e.target.value) : undefined })} />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeGroep(idx)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
          {groepen.length === 0 && <p className="text-sm text-muted-foreground">Nog geen groepen toegevoegd.</p>}
        </div>
      </section>
    </div>
  );
}