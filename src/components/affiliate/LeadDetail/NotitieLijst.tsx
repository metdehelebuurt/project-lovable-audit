import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { StickyNote, Send, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { useLeadNotities, useVoegLeadNotitieToe, useVerwijderLeadNotitie, type LeadNotitie } from "@/hooks/affiliate/useLeadNotities";

interface Props {
  leadId: string;
}

/**
 * Notitie-log per lead. Iedere notitie is een aparte entry met naam,
 * tijdstip en tekst. Vervangt het vrije tekstveld dat regels overschreef.
 */
export function NotitieLijst({ leadId }: Props) {
  const [tekst, setTekst] = useState("");
  const { data: notities = [], isLoading } = useLeadNotities(leadId);
  const voegToe = useVoegLeadNotitieToe(leadId);
  const verwijder = useVerwijderLeadNotitie(leadId);

  const onOpslaan = async () => {
    if (!tekst.trim()) return;
    try {
      await voegToe.mutateAsync(tekst);
      setTekst("");
      toast.success("Notitie toegevoegd");
    } catch {
      /* toast wordt door hook getoond */
    }
  };

  const onCtrlEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void onOpslaan();
    }
  };

  return (
    <div className="space-y-4 min-w-0">
      <div className="rounded-xl border bg-card p-4 space-y-3 shadow-sm">
        <div className="flex items-center gap-2">
          <StickyNote className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Nieuwe notitie toevoegen</h3>
        </div>
        <Textarea
          value={tekst}
          onChange={(e) => setTekst(e.target.value)}
          onKeyDown={onCtrlEnter}
          rows={3}
          placeholder="Wat wil je vastleggen? (Cmd/Ctrl + Enter om op te slaan)"
          className="resize-none"
        />
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            Wordt vastgelegd als losse entry met datum en jouw naam.
          </p>
          <Button
            size="sm"
            onClick={onOpslaan}
            disabled={!tekst.trim() || voegToe.isPending}
          >
            <Send className="h-3.5 w-3.5 mr-1.5" />
            {voegToe.isPending ? "Opslaan..." : "Opslaan"}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Notities log ({notities.length})
          </h3>
        </div>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : notities.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/20 p-8 text-center">
            <StickyNote className="h-6 w-6 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nog geen notities voor deze lead.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {notities.map((n) => (
              <NotitieKaart
                key={n.id}
                notitie={n}
                onVerwijder={() => verwijder.mutate(n.id)}
                verwijderBezig={verwijder.isPending}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function NotitieKaart({
  notitie,
  onVerwijder,
  verwijderBezig,
}: {
  notitie: LeadNotitie;
  onVerwijder: () => void;
  verwijderBezig: boolean;
}) {
  const dt = new Date(notitie.created_at);
  const relatief = formatDistanceToNow(dt, { locale: nl, addSuffix: true });
  const absoluut = dt.toLocaleString("nl-NL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <li
      className={`rounded-xl border bg-card p-3 shadow-sm ${
        notitie.is_eigen ? "border-l-4 border-l-primary/50" : "border-l-4 border-l-amber-400"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <User className="h-3 w-3" />
            </div>
            <span className="text-sm font-medium truncate">
              {notitie.is_eigen ? "Jij" : notitie.auteur_naam}
            </span>
            <span className="text-xs text-muted-foreground" title={absoluut}>
              · {relatief}
            </span>
          </div>
          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{notitie.notitie}</p>
        </div>
        {notitie.is_eigen && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                disabled={verwijderBezig}
                aria-label="Notitie verwijderen"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Notitie verwijderen?</AlertDialogTitle>
                <AlertDialogDescription>
                  Deze actie kan niet ongedaan gemaakt worden.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuleren</AlertDialogCancel>
                <AlertDialogAction onClick={onVerwijder}>Verwijderen</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </li>
  );
}