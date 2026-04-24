import { useState } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Mail, MailX, ShieldOff } from "lucide-react";
import { type AccessGrant, getGrantStatus, useRevokeAccessGrant } from "@/hooks/useAccessGrants";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("nl-NL", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function timeRemaining(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "verlopen";
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const restMin = minutes % 60;
  return `${hours}u ${restMin}m`;
}

function StatusBadge({ grant }: { grant: AccessGrant }) {
  const status = getGrantStatus(grant);
  if (status === "actief") return <Badge className="bg-success-light text-success">Actief</Badge>;
  if (status === "verlopen") return <Badge variant="secondary">Verlopen</Badge>;
  return <Badge variant="outline" className="text-muted-foreground">Ingetrokken</Badge>;
}

function RevokeButton({ grantId, partnerNaam }: { grantId: string; partnerNaam: string }) {
  const [open, setOpen] = useState(false);
  const revoke = useRevokeAccessGrant();
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline">
          <ShieldOff className="h-3.5 w-3.5 mr-1.5" />
          Intrekken
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Toegang intrekken?</AlertDialogTitle>
          <AlertDialogDescription>
            Hierna heeft u direct geen toegang meer tot de gegevens van {partnerNaam}.
            Deze handeling wordt vastgelegd in het audit-log.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuleren</AlertDialogCancel>
          <AlertDialogAction
            onClick={async () => {
              await revoke.mutateAsync(grantId).catch(() => undefined);
              setOpen(false);
            }}
          >
            Ja, intrekken
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function GrantsTable({ grants }: { grants: AccessGrant[] }) {
  if (grants.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        Nog geen toegangsaanvragen.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Partner</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Reden</TableHead>
            <TableHead>Verleend</TableHead>
            <TableHead>Vervalt</TableHead>
            <TableHead>Notificatie</TableHead>
            <TableHead className="text-right">Actie</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {grants.map((g) => {
            const status = getGrantStatus(g);
            const partnerNaam = g.partner?.naam ?? "Onbekend";
            return (
              <TableRow key={g.id}>
                <TableCell className="font-medium">{partnerNaam}</TableCell>
                <TableCell><StatusBadge grant={g} /></TableCell>
                <TableCell className="max-w-xs">
                  <p className="text-sm line-clamp-2" title={g.reden}>{g.reden}</p>
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap">
                  {formatDateTime(g.verleend_op)}
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap">
                  {formatDateTime(g.vervalt_op)}
                  {status === "actief" && (
                    <div className="text-xs text-muted-foreground">
                      nog {timeRemaining(g.vervalt_op)}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {g.notify_partner ? (
                    <span className="inline-flex items-center text-xs text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 mr-1" /> Verzonden
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-xs text-muted-foreground">
                      <MailX className="h-3.5 w-3.5 mr-1" /> Niet verzonden
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {status === "actief" && (
                    <RevokeButton grantId={g.id} partnerNaam={partnerNaam} />
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}