import { Badge } from "@/components/ui/badge";
import { TEMP_COLOR, TEMP_ICON, TEMP_LABEL, type Temperatuur } from "@/lib/sales/temperatuur";

interface Props {
  temperatuur: Temperatuur | null | undefined;
  size?: "sm" | "md";
  showLabel?: boolean;
}

export default function TemperatuurBadge({ temperatuur, size = "sm", showLabel = true }: Props) {
  const t: Temperatuur = (temperatuur ?? "koud") as Temperatuur;
  const Icon = TEMP_ICON[t];
  const iconSize = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";
  return (
    <Badge variant="outline" className={`${TEMP_COLOR[t]} gap-1 px-1.5 py-0`}>
      <Icon className={iconSize} />
      {showLabel && <span className="text-[11px]">{TEMP_LABEL[t]}</span>}
    </Badge>
  );
}