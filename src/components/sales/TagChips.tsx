import { Badge } from "@/components/ui/badge";

interface Props {
  tags: string[] | null | undefined;
  onKlik?: (tag: string) => void;
  max?: number;
  className?: string;
}

/** Klikbare tag-chips voor lijsten en detailheaders. */
export default function TagChips({ tags, onKlik, max, className }: Props) {
  const lijst = (tags ?? []).filter(Boolean);
  if (lijst.length === 0) return null;
  const zichtbaar = typeof max === "number" ? lijst.slice(0, max) : lijst;
  const rest = lijst.length - zichtbaar.length;
  return (
    <div className={`flex flex-wrap gap-1 ${className ?? ""}`}>
      {zichtbaar.map((t) => (
        <Badge
          key={t}
          variant="outline"
          className={`text-[10px] py-0 h-5 border-purple-300 text-purple-800 bg-purple-50 ${onKlik ? "cursor-pointer hover:bg-purple-100" : ""}`}
          onClick={
            onKlik
              ? (e) => {
                  e.stopPropagation();
                  onKlik(t);
                }
              : undefined
          }
          title={onKlik ? `Filter leads met tag "${t}"` : t}
        >
          #{t}
        </Badge>
      ))}
      {rest > 0 && (
        <Badge variant="outline" className="text-[10px] py-0 h-5">
          +{rest}
        </Badge>
      )}
    </div>
  );
}