import { Badge } from "@/components/ui/badge";
import type { OpleverStatus } from "./types";

const LABELS: Record<OpleverStatus, string> = {
  concept: "Concept",
  wacht_op_klant: "Wacht op klant",
  ondertekend: "Ondertekend",
  afgekeurd: "Afgekeurd",
  vervallen: "Vervallen",
};

const VARIANTS: Record<OpleverStatus, string> = {
  concept: "bg-muted text-foreground",
  wacht_op_klant: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200",
  ondertekend: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  afgekeurd: "bg-destructive/15 text-destructive",
  vervallen: "bg-zinc-200 text-zinc-700 line-through dark:bg-zinc-800 dark:text-zinc-300",
};

export default function OpleverStatusBadge({ status }: { status: OpleverStatus }) {
  return <Badge className={VARIANTS[status]} variant="secondary">{LABELS[status]}</Badge>;
}
