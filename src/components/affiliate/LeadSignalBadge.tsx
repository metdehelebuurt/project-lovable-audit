import { Mail, ListChecks, PhoneCall } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { LeadSignal } from "@/hooks/affiliate/useLeadSignals";
import { totaalSignalen } from "@/hooks/affiliate/useLeadSignals";

/**
 * Kleine badge-strip die per lead-kaart toont wat er nog ongelezen/openstaand is.
 * Toont niets als er geen signalen zijn.
 */
export function LeadSignalBadge({ signal, compact = false }: { signal: LeadSignal | undefined; compact?: boolean }) {
  if (!signal || totaalSignalen(signal) === 0) return null;
  const items: Array<{ icon: typeof Mail; count: number; label: string; kleur: string }> = [];
  if (signal.ongelezen_mails > 0)
    items.push({ icon: Mail, count: signal.ongelezen_mails, label: `${signal.ongelezen_mails} ongelezen e-mail(s)`, kleur: "bg-blue-500 text-white" });
  if (signal.openstaande_taken > 0)
    items.push({ icon: ListChecks, count: signal.openstaande_taken, label: `${signal.openstaande_taken} openstaande taak(en)`, kleur: "bg-purple-500 text-white" });
  if (signal.aankomende_terugbel > 0)
    items.push({ icon: PhoneCall, count: signal.aankomende_terugbel, label: `${signal.aankomende_terugbel} terugbelafspraak binnenkort`, kleur: "bg-amber-500 text-white" });

  return (
    <div className={`flex items-center gap-1 ${compact ? "" : "mt-1"}`}>
      {items.map((it, i) => (
        <Tooltip key={i}>
          <TooltipTrigger asChild>
            <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${it.kleur}`}>
              <it.icon className="h-2.5 w-2.5" />
              {it.count}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">{it.label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}