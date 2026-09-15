import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { usePartnerBlokkadeHistorie } from "@/hooks/administratie/usePartnerBlokkadeHistorie";

interface BlokkadeHistorieProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerId: string | null;
  partnerNaam: string;
}

export default function BlokkadeHistorie({
  open, onOpenChange, partnerId, partnerNaam,
}: BlokkadeHistorieProps) {
  const { data = [], isLoading, error } = usePartnerBlokkadeHistorie(open ? partnerId : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Blokkadegeschiedenis — {partnerNaam}</DialogTitle>
        </DialogHeader>

        {isLoading && <p className="text-sm text-muted-foreground">Laden...</p>}
        {error && <p className="text-sm text-destructive">Geschiedenis kon niet worden geladen.</p>}
        {!isLoading && !error && data.length === 0 && (
          <p className="text-sm text-muted-foreground">Nog geen blokkades vastgelegd.</p>
        )}

        <ul className="space-y-3">
          {data.map((regel) => (
            <li key={regel.id} className="border-b border-border pb-3 last:border-0">
              <div className="flex items-center gap-2">
                <Badge variant={regel.actie === "blokkeren" ? "destructive" : "secondary"}>
                  {regel.actie === "blokkeren" ? "Geblokkeerd" : "Gedeblokkeerd"}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(regel.created_at), "d MMMM yyyy HH:mm", { locale: nl })}
                </span>
              </div>
              <p className="text-sm mt-1">{regel.reden}</p>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
