import { Building2, Briefcase, MapPin, Tag, Pencil, Sparkles, Hash, Users, TrendingUp, Linkedin, Facebook, Instagram, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { AffiliateLead } from "@/hooks/affiliate/useAffiliateLeads";
import { BedrijfBewerkenDialog } from "./BedrijfBewerkenDialog";

interface Props {
  lead: AffiliateLead & Record<string, unknown>;
  bronLabel: string | null;
}

export function BedrijfsKaartUitgebreid({ lead, bronLabel }: Props) {
  const [open, setOpen] = useState(false);
  const l = lead as AffiliateLead & {
    kvk_nummer?: string | null;
    btw_nummer?: string | null;
    oprichtingsjaar?: number | null;
    aantal_medewerkers?: number | null;
    jaaromzet?: number | null;
    linkedin_url?: string | null;
    facebook_url?: string | null;
    instagram_url?: string | null;
    huidige_leverancier?: string | null;
    concurrenten?: string | null;
    beslissingscriteria?: string | null;
  };
  const adresRegels = [l.adres, [l.postcode, l.plaats].filter(Boolean).join(" ")].filter(Boolean);
  const fmtEuro = (n: number | null | undefined) =>
    typeof n === "number" ? new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n) : null;

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" /> Bedrijfsgegevens
        </h3>
        <Button size="sm" variant="ghost" onClick={() => setOpen(true)} className="h-7 px-2">
          <Pencil className="h-3.5 w-3.5 mr-1" /> Bewerken
        </Button>
      </div>

      <dl className="text-sm space-y-1.5">
        <Rij icon={<Briefcase className="h-3.5 w-3.5" />} label="Branche" value={l.branche} />
        <Rij icon={<MapPin className="h-3.5 w-3.5" />} label="Regio" value={l.regio} />
        {adresRegels.length > 0 && (
          <Rij
            icon={<MapPin className="h-3.5 w-3.5" />}
            label="Adres"
            value={adresRegels.join(", ")}
          />
        )}
        <Rij icon={<Tag className="h-3.5 w-3.5" />} label="Bron" value={bronLabel} />
      </dl>

      {(l.kvk_nummer || l.btw_nummer || l.oprichtingsjaar) && (
        <Sectie titel="Identiteit">
          <Rij icon={<Hash className="h-3.5 w-3.5" />} label="KvK" value={l.kvk_nummer} />
          <Rij icon={<Hash className="h-3.5 w-3.5" />} label="BTW" value={l.btw_nummer} />
          <Rij icon={<Hash className="h-3.5 w-3.5" />} label="Opgericht" value={l.oprichtingsjaar?.toString() ?? null} />
        </Sectie>
      )}

      {(l.aantal_medewerkers || l.jaaromzet) && (
        <Sectie titel="Omvang">
          <Rij icon={<Users className="h-3.5 w-3.5" />} label="Medewerkers" value={l.aantal_medewerkers?.toString() ?? null} />
          <Rij icon={<TrendingUp className="h-3.5 w-3.5" />} label="Jaaromzet" value={fmtEuro(l.jaaromzet ?? null)} />
        </Sectie>
      )}

      {(l.linkedin_url || l.facebook_url || l.instagram_url) && (
        <Sectie titel="Online">
          {l.linkedin_url && <Link icon={<Linkedin className="h-3.5 w-3.5" />} label="LinkedIn" href={l.linkedin_url} />}
          {l.facebook_url && <Link icon={<Facebook className="h-3.5 w-3.5" />} label="Facebook" href={l.facebook_url} />}
          {l.instagram_url && <Link icon={<Instagram className="h-3.5 w-3.5" />} label="Instagram" href={l.instagram_url} />}
        </Sectie>
      )}

      {(l.huidige_leverancier || l.concurrenten || l.beslissingscriteria) && (
        <Sectie titel="Sales-context">
          <Rij icon={<Target className="h-3.5 w-3.5" />} label="Huidige leverancier" value={l.huidige_leverancier} />
          <Rij icon={<Target className="h-3.5 w-3.5" />} label="Concurrenten" value={l.concurrenten} />
          <Rij icon={<Target className="h-3.5 w-3.5" />} label="Beslissingscriteria" value={l.beslissingscriteria} />
        </Sectie>
      )}

      {l.ai_bedrijf_samenvatting && (
        <p className="text-xs text-muted-foreground border-t pt-2 mt-2 italic">
          <Sparkles className="h-3 w-3 inline mr-1 text-primary" />
          {l.ai_bedrijf_samenvatting}
        </p>
      )}

      <BedrijfBewerkenDialog open={open} onOpenChange={setOpen} lead={l} />
    </div>
  );
}

function Sectie({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <div className="border-t pt-2 space-y-1.5">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">{titel}</p>
      <dl className="text-sm space-y-1.5">{children}</dl>
    </div>
  );
}

function Rij({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-2">
      <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="break-words">{value}</dd>
      </div>
    </div>
  );
}

function Link({ icon, label, href }: { icon: React.ReactNode; label: string; href: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
      <a href={href} target="_blank" rel="noreferrer" className="text-primary hover:underline text-sm truncate">{label}</a>
    </div>
  );
}