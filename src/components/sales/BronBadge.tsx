import { Badge } from "@/components/ui/badge";
import { kleurClasses } from "@/lib/sales/pipeline";
import { useLeadBronnen } from "@/hooks/sales/useLeadBronnen";

interface Props {
  bronId: string | null | undefined;
  fallbackLabel?: string | null;
}

export default function BronBadge({ bronId, fallbackLabel }: Props) {
  const { data: bronnen } = useLeadBronnen();
  const bron = bronnen?.find((b) => b.id === bronId);
  const label = bron?.label ?? fallbackLabel ?? null;
  if (!label) return null;
  return (
    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${kleurClasses(bron?.kleur ?? "slate")}`}>
      {label}
    </Badge>
  );
}