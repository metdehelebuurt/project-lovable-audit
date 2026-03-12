import {
  LayoutDashboard, Building2, Users, Package, ClipboardList,
  FileText, Wrench, Calendar, BarChart3, Settings, UserCheck,
  MessageSquare, Home, FolderOpen, Battery, PenTool
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/components/Logo";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
}

const getNavItems = (rol: string): NavItem[] => {
  const common: NavItem[] = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  ];

  switch (rol) {
    case "superadmin":
      return [
        ...common,
        { title: "Partners", url: "/partners", icon: Building2 },
        { title: "Adviseurs", url: "/adviseurs", icon: UserCheck },
        { title: "Gebruikers", url: "/gebruikers", icon: Users },
        { title: "Producten", url: "/producten", icon: Package },
        { title: "Schouwen", url: "/schouwen", icon: ClipboardList },
        { title: "Offertes", url: "/offertes", icon: FileText },
        { title: "Documenten", url: "/documenten", icon: FolderOpen },
        { title: "Tools", url: "/tools", icon: PenTool },
        { title: "Instellingen", url: "/instellingen", icon: Settings },
      ];
    case "partner_admin":
      return [
        ...common,
        { title: "Adviseurs", url: "/adviseurs", icon: UserCheck },
        { title: "Gebruikers", url: "/gebruikers", icon: Users },
        { title: "Producten", url: "/producten", icon: Package },
        { title: "Schouwen", url: "/schouwen", icon: ClipboardList },
        { title: "Offertes", url: "/offertes", icon: FileText },
        { title: "Leads", url: "/leads", icon: Users },
        { title: "Installaties", url: "/installaties", icon: Wrench },
        { title: "Planning", url: "/planning", icon: Calendar },
        { title: "Analytics", url: "/analytics", icon: BarChart3 },
        { title: "Documenten", url: "/documenten", icon: FolderOpen },
        { title: "Tools", url: "/tools", icon: PenTool },
        { title: "Instellingen", url: "/instellingen", icon: Settings },
      ];
    case "partner_staff":
      return [
        ...common,
        { title: "Adviseurs", url: "/adviseurs", icon: UserCheck },
        { title: "Producten", url: "/producten", icon: Package },
        { title: "Schouwen", url: "/schouwen", icon: ClipboardList },
        { title: "Offertes", url: "/offertes", icon: FileText },
        { title: "Leads", url: "/leads", icon: Users },
        { title: "Installaties", url: "/installaties", icon: Wrench },
        { title: "Planning", url: "/planning", icon: Calendar },
        { title: "Analytics", url: "/analytics", icon: BarChart3 },
        { title: "Documenten", url: "/documenten", icon: FolderOpen },
        { title: "Instellingen", url: "/instellingen", icon: Settings },
      ];
    case "adviseur":
      return [
        ...common,
        { title: "Producten", url: "/producten", icon: Package },
        { title: "Mijn Leads", url: "/leads", icon: Users },
        { title: "Schouwen", url: "/schouwen", icon: ClipboardList },
        { title: "Offertes", url: "/offertes", icon: FileText },
        { title: "Tools", url: "/tools", icon: PenTool },
        { title: "Agenda", url: "/planning", icon: Calendar },
      ];
    case "installateur":
      return [
        ...common,
        { title: "Producten", url: "/producten", icon: Package },
        { title: "Mijn Opdrachten", url: "/installaties", icon: Wrench },
        { title: "Planning", url: "/planning", icon: Calendar },
      ];
    case "consument":
      return [
        ...common,
        { title: "Mijn Offertes", url: "/offertes", icon: FileText },
        { title: "Mijn Schouwen", url: "/schouwen", icon: ClipboardList },
        { title: "Afspraken", url: "/planning", icon: Calendar },
        { title: "Berichten", url: "/berichten", icon: MessageSquare },
      ];
    default:
      return common;
  }
};

export function AppSidebar() {
  const { profile } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const items = getNavItems(profile?.rol ?? "consument");

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <div className="flex items-center h-[72px] px-4 border-b border-sidebar-border">
        <Logo showText={!collapsed} />
      </div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
