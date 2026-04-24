import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Send, ShieldCheck, XCircle, Hourglass } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useInkoopInstellingen } from "@/hooks/inkoop/useInkoopInstellingen";
import {
  useGoedkeurInkoopOrder, useVraagGoedkeuringAan, useAnnuleerInkoopOrder,
} from "@/hooks/inkoop/useInkoopOrders";
import InkoopVerzendDialog from "./InkoopVerzendDialog";

interface Props {
  doc: {
    id: string;
    status: string;
    totaal_bedrag: number;
    goedgekeurd_op: string | null;
    verzonden_op: string | null;
    leverancier_id: string | null;
    leveranciers?: { naam?: string | null; email?: string | null } | null;
  };
  partnerId: string;
  onUpdated?: () => void;
}

export default function InkoopOrderActies({ doc, partnerId, onUpdated }: Props) {
  const { profile } = useAuth();
  const { data: instellingen } = useInkoopInstellingen(partnerId);
  const goedkeuren = useGoedkeurInkoopOrder();
  const vraagAan = useVraagGoedkeuringAan();
  const annuleer = useAnnuleerInkoopOrder();
  const [verzendOpen, setVerzendOpen] = useState(false);

  const goedkeuringNodig = useMemo(() => {
    if (!instellingen) return false;
    if (instellingen.goedkeuring_modus === "altijd") return true;
    if (instellingen.goedkeuring_modus === "drempel") {
      return Number(doc.totaal_bedrag) >= Number(instellingen.goedkeuring_drempel_bedrag ?? 0);
    }
    return false;
  }, [instellingen, doc.totaal_bedrag]);

  const isGoedgekeurd = !!doc.goedgekeurd_op;
  const isWachtend = doc.status === "wacht_goedkeuring";
  const isConcept = doc.status === "concept";
  const isVerzonden = !!doc.verzonden_op;
  const kanVerzenden = (!goedkeuringNodig || isGoedgekeurd) && (isConcept || isWachtend);

  const handleAfter = () => onUpdated?.();

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {isGoedgekeurd && (
          <Badge className="bg-success-light text-success">
            <ShieldCheck className="h-3 w-3 mr-1" /> Goedgekeurd
          </Badge>
        )}
        {goedkeuringNodig && !isGoedgekeurd && isConcept && (
          <Button
            variant="outline"
            onClick={() => vraagAan.mutate(doc.id, { onSuccess: handleAfter })}
            disabled={vraagAan.isPending}
          >
            <Hourglass className="h-4 w-4 mr-2" /> Goedkeuring aanvragen
          </Button>
        )}
        {isWachtend && profile?.id && (
          <Button
            onClick={() => goedkeuren.mutate({ id: doc.id, userId: profile.id }, { onSuccess: handleAfter })}
            disabled={goedkeuren.isPending}
            className="bg-success hover:bg-success/90 text-success-foreground"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" /> Goedkeuren
          </Button>
        )}
        {kanVerzenden && (
          <Button onClick={() => setVerzendOpen(true)}>
            <Send className="h-4 w-4 mr-2" />
            {isVerzonden ? "Opnieuw versturen" : "Verstuur naar leverancier"}
          </Button>
        )}
        {!kanVerzenden && goedkeuringNodig && !isGoedgekeurd && isConcept && (
          <span className="text-xs text-muted-foreground self-center">
            Goedkeuring vereist voordat de order verstuurd kan worden.
          </span>
        )}
        {(isConcept || isWachtend) && (
          <Button
            variant="ghost"
            onClick={() => annuleer.mutate(doc.id, { onSuccess: handleAfter })}
            disabled={annuleer.isPending}
          >
            <XCircle className="h-4 w-4 mr-2" /> Annuleren
          </Button>
        )}
      </div>

      <InkoopVerzendDialog
        open={verzendOpen}
        onOpenChange={setVerzendOpen}
        inkooporderId={doc.id}
        defaultEmail={doc.leveranciers?.email ?? ""}
        leverancierNaam={doc.leveranciers?.naam ?? ""}
        onSent={handleAfter}
      />
    </>
  );
}
