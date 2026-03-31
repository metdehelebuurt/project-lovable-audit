import {
  LayoutDashboard, Building2, Users, Package, ClipboardList,
  FileText, Wrench, Calendar, BarChart3, Settings, UserCheck,
  MessageSquare, FolderOpen, PenTool, Link2, Handshake, ClipboardCheck, UserCheck2,
  MessageCircleWarning, MessageSquareHeart, Lightbulb, CreditCard
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/components/Logo";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const getNavGroups = (rol: string): NavGroup[] => {
  const groups: NavGroup[] = [];

  // OVERZICHT — always
  groups.push({ label: "Overzicht", items: [{ title: "Dashboard", url: "/dashboard", icon: LayoutDashboard }] });

  // RELATIEBEHEER
  const relatie: NavItem[] = [];
  if (["superadmin", "partner_admin", "partner_staff", "adviseur"].includes(rol))
    relatie.push({ title: rol === "adviseur" ? "Mijn Leads" : "Leads", url: "/leads", icon: Users });
  if (["superadmin", "partner_admin", "partner_staff", "adviseur"].includes(rol))
    relatie.push({ title: "Klanten", url: "/klanten", icon: UserCheck2 });
  if (["superadmin", "partner_admin", "partner_staff", "adviseur", "consument"].includes(rol))
    relatie.push({ title: "Berichten", url: "/berichten", icon: MessageSquare });
  if (relatie.length) groups.push({ label: "Relatiebeheer", items: relatie });

  // WERKPROCES
  const werk: NavItem[] = [];
  if (["superadmin", "partner_admin", "partner_staff", "adviseur", "consument"].includes(rol))
    werk.push({ title: rol === "consument" ? "Mijn Schouwen" : "Schouwen", url: "/schouwen", icon: ClipboardList });
  if (["superadmin", "partner_admin", "partner_staff", "adviseur", "consument", "affiliate"].includes(rol))
    werk.push({ title: rol === "consument" ? "Mijn Offertes" : "Offertes", url: "/offertes", icon: FileText });
  if (["superadmin", "partner_admin", "partner_staff"].includes(rol))
    werk.push({ title: "Offerte Feedback", url: "/offertes/feedback", icon: MessageCircleWarning });
  if (["superadmin", "partner_admin", "partner_staff", "adviseur", "installateur"].includes(rol))
    werk.push({ title: "Opdrachten", url: "/opdrachten", icon: ClipboardCheck });
  if (["partner_admin", "partner_staff", "installateur"].includes(rol))
    werk.push({ title: rol === "installateur" ? "Mijn Opdrachten" : "Installaties", url: "/installaties", icon: Wrench });
  if (werk.length) groups.push({ label: "Werkproces", items: werk });

  // PLANNING & TOOLS
  const planning: NavItem[] = [];
  if (["partner_admin", "partner_staff", "adviseur", "installateur", "consument"].includes(rol))
    planning.push({ title: rol === "adviseur" ? "Agenda" : rol === "consument" ? "Afspraken" : "Planning", url: "/planning", icon: Calendar });
  if (["superadmin", "partner_admin", "partner_staff", "adviseur", "installateur"].includes(rol))
    planning.push({ title: "Producten", url: "/producten", icon: Package });
  if (["superadmin", "partner_admin", "adviseur"].includes(rol))
    planning.push({ title: "Tools", url: "/tools", icon: PenTool });
  if (["partner_admin", "partner_staff"].includes(rol))
    planning.push({ title: "Analytics", url: "/analytics", icon: BarChart3 });
  if (planning.length) groups.push({ label: "Planning & Tools", items: planning });

  // BEHEER
  const beheer: NavItem[] = [];
  if (rol === "superadmin")
    beheer.push({ title: "Partners", url: "/partners", icon: Building2 });
  if (["superadmin", "partner_admin", "partner_staff"].includes(rol))
    beheer.push({ title: "Adviseurs", url: "/adviseurs", icon: UserCheck });
  if (["superadmin", "partner_admin"].includes(rol))
    beheer.push({ title: "Gebruikers", url: "/gebruikers", icon: Users });
  if (["superadmin", "partner_admin", "partner_staff"].includes(rol))
    beheer.push({ title: "Documenten", url: "/documenten", icon: FolderOpen });
  if (rol === "superadmin")
    beheer.push({ title: "Affiliate Beheer", url: "/affiliate-beheer", icon: Handshake });
  if (rol === "affiliate")
    beheer.push({ title: "Affiliate Links", url: "/affiliates", icon: Link2 });
  if (beheer.length) groups.push({ label: "Beheer", items: beheer });

  // FEEDBACK & SUPPORT
  const support: NavItem[] = [];
  support.push({ title: "Feedback", url: "/feedback", icon: MessageSquareHeart });
  support.push({ title: "Functieverzoek", url: "/feedback/nieuw?type=functieverzoek", icon: Lightbulb });
  if (rol === "superadmin")
    support.push({ title: "Feedback Beheer", url: "/feedback/admin", icon: MessageSquareHeart });
  groups.push({ label: "Support", items: support });

  // INSTELLINGEN
  if (["superadmin", "partner_admin", "partner_staff", "affiliate"].includes(rol))
    groups.push({ label: "Instellingen", items: [{ title: "Instellingen", url: "/instellingen", icon: Settings }] });

  return groups;
};

export function AppSidebar() {
  const { profile } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const groups = getNavGroups(profile?.rol ?? "consument");

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <div className="flex items-center h-[72px] px-4 border-b border-sidebar-border">
        <Logo showText={!collapsed} />
      </div>
      <SidebarContent>
        {groups.map((group, gi) => (
          <div key={group.label}>
            {gi > 0 && <Separator className="mx-3 my-1" />}
            <SidebarGroup>
              {!collapsed && (
                <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-semibold px-3 mb-0.5">
                  {group.label}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end={item.url === "/dashboard"}
                          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                          activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                        >
                          <item.icon className="h-4.5 w-4.5 shrink-0" />
                          {!collapsed && <span className="text-sm">{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
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
