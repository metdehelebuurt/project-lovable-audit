import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navigation, PlayCircle, Pause, CheckCircle2, ShieldCheck, Lock, Flag } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useInstallatieActies } from "./useInstallatieActies";
import GereedMeldenDialog from "./GereedMeldenDialog";
import type { Installatie } from "./api/installatieApi";
import type { InstallatieStatus } from "./status";

interface Props {
  installatie: Installatie;
  onMaakOplevering: () => void;
}

const BEHEER_ROLLEN = ["superadmin", "partner_admin", "partner_staff", "backoffice"];

export default function InstallatieActieBalk({ installatie, onMaakOplevering }: Props) {
  const { profile } = useAuth();
  const acties = useInstallatieActies(installatie.id);
  const [gereedOpen, setGereedOpen] = useState(false);

  const isBeheerder = profile && BEHEER_ROLLEN.includes(profile.rol);
  const isToegewezenMonteur = profile?.id === installatie.installateur_id;
  const magBedienen = Boolean(isBeheerder || isToegewezenMonteur);

  const status = installatie.status as InstallatieStatus;

  if (status === "afgerond" || status === "geannuleerd") {
    return (
      <Card className="rounded-2xl border-0 shadow-sm bg-muted/40">
        <CardContent className="flex items-center gap-3 p-4 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" />
          Installatie is afgesloten. Wijzigingen zijn niet meer mogelijk.
        </CardContent>
      </Card>
    );
  }

  if (!magBedienen) {
    return (
      <Card className="rounded-2xl border-0 shadow-sm bg-muted/40">
        <CardContent className="flex items-center gap-3 p-4 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" />
          Alleen de toegewezen monteur of beheerders kunnen de status wijzigen.
        </CardContent>
      </Card>
    );
  }

  const disabled = acties.isPending;

  return (
    <>
      <Card className="rounded-2xl border-0 shadow-sm sticky top-2 z-10">
        <CardContent className="p-4 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium mr-2">Snelle acties:</span>

          {(status === "concept" || status === "gepland" || status === "bevestigd") && (
            <>
              <Button size="sm" variant="outline" className="rounded-xl gap-1.5" disabled={disabled} onClick={acties.markeerOnderweg}>
                <Navigation className="h-4 w-4" /> Onderweg
              </Button>
              <Button size="sm" className="rounded-xl gap-1.5" disabled={disabled} onClick={acties.markeerGestart}>
                <PlayCircle className="h-4 w-4" /> Direct starten
              </Button>
            </>
          )}

          {status === "onderweg" && (
            <>
              <Button size="sm" className="rounded-xl gap-1.5" disabled={disabled} onClick={acties.markeerGestart}>
                <PlayCircle className="h-4 w-4" /> Aangekomen / starten
              </Button>
              <Button size="sm" variant="outline" className="rounded-xl gap-1.5" disabled={disabled} onClick={acties.markeerPauze}>
                <Pause className="h-4 w-4" /> Pauzeren
              </Button>
            </>
          )}

          {status === "in_uitvoering" && (
            <>
              <Button size="sm" variant="outline" className="rounded-xl gap-1.5" disabled={disabled} onClick={acties.markeerPauze}>
                <Pause className="h-4 w-4" /> Pauzeren
              </Button>
              <Button size="sm" className="rounded-xl gap-1.5" disabled={disabled} onClick={() => setGereedOpen(true)}>
                <CheckCircle2 className="h-4 w-4" /> Gereed melden
              </Button>
            </>
          )}

          {status === "gereed" && (
            <>
              <Button size="sm" className="rounded-xl gap-1.5" onClick={onMaakOplevering}>
                <ShieldCheck className="h-4 w-4" /> Opleverrapport maken
              </Button>
              <Button size="sm" variant="outline" className="rounded-xl gap-1.5" disabled={disabled} onClick={acties.markeerAfgerond}>
                <Flag className="h-4 w-4" /> Markeer afgerond
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <GereedMeldenDialog
        open={gereedOpen}
        onOpenChange={setGereedOpen}
        onConfirm={(notitie) => acties.gereedMelden(notitie)}
        isPending={acties.isPending}
      />
    </>
  );
}