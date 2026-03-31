import { LogOut, User, MessageSquarePlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { toast } from "sonner";
import { NotificatieCenter } from "@/components/NotificatieCenter";

const rolLabels: Record<string, string> = {
  superadmin: "Platformbeheerder",
  partner_admin: "Organisatiebeheerder",
  partner_staff: "Medewerker",
  adviseur: "Energieadviseur",
  installateur: "Installateur",
  consument: "Consument",
};

export function AppHeader() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Uitgelogd");
    navigate("/login");
  };

  return (
    <header className="h-[72px] bg-card border-b border-border flex items-center justify-between px-4 md:px-8">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="text-foreground" />
      </div>

      <div className="flex items-center gap-3">
        <NotificatieCenter />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                {profile?.voornaam?.[0]}{profile?.achternaam?.[0]}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium leading-none">
                  {profile?.voornaam} {profile?.achternaam}
                </p>
                <p className="text-xs text-muted-foreground">
                  {rolLabels[profile?.rol ?? ""] ?? profile?.rol}
                </p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => navigate("/instellingen")}>
              <User className="mr-2 h-4 w-4" />
              Profiel
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Uitloggen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
