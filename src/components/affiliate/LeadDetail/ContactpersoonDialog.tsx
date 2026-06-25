import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { z } from "zod";
import { toast } from "sonner";
import type { Contactpersoon } from "@/hooks/affiliate/useLeadContactpersonen";
import { useUpsertContactpersoon } from "@/hooks/affiliate/useLeadContactpersonen";

const schema = z.object({
  naam: z.string().trim().min(1, "Naam is verplicht").max(120),
  functie: z.string().trim().max(120).optional().or(z.literal("")),
  email: z.string().trim().email("Ongeldig e-mailadres").max(255).optional().or(z.literal("")),
  telefoon_mobiel: z.string().trim().max(40).optional().or(z.literal("")),
  telefoon_kantoor: z.string().trim().max(40).optional().or(z.literal("")),
  linkedin_url: z.string().trim().url("Ongeldige URL").max(255).optional().or(z.literal("")),
  notitie: z.string().trim().max(1000).optional().or(z.literal("")),
  is_hoofdcontact: z.boolean(),
});

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  leadId: string;
  bestaand?: Contactpersoon | null;
}

export function ContactpersoonDialog({ open, onOpenChange, leadId, bestaand }: Props) {
  const upsert = useUpsertContactpersoon(leadId);
  const [form, setForm] = useState({
    naam: "", functie: "", email: "", telefoon_mobiel: "", telefoon_kantoor: "",
    linkedin_url: "", notitie: "", is_hoofdcontact: false,
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      naam: bestaand?.naam ?? "",
      functie: bestaand?.functie ?? "",
      email: bestaand?.email ?? "",
      telefoon_mobiel: bestaand?.telefoon_mobiel ?? "",
      telefoon_kantoor: bestaand?.telefoon_kantoor ?? "",
      linkedin_url: bestaand?.linkedin_url ?? "",
      notitie: bestaand?.notitie ?? "",
      is_hoofdcontact: bestaand?.is_hoofdcontact ?? false,
    });
  }, [open, bestaand]);

  const opslaan = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message ?? "Validatiefout");
      return;
    }
    try {
      await upsert.mutateAsync({
        id: bestaand?.id,
        naam: parsed.data.naam,
        functie: parsed.data.functie || null,
        email: parsed.data.email || null,
        telefoon_mobiel: parsed.data.telefoon_mobiel || null,
        telefoon_kantoor: parsed.data.telefoon_kantoor || null,
        linkedin_url: parsed.data.linkedin_url || null,
        notitie: parsed.data.notitie || null,
        is_hoofdcontact: parsed.data.is_hoofdcontact,
      });
      onOpenChange(false);
    } catch {
      // toast in hook
    }
  };

  const set = (k: keyof typeof form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{bestaand ? "Contactpersoon bewerken" : "Contactpersoon toevoegen"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Naam *</Label>
              <Input value={form.naam} onChange={(e) => set("naam", e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label>Functie</Label>
              <Input value={form.functie} onChange={(e) => set("functie", e.target.value)} placeholder="Eigenaar, directeur, ..." />
            </div>
            <div className="col-span-2">
              <Label>E-mail</Label>
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div>
              <Label>Mobiel</Label>
              <Input value={form.telefoon_mobiel} onChange={(e) => set("telefoon_mobiel", e.target.value)} />
            </div>
            <div>
              <Label>Kantoor</Label>
              <Input value={form.telefoon_kantoor} onChange={(e) => set("telefoon_kantoor", e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label>LinkedIn</Label>
              <Input value={form.linkedin_url} onChange={(e) => set("linkedin_url", e.target.value)} placeholder="https://linkedin.com/in/..." />
            </div>
            <div className="col-span-2">
              <Label>Notitie</Label>
              <Textarea rows={3} value={form.notitie} onChange={(e) => set("notitie", e.target.value)} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox checked={form.is_hoofdcontact} onCheckedChange={(v) => set("is_hoofdcontact", !!v)} />
            Markeer als hoofdcontact
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={upsert.isPending}>
            Annuleren
          </Button>
          <Button onClick={opslaan} disabled={upsert.isPending}>Opslaan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}