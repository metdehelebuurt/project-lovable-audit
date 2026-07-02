import { Button } from "@/components/ui/button";
import { Bell, X, StickyNote, Phone, Mail } from "lucide-react";
import { useLeadOngelezen } from "@/hooks/affiliate/useLeadOngelezen";

interface Props {
  leadId: string;
  onGelezen: () => void;
  onOpenNotities: () => void;
}

/**
 * Melding bovenaan de lead-/klantkaart als er sinds het laatste bezoek nieuwe
 * notities, contactmomenten of inkomende mails zijn geregistreerd door anderen.
 */
export function NieuweActiviteitBanner({ leadId, onGelezen, onOpenNotities }: Props) {
  const { data, isLoading } = useLeadOngelezen(leadId);
  if (isLoading || !data) return null;
  const totaal = data.nieuwe_notities + data.nieuwe_contactmomenten + data.nieuwe_mails;
  if (totaal === 0) return null;

  const brokken: string[] = [];
  if (data.nieuwe_notities > 0) brokken.push(`${data.nieuwe_notities} nieuwe notitie${data.nieuwe_notities === 1 ? "" : "s"}`);
  if (data.nieuwe_contactmomenten > 0) brokken.push(`${data.nieuwe_contactmomenten} contactmoment${data.nieuwe_contactmomenten === 1 ? "" : "en"}`);
  if (data.nieuwe_mails > 0) brokken.push(`${data.nieuwe_mails} inkomende mail${data.nieuwe_mails === 1 ? "" : "s"}`);

  return (
    <div
      role="alert"
      className="rounded-xl border-l-4 border-l-amber-500 border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-3 shadow-sm flex items-start gap-3"
    >
      <div className="h-9 w-9 rounded-lg bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
        <Bell className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-900">
          Nieuw sinds je laatste bezoek
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-amber-800">
          {data.nieuwe_notities > 0 && (
            <span className="inline-flex items-center gap-1 bg-white/70 rounded-full px-2 py-0.5">
              <StickyNote className="h-3 w-3" /> {data.nieuwe_notities}
            </span>
          )}
          {data.nieuwe_contactmomenten > 0 && (
            <span className="inline-flex items-center gap-1 bg-white/70 rounded-full px-2 py-0.5">
              <Phone className="h-3 w-3" /> {data.nieuwe_contactmomenten}
            </span>
          )}
          {data.nieuwe_mails > 0 && (
            <span className="inline-flex items-center gap-1 bg-white/70 rounded-full px-2 py-0.5">
              <Mail className="h-3 w-3" /> {data.nieuwe_mails}
            </span>
          )}
          <span className="text-amber-700/80">· {brokken.join(", ")}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {data.nieuwe_notities > 0 && (
          <Button size="sm" variant="outline" className="h-8 bg-white/70 border-amber-300" onClick={onOpenNotities}>
            Bekijk notities
          </Button>
        )}
        <Button size="sm" variant="ghost" className="h-8 text-amber-800 hover:bg-white/70" onClick={onGelezen}>
          <X className="h-3.5 w-3.5 mr-1" /> Gelezen
        </Button>
      </div>
    </div>
  );
}