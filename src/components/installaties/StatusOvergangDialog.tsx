import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useInstallatieGereedheid } from "@/hooks/installaties/useInstallatieGereedheid";
import type { Installatie } from "./api/installatieApi";
import type { InstallatieStatus } from "./status";
import { INSTALLATIE_STATUS_LABELS } from "./status";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installatie: Installatie;
  doelStatus: InstallatieStatus;
  onConfirm: () => void;
  isPending?: boolean;
}

export default function StatusOvergangDialog({ open, onOpenChange, installatie, doelStatus, onConfirm, isPending }: Props) {
  const { data: gereedheid, isLoading } = useInstallatieGereedheid(installatie);
  const blokkades = useMemo(() => gereedheid?.open_blokkades ?? [], [gereedheid]);
  const heeftBlokkades = blokkades.length > 0;
  const targetLabel = INSTALLATIE_STATUS_LABELS[doelStatus] ?? doelStatus;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Status wijzigen naar "{targetLabel}"</DialogTitle>
          <DialogDescription>
            Werkvoorbereiding wordt gecontroleerd voordat de status wordt bijgewerkt.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Werkvoorbereiding ophalen…</p>
        ) : heeftBlokkades ? (
          <div className="space-y-3">
            <div className="flex items-start gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <p>De volgende verplichte punten zijn nog niet voltooid:</p>
            </div>
            <ul className="space-y-1.5 text-sm pl-6 list-disc">
              {blokkades.map((b) => (
                <li key={b.key}>
                  <span className="font-medium">{b.label}</span>
                  {b.details && <span className="text-muted-foreground"> — {b.details}</span>}
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">
              Los deze blokkades op in het tabblad <strong>Werkvoorbereiding</strong> en probeer opnieuw.
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 mt-0.5 text-success shrink-0" />
            <p>Alle verplichte werkvoorbereiding is voltooid. Je kunt de installatie verplaatsen naar <strong>{targetLabel}</strong>.</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuleren</Button>
          <Button onClick={onConfirm} disabled={heeftBlokkades || isLoading || isPending}>
            Bevestigen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
