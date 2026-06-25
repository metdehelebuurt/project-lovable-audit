import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useUpdateAffiliateLead, type AffiliateLead } from "@/hooks/affiliate/useAffiliateLeads";

type ExtraVelden = {
  kvk_nummer: string | null;
  btw_nummer: string | null;
  oprichtingsjaar: number | null;
  aantal_medewerkers: number | null;
  jaaromzet: number | null;
  linkedin_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  huidige_leverancier: string | null;
  concurrenten: string | null;
  beslissingscriteria: string | null;
};

type LeadMetExtra = AffiliateLead & Partial<ExtraVelden>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lead: LeadMetExtra;
}

export function BedrijfBewerkenDialog({ open, onOpenChange, lead }: Props) {
  const update = useUpdateAffiliateLead();
  const [form, setForm] = useState({
    bedrijfsnaam: "", branche: "", regio: "", website: "", adres: "", postcode: "", plaats: "",
    kvk_nummer: "", btw_nummer: "", oprichtingsjaar: "", aantal_medewerkers: "", jaaromzet: "",
    linkedin_url: "", facebook_url: "", instagram_url: "",
    huidige_leverancier: "", concurrenten: "", beslissingscriteria: "",
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      bedrijfsnaam: lead.bedrijfsnaam ?? "",
      branche: lead.branche ?? "",
      regio: lead.regio ?? "",
      website: lead.website ?? "",
      adres: lead.adres ?? "",
      postcode: lead.postcode ?? "",
      plaats: lead.plaats ?? "",
      kvk_nummer: lead.kvk_nummer ?? "",
      btw_nummer: lead.btw_nummer ?? "",
      oprichtingsjaar: lead.oprichtingsjaar?.toString() ?? "",
      aantal_medewerkers: lead.aantal_medewerkers?.toString() ?? "",
      jaaromzet: lead.jaaromzet?.toString() ?? "",
      linkedin_url: lead.linkedin_url ?? "",
      facebook_url: lead.facebook_url ?? "",
      instagram_url: lead.instagram_url ?? "",
      huidige_leverancier: lead.huidige_leverancier ?? "",
      concurrenten: lead.concurrenten ?? "",
      beslissingscriteria: lead.beslissingscriteria ?? "",
    });
  }, [open, lead]);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const opslaan = async () => {
    if (!form.bedrijfsnaam.trim()) {
      toast.error("Bedrijfsnaam is verplicht");
      return;
    }
    const kvk = form.kvk_nummer.trim();
    if (kvk && !/^\d{8}$/.test(kvk)) {
      toast.error("KvK-nummer moet 8 cijfers zijn");
      return;
    }
    const patch: Record<string, unknown> = {
      bedrijfsnaam: form.bedrijfsnaam.trim(),
      branche: form.branche.trim() || null,
      regio: form.regio.trim() || null,
      website: form.website.trim() || null,
      adres: form.adres.trim() || null,
      postcode: form.postcode.trim() || null,
      plaats: form.plaats.trim() || null,
      kvk_nummer: kvk || null,
      btw_nummer: form.btw_nummer.trim() || null,
      oprichtingsjaar: form.oprichtingsjaar ? Number(form.oprichtingsjaar) : null,
      aantal_medewerkers: form.aantal_medewerkers ? Number(form.aantal_medewerkers) : null,
      jaaromzet: form.jaaromzet ? Number(form.jaaromzet) : null,
      linkedin_url: form.linkedin_url.trim() || null,
      facebook_url: form.facebook_url.trim() || null,
      instagram_url: form.instagram_url.trim() || null,
      huidige_leverancier: form.huidige_leverancier.trim() || null,
      concurrenten: form.concurrenten.trim() || null,
      beslissingscriteria: form.beslissingscriteria.trim() || null,
    };
    try {
      await update.mutateAsync({ id: lead.id, patch: patch as never });
      toast.success("Bedrijfsgegevens bijgewerkt");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Opslaan mislukt");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bedrijfsgegevens bewerken</DialogTitle>
          <DialogDescription>Alle velden zijn optioneel behalve bedrijfsnaam.</DialogDescription>
        </DialogHeader>

        <Sectie titel="Basis">
          <Veld label="Bedrijfsnaam *" value={form.bedrijfsnaam} onChange={(v) => set("bedrijfsnaam", v)} />
          <Veld label="Branche" value={form.branche} onChange={(v) => set("branche", v)} />
          <Veld label="Regio" value={form.regio} onChange={(v) => set("regio", v)} />
          <Veld label="Website" value={form.website} onChange={(v) => set("website", v)} placeholder="https://..." />
        </Sectie>

        <Sectie titel="Adres">
          <Veld label="Straat + nr" value={form.adres} onChange={(v) => set("adres", v)} className="sm:col-span-2" />
          <Veld label="Postcode" value={form.postcode} onChange={(v) => set("postcode", v)} />
          <Veld label="Plaats" value={form.plaats} onChange={(v) => set("plaats", v)} />
        </Sectie>

        <Sectie titel="Identiteit">
          <Veld label="KvK-nummer" value={form.kvk_nummer} onChange={(v) => set("kvk_nummer", v)} placeholder="8 cijfers" />
          <Veld label="BTW-nummer" value={form.btw_nummer} onChange={(v) => set("btw_nummer", v)} placeholder="NL.....B01" />
          <Veld label="Oprichtingsjaar" value={form.oprichtingsjaar} onChange={(v) => set("oprichtingsjaar", v)} type="number" />
        </Sectie>

        <Sectie titel="Omvang">
          <Veld label="Aantal medewerkers" value={form.aantal_medewerkers} onChange={(v) => set("aantal_medewerkers", v)} type="number" />
          <Veld label="Jaaromzet (€)" value={form.jaaromzet} onChange={(v) => set("jaaromzet", v)} type="number" />
        </Sectie>

        <Sectie titel="Online">
          <Veld label="LinkedIn" value={form.linkedin_url} onChange={(v) => set("linkedin_url", v)} className="sm:col-span-2" />
          <Veld label="Facebook" value={form.facebook_url} onChange={(v) => set("facebook_url", v)} />
          <Veld label="Instagram" value={form.instagram_url} onChange={(v) => set("instagram_url", v)} />
        </Sectie>

        <Sectie titel="Sales-context">
          <div className="sm:col-span-2 space-y-1">
            <Label className="text-xs">Huidige leverancier</Label>
            <Input value={form.huidige_leverancier} onChange={(e) => set("huidige_leverancier", e.target.value)} />
          </div>
          <div className="sm:col-span-2 space-y-1">
            <Label className="text-xs">Concurrenten / alternatieven</Label>
            <Textarea rows={2} value={form.concurrenten} onChange={(e) => set("concurrenten", e.target.value)} />
          </div>
          <div className="sm:col-span-2 space-y-1">
            <Label className="text-xs">Beslissingscriteria</Label>
            <Textarea rows={2} value={form.beslissingscriteria} onChange={(e) => set("beslissingscriteria", e.target.value)} placeholder="Wat is voor deze klant doorslaggevend?" />
          </div>
        </Sectie>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={update.isPending}>Annuleren</Button>
          <Button onClick={opslaan} disabled={update.isPending}>Opslaan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Sectie({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 border-t pt-3 first:border-t-0 first:pt-0">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{titel}</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function Veld({
  label, value, onChange, placeholder, type, className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <Label className="text-xs">{label}</Label>
      <Input type={type ?? "text"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}