import { useNavigate, useLocation } from "react-router-dom";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getNavigation, type NavigatieItem } from "@/lib/navigation/navigationModel";
import { useModuleNotificatieCounts, entityTypeForUrl } from "@/hooks/useModuleNotificatieCounts";
import type { AppRole } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { MobileQuickCreateSheet } from "./MobileQuickCreateSheet";
import { useState } from "react";

/**
 * Mobiele bottom-navigatie: 4 rol-specifieke kerntabs + centrale FAB voor "Nieuw".
 * Verschijnt alleen op mobiele viewports (md:hidden).
 */

const TOP_ITEMS_PER_ROL: Record<AppRole, string[]> = {
  superadmin: ["vandaag", "leads", "offertes", "planning"],
  partner_admin: ["vandaag", "leads", "offertes", "planning"],
  backoffice: ["vandaag", "leads", "offertes", "planning"],
  partner_staff: ["vandaag", "leads", "offertes", "planning"],
  adviseur: ["vandaag", "leads", "schouwen", "planning"],
  installateur: ["vandaag", "installaties", "planning", "voorraad"],
  consument: ["mijn-woning", "offertes", "schouwen", "planning"],
  affiliate: ["vandaag", "affiliate-links", "offertes", "feedback"],
  sales_manager: ["vandaag", "affiliate-pipeline", "affiliate-pool", "affiliate-analytics"],
};

function selecteerTopItems(
  rol: AppRole | undefined | null,
  extraRollen: AppRole[] = [],
): NavigatieItem[] {
  const ids = TOP_ITEMS_PER_ROL[(rol as AppRole) ?? "consument"] ?? [];
  const groepen = getNavigation(rol, extraRollen);
  const alleItems: NavigatieItem[] = groepen.flatMap((g) => g.items);
  const out: NavigatieItem[] = [];
  for (const id of ids) {
    const m = alleItems.find((i) => i.id === id);
    if (m) out.push(m);
  }
  return out.slice(0, 4);
}

export function MobileBottomNav() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: counts = {} } = useModuleNotificatieCounts();
  const [quickOpen, setQuickOpen] = useState(false);

  const items = selecteerTopItems(profile?.rol, profile?.extra_rollen ?? []);
  if (items.length === 0) return null;

  const isActief = (url: string) => {
    const pad = url.split("?")[0];
    return location.pathname === pad || location.pathname.startsWith(pad + "/");
  };

  // 4 items + centrale FAB (positie 3 van de 5)
  const links = items.slice(0, 2);
  const rechts = items.slice(2, 4);

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border pb-[env(safe-area-inset-bottom)]"
        aria-label="Hoofdnavigatie mobiel"
      >
        <div className="grid grid-cols-5 h-16">
          {links.map((it) => (
            <BottomTab
              key={it.id} item={it}
              actief={isActief(it.url)}
              badge={counts[it.badgeEntiteit ?? entityTypeForUrl(it.url) ?? ""] ?? 0}
              onClick={() => navigate(it.url)}
            />
          ))}
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => setQuickOpen(true)}
              className="h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center -mt-4 active:scale-95 transition-transform"
              aria-label="Snel iets aanmaken"
            >
              <Plus className="h-6 w-6" />
            </button>
          </div>
          {rechts.map((it) => (
            <BottomTab
              key={it.id} item={it}
              actief={isActief(it.url)}
              badge={counts[it.badgeEntiteit ?? entityTypeForUrl(it.url) ?? ""] ?? 0}
              onClick={() => navigate(it.url)}
            />
          ))}
        </div>
      </nav>
      <MobileQuickCreateSheet open={quickOpen} onOpenChange={setQuickOpen} />
    </>
  );
}

function BottomTab({
  item, actief, badge, onClick,
}: {
  item: NavigatieItem; actief: boolean; badge: number; onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium",
        actief ? "text-primary" : "text-muted-foreground",
      )}
      aria-label={item.label}
      aria-current={actief ? "page" : undefined}
    >
      <Icon className="h-5 w-5" />
      <span className="truncate max-w-[60px]">{item.label}</span>
      {badge > 0 && (
        <span className="absolute top-1 right-[18%] inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </button>
  );
}