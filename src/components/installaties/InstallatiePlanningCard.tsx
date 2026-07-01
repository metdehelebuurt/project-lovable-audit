import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Calendar, Save, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Installatie } from "./api/installatieApi";
import { updateInstallatie } from "./api/installatieApi";
import AiWerkomschrijvingDialog from "./AiWerkomschrijvingDialog";
import { TijdzoneBanner } from "@/components/shared/TijdzoneBanner";
import AdresAutocomplete from "@/components/shared/AdresAutocomplete";

interface Props {
  installatie: Installatie;
  onChanged: () => void;
  readOnly?: boolean;
}

export default function InstallatiePlanningCard({ installatie, onChanged, readOnly }: Props) {
  const [monteurs, setMonteurs] = useState<{ id: string; voornaam: string; achternaam: string }[]>([]);
  const [form, setForm] = useState({
    installateur_id: installatie.installateur_id ?? "",
    geplande_startdatum: installatie.geplande_startdatum ?? "",
    geplande_einddatum: installatie.geplande_einddatum ?? "",
    start_tijd: installatie.start_tijd ?? "",
    eind_tijd: installatie.eind_tijd ?? "",
    werkadres: installatie.werkadres ?? "",
    werkomschrijving: installatie.werkomschrijving ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  useEffect(() => {
    void supabase.from("users").select("id, voornaam, achternaam").eq("rol", "installateur")
      .then(({ data }) => setMonteurs(data ?? []));
  }, []);

  const opslaan = async () => {
    setBusy(true);
    try {
      await updateInstallatie(installatie.id, {
        installateur_id: form.installateur_id || null,
        geplande_startdatum: form.geplande_startdatum || null,
        geplande_einddatum: form.geplande_einddatum || null,
        start_tijd: form.start_tijd || null,
        eind_tijd: form.eind_tijd || null,
        werkadres: form.werkadres || null,
        werkomschrijving: form.werkomschrijving || null,
      });
      toast.success("Planning bijgewerkt");
      onChanged();
    } catch (e: any) {
      toast.error(e.message);
    }
    setBusy(false);
  };

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> Planning</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Monteur</Label>
          <Select value={form.installateur_id} onValueChange={(v) => setForm({ ...form, installateur_id: v })} disabled={readOnly}>
            <SelectTrigger><SelectValue placeholder="Selecteer monteur" /></SelectTrigger>
            <SelectContent>
              {monteurs.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.voornaam} {m.achternaam}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Startdatum</Label>
            <Input type="date" value={form.geplande_startdatum} onChange={(e) => setForm({ ...form, geplande_startdatum: e.target.value })} disabled={readOnly} />
          </div>
          <div>
            <Label>Einddatum</Label>
            <Input type="date" value={form.geplande_einddatum} onChange={(e) => setForm({ ...form, geplande_einddatum: e.target.value })} disabled={readOnly} />
          </div>
          <div>
            <Label>Starttijd</Label>
            <Input type="time" value={form.start_tijd} onChange={(e) => setForm({ ...form, start_tijd: e.target.value })} disabled={readOnly} />
          </div>
          <div>
            <Label>Eindtijd</Label>
            <Input type="time" value={form.eind_tijd} onChange={(e) => setForm({ ...form, eind_tijd: e.target.value })} disabled={readOnly} />
          </div>
        </div>
        <TijdzoneBanner datum={form.geplande_startdatum} tijd={form.start_tijd} compact />
        <div>
          <Label>Werkadres</Label>
          <AdresAutocomplete
            value={form.werkadres}
            onChange={(v) => setForm({ ...form, werkadres: v })}
            placeholder="Straat huisnr, postcode plaats"
            disabled={readOnly}
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label>Werkomschrijving</Label>
            {!readOnly && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 text-xs"
                onClick={() => setAiOpen(true)}
              >
                <Sparkles className="h-3.5 w-3.5 text-primary" /> AI-werkomschrijving
              </Button>
            )}
          </div>
          <Textarea value={form.werkomschrijving} onChange={(e) => setForm({ ...form, werkomschrijving: e.target.value })} rows={3} disabled={readOnly} />
        </div>
        {!readOnly && (
          <Button onClick={opslaan} disabled={busy} className="gap-2">
            <Save className="h-4 w-4" /> {busy ? "Opslaan…" : "Planning opslaan"}
          </Button>
        )}

        <AiWerkomschrijvingDialog
          open={aiOpen}
          onOpenChange={setAiOpen}
          installatieId={installatie.id}
          huidigeTekst={form.werkomschrijving}
          onAccept={async (tekst) => {
            setForm((prev) => ({ ...prev, werkomschrijving: tekst }));
            try {
              await updateInstallatie(installatie.id, { werkomschrijving: tekst });
              toast.success("AI-werkomschrijving opgeslagen");
              onChanged();
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Opslaan mislukt");
            }
          }}
        />
      </CardContent>
    </Card>
  );
}