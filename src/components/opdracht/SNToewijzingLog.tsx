import { useSNToewijzingLog } from "@/hooks/logistiek/useSNToewijzing";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRight, Undo2, PlusCircle } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface Props { opdrachtId: string }

const actieMeta: Record<string, { label: string; icon: any; className: string }> = {
  toegewezen: { label: "Toegewezen", icon: ArrowRight, className: "bg-success-light text-success" },
  teruggezet: { label: "Teruggezet naar voorraad", icon: Undo2, className: "bg-warning-light text-warning-foreground" },
  handmatig_toegevoegd: { label: "Handmatig toegevoegd", icon: PlusCircle, className: "bg-primary/10 text-primary" },
};

const SNToewijzingLog = ({ opdrachtId }: Props) => {
  const { data, isLoading } = useSNToewijzingLog(opdrachtId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-6 justify-center text-sm">
        <Loader2 className="h-4 w-4 animate-spin" /> Log laden...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-6">
        Nog geen serienummer-wijzigingen geregistreerd.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((entry) => {
        const meta = actieMeta[entry.actie] ?? actieMeta.toegewezen;
        const Icon = meta.icon;
        return (
          <div key={entry.id} className="flex items-start gap-3 border rounded-lg p-2.5 text-sm">
            <Badge className={`gap-1 ${meta.className}`}>
              <Icon className="h-3 w-3" /> {meta.label}
            </Badge>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">
                {entry.serienummer}
                {entry.product_naam && <span className="text-muted-foreground font-normal"> · {entry.product_naam}</span>}
              </div>
              <div className="text-xs text-muted-foreground">
                {entry.oude_status && entry.nieuwe_status && (
                  <span>{entry.oude_status} → {entry.nieuwe_status} · </span>
                )}
                {entry.actor_naam || "Onbekend"} · {format(new Date(entry.created_at), "dd MMM yyyy HH:mm", { locale: nl })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SNToewijzingLog;