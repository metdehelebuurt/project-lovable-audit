import { ShieldAlert, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { EigenaarOverdrachtDialog } from "./EigenaarOverdrachtDialog";

interface Props {
  leadId: string;
  eigenaarId: string | null;
}

export function BewerkBanner({ leadId, eigenaarId }: Props) {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user || !profile) return null;
  const rollen = [profile.rol, ...(profile.extra_rollen ?? [])];
  const isBeheer = rollen.includes("superadmin") || rollen.includes("sales_manager");
  if (!isBeheer) return null;
  if (eigenaarId === user.id) return null;

  const label = profile.rol === "superadmin" ? "platformbeheerder" : "sales-manager";

  return (
    <>
      <div className="rounded-md border border-primary/40 bg-primary/5 px-3 py-2 flex flex-wrap items-center gap-2 text-sm">
        <ShieldAlert className="h-4 w-4 text-primary shrink-0" />
        <span className="flex-1 min-w-0">
          Je bewerkt deze lead als <strong>{label}</strong>. Wijzigingen worden gelogd in de historie.
        </span>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          <UserCog className="h-3.5 w-3.5 mr-1" /> Eigenaar wijzigen
        </Button>
      </div>
      <EigenaarOverdrachtDialog open={open} onOpenChange={setOpen} leadId={leadId} huidigeEigenaarId={eigenaarId} />
    </>
  );
}