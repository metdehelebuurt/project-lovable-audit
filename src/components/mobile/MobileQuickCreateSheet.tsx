import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Users, UserCheck2, FileText, ClipboardList, Wrench, Calendar, LifeBuoy, type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Mobiel snel-aanmaken sheet — wordt geopend door de FAB in MobileBottomNav.
 */

interface ActieDef {
  label: string;
  url: string;
  icon: LucideIcon;
  rollen: string[];
  groep: "verkoop" | "uitvoering" | "service";
  beschrijving?: string;
}

const ACTIES: ActieDef[] = [
  { label: "Lead", url: "/leads?nieuw=1", icon: Users, groep: "verkoop",
    rollen: ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur"],
    beschrijving: "Nieuwe aanvraag of prospect" },
  { label: "Klant", url: "/klanten?nieuw=1", icon: UserCheck2, groep: "verkoop",
    rollen: ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur"] },
  { label: "Offerte", url: "/offertes/nieuw", icon: FileText, groep: "verkoop",
    rollen: ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur"] },
  { label: "Schouw", url: "/schouwen/nieuw", icon: ClipboardList, groep: "verkoop",
    rollen: ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur"] },
  { label: "Installatie", url: "/installaties/nieuw", icon: Wrench, groep: "uitvoering",
    rollen: ["superadmin", "partner_admin", "backoffice", "partner_staff"] },
  { label: "Afspraak", url: "/planning?nieuw=1", icon: Calendar, groep: "uitvoering",
    rollen: ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur"] },
  { label: "Ticket", url: "/helpdesk/tickets/nieuw", icon: LifeBuoy, groep: "service",
    rollen: ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur"] },
];

const GROEP_LABEL: Record<ActieDef["groep"], string> = {
  verkoop: "Klant & Verkoop",
  uitvoering: "Uitvoering",
  service: "Service",
};

export function MobileQuickCreateSheet({
  open, onOpenChange,
}: {
  open: boolean; onOpenChange: (open: boolean) => void;
}) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const rol = profile?.rol;
  const beschikbaar = ACTIES.filter((a) => !rol || a.rollen.includes(rol));

  const handleKies = (url: string) => {
    onOpenChange(false);
    navigate(url);
  };

  const groepen: ActieDef["groep"][] = ["verkoop", "uitvoering", "service"];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl p-0 max-h-[80vh]">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle className="text-left">Nieuw aanmaken</SheetTitle>
        </SheetHeader>
        <div className="p-4 space-y-5 overflow-y-auto">
          {groepen.map((g) => {
            const items = beschikbaar.filter((a) => a.groep === g);
            if (items.length === 0) return null;
            return (
              <div key={g}>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">
                  {GROEP_LABEL[g]}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {items.map((a) => {
                    const Icon = a.icon;
                    return (
                      <button
                        key={a.label}
                        type="button"
                        onClick={() => handleKies(a.url)}
                        className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-accent active:scale-[0.98] transition-all text-left"
                      >
                        <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Icon className="h-4.5 w-4.5" />
                        </div>
                        <span className="text-sm font-medium">{a.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}