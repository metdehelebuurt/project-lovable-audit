import type { AffiliateLead } from "@/hooks/affiliate/useAffiliateLeads";
import type { Temperatuur } from "@/lib/sales/temperatuur";

type Props = {
  queue: AffiliateLead[];
  huidigeIndex: number;
  onKies: (index: number) => void;
};

const TEMP_KLEUR: Record<Temperatuur, string> = {
  heet: "bg-rose-500",
  warm: "bg-amber-500",
  koud: "bg-sky-500",
};

export function BelQueueStrip({ queue, huidigeIndex, onKies }: Props) {
  if (queue.length === 0) return null;
  const venster = queue.slice(huidigeIndex, huidigeIndex + 8);
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground shrink-0 pr-1">
        Up next
      </span>
      {venster.map((lead, i) => {
        const echteIndex = huidigeIndex + i;
        const isHuidig = i === 0;
        const temp = (lead.temperatuur ?? "koud") as Temperatuur;
        return (
          <button
            key={lead.id}
            type="button"
            onClick={() => onKies(echteIndex)}
            className={`shrink-0 flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-all ${
              isHuidig
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-background hover:bg-muted border-border text-foreground/80"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${TEMP_KLEUR[temp]}`} aria-hidden />
            <span className="max-w-[140px] truncate font-medium">{lead.bedrijfsnaam}</span>
            {isHuidig && (
              <span className="text-[10px] uppercase tracking-wide opacity-80">nu</span>
            )}
          </button>
        );
      })}
      {queue.length > huidigeIndex + 8 && (
        <span className="shrink-0 text-xs text-muted-foreground pl-1">
          +{queue.length - huidigeIndex - 8} meer
        </span>
      )}
    </div>
  );
}

export default BelQueueStrip;