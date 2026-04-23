import { forwardRef, type CSSProperties } from "react";
import { Star, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppDefinition } from "@/lib/dashboard/apps";
import { tegelStyle, glowStyle } from "@/lib/dashboard/appColors";

interface AppTileProps {
  app: AppDefinition;
  badgeCount?: number;
  isFavoriet?: boolean;
  editMode?: boolean;
  onClick?: () => void;
  onToggleFavoriet?: () => void;
  onHide?: () => void;
  dragHandleProps?: Record<string, unknown>;
  style?: CSSProperties;
  isDragging?: boolean;
  isOverlay?: boolean;
}

export const AppTile = forwardRef<HTMLDivElement, AppTileProps>(function AppTile(
  {
    app, badgeCount = 0, isFavoriet, editMode, onClick, onToggleFavoriet, onHide,
    dragHandleProps, style, isDragging, isOverlay,
  },
  ref,
) {
  const Icon = app.icon;

  return (
    <div
      ref={ref}
      style={style}
      className={cn(
        "group relative flex flex-col items-center gap-2 select-none touch-none",
        isDragging && "opacity-30",
      )}
    >
      <div
        {...dragHandleProps}
        className={cn(
          "relative aspect-square w-full max-w-[112px] rounded-3xl overflow-hidden",
          "transition-all duration-300 cursor-pointer",
          "hover:scale-105 active:scale-95",
          editMode && "animate-[wiggle_0.6s_ease-in-out_infinite]",
          isOverlay && "scale-110 rotate-3",
        )}
        style={{ ...tegelStyle(app.kleur), ...glowStyle(app.kleur, 0.35) }}
        onClick={editMode ? undefined : onClick}
        role="button"
        tabIndex={0}
        aria-label={`${app.label} openen${badgeCount > 0 ? `, ${badgeCount} ongelezen meldingen` : ""}`}
        onKeyDown={(e) => {
          if (!editMode && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            onClick?.();
          }
        }}
      >
        {/* Glanslaag */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-transparent to-black/10 pointer-events-none" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className="h-9 w-9 text-white drop-shadow-lg" strokeWidth={2.2} />
        </div>

        {/* Badge */}
        {badgeCount > 0 && !editMode && (
          <div className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1.5 rounded-full bg-destructive text-destructive-foreground text-[11px] font-bold flex items-center justify-center shadow-lg ring-2 ring-background">
            {badgeCount > 99 ? "99+" : badgeCount}
          </div>
        )}

        {/* Edit-modus knop: verbergen */}
        {editMode && onHide && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onHide(); }}
            className="absolute -top-1 -left-1 h-6 w-6 rounded-full bg-foreground text-background flex items-center justify-center shadow-lg ring-2 ring-background hover:scale-110 transition-transform z-10"
            aria-label={`${app.label} verbergen`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Favoriet-ster (hover, niet in edit-modus) */}
        {!editMode && onToggleFavoriet && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleFavoriet(); }}
            className={cn(
              "absolute top-1.5 right-1.5 h-7 w-7 rounded-full flex items-center justify-center transition-all z-10",
              "bg-white/20 backdrop-blur-sm hover:bg-white/40",
              isFavoriet ? "opacity-100" : "opacity-0 group-hover:opacity-100",
            )}
            aria-label={isFavoriet ? "Verwijder uit favorieten" : "Markeer als favoriet"}
          >
            <Star
              className={cn("h-3.5 w-3.5", isFavoriet ? "fill-amber-300 text-amber-300" : "text-white")}
            />
          </button>
        )}
      </div>

      <span className="text-xs font-medium text-foreground text-center line-clamp-2 max-w-[112px] leading-tight">
        {app.label}
      </span>
    </div>
  );
});
