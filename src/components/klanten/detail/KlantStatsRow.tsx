import {
  FileText, Wrench, TrendingUp, ClipboardCheck, ShieldCheck, CalendarIcon,
} from "lucide-react";
import { formatCurrency } from "@/components/detail/DetailComponents";

interface Stats {
  offertes: number;
  opdrachten: number;
  orderwaarde: number;
  schouwen: number;
  opleveringen: number;
  afspraken: number;
}

interface Props {
  stats: Stats;
}

/**
 * Compacte horizontale stat-row.
 * - Mobiel: scrollbaar (chips, 2 belangrijkste prominent)
 * - Desktop: 6-koloms grid
 */
export default function KlantStatsRow({ stats }: Props) {
  const items = [
    { label: "Offertes", value: stats.offertes, icon: FileText, primary: false },
    { label: "Verkooporders", value: stats.opdrachten, icon: Wrench, primary: false },
    { label: "Orderwaarde", value: formatCurrency(stats.orderwaarde), icon: TrendingUp, primary: true },
    { label: "Schouwen", value: stats.schouwen, icon: ClipboardCheck, primary: false },
    { label: "Opleveringen", value: stats.opleveringen, icon: ShieldCheck, primary: false },
    { label: "Afspraken", value: stats.afspraken, icon: CalendarIcon, primary: false },
  ];

  return (
    <>
      {/* Desktop grid */}
      <div className="hidden sm:grid grid-cols-3 lg:grid-cols-6 gap-3">
        {items.map((it) => (
          <div key={it.label} className="flex items-center gap-3 p-3 rounded-xl bg-primary/5">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <it.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">{it.label}</p>
              <p className="text-sm font-bold text-foreground truncate">{it.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Mobiel: horizontaal scrollend */}
      <div className="sm:hidden -mx-4 px-4 overflow-x-auto">
        <div className="flex gap-2 min-w-max pb-1">
          {items.map((it) => (
            <div
              key={it.label}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/5 shrink-0"
            >
              <it.icon className="h-3.5 w-3.5 text-primary" />
              <div>
                <p className="text-[10px] text-muted-foreground leading-none">{it.label}</p>
                <p className="text-xs font-semibold text-foreground mt-0.5">{it.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}