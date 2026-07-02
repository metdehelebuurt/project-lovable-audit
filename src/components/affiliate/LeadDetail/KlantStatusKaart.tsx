import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Sparkles, TrendingUp, UserCheck, UserX } from "lucide-react";
import { Link } from "react-router-dom";
import { useLeadKlantstatus, type Klantstatus, type KlantstatusStatus } from "@/hooks/affiliate/useLeadKlantstatus";

const STATUS_META: Record<KlantstatusStatus, { label: string; kleur: string; icon: typeof UserCheck }> = {
  geen_match: { label: "Nieuw prospect", kleur: "bg-slate-100 text-slate-700 border-slate-200", icon: UserX },
  geen_toegang: { label: "Onbekend", kleur: "bg-slate-100 text-slate-700 border-slate-200", icon: UserX },
  geen_abonnement: { label: "Partner zonder abonnement", kleur: "bg-amber-100 text-amber-800 border-amber-200", icon: UserCheck },
  trial: { label: "Trial actief", kleur: "bg-violet-100 text-violet-800 border-violet-200", icon: Sparkles },
  betalend: { label: "Betalend klant", kleur: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: UserCheck },
  opgezegd: { label: "Opgezegd", kleur: "bg-rose-100 text-rose-800 border-rose-200", icon: UserX },
  verlopen: { label: "Verlopen", kleur: "bg-amber-100 text-amber-800 border-amber-200", icon: UserX },
};

const MATCH_LABEL: Record<string, string> = {
  gewonnen_lead: "eerder gewonnen lead",
  domein: "e-maildomein",
  bedrijfsnaam: "bedrijfsnaam",
};

function formatEuro(n?: number | null) {
  if (n == null) return null;
  return Number(n).toLocaleString("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

interface Props {
  leadId: string;
}

export function KlantStatusKaart({ leadId }: Props) {
  const { data, isLoading } = useLeadKlantstatus(leadId);
  if (isLoading || !data) return null;

  const meta = STATUS_META[data.status] ?? STATUS_META.geen_match;
  const Icon = meta.icon;
  const isKlant = data.status !== "geen_match" && data.status !== "geen_toegang";

  return (
    <section className={`rounded-xl border bg-card p-4 ${isKlant ? "border-l-4 border-l-emerald-400" : ""}`}>
      <header className="flex flex-wrap items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-primary" aria-hidden />
        <h3 className="text-sm font-semibold">Klantstatus</h3>
        <Badge variant="outline" className={`text-[11px] font-medium ${meta.kleur}`}>
          {meta.label}
        </Badge>
        {data.match_reden && (
          <span className="text-[11px] text-muted-foreground">
            match op {MATCH_LABEL[data.match_reden] ?? data.match_reden}
          </span>
        )}
      </header>

      {!isKlant && (
        <p className="text-sm text-muted-foreground">
          Dit bedrijf staat nog niet als partner in mijnhuis.nu — perfect moment voor een trial.
        </p>
      )}

      {isKlant && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="font-medium">{data.partner_naam}</span>
            {data.partner_plaats && <span className="text-muted-foreground">{data.partner_plaats}</span>}
            {data.plan_naam && (
              <span className="text-muted-foreground">
                Plan: <span className="text-foreground font-medium">{data.plan_naam}</span>
                {formatEuro(data.maand_bedrag) ? ` (${formatEuro(data.maand_bedrag)}/mnd)` : ""}
              </span>
            )}
            {data.trial_einddatum && data.status === "trial" && (
              <span className="text-muted-foreground">
                Trial tot {new Date(data.trial_einddatum).toLocaleDateString("nl-NL")}
              </span>
            )}
            {data.opzeg_datum && (
              <span className="text-rose-700">
                Opgezegd per {new Date(data.opzeg_datum).toLocaleDateString("nl-NL")}
              </span>
            )}
          </div>

          {data.huidige_addons && data.huidige_addons.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Huidige add-ons</p>
              <div className="flex flex-wrap gap-1.5">
                {data.huidige_addons.map((a) => (
                  <Badge key={a.slug} variant="secondary" className="text-[11px]">
                    {a.naam}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {(data.status === "trial" || data.status === "betalend") &&
            data.upsell_addons && data.upsell_addons.length > 0 && (
              <UpsellBlok
                titel="Upsell-kansen (add-ons)"
                items={data.upsell_addons.map((a) => ({
                  slug: a.slug,
                  naam: a.naam,
                  prijs: a.maand_prijs,
                  hint: a.beschrijving ?? undefined,
                }))}
              />
            )}

          {(data.status === "trial" || data.status === "betalend") &&
            data.upsell_plannen && data.upsell_plannen.length > 0 && (
              <UpsellBlok
                titel="Upgrade-kansen (hoger plan)"
                items={data.upsell_plannen.map((p) => ({
                  slug: p.slug,
                  naam: p.naam,
                  prijs: p.maand_prijs,
                }))}
              />
            )}

          {data.partner_id && (
            <div className="pt-1">
              <Button asChild size="sm" variant="outline">
                <Link to={`/superadmin/partners/${data.partner_id}`}>
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Klantpagina openen
                </Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

interface UpsellItem {
  slug: string;
  naam: string;
  prijs?: number | null;
  hint?: string;
}

function UpsellBlok({ titel, items }: { titel: string; items: UpsellItem[] }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
        <TrendingUp className="h-3.5 w-3.5" /> {titel}
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {items.map((i) => (
          <li key={i.slug}>
            <Badge
              variant="outline"
              className="text-[11px] border-emerald-200 bg-emerald-50 text-emerald-800"
              title={i.hint}
            >
              {i.naam}
              {i.prijs ? ` · ${formatEuro(i.prijs)}/mnd` : ""}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}