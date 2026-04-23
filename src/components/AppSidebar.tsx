import {
  LayoutDashboard, Building2, Users, Package, ClipboardList,
  FileText, Wrench, Calendar, BarChart3, Settings, UserCheck,
  MessageSquare, FolderOpen, PenTool, Link2, Handshake, ClipboardCheck, UserCheck2,
  MessageCircleWarning, MessageSquareHeart, Lightbulb, CreditCard, Receipt, Truck,
  ChevronRight, LifeBuoy, BookOpen, ShieldCheck, RotateCcw
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/components/Logo";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { isAdminTier, isPartnerAdminOrHigher } from "@/lib/permissions";
import type { AppRole } from "@/lib/permissions";
import { useModuleNotificatieCounts, entityTypeForUrl, markeerModuleGelezen } from "@/hooks/useModuleNotificatieCounts";

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  children?: NavItem[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const getNavGroups = (rol: string): NavGroup[] => {
  const groups: NavGroup[] = [];

  groups.push({ label: "Overzicht", items: [{ title: "Dashboard", url: "/dashboard", icon: LayoutDashboard }] });

  const relatie: NavItem[] = [];
  if (["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur"].includes(rol))
    relatie.push({ title: rol === "adviseur" ? "Mijn Leads" : "Leads", url: "/leads", icon: Users });
  if (["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur"].includes(rol))
    relatie.push({ title: "Klanten", url: "/klanten", icon: UserCheck2 });
  if (["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur", "consument"].includes(rol))
    relatie.push({ title: "Berichten", url: "/berichten", icon: MessageSquare });
  if (relatie.length) groups.push({ label: "Relatiebeheer", items: relatie });

  const werk: NavItem[] = [];
  if (["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur", "consument"].includes(rol))
    werk.push({ title: rol === "consument" ? "Mijn Schouwen" : "Schouwen", url: "/schouwen", icon: ClipboardList });
  
  // Offertes with sub-items
  if (["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "consument", "affiliate"].includes(rol)) {
    const offerteItem: NavItem = {
      title: rol === "consument" ? "Mijn Offertes" : "Offertes",
      url: "/offertes",
      icon: FileText,
    };
    if (["superadmin", "partner_admin", "backoffice", "partner_staff"].includes(rol)) {
      offerteItem.children = [
        { title: "Alle Offertes", url: "/offertes", icon: FileText },
        { title: "Offerte Feedback", url: "/offertes/feedback", icon: MessageCircleWarning },
      ];
    }
    werk.push(offerteItem);
  }

  if (["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur"].includes(rol))
    werk.push({ title: "Verkooporders", url: "/opdrachten", icon: ClipboardCheck });
  if (["superadmin", "partner_admin", "backoffice", "partner_staff", "installateur"].includes(rol)) {
    werk.push({
      title: rol === "installateur" ? "Mijn werk" : "Installaties",
      url: "/installaties",
      icon: Wrench,
    });
  }
  if (["superadmin", "partner_admin", "backoffice", "partner_staff", "installateur"].includes(rol))
    werk.push({ title: "Opleveringen", url: "/opleveringen", icon: ShieldCheck });
  if (werk.length) groups.push({ label: "Werkproces", items: werk });

  // Helpdesk
  const helpdesk: NavItem[] = [];
  if (["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur"].includes(rol)) {
    helpdesk.push({
      title: "Helpdesk",
      url: "/helpdesk",
      icon: LifeBuoy,
      children: [
        { title: "Dashboard", url: "/helpdesk", icon: LayoutDashboard },
        { title: "Tickets", url: "/helpdesk/tickets", icon: LifeBuoy },
        ...(["superadmin", "partner_admin", "backoffice", "partner_staff"].includes(rol)
          ? [{ title: "Planning", url: "/helpdesk/planning", icon: Calendar }]
          : []),
        { title: "Kennisbank", url: "/helpdesk/kennisbank", icon: BookOpen },
      ],
    });
  }
  if (helpdesk.length) groups.push({ label: "Helpdesk & Service", items: helpdesk });

  // Financieel with sub-items
  const financieel: NavItem[] = [];
  if (["superadmin", "partner_admin", "backoffice"].includes(rol)) {
    financieel.push({
      title: "Financieel",
      url: "/financieel",
      icon: Receipt,
      children: [
        { title: "Dashboard", url: "/financieel?tab=overzicht", icon: LayoutDashboard },
        { title: "Verkoopfacturen", url: "/financieel?tab=verkoop", icon: FileText },
        { title: "Inkoopfacturen", url: "/financieel?tab=inkoop", icon: Receipt },
        { title: "Pakbonnen", url: "/financieel?tab=pakbonnen", icon: ClipboardList },
        { title: "Openstaand", url: "/financieel?tab=openstaand", icon: Clock },
        { title: "BTW", url: "/financieel?tab=btw", icon: BarChart3 },
      ],
    });
  }
  if (["superadmin", "partner_admin", "backoffice"].includes(rol))
    financieel.push({ title: "Leveranciers", url: "/leveranciers", icon: Truck });
  if (financieel.length) groups.push({ label: "Financieel", items: financieel });

  // Logistiek (voorraad, retouren) — apart blok zodat het in plan/matrix beheerd kan worden
  const logistiek: NavItem[] = [];
  if (["superadmin", "partner_admin", "backoffice", "partner_staff", "installateur"].includes(rol))
    logistiek.push({ title: "Voorraad", url: "/voorraad", icon: Package });
  if (["superadmin", "partner_admin", "backoffice", "partner_staff"].includes(rol))
    logistiek.push({ title: "Retouren", url: "/retouren", icon: RotateCcw });
  if (logistiek.length) groups.push({ label: "Logistiek", items: logistiek });

  const planning: NavItem[] = [];
  if (["partner_admin", "backoffice", "partner_staff", "adviseur", "installateur", "consument"].includes(rol))
    planning.push({ title: rol === "adviseur" ? "Agenda" : rol === "consument" ? "Afspraken" : "Planning", url: "/planning", icon: Calendar });
  if (["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur"].includes(rol))
    planning.push({ title: "Producten", url: "/producten", icon: Package });
  if (["superadmin", "partner_admin", "adviseur"].includes(rol))
    planning.push({ title: "Tools", url: "/tools", icon: PenTool });
  if (["partner_admin", "backoffice"].includes(rol))
    planning.push({ title: "Analytics", url: "/analytics", icon: BarChart3 });
  if (planning.length) groups.push({ label: "Planning & Tools", items: planning });

  const beheer: NavItem[] = [];
  if (rol === "superadmin")
    beheer.push({ title: "Partners", url: "/partners", icon: Building2 });
  if (["superadmin", "partner_admin"].includes(rol))
    beheer.push({ title: "Adviseurs", url: "/adviseurs", icon: UserCheck });
  if (["superadmin", "partner_admin"].includes(rol))
    beheer.push({ title: "Gebruikers", url: "/gebruikers", icon: Users });
  if (["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur"].includes(rol))
    beheer.push({ title: "Documenten", url: "/documenten", icon: FolderOpen });
  if (rol === "superadmin")
    beheer.push({ title: "Affiliate Beheer", url: "/affiliate-beheer", icon: Handshake });
  if (rol === "superadmin")
    beheer.push({ title: "Abonnementen", url: "/admin/abonnementen", icon: CreditCard });
  if (rol === "affiliate")
    beheer.push({ title: "Affiliate Links", url: "/affiliates", icon: Link2 });
  if (beheer.length) groups.push({ label: "Beheer", items: beheer });

  const support: NavItem[] = [];
  support.push({ title: "Feedback", url: "/feedback", icon: MessageSquareHeart });
  support.push({ title: "Functieverzoek", url: "/feedback/nieuw?type=functieverzoek", icon: Lightbulb });
  if (rol === "superadmin")
    support.push({ title: "Feedback Beheer", url: "/feedback/admin", icon: MessageSquareHeart });
  groups.push({ label: "Support", items: support });

  if (["superadmin", "partner_admin", "partner_staff", "affiliate"].includes(rol))
    groups.push({ label: "Instellingen", items: [{ title: "Instellingen", url: "/instellingen", icon: Settings }] });

  return groups;
};

// Need Clock icon for "Openstaand"
import { Clock } from "lucide-react";

function SidebarNavItem({ item, collapsed, isMobile, pathname, badgeCount, onActivate }: { item: NavItem; collapsed: boolean; isMobile: boolean; pathname: string; badgeCount?: number; onActivate?: (url: string) => void }) {
  const hasChildren = item.children && item.children.length > 0;
  const isChildActive = hasChildren && item.children!.some(c => {
    const [path, query] = c.url.split("?");
    return pathname === path || pathname.startsWith(path + "/");
  });
  const isActive = pathname === item.url || pathname.startsWith(item.url + "/") || isChildActive;

  if (!hasChildren) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <NavLink
            to={item.url}
            end={item.url === "/dashboard"}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent transition-colors min-h-[44px]"
            activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
            onClick={() => onActivate?.(item.url)}
          >
            <item.icon className="h-4.5 w-4.5 shrink-0" />
            {(!collapsed || isMobile) && <span className="text-sm">{item.title}</span>}
            {(!collapsed || isMobile) && badgeCount && badgeCount > 0 ? (
              <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                {badgeCount > 9 ? "9+" : badgeCount}
              </span>
            ) : null}
            {(collapsed && !isMobile && badgeCount && badgeCount > 0) ? (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
            ) : null}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <Collapsible defaultOpen={isActive} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton className="flex items-center gap-3 px-3 py-2 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent transition-colors min-h-[44px] w-full">
            <item.icon className="h-4.5 w-4.5 shrink-0" />
            {(!collapsed || isMobile) && (
              <>
                <span className="text-sm flex-1 text-left">{item.title}</span>
                {badgeCount && badgeCount > 0 ? (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                    {badgeCount > 9 ? "9+" : badgeCount}
                  </span>
                ) : null}
                <ChevronRight className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </>
            )}
          </SidebarMenuButton>
        </CollapsibleTrigger>
        {(!collapsed || isMobile) && (
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.children!.map(child => (
                <SidebarMenuSubItem key={child.title}>
                  <SidebarMenuSubButton asChild>
                    <NavLink
                      to={child.url}
                      end
                      className="text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
                      activeClassName="text-sidebar-primary font-medium"
                    >
                      <span className="text-sm">{child.title}</span>
                    </NavLink>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        )}
      </SidebarMenuItem>
    </Collapsible>
  );
}

export function AppSidebar() {
  const { profile, user } = useAuth();
  const { state, setOpenMobile, openMobile } = useSidebar();
  const isMobile = useIsMobile();
  const collapsed = state === "collapsed";
  const groups = getNavGroups(profile?.rol ?? "consument");
  const location = useLocation();
  const { data: counts = {} } = useModuleNotificatieCounts();

  const handleActivate = (url: string) => {
    if (!user) return;
    const et = entityTypeForUrl(url);
    if (et) void markeerModuleGelezen(user.id, et);
  };

  // Auto-close sidebar on navigation on mobile
  useEffect(() => {
    if (isMobile && openMobile) {
      setOpenMobile(false);
    }
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
        {groups.map((group, gi) => (
          <div key={group.label}>
            {gi > 0 && <Separator className="mx-3 my-1" />}
            <SidebarGroup>
              {(!collapsed || isMobile) && (
                <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-semibold px-3 mb-0.5">
                  {group.label}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarNavItem
                      key={item.title}
                      item={item}
                      collapsed={collapsed}
                      isMobile={isMobile}
                      pathname={location.pathname}
                      badgeCount={counts[entityTypeForUrl(item.url) ?? ""] ?? 0}
                      onActivate={handleActivate}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </div>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
