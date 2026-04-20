import { Badge } from "@/components/ui/badge";

const map: Record<string, { label: string; cls: string }> = {
  laag: { label: "Laag", cls: "bg-muted text-muted-foreground" },
  normaal: { label: "Normaal", cls: "bg-secondary text-secondary-foreground" },
  hoog: { label: "Hoog", cls: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30" },
  urgent: { label: "Urgent", cls: "bg-destructive/15 text-destructive border-destructive/30" },
};

export function PrioriteitBadge({ prio }: { prio: string }) {
  const m = map[prio] ?? map.normaal;
  return (
    <Badge variant="outline" className={m.cls}>
      {m.label}
    </Badge>
  );
}