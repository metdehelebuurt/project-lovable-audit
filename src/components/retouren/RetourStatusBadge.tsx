import { Badge } from "@/components/ui/badge";
import type { RetourStatus } from "@/hooks/retouren/useRetouren";

const labels: Record<RetourStatus, string> = {
  aangemeld: "Aangemeld",
  goedgekeurd: "Goedgekeurd",
  verzonden: "Verzonden",
  ontvangen: "Ontvangen",
  afgehandeld: "Afgehandeld",
  afgewezen: "Afgewezen",
};

const colors: Record<RetourStatus, string> = {
  aangemeld: "bg-muted text-muted-foreground",
  goedgekeurd: "bg-primary/10 text-primary",
  verzonden: "bg-warning/10 text-warning-foreground",
  ontvangen: "bg-accent/40 text-accent-foreground",
  afgehandeld: "bg-success-light text-success",
  afgewezen: "bg-error-light text-error",
};

export default function RetourStatusBadge({ status }: { status: RetourStatus }) {
  return <Badge className={colors[status]} variant="secondary">{labels[status]}</Badge>;
}