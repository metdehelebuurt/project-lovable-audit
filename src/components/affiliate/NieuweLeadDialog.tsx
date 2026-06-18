import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCreateAffiliateLead } from "@/hooks/affiliate/useAffiliateLeads";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function NieuweLeadDialog({ open, onOpenChange }: Props) {
  const create = useCreateAffiliateLead();
  const [form, setForm] = useState({
    bedrijfsnaam: "",
    contactpersoon: "",
    email: "",
    telefoon: "",
    branche: "",
    regio: "",
    website: "",
    geschatte_waarde: "",
    notities: "",
  });

  const submit = async () => {
    if (!form.bedrijfsnaam.trim()) return;
    await create.mutateAsync({
      bedrijfsnaam: form.bedrijfsnaam.trim(),
      contactpersoon: form.contactpersoon || null,
      email: form.email || null,
      telefoon: form.telefoon || null,
      branche: form.branche || null,
      regio: form.regio || null,
      website: form.website || null,
      notities: form.notities || null,
      geschatte_waarde: form.geschatte_waarde ? parseFloat(form.geschatte_waarde) : 0,
    });
    setForm({ bedrijfsnaam: "", contactpersoon: "", email: "", telefoon: "", branche: "", regio: "", website: "", geschatte_waarde: "", notities: "" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Nieuwe lead toevoegen</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label>Bedrijfsnaam *</Label><Input value={form.bedrijfsnaam} onChange={(e) => setForm({ ...form, bedrijfsnaam: e.target.value })} /></div>
          <div><Label>Contactpersoon</Label><Input value={form.contactpersoon} onChange={(e) => setForm({ ...form, contactpersoon: e.target.value })} /></div>
          <div><Label>Telefoon</Label><Input value={form.telefoon} onChange={(e) => setForm({ ...form, telefoon: e.target.value })} /></div>
          <div><Label>E-mail</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label>Website</Label><Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></div>
          <div><Label>Branche</Label><Input value={form.branche} onChange={(e) => setForm({ ...form, branche: e.target.value })} /></div>
          <div><Label>Regio</Label><Input value={form.regio} onChange={(e) => setForm({ ...form, regio: e.target.value })} /></div>
          <div className="col-span-2"><Label>Geschatte waarde (€)</Label><Input type="number" value={form.geschatte_waarde} onChange={(e) => setForm({ ...form, geschatte_waarde: e.target.value })} /></div>
          <div className="col-span-2"><Label>Notitie</Label><Textarea rows={3} value={form.notities} onChange={(e) => setForm({ ...form, notities: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuleren</Button>
          <Button onClick={submit} disabled={!form.bedrijfsnaam.trim() || create.isPending}>Toevoegen</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}