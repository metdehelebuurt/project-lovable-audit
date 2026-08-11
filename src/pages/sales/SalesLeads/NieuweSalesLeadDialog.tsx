import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useCreateSalesLead } from "@/hooks/sales/useSalesLeads";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const LEEG = {
  bedrijfsnaam: "",
  contactpersoon: "",
  email: "",
  telefoon: "",
  branche: "",
  regio: "",
  website: "",
  notities: "",
};

/** Nieuwe sales-lead met volledige gegevens (sales-manager en platformbeheer). */
export default function NieuweSalesLeadDialog({ open, onOpenChange }: Props) {
  const create = useCreateSalesLead();
  const [form, setForm] = useState(LEEG);

  const zet = (veld: keyof typeof LEEG) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [veld]: e.target.value }));

  const opslaan = async () => {
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
      sales_fase: "koud",
    });
    setForm(LEEG);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Nieuwe lead toevoegen</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label htmlFor="lead-bedrijf">Bedrijfsnaam *</Label>
            <Input id="lead-bedrijf" value={form.bedrijfsnaam} onChange={zet("bedrijfsnaam")} />
          </div>
          <div>
            <Label htmlFor="lead-contact">Contactpersoon</Label>
            <Input id="lead-contact" value={form.contactpersoon} onChange={zet("contactpersoon")} />
          </div>
          <div>
            <Label htmlFor="lead-tel">Telefoon</Label>
            <Input id="lead-tel" value={form.telefoon} onChange={zet("telefoon")} />
          </div>
          <div>
            <Label htmlFor="lead-email">E-mail</Label>
            <Input id="lead-email" type="email" value={form.email} onChange={zet("email")} />
          </div>
          <div>
            <Label htmlFor="lead-website">Website</Label>
            <Input id="lead-website" value={form.website} onChange={zet("website")} />
          </div>
          <div>
            <Label htmlFor="lead-branche">Branche</Label>
            <Input id="lead-branche" value={form.branche} onChange={zet("branche")} />
          </div>
          <div>
            <Label htmlFor="lead-regio">Regio</Label>
            <Input id="lead-regio" value={form.regio} onChange={zet("regio")} />
          </div>
          <div className="col-span-2">
            <Label htmlFor="lead-notitie">Notitie</Label>
            <Textarea id="lead-notitie" rows={3} value={form.notities} onChange={zet("notities")} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuleren</Button>
          <Button onClick={opslaan} disabled={!form.bedrijfsnaam.trim() || create.isPending}>Toevoegen</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
