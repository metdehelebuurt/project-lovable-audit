import { forwardRef, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { appById } from "@/lib/dashboard/apps";
import { tegelStyle } from "@/lib/dashboard/appColors";
import type { LayoutItem } from "./layoutHelpers";

interface FolderTileProps {
  folder: Extract<LayoutItem, { type: "folder" }>;
  editMode?: boolean;
  onClick?: () => void;
  dragHandleProps?: Record<string, unknown>;
  style?: CSSProperties;
  isDragging?: boolean;
  isOverlay?: boolean;
}

export const FolderTile = forwardRef<HTMLDivElement, FolderTileProps>(function FolderTile(
  { folder, editMode, onClick, dragHandleProps, style, isDragging, isOverlay },
  ref,
) {
  const previewApps = folder.apps.slice(0, 4).map((id) => appById(id)).filter(Boolean);

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
          "relative aspect-square w-full max-w-[112px] rounded-3xl overflow-hidden cursor-pointer",
          "bg-foreground/10 backdrop-blur-md border border-foreground/10",
          "transition-all duration-300 hover:scale-105 active:scale-95",
          "shadow-[0_8px_24px_-8px_hsla(220,12%,10%,0.25)]",
          editMode && "animate-[wiggle_0.6s_ease-in-out_infinite]",
          isOverlay && "scale-110 rotate-3",
        )}
        onClick={editMode ? undefined : onClick}
        role="button"
        tabIndex={0}
        aria-label={`Map ${folder.naam} openen, bevat ${folder.apps.length} apps`}
        onKeyDown={(e) => {
          if (!editMode && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            onClick?.();
          }
        }}
      >
        <div className="absolute inset-2 grid grid-cols-2 grid-rows-2 gap-1.5">
          {previewApps.map((app, idx) => {
            if (!app) return null;
            const Icon = app.icon;
            return (
              <div
                key={`${app.id}-${idx}`}
                className="rounded-lg flex items-center justify-center overflow-hidden"
                style={tegelStyle(app.kleur)}
              >
                <Icon className="h-4 w-4 text-white" strokeWidth={2.4} />
              </div>
            );
          })}
          {Array.from({ length: Math.max(0, 4 - previewApps.length) }).map((_, idx) => (
            <div key={`empty-${idx}`} className="rounded-lg bg-foreground/5" />
          ))}
        </div>
      </div>

      <span className="text-xs font-medium text-foreground text-center line-clamp-2 max-w-[112px] leading-tight">
        {folder.naam}
      </span>
    </div>
  );
});
