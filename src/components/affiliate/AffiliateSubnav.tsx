import { NavLink } from "react-router-dom";
import { LayoutDashboard, Kanban, PhoneCall, Users, AlertCircle, Link2, FileText, Calendar, BarChart3, Sparkles, AlertTriangle, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsLostReviewAdmin } from "@/hooks/affiliate/useIsLostReviewAdmin";

const baseItems = [
  { to: "/affiliates", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/affiliates/pipeline", label: "Pipeline", icon: Kanban },
  { to: "/affiliates/bellen", label: "Bellen", icon: PhoneCall },
  { to: "/affiliates/agenda", label: "Agenda", icon: Calendar },
  { to: "/affiliates/opvolging", label: "Opvolging", icon: Sparkles },
  { to: "/affiliates/pool", label: "Leads", icon: Users },
  { to: "/affiliates/klanten", label: "Mijn klanten", icon: Users },
  { to: "/affiliates/trials", label: "Trials", icon: AlertCircle },
  { to: "/affiliates/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/affiliates/links", label: "Links & codes", icon: Link2 },
  { to: "/affiliates/offertes", label: "Offertes", icon: FileText },
  { to: "/affiliates/instellingen", label: "Instellingen", icon: Settings },
];

/** Legacy in-page subnav — nu geïntegreerd in de top header op affiliate routes. */
export function AffiliateSubnav() {
  return null;
}

/** Top-bar navigatie voor affiliate module, rendered binnen de paarse AppHeader. */
export function AffiliateTopnav() {
  const magReview = useIsLostReviewAdmin();
  const items = magReview
    ? [...baseItems, { to: "/affiliates/verloren-review", label: "Verloren review", icon: AlertTriangle }]
    : baseItems;
  return (
    <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1 min-w-0">
      {items.map((i) => (
        <NavLink
          key={i.to}
          to={i.to}
          end={i.end}
          className={({ isActive }) =>
            cn(
              "inline-flex shrink-0 items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              isActive
                ? "bg-primary-foreground text-primary"
                : "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground",
            )
          }
        >
          <i.icon className="h-4 w-4" />
          <span className="whitespace-nowrap">{i.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}