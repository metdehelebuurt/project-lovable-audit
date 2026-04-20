import { Badge } from "@/components/ui/badge";

const map: Record<string, { label: string; cls: string }> = {
  nieuw: { label: "Nieuw", cls: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30" },
  open: { label: "Open", cls: "bg-secondary text-secondary-foreground" },
  in_behandeling: { label: "In behandeling", cls: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30" },
  wacht_op_klant: { label: "Wacht op klant", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30" },
  wacht_op_intern: { label: "Wacht intern", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30" },
  wacht_op_onderdeel: { label: "Wacht op onderdeel", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30" },
  ingepland: { label: "Ingepland", cls: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30" },
  onderweg: { label: "Onderweg", cls: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30" },
  opgelost: { label: "Opgelost", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" },
  gesloten: { label: "Gesloten", cls: "bg-muted text-muted-foreground" },
  geescaleerd: { label: "Geëscaleerd", cls: "bg-destructive/15 text-destructive border-destructive/30" },
};

export function StatusBadge({ status }: { status: string }) {
  const m = map[status] ?? map.open;
  return (
    <Badge variant="outline" className={m.cls}>
      {m.label}
    </Badge>
  );
}