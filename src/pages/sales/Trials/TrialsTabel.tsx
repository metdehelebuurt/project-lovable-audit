import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, ExternalLink, StickyNote, User2 } from "lucide-react";
import type { SalesTrialPartner } from "@/hooks/sales/useSalesTrials";
import UpsellBadge from "@/components/sales/UpsellBadge";
import { bepaalBron, TRIAL_BRON_KLEUR, TRIAL_BRON_KORT } from "@/lib/sales/trialBron";

interface Props {
  trials: SalesTrialPartner[];
  upsells: Record<string, { heeft_smartaccu: boolean }>;
  notitiesPerPartner: Record<string, { aantal: number; laatste: string | null }>;
  onOpenNotities: (partner: SalesTrialPartner) => void;
}

function dagenTot(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  d.setHours(23, 59, 59, 999);
  return Math.ceil((d.getTime() - Date.now()) / 86_400_000);
}

function dagenBadge(dagen: number | null) {
  if (dagen === null) return <Badge variant="secondary">Geen einddatum</Badge>;
  if (dagen < 0)
    return (
      <Badge className="bg-rose-100 text-rose-800 border-rose-200">
        Verlopen ({Math.abs(dagen)}d)
      </Badge>
    );
  if (dagen < 3)
    return <Badge className="bg-rose-100 text-rose-800 border-rose-200">Nog {dagen} dagen</Badge>;
  if (dagen < 7)
    return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Nog {dagen} dagen</Badge>;
  return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Nog {dagen} dagen</Badge>;
}

export default function TrialsTabel({ trials, upsells, notitiesPerPartner, onOpenNotities }: Props) {
  if (trials.length === 0) {
    return (
      <Card className="p-6 text-center text-sm text-muted-foreground">
        Geen trials in deze selectie.
      </Card>
    );
  }
  return (
    <div className="space-y-2">
      {trials.map((t) => {
        const dagen = dagenTot(t.trial_einddatum);
        const contact = [t.contactpersoon_voornaam, t.contactpersoon_achternaam]
          .filter(Boolean)
          .join(" ");
        const notities = notitiesPerPartner[t.id];
        const upsell = upsells[t.id];
        return (
          <Card key={t.id} className="p-3 flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to={`/partners/${t.id}`}
                  className="font-semibold text-sm hover:underline truncate"
                >
                  {t.naam}
                </Link>
                {dagenBadge(dagen)}
                {upsell?.heeft_smartaccu === false && <UpsellBadge compact />}
                {(() => {
                  const b = bepaalBron(t);
                  return (
                    <Badge className={`${TRIAL_BRON_KLEUR[b]} border`}>{TRIAL_BRON_KORT[b]}</Badge>
                  );
                })()}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-x-3 gap-y-1">
                {t.plaats && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {t.plaats}
                  </span>
                )}
                {contact && (
                  <span className="inline-flex items-center gap-1">
                    <User2 className="h-3 w-3" /> {contact}
                    {t.contactpersoon_functie ? ` · ${t.contactpersoon_functie}` : ""}
                  </span>
                )}
                {(t.contactpersoon_email || t.email) && (
                  <a
                    href={`mailto:${t.contactpersoon_email ?? t.email}`}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    <Mail className="h-3 w-3" />
                    {t.contactpersoon_email ?? t.email}
                  </a>
                )}
                {(t.contactpersoon_telefoon || t.telefoonnummer) && (
                  <a
                    href={`tel:${t.contactpersoon_telefoon ?? t.telefoonnummer}`}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    <Phone className="h-3 w-3" />
                    {t.contactpersoon_telefoon ?? t.telefoonnummer}
                  </a>
                )}
              </div>
              {t.affiliate && (
                <div className="text-[11px] text-muted-foreground mt-1">
                  Aangebracht door:{" "}
                  <span className="font-medium text-foreground">
                    {[t.affiliate.voornaam, t.affiliate.achternaam].filter(Boolean).join(" ") ||
                      t.affiliate.email}
                  </span>
                  {t.affiliate.commissie_percentage != null &&
                    ` · ${t.affiliate.commissie_percentage}%`}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5"
                onClick={() => onOpenNotities(t)}
              >
                <StickyNote className="h-3.5 w-3.5" />
                Notities
                {notities && notities.aantal > 0 && (
                  <span className="ml-1 text-[10px] rounded-full bg-muted px-1.5">
                    {notities.aantal}
                  </span>
                )}
              </Button>
              <Button size="sm" variant="ghost" asChild className="h-8">
                <Link to={`/partners/${t.id}`}>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}