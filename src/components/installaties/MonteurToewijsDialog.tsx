import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createInstallatie } from "./api/installatieApi";

interface Opdracht {
  id: string;
  partner_id: string;
  offerte_id?: string | null;
  lead_id?: string | null;
  klant_naam?: string | null;
  klant_email?: string | null;
  klant_telefoon?: string | null;
  klant_adres?: string | null;
  klant_postcode?: string | null;
  klant_plaats?: string | null;
  regels?: unknown;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  opdracht: Opdracht;
  onSuccess?: (installatieId: string) => void;
}

export default function MonteurToewijsDialog({ open, onOpenChange, opdracht, onSuccess }: Props) {
  const { user } = useAuth();
  const [monteurs, setMonteurs] = useState<{ id: string; voornaam: string; achternaam: string }[]>([]);
  const [form, setForm] = useState({
    monteur_id: "",
    startdatum: "",
    einddatum: "",
    starttijd: "",
    eindtijd: "",
    werkomschrijving: "",
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void supabase.from("users").select("id, voornaam, achternaam").eq("rol", "installateur")
      .then(({ data }) => setMonteurs(data ?? []));
  }, []);

  const aanmaken = async () => {
    if (!form.monteur_id || !form.startdatum) {
      toast.error("Monteur en startdatum zijn verplicht");
      return;
    }
    setBusy(true);
    try {
      const jaar = new Date().getFullYear();
      const inst = await createInstallatie({
        partner_id: opdracht.partner_id,
        opdracht_id: opdracht.id,
        offerte_id: opdracht.offerte_id ?? null,
        lead_id: opdracht.lead_id ?? null,
        installateur_id: form.monteur_id,
        consument_naam: opdracht.klant_naam ?? null,
        klant_email: opdracht.klant_email ?? null,
        klant_telefoon: opdracht.klant_telefoon ?? null,
        klant_adres: opdracht.klant_adres ?? null,
        klant_postcode: opdracht.klant_postcode ?? null,
        klant_plaats: opdracht.klant_plaats ?? null,
        werkadres: opdracht.klant_adres ?? null,
        werkomschrijving: form.werkomschrijving || null,
        producten: (Array.isArray(opdracht.regels) ? opdracht.regels : []) as unknown as never,
        geplande_startdatum: form.startdatum,
        geplande_einddatum: form.einddatum || form.startdatum,
        start_tijd: form.starttijd || null,
        eind_tijd: form.eindtijd || null,
        installatienummer: `INST-${jaar}-${Date.now().toString().slice(-5)}`,
        status: "gepland",
        created_by: user?.id ?? null,
      });

      await supabase.from("opdrachten").update({
        status: "installatie_gepland",
        installatie_id: inst.id,
        toegewezen_monteur_id: form.monteur_id,
      }).eq("id", opdracht.id);

      toast.success("Installatie ingepland en monteur toegewezen");
      onSuccess?.(inst.id);
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message);
    }
    setBusy(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Installatie plannen</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Monteur *</Label>
            <Select value={form.monteur_id} onValueChange={(v) => setForm({ ...form, monteur_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecteer monteur" /></SelectTrigger>
              <SelectContent>
                {monteurs.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.voornaam} {m.achternaam}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Startdatum *</Label>
              <Input type="date" value={form.startdatum} onChange={(e) => setForm({ ...form, startdatum: e.target.value })} />
            </div>
            <div>
              <Label>Einddatum</Label>
              <Input type="date" value={form.einddatum} onChange={(e) => setForm({ ...form, einddatum: e.target.value })} />
            </div>
            <div>
              <Label>Starttijd</Label>
              <Input type="time" value={form.starttijd} onChange={(e) => setForm({ ...form, starttijd: e.target.value })} />
            </div>
            <div>
              <Label>Eindtijd</Label>
              <Input type="time" value={form.eindtijd} onChange={(e) => setForm({ ...form, eindtijd: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Werkomschrijving</Label>
            <Textarea value={form.werkomschrijving} onChange={(e) => setForm({ ...form, werkomschrijving: e.target.value })} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuleren</Button>
          <Button onClick={aanmaken} disabled={busy}>{busy ? "Opslaan…" : "Plannen"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}