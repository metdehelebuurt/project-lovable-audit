import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { EmbedProduct } from "./types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  producten: EmbedProduct[];
  primaryColor: string;
  onRemove: (id: string) => void;
  onRequestQuote: (p: EmbedProduct) => void;
}

const fmtPrijs = (p: number | null) =>
  p && p > 0 ? `€ ${Number(p).toLocaleString("nl-NL", { minimumFractionDigits: 2 })}` : "—";

const specsToRows = (producten: EmbedProduct[]): { key: string; label: string }[] => {
  const keys = new Set<string>();
  producten.forEach((p) => {
    if (p.specs && typeof p.specs === "object") {
      Object.keys(p.specs as Record<string, unknown>).forEach((k) => keys.add(k));
    }
  });
  return Array.from(keys).map((k) => ({ key: k, label: k.replace(/_/g, " ") }));
};

export const CompareDialog = ({
  open,
  onOpenChange,
  producten,
  primaryColor,
  onRemove,
  onRequestQuote,
}: Props) => {
  const specRows = specsToRows(producten);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Producten vergelijken</DialogTitle>
        </DialogHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="text-left p-2 w-32 align-top"></th>
                {producten.map((p) => (
                  <th key={p.id} className="p-2 align-top min-w-[200px]">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-left">
                          {p.merk && (
                            <p className="text-xs uppercase text-muted-foreground">{p.merk}</p>
                          )}
                          <p className="font-semibold text-sm leading-tight">{p.naam}</p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 -mr-1 shrink-0"
                          onClick={() => onRemove(p.id)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="aspect-square bg-muted rounded-md overflow-hidden flex items-center justify-center">
                        {p.afbeelding_url ? (
                          <img
                            src={p.afbeelding_url}
                            alt={p.naam ?? ""}
                            className="object-contain w-full h-full"
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">Geen afbeelding</span>
                        )}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="p-2 font-medium text-muted-foreground">Prijs</td>
                {producten.map((p) => (
                  <td key={p.id} className="p-2 font-semibold" style={{ color: primaryColor }}>
                    {fmtPrijs(p.prijs_excl_btw)}
                  </td>
                ))}
              </tr>
              <tr className="border-t">
                <td className="p-2 font-medium text-muted-foreground">Garantie</td>
                {producten.map((p) => (
                  <td key={p.id} className="p-2">
                    {p.garantie_jaren ? `${p.garantie_jaren} jaar` : "—"}
                  </td>
                ))}
              </tr>
              <tr className="border-t">
                <td className="p-2 font-medium text-muted-foreground">Categorie</td>
                {producten.map((p) => (
                  <td key={p.id} className="p-2">{p.categorie ?? "—"}</td>
                ))}
              </tr>
              {specRows.map((row) => (
                <tr key={row.key} className="border-t">
                  <td className="p-2 font-medium text-muted-foreground capitalize">{row.label}</td>
                  {producten.map((p) => {
                    const v =
                      p.specs && typeof p.specs === "object"
                        ? (p.specs as Record<string, unknown>)[row.key]
                        : null;
                    return (
                      <td key={p.id} className="p-2">
                        {v == null || v === "" ? "—" : String(v)}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="border-t">
                <td className="p-2"></td>
                {producten.map((p) => (
                  <td key={p.id} className="p-2">
                    <Button
                      size="sm"
                      className="w-full rounded-[40px]"
                      style={{ backgroundColor: primaryColor }}
                      onClick={() => onRequestQuote(p)}
                    >
                      Offerte aanvragen
                    </Button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
};