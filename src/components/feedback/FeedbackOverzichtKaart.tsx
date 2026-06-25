import { Badge } from "@/components/ui/badge";
import {
  ArrowUp,
  Bug,
  Lightbulb,
  MessageSquareText,
  MessageCircle,
  Paperclip,
  Star,
  Calendar,
  Rocket,
  AlertCircle,
} from "lucide-react";
import {
  STATUS_KLEUR,
  STATUS_OPTIONS,
  type FeedbackStatus,
} from "@/lib/feedback/constants";

const CATEGORIE_LABEL: Record<string, string> = {
  ui: "UI/UX",
  performance: "Performance",
  nieuwe_functie: "Nieuwe functie",
  bug: "Bug",
  integratie: "Integratie",
  workflow: "Workflow",
  overig: "Overig",
};

export type OverzichtKaartItem = {
  id: string;
  titel: string;
  type: string;
  status: string;
  categorie: string | null;
  stemmen: number | null;
  ai_samenvatting: string | null;
  ai_tags: string[] | null;
  beschrijving: string | null;
  bijlagen: unknown[] | null;
  bevestiging_status: string | null;
  verwacht_klaar_op: string | null;
  verwerkt_in_versie: string | null;
  csat_score: number | null;
  created_at: string;
  user_id: string | null;
};

interface Props {
  item: OverzichtKaartItem;
  isOwn: boolean;
  hasVoted: boolean;
  reactieCount: number;
  onVote: (id: string) => void;
  onClick: () => void;
}

function formatDatum(iso: string, withYear = false) {
  return new Date(iso).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
  });
}

function plainText(html: string | null) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export default function FeedbackOverzichtKaart({
  item,
  isOwn,
  hasVoted,
  reactieCount,
  onVote,
  onClick,
}: Props) {
  const Icon =
    item.categorie === "bug"
      ? Bug
      : item.type === "functieverzoek"
      ? Lightbulb
      : MessageSquareText;

  const statusLabel =
    STATUS_OPTIONS.find((s) => s.value === item.status)?.label ?? item.status;
  const statusKleur = STATUS_KLEUR[item.status as FeedbackStatus] ?? "";
  const categorieLabel = item.categorie ? CATEGORIE_LABEL[item.categorie] ?? item.categorie : null;

  const samenvatting = item.ai_samenvatting?.split("\n")[0] || plainText(item.beschrijving);
  const tags = item.ai_tags ?? [];
  const zichtbareTags = tags.slice(0, 3);
  const restTags = Math.max(0, tags.length - zichtbareTags.length);
  const aantalBijlagen = Array.isArray(item.bijlagen) ? item.bijlagen.length : 0;
  const toonRelease =
    (item.status === "gepland" || item.status === "in_behandeling" || item.status === "in_review") &&
    (item.verwerkt_in_versie || item.verwacht_klaar_op);
  const toonAfgerondVersie = item.status === "afgerond" && item.verwerkt_in_versie;
  const moetBevestigen =
    isOwn && item.status === "afgerond" && !item.bevestiging_status;

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-xl border bg-card p-4 transition hover:border-primary/30 hover:shadow-md"
    >
      <div className="flex gap-3">
        {/* Stem-kolom */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!isOwn && !hasVoted) onVote(item.id);
          }}
          disabled={isOwn || hasVoted}
          aria-label={hasVoted ? "Je hebt al gestemd" : "Stem op dit verzoek"}
          className={`flex h-12 w-10 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border transition ${
            hasVoted
              ? "border-primary/30 bg-primary/10 text-primary"
              : isOwn
              ? "border-dashed text-muted-foreground/50"
              : "border-border text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
          }`}
        >
          <ArrowUp className="h-3.5 w-3.5" strokeWidth={2.5} />
          <span className="text-xs font-semibold leading-none">{item.stemmen ?? 0}</span>
        </button>

        <div className="flex-1 min-w-0">
          {/* Header: icon + categorie + status pill rechts */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {categorieLabel && <span className="font-medium">{categorieLabel}</span>}
              {isOwn && (
                <>
                  <span aria-hidden>·</span>
                  <span className="text-primary/80">Door jou</span>
                </>
              )}
            </div>
            <Badge
              variant="outline"
              className={`shrink-0 border-transparent text-[10px] font-medium ${statusKleur}`}
            >
              {statusLabel}
            </Badge>
          </div>

          {/* Titel */}
          <h3 className="mt-1 truncate text-sm font-semibold text-foreground">
            {item.titel}
          </h3>

          {/* Samenvatting */}
          {samenvatting && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {samenvatting}
            </p>
          )}

          {/* Tags */}
          {zichtbareTags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {zichtbareTags.map((tag, i) => (
                <span
                  key={i}
                  className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
              {restTags > 0 && (
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  +{restTags}
                </span>
              )}
            </div>
          )}

          {/* Meta-strook */}
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDatum(item.created_at)}
            </span>

            {toonRelease && (
              <span className="inline-flex items-center gap-1">
                <Rocket className="h-3 w-3" />
                {item.verwerkt_in_versie
                  ? `v${item.verwerkt_in_versie}`
                  : `verwacht ${formatDatum(item.verwacht_klaar_op!)}`}
              </span>
            )}

            {toonAfgerondVersie && (
              <span className="inline-flex items-center gap-1 text-emerald-700">
                <Rocket className="h-3 w-3" />
                v{item.verwerkt_in_versie}
              </span>
            )}

            {reactieCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                {reactieCount}
              </span>
            )}

            {aantalBijlagen > 0 && (
              <span className="inline-flex items-center gap-1">
                <Paperclip className="h-3 w-3" />
                {aantalBijlagen}
              </span>
            )}

            {typeof item.csat_score === "number" && item.csat_score > 0 && (
              <span className="inline-flex items-center gap-0.5 font-medium text-amber-600">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {item.csat_score}/5
              </span>
            )}
          </div>

          {/* Bevestiging-CTA */}
          {moetBevestigen && (
            <div className="mt-3 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-800">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>Bevestig of het probleem voor jou is opgelost</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}