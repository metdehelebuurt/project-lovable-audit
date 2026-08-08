import { useEffect } from "react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/components/Logo";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation } from "react-router-dom";
import { useModuleNotificatieCounts, entityTypeForUrl } from "@/hooks/useModuleNotificatieCounts";
import { getNavigation, type NavigatieGroep, type NavigatieItem } from "@/lib/navigation/navigationModel";
import { ModuleNotificatiePopover } from "@/components/notificaties/ModuleNotificatiePopover";

/**
 * Sidebar v2.1 — alle rol-relevante groepen plat zichtbaar, sidebar scrollt.
 * Geen verborgen "Meer"-uitklap meer; iedere module is met één klik bereikbaar.
 */

function NavItem({
  item, collapsed, isMobile, badgeCount, entityType, onActivate,
}: {
  item: NavigatieItem; collapsed: boolean; isMobile: boolean;
  badgeCount?: number; entityType?: string | null; onActivate?: (url: string) => void;
}) {
  const Icon = item.icon;
  const showBadge = !!badgeCount && badgeCount > 0;
  const expanded = !collapsed || isMobile;

  // De NavLink en de badge-button leven naast elkaar binnen een relatieve container,
  // zodat we geen interactieve elementen nesten (a > button is verboden in HTML).
  const navLink = (
    <NavLink
      to={item.url}
      end={item.url === "/dashboard"}
      data-tour={`nav:${item.url}`}
      className="relative flex items-center gap-3 px-3 py-2 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent transition-colors min-h-[40px] w-full pr-9"
      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
      onClick={() => onActivate?.(item.url)}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {expanded && <span className="text-sm flex-1 truncate">{item.label}</span>}
      {!expanded && showBadge && (
        <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
      )}
    </NavLink>
  );

  const badgeButton = showBadge && expanded ? (
    entityType ? (
      <ModuleNotificatiePopover
        entityType={entityType}
        moduleLabel={item.label}
        moduleUrl={item.url}
        side="right"
        align="start"
      >
        <button
          type="button"
          aria-label={`${badgeCount} ongelezen — bekijk meldingen`}
          className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold hover:scale-110 active:scale-95 transition-transform"
          onClick={(e) => e.stopPropagation()}
        >
          {badgeCount! > 9 ? "9+" : badgeCount}
        </button>
      </ModuleNotificatiePopover>
    ) : (
      <span
        aria-label={`${badgeCount} ongelezen`}
        className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold pointer-events-none"
      >
        {badgeCount! > 9 ? "9+" : badgeCount}
      </span>
    )
  ) : null;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <div className="relative w-full p-0">
          {navLink}
          {badgeButton}
        </div>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function NavGroep({
  groep, collapsed, isMobile, counts, onActivate,
}: {
  groep: NavigatieGroep; collapsed: boolean; isMobile: boolean;
  counts: Record<string, number>; onActivate: (url: string) => void;
}) {
  if (groep.items.length === 0) return null;
  return (
    <SidebarGroup>
      {(!collapsed || isMobile) && groep.label && (
        <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-semibold px-3 mb-0.5">
          {groep.label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu>
          {groep.items.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              collapsed={collapsed}
              isMobile={isMobile}
              badgeCount={counts[item.badgeEntiteit ?? entityTypeForUrl(item.url) ?? ""] ?? 0}
              entityType={item.badgeEntiteit ?? entityTypeForUrl(item.url) ?? null}
              onActivate={onActivate}
            />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const { profile } = useAuth();
  const { state, setOpenMobile, openMobile } = useSidebar();
  const isMobile = useIsMobile();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { data: counts = {} } = useModuleNotificatieCounts();

  const groepen = getNavigation(profile?.rol, profile?.extra_rollen ?? []).filter((g) => g.items.length > 0);

  // Notificaties worden niet langer automatisch op gelezen gezet bij navigatie:
  // dat gebeurt nu via de popover op de badge of bij het openen van het detail.
  const handleActivate = (_url: string) => {};

  // Auto-close sidebar op mobiel bij navigatie
  useEffect(() => {
    if (isMobile && openMobile) setOpenMobile(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <Sidebar
      collapsible={isMobile ? "offcanvas" : "icon"}
      className="border-r border-sidebar-border"
    >
      <div className="flex items-center h-[72px] px-4 border-b border-sidebar-border">
        <Logo showText={!collapsed || isMobile} />
      </div>
      <SidebarContent>
        {groepen.map((groep, gi) => (
          <div key={groep.id}>
            {gi > 0 && <Separator className="mx-3 my-1" />}
            <NavGroep
              groep={groep}
              collapsed={collapsed}
              isMobile={isMobile}
              counts={counts}
              onActivate={handleActivate}
            />
          </div>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}