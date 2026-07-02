import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useKostprijsHistorie } from "@/hooks/producten/useAssemblages";
import { formatCurrency } from "@/types/offerte";

interface Props {
  productId?: string | null;
}

export default function KostprijsHistoriePopover({ productId }: Props) {
  const { data, isLoading } = useKostprijsHistorie(productId);
  if (!productId) return null;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" title="Prijshistorie">
          <History className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="p-3 border-b">
          <p className="text-sm font-semibold">Kostprijs-historie</p>
          <p className="text-xs text-muted-foreground">Laatste 50 wijzigingen</p>
        </div>
        <div className="max-h-72 overflow-y-auto">
          {isLoading ? (
            <p className="p-3 text-sm text-muted-foreground">Laden...</p>
          ) : !data || data.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">Nog geen wijzigingen geregistreerd.</p>
          ) : (
            <ul className="divide-y">
              {data.map((r) => {
                const oud = r.oude_kostprijs != null ? Number(r.oude_kostprijs) : null;
                const nieuw = Number(r.nieuwe_kostprijs);
                const delta = oud != null ? nieuw - oud : null;
                const kleur = delta == null ? "" : delta > 0 ? "text-error" : "text-success";
                return (
                  <li key={r.id} className="px-3 py-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        {new Date(r.created_at).toLocaleString("nl-NL")}
                      </span>
                      {delta != null && (
                        <span className={`font-medium ${kleur}`}>
                          {delta > 0 ? "+" : ""}
                          {formatCurrency(delta)}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5">
                      {oud != null ? formatCurrency(oud) : "—"} → <strong>{formatCurrency(nieuw)}</strong>
                    </div>
                    {r.gewijzigd_door_naam && (
                      <div className="text-muted-foreground">door {r.gewijzigd_door_naam}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}