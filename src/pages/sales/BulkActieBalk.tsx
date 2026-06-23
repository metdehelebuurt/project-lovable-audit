import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Trash2, Tag, X } from "lucide-react";
import { SALES_FASES, FASE_LABEL, type SalesFase } from "@/lib/sales/faseLabels";
import {
  useAffiliateGebruikers,
  useBulkDoorzetten,
  useBulkFase,
  useBulkDelete,
} from "@/hooks/sales/useDoorzetten";

interface Props {
  geselecteerd: string[];
  onClear: () => void;
}

export default function BulkActieBalk({ geselecteerd, onClear }: Props) {
  const [affiliateId, setAffiliateId] = useState<string>("");
  const [fase, setFase] = useState<SalesFase | "">("");
  const { data: affiliates } = useAffiliateGebruikers();
  const doorzet = useBulkDoorzetten();
  const updFase = useBulkFase();
  const del = useBulkDelete();

  if (geselecteerd.length === 0) return null;

  const doorzetten = (target: string | null) => {
    doorzet.mutate(
      { lead_ids: geselecteerd, affiliate_id: target },
      { onSuccess: () => onClear() },
    );
  };

  const wijzigFase = () => {
    if (!fase) return;
    updFase.mutate({ lead_ids: geselecteerd, fase }, { onSuccess: () => onClear() });
  };

  const verwijderen = () => {
    if (!confirm(`${geselecteerd.length} leads definitief verwijderen?`)) return;
    del.mutate(geselecteerd, { onSuccess: () => onClear() });
  };

  return (
    <div className="sticky top-0 z-10 flex flex-wrap gap-2 items-center bg-primary/5 border border-primary/20 rounded-md p-3">
      <span className="text-sm font-medium">{geselecteerd.length} geselecteerd</span>

      <div className="flex items-center gap-1">
        <Select value={affiliateId} onValueChange={setAffiliateId}>
          <SelectTrigger className="h-9 w-56"><SelectValue placeholder="Kies affiliate…" /></SelectTrigger>
          <SelectContent>
            {(affiliates ?? []).map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.naam} — {a.email}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" className="gap-1" disabled={!affiliateId || doorzet.isPending}
          onClick={() => doorzetten(affiliateId)}>
          <Send className="h-3.5 w-3.5" /> Doorzet
        </Button>
        <Button size="sm" variant="outline" disabled={doorzet.isPending}
          onClick={() => doorzetten(null)}>
          Naar pool
        </Button>
      </div>

      <div className="flex items-center gap-1">
        <Select value={fase} onValueChange={(v) => setFase(v as SalesFase)}>
          <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Fase…" /></SelectTrigger>
          <SelectContent>
            {SALES_FASES.map((f) => <SelectItem key={f} value={f}>{FASE_LABEL[f]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" className="gap-1" disabled={!fase || updFase.isPending} onClick={wijzigFase}>
          <Tag className="h-3.5 w-3.5" /> Wijzig fase
        </Button>
      </div>

      <Button size="sm" variant="ghost" className="text-destructive gap-1 ml-auto"
        disabled={del.isPending} onClick={verwijderen}>
        <Trash2 className="h-3.5 w-3.5" /> Verwijder
      </Button>
      <Button size="sm" variant="ghost" onClick={onClear} className="gap-1">
        <X className="h-3.5 w-3.5" /> Deselecteren
      </Button>
    </div>
  );
}