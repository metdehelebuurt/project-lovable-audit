import { useState } from "react";
import { Building2, Hash, MapPin, Briefcase, Tag, Globe, Pencil, Sparkles, Users, TrendingUp, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AffiliateLead } from "@/hooks/affiliate/useAffiliateLeads";
import { BedrijfBewerkenDialog } from "../BedrijfBewerkenDialog";
import { cn } from "@/lib/utils";

interface Props {
  lead: AffiliateLead & Record<string, unknown>;
  bronLabel: string | null;
}

export function BedrijfCard({ lead, bronLabel }: Props) {
  const [open, setOpen] = useState(false);
  const l = lead as AffiliateLead & {
    kvk_nummer?: string | null;
    aantal_medewerkers?: number | null;
    jaaromzet?: number | null;
    linkedin_url?: string | null;
    huidige_leverancier?: string | null;
  };
  const fmtEuro = (n: number | null | undefined) =>
    typeof n === "number" ? new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n) : null;

  const heeftData = !!(l.kvk_nummer || l.plaats || l.branche || l.regio || l.website || l.aantal_medewerkers || l.jaaromzet || bronLabel || l.huidige_leverancier);

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3 min-w-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center h-6 w-6 rounded-md text-amber-700 bg-amber-50">
            <Building2 className="h-4 w-4" />
          </span>
          <h3 className="text-sm font-semibold">Bedrijf</h3>
        </div>
        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setOpen(true)}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </div>

      {!heeftData && (
        <div className="rounded-md border border-dashed bg-muted/30 p-3 text-center space-y-2">
          <p className="text-xs text-muted-foreground">Geen bedrijfsgegevens bekend.</p>
          <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="h-7 text-xs">
            <Sparkles className="h-3 w-3 mr-1" /> Vul aan
          </Button>
        </div>
      )}

      {heeftData && (
        <dl className="grid grid-cols-1 gap-1.5 text-sm">
          <Rij icon={<Hash className="h-3.5 w-3.5" />} label="KvK" value={l.kvk_nummer} />
          <Rij icon={<MapPin className="h-3.5 w-3.5" />} label="Plaats" value={l.plaats} />
          <Rij icon={<Briefcase className="h-3.5 w-3.5" />} label="Branche" value={l.branche} />
          <Rij icon={<Tag className="h-3.5 w-3.5" />} label="Bron" value={bronLabel} />
          <Rij icon={<Users className="h-3.5 w-3.5" />} label="Medewerkers" value={l.aantal_medewerkers?.toString() ?? null} />
          <Rij icon={<TrendingUp className="h-3.5 w-3.5" />} label="Omzet" value={fmtEuro(l.jaaromzet ?? null)} />
          {l.website && (
            <ExternLink icon={<Globe className="h-3.5 w-3.5" />} label="Website" href={l.website} />
          )}
          {l.linkedin_url && (
            <ExternLink icon={<Linkedin className="h-3.5 w-3.5" />} label="LinkedIn" href={l.linkedin_url} />
          )}
        </dl>
      )}

      <BedrijfBewerkenDialog open={open} onOpenChange={setOpen} lead={l} />
    </div>
  );
}

function Rij({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <span className="text-xs text-muted-foreground w-20 shrink-0">{label}</span>
      <span className="truncate">{value}</span>
    </div>
  );
}

function ExternLink({ icon, label, href }: { icon: React.ReactNode; label: string; href: string }) {
  const url = href.startsWith("http") ? href : `https://${href}`;
  return (
    <div className={cn("flex items-center gap-2 min-w-0")}>
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <span className="text-xs text-muted-foreground w-20 shrink-0">{label}</span>
      <a href={url} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate text-sm">
        {href.replace(/^https?:\/\//, "")}
      </a>
    </div>
  );
}