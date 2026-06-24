import { Badge } from "@/components/ui/badge";
import { ThumbsUp, Bug, Lightbulb, MessageSquareText, User, Star } from "lucide-react";
import {
  STATUS_KLEUR,
  STATUS_OPTIONS,
  PRIORITEIT_KLEUR,
  BEVESTIGING_KLEUR,
  BEVESTIGING_LABEL,
  type BevestigingStatus,
  type FeedbackStatus,
} from "@/lib/feedback/constants";

export type FeedbackKaartItem = {
  id: string;
  titel: string;
  type: string;
  status: string;
  categorie: string | null;
  prioriteit: string | null;
  stemmen: number | null;
  ai_samenvatting: string | null;
  bevestiging_status: string | null;
  gearchiveerd: boolean | null;
  created_at: string;
  csat_score?: number | null;
  indienerNaam?: string;
};

interface Props {
  item: FeedbackKaartItem;
  compact?: boolean;
  selected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  onClick?: () => void;
  draggable?: boolean;
  onDragStart?: (id: string) => void;
}

export default function FeedbackKaart({
  item,
  compact,
  selected,
  onSelect,
  onClick,
  draggable,
  onDragStart,
}: Props) {
  const Icon =
    item.categorie === "bug"
      ? Bug
      : item.type === "functieverzoek"
      ? Lightbulb
      : MessageSquareText;
  const statusLabel =
    STATUS_OPTIONS.find((s) => s.value === item.status)?.label ?? item.status;
  const bevestiging = item.bevestiging_status as BevestigingStatus | null;

  return (
    <div
      className={`group rounded-lg border bg-card p-3 transition hover:shadow-md ${
        selected ? "ring-2 ring-primary" : ""
      } ${onClick ? "cursor-pointer" : ""}`}
      draggable={draggable}
      onDragStart={(e) => {
        if (!draggable) return;
        e.dataTransfer.setData("text/plain", item.id);
        onDragStart?.(item.id);
      }}
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        {onSelect && (
          <input
            type="checkbox"
            checked={!!selected}
            onChange={(e) => {
              e.stopPropagation();
              onSelect(item.id, e.target.checked);
            }}
            onClick={(e) => e.stopPropagation()}
            className="mt-1 h-3.5 w-3.5"
            aria-label="Selecteer feedback"
          />
        )}
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
        <div className="flex-1 min-w-0 space-y-1.5">
          <p className="text-sm font-medium leading-snug line-clamp-2">{item.titel}</p>
          {!compact && item.ai_samenvatting && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {item.ai_samenvatting.split("\n")[0]}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
            <Badge variant="outline" className={`${STATUS_KLEUR[item.status as FeedbackStatus] ?? ""} border-transparent`}>
              {statusLabel}
            </Badge>
            {item.categorie && (
              <Badge variant="outline" className="capitalize">
                {item.categorie}
              </Badge>
            )}
            {bevestiging && (
              <Badge variant="outline" className={`${BEVESTIGING_KLEUR[bevestiging] ?? ""} border-transparent`}>
                {BEVESTIGING_LABEL[bevestiging]}
              </Badge>
            )}
            {item.prioriteit && item.prioriteit !== "normaal" && (
              <span className={`font-medium ${PRIORITEIT_KLEUR[item.prioriteit] ?? ""}`}>
                {item.prioriteit}
              </span>
            )}
            {typeof item.csat_score === "number" && item.csat_score > 0 && (
              <span
                className="inline-flex items-center gap-0.5 text-amber-600 font-medium"
                title={`CSAT: ${item.csat_score}/5`}
              >
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {item.csat_score}/5
              </span>
            )}
          </div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1 truncate">
              <User className="h-3 w-3" />
              {item.indienerNaam ?? "Onbekend"}
            </span>
            <span className="flex items-center gap-2 shrink-0">
              <span className="flex items-center gap-0.5">
                <ThumbsUp className="h-3 w-3" />
                {item.stemmen ?? 0}
              </span>
              <span>
                {new Date(item.created_at).toLocaleDateString("nl-NL", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}