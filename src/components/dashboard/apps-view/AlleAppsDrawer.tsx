import { useState, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, EyeOff, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { AppDefinition } from "@/lib/dashboard/apps";
import { tegelStyle } from "@/lib/dashboard/appColors";

interface AlleAppsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apps: AppDefinition[];
  verborgenIds: string[];
  onShow: (appId: string) => void;
  onHide: (appId: string) => void;
}

export function AlleAppsDrawer({ open, onOpenChange, apps, verborgenIds, onShow, onHide }: AlleAppsDrawerProps) {
  const navigate = useNavigate();
  const [zoek, setZoek] = useState("");

  const filtered = useMemo(() => {
    const q = zoek.trim().toLowerCase();
    if (!q) return apps;
    return apps.filter((a) =>
      a.label.toLowerCase().includes(q) ||
      a.synoniemen?.some((s) => s.toLowerCase().includes(q)),
    );
  }, [apps, zoek]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Alle apps</SheetTitle>
        </SheetHeader>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Zoek een app..."
            value={zoek}
            onChange={(e) => setZoek(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="mt-4 space-y-1">
          {filtered.map((app) => {
            const isVerborgen = verborgenIds.includes(app.id);
            const Icon = app.icon;
            return (
              <div
                key={app.id}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-accent transition-colors"
              >
                <button
                  type="button"
                  onClick={() => { navigate(app.url); onOpenChange(false); }}
                  className="flex-1 flex items-center gap-3 text-left"
                >
                  <div
                    className="h-9 w-9 rounded-lg flex items-center justify-center"
                    style={tegelStyle(app.kleur)}
                  >
                    <Icon className="h-4.5 w-4.5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{app.label}</p>
                    <p className="text-xs text-muted-foreground truncate capitalize">{app.categorie}</p>
                  </div>
                </button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => isVerborgen ? onShow(app.id) : onHide(app.id)}
                  aria-label={isVerborgen ? `${app.label} weer tonen` : `${app.label} verbergen`}
                  title={isVerborgen ? "Toevoegen aan dashboard" : "Verbergen"}
                >
                  {isVerborgen ? <Plus className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Geen apps gevonden.</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
