import { LayoutDashboard, Grid3x3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardView } from "./apps-view/useDashboardView";

interface DashboardViewSwitcherProps {
  view: DashboardView;
  onChange: (next: DashboardView) => void;
}

export function DashboardViewSwitcher({ view, onChange }: DashboardViewSwitcherProps) {
  return (
    <div
      role="tablist"
      aria-label="Dashboardweergave kiezen"
      className="inline-flex items-center gap-1 rounded-full bg-muted/60 p-1 backdrop-blur-sm"
    >
      <button
        type="button"
        role="tab"
        aria-selected={view === "klassiek"}
        onClick={() => onChange("klassiek")}
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-300",
          view === "klassiek"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <LayoutDashboard className="h-3.5 w-3.5" />
        Klassiek
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={view === "apps"}
        onClick={() => onChange("apps")}
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-300",
          view === "apps"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Grid3x3 className="h-3.5 w-3.5" />
        App-view
      </button>
    </div>
  );
}
