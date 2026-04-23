import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Plus, Users, UserCheck2, FileText, ClipboardList, Wrench, Calendar, LifeBuoy,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface ActieDef {
  label: string;
  url: string;
  icon: any;
  rollen: string[];
  groep: "verkoop" | "uitvoering" | "service";
}

const ACTIES: ActieDef[] = [
  { label: "Lead", url: "/leads?nieuw=1", icon: Users,
    rollen: ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur"], groep: "verkoop" },
  { label: "Klant", url: "/klanten?nieuw=1", icon: UserCheck2,
    rollen: ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur"], groep: "verkoop" },
  { label: "Offerte", url: "/offertes/nieuw", icon: FileText,
    rollen: ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur"], groep: "verkoop" },
  { label: "Schouw", url: "/schouwen/nieuw", icon: ClipboardList,
    rollen: ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur"], groep: "verkoop" },
  { label: "Installatie", url: "/installaties/nieuw", icon: Wrench,
    rollen: ["superadmin", "partner_admin", "backoffice", "partner_staff"], groep: "uitvoering" },
  { label: "Afspraak", url: "/planning?nieuw=1", icon: Calendar,
    rollen: ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur"], groep: "uitvoering" },
  { label: "Ticket", url: "/helpdesk/tickets/nieuw", icon: LifeBuoy,
    rollen: ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur"], groep: "service" },
];

const GROEP_LABEL: Record<ActieDef["groep"], string> = {
  verkoop: "Klant & Verkoop",
  uitvoering: "Uitvoering",
  service: "Service",
};

/**
 * "+ Nieuw"-knop in de header. Toont rol-relevante quick-create acties.
 */
export function QuickCreateMenu() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const rol = profile?.rol;
  const beschikbaar = ACTIES.filter((a) => !rol || a.rollen.includes(rol));
  if (beschikbaar.length === 0) return null;

  const groepen: ActieDef["groep"][] = ["verkoop", "uitvoering", "service"];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className="gap-1.5 rounded-full">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nieuw</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {groepen.map((g, gi) => {
          const items = beschikbaar.filter((a) => a.groep === g);
          if (items.length === 0) return null;
          return (
            <div key={g}>
              {gi > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {GROEP_LABEL[g]}
              </DropdownMenuLabel>
              {items.map((a) => {
                const Icon = a.icon;
                return (
                  <DropdownMenuItem key={a.label} onClick={() => navigate(a.url)}>
                    <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                    {a.label}
                  </DropdownMenuItem>
                );
              })}
            </div>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}