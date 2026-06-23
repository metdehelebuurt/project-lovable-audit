import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Save, Tag } from "lucide-react";
import { useLeadBronnen, useUpsertLeadBron, useDeleteLeadBron, type LeadBron } from "@/hooks/sales/useLeadBronnen";
import { PIPELINE_KLEUREN, kleurClasses } from "@/lib/sales/pipeline";
import { TEMPERATUREN, TEMP_LABEL, type Temperatuur } from "@/lib/sales/temperatuur";

const CATEGORIEEN = ["inbound", "outbound", "import", "referral", "ai", "overig"] as const;

export default function BronnenBeheer() {
  const { data: bronnen, isLoading } = useLeadBronnen();
  const upsert = useUpsertLeadBron();
  const del = useDeleteLeadBron();
  const [nieuw, setNieuw] = useState({ label: "", categorie: "outbound", kleur: "slate", score_gewicht: 15 });

  if (isLoading) return <Skeleton className="h-64" />;

  const toevoegen = () => {
    if (!nieuw.label.trim()) return;
    const slug = nieuw.label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 32);
    upsert.mutate({
      slug,
      label: nieuw.label.trim(),
      categorie: nieuw.categorie,
      kleur: nieuw.kleur,
      actief: true,
      score_gewicht: nieuw.score_gewicht,
    }, { onSuccess: () => setNieuw({ label: "", categorie: "outbound", kleur: "slate", score_gewicht: 15 }) });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Tag className="h-5 w-5" />
        <div>
          <h2 className="text-lg font-semibold">Lead-bronnen</h2>
          <p className="text-sm text-muted-foreground">
            Beheer waar leads vandaan komen. Score-gewicht (0-30) telt mee in de automatische lead-score.
          </p>
        </div>
      </div>

      <Card className="p-4 space-y-2">
        {(bronnen ?? []).map((b) => (
          <BronRij key={b.id} bron={b} onSave={(patch) => upsert.mutate({ ...b, ...patch })} onDelete={() => del.mutate(b.id)} />
        ))}
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-medium mb-3">Nieuwe bron toevoegen</h3>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end">
          <div className="sm:col-span-2">
            <Label>Label</Label>
            <Input value={nieuw.label} onChange={(e) => setNieuw({ ...nieuw, label: e.target.value })} placeholder="Bijv. LinkedIn outreach" />
          </div>
          <div>
            <Label>Categorie</Label>
            <Select value={nieuw.categorie} onValueChange={(v) => setNieuw({ ...nieuw, categorie: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIEEN.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Kleur</Label>
            <Select value={nieuw.kleur} onValueChange={(v) => setNieuw({ ...nieuw, kleur: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PIPELINE_KLEUREN.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={toevoegen} disabled={!nieuw.label.trim() || upsert.isPending} className="gap-1">
            <Plus className="h-4 w-4" /> Toevoegen
          </Button>
        </div>
      </Card>
    </div>
  );
}

function BronRij({ bron, onSave, onDelete }: { bron: LeadBron; onSave: (patch: Partial<LeadBron>) => void; onDelete: () => void }) {
  const [label, setLabel] = useState(bron.label);
  const [kleur, setKleur] = useState(bron.kleur);
  const [gewicht, setGewicht] = useState(bron.score_gewicht);
  const [temp, setTemp] = useState<Temperatuur>((bron.default_temperatuur ?? "koud") as Temperatuur);
  const [actief, setActief] = useState(bron.actief);
  const gewijzigd = label !== bron.label || kleur !== bron.kleur || gewicht !== bron.score_gewicht || temp !== bron.default_temperatuur || actief !== bron.actief;

  return (
    <div className="grid grid-cols-12 gap-2 items-center border rounded-md p-2">
      <div className="col-span-12 sm:col-span-3 flex items-center gap-2">
        <span className={`inline-block w-2 h-6 rounded ${kleurClasses(kleur).split(" ")[0]}`} aria-hidden />
        <Input value={label} onChange={(e) => setLabel(e.target.value)} className="h-8" />
      </div>
      <div className="col-span-6 sm:col-span-2">
        <Select value={kleur} onValueChange={setKleur}>
          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
          <SelectContent>{PIPELINE_KLEUREN.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="col-span-6 sm:col-span-2">
        <Select value={temp} onValueChange={(v) => setTemp(v as Temperatuur)}>
          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
          <SelectContent>{TEMPERATUREN.map((t) => <SelectItem key={t} value={t}>{TEMP_LABEL[t]}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="col-span-6 sm:col-span-2">
        <Input type="number" min={0} max={30} value={gewicht} onChange={(e) => setGewicht(Number(e.target.value))} className="h-8" title="Score-gewicht 0-30" />
      </div>
      <label className="col-span-3 sm:col-span-1 flex items-center gap-1 text-xs">
        <Switch checked={actief} onCheckedChange={setActief} /> {actief ? "Actief" : "Uit"}
      </label>
      <div className="col-span-3 sm:col-span-2 flex items-center justify-end gap-1">
        <Button size="sm" variant={gewijzigd ? "default" : "outline"} disabled={!gewijzigd} onClick={() => onSave({ label, kleur, score_gewicht: gewicht, default_temperatuur: temp, actief })} className="gap-1">
          <Save className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => confirm(`Bron "${bron.label}" verwijderen?`) && onDelete()}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}