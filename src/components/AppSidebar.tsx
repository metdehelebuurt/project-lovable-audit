import { useEffect, useState } from "react";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/components/Logo";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation } from "react-router-dom";
import { useModuleNotificatieCounts, entityTypeForUrl, markeerModuleGelezen } from "@/hooks/useModuleNotificatieCounts";
import { getNavigation, type NavigatieGroep, type NavigatieItem } from "@/lib/navigation/navigationModel";

/**
 * Sidebar v2 — rol-gestuurd navigatiemodel met drie vaste hoofdgroepen
 * (Werk / Klant & Verkoop / Uitvoering) en een uitklapbaar "Meer"-blok.
 */

function NavItem({
  item, collapsed, isMobile, badgeCount, onActivate,
}: {
  item: NavigatieItem; collapsed: boolean; isMobile: boolean;
  badgeCount?: number; onActivate?: (url: string) => void;
}) {
  const Icon = item.icon;
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <NavLink
          to={item.url}
          end={item.url === "/dashboard"}
          className="relative flex items-center gap-3 px-3 py-2 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent transition-colors min-h-[40px]"
          activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
          onClick={() => onActivate?.(item.url)}
        >
          <Icon className="h-4.5 w-4.5 shrink-0" />
          {(!collapsed || isMobile) && <span className="text-sm flex-1 truncate">{item.label}</span>}
          {(!collapsed || isMobile) && !!badgeCount && badgeCount > 0 && (
            <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
              {badgeCount > 9 ? "9+" : badgeCount}
            </span>
          )}
          {collapsed && !isMobile && !!badgeCount && badgeCount > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
          )}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function HoofdGroep({
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
              onActivate={onActivate}
            />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function MeerGroep({
  groep, collapsed, isMobile, counts, onActivate, pathname,
}: {
  groep: NavigatieGroep; collapsed: boolean; isMobile: boolean;
  counts: Record<string, number>; onActivate: (url: string) => void; pathname: string;
}) {
  // Open standaard wanneer een item binnen "Meer" actief is
  const subItems = (groep.subgroepen ?? []).flatMap((sg) => sg.items);
  const heeftActief = subItems.some((it) => pathname === it.url || pathname.startsWith(it.url.split("?")[0] + "/"));
  const [open, setOpen] = useState(heeftActief);

  // Wanneer collapsed: toon items als gewone navigatie zonder kop, anders is alles onbereikbaar in icon-mode.
  if (collapsed && !isMobile) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {subItems.map((item) => (
              <NavItem
                key={item.id}
                item={item}
                collapsed={collapsed}
                isMobile={isMobile}
                badgeCount={counts[item.badgeEntiteit ?? entityTypeForUrl(item.url) ?? ""] ?? 0}
                onActivate={onActivate}
              />
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (subItems.length === 0) return null;

  return (
    <SidebarGroup>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent transition-colors min-h-[40px]"
          >
            <MoreHorizontal className="h-4.5 w-4.5 shrink-0" />
            <span className="text-sm flex-1 text-left">{groep.label}</span>
            <ChevronRight className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-90" : ""}`} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="pl-2 space-y-2 mt-1">
            {(groep.subgroepen ?? []).map((sg, sgi) => {
              if (sg.items.length === 0) return null;
              return (
                <div key={`${sg.label}-${sgi}`}>
                  {sg.label && (
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold px-3 mb-0.5 mt-2">
                      {sg.label}
                    </p>
                  )}
                  <SidebarMenu>
                    {sg.items.map((item) => (
                      <NavItem
                        key={item.id}
                        item={item}
                        collapsed={false}
                        isMobile={isMobile}
                        badgeCount={counts[item.badgeEntiteit ?? entityTypeForUrl(item.url) ?? ""] ?? 0}
                        onActivate={onActivate}
                      />
                    ))}
                  </SidebarMenu>
                </div>
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const { profile, user } = useAuth();
  const { state, setOpenMobile, openMobile } = useSidebar();
  const isMobile = useIsMobile();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { data: counts = {} } = useModuleNotificatieCounts();

  const groepen = getNavigation(profile?.rol);
  const hoofdGroepen = groepen.filter((g) => g.id !== "meer");
  const meerGroep = groepen.find((g) => g.id === "meer");

  const handleActivate = (url: string) => {
    if (!user) return;
    const et = entityTypeForUrl(url);
    if (et) void markeerModuleGelezen(user.id, et);
  };

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
        {hoofdGroepen.map((groep, gi) => (
          <div key={groep.id}>
            {gi > 0 && <Separator className="mx-3 my-1" />}
            <HoofdGroep
              groep={groep}
              collapsed={collapsed}
              isMobile={isMobile}
              counts={counts}
              onActivate={handleActivate}
            />
          </div>
        ))}
        {meerGroep && (
          <>
            <Separator className="mx-3 my-1" />
            <MeerGroep
              groep={meerGroep}
              collapsed={collapsed}
              isMobile={isMobile}
              counts={counts}
              onActivate={handleActivate}
              pathname={location.pathname}
            />
          </>
        )}
      </SidebarContent>
    </Sidebar>
  );
}