import { Badge } from "@/components/ui/badge";
import { INSTALLATIE_STATUS_COLORS, INSTALLATIE_STATUS_LABELS, type InstallatieStatus } from "./status";

export default function InstallatieStatusBadge({ status }: { status: InstallatieStatus }) {
  return (
    <Badge className={INSTALLATIE_STATUS_COLORS[status] || ""}>
      {INSTALLATIE_STATUS_LABELS[status] || status}
    </Badge>
  );
}