import { NavLink } from "react-router-dom";
import { LayoutDashboard, Kanban, PhoneCall, Users, AlertCircle, Link2, FileText, Calendar, BarChart3, Sparkles, AlertTriangle, Settings, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsLostReviewAdmin } from "@/hooks/affiliate/useIsLostReviewAdmin";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const primaryItems = [
  { to: "/affiliates", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/affiliates/pipeline", label: "Pipeline", icon: Kanban },
  { to: "/affiliates/bellen", label: "Bellen", icon: PhoneCall },
  { to: "/affiliates/agenda", label: "Agenda", icon: Calendar },
  { to: "/affiliates/opvolging", label: "Opvolging", icon: Sparkles },
  { to: "/affiliates/pool", label: "Leads", icon: Users },
  { to: "/affiliates/klanten", label: "Mijn klanten", icon: Users },
  { to: "/affiliates/offertes", label: "Offertes", icon: FileText },
];

const secondaryItems = [
  { to: "/affiliates/trials", label: "Trials", icon: AlertCircle },
  { to: "/affiliates/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/affiliates/links", label: "Links & codes", icon: Link2 },
  { to: "/affiliates/instellingen", label: "Instellingen", icon: Settings },
];

/** Legacy in-page subnav — nu geïntegreerd in de top header op affiliate routes. */
export function AffiliateSubnav() {
  return null;
}

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "inline-flex shrink-0 items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors",
    isActive
      ? "bg-primary-foreground text-primary"
      : "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground",
  );

/** Top-bar navigatie voor affiliate module, rendered binnen de paarse AppHeader. */
export function AffiliateTopnav() {
  const magReview = useIsLostReviewAdmin();
  const overflow = magReview
    ? [...secondaryItems, { to: "/affiliates/verloren-review", label: "Verloren review", icon: AlertTriangle }]
    : secondaryItems;
  return (
    <nav className="flex items-center gap-0.5 overflow-x-auto no-scrollbar flex-1 min-w-0">
      {primaryItems.map((i) => (
        <NavLink key={i.to} to={i.to} end={i.end} className={linkClass}>
          <i.icon className="h-4 w-4 shrink-0" />
          <span className="whitespace-nowrap hidden xl:inline">{i.label}</span>
          <span className="whitespace-nowrap xl:hidden text-xs">{i.label}</span>
        </NavLink>
      ))}
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors",
            "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground focus:outline-none",
          )}
          aria-label="Meer navigatie"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="whitespace-nowrap">Meer</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {overflow.map((i) => (
            <DropdownMenuItem key={i.to} asChild>
              <NavLink
                to={i.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 w-full cursor-pointer",
                    isActive && "bg-accent text-accent-foreground",
                  )
                }
              >
                <i.icon className="h-4 w-4" />
                <span>{i.label}</span>
              </NavLink>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}