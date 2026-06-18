import { NavLink } from "react-router-dom";
import { LayoutDashboard, Kanban, PhoneCall, Users, AlertCircle, Link2, FileText, Calendar, BarChart3, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/affiliates", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/affiliates/pipeline", label: "Pipeline", icon: Kanban },
  { to: "/affiliates/bellen", label: "Bellen", icon: PhoneCall },
  { to: "/affiliates/agenda", label: "Agenda", icon: Calendar },
  { to: "/affiliates/opvolging", label: "Opvolging", icon: Sparkles },
  { to: "/affiliates/pool", label: "Koude leads", icon: Users },
  { to: "/affiliates/klanten", label: "Mijn klanten", icon: Users },
  { to: "/affiliates/trials", label: "Trials", icon: AlertCircle },
  { to: "/affiliates/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/affiliates/links", label: "Links & codes", icon: Link2 },
  { to: "/offertes", label: "Offertes", icon: FileText },
];

export function AffiliateSubnav() {
  return (
    <nav className="flex flex-wrap gap-2 border-b border-border pb-2 mb-6">
      {items.map((i) => (
        <NavLink
          key={i.to}
          to={i.to}
          end={i.end}
          className={({ isActive }) =>
            cn(
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
            )
          }
        >
          <i.icon className="h-4 w-4" />
          {i.label}
        </NavLink>
      ))}
    </nav>
  );
}