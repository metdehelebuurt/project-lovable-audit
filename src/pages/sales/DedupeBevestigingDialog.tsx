import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import type { DedupeResultaat } from "@/hooks/sales/useDedupeCheck";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  resultaat: DedupeResultaat | null;
  rijen: Record<string, string>[];
  bezig: boolean;
  onBevestig: (rij_indices_skip: number[]) => void;
}

export default function DedupeBevestigingDialog({ open, onOpenChange, resultaat, rijen, bezig, onBevestig }: Props) {
  if (!resultaat) return null;
  const { duplicaten, uniek, totaal } = resultaat;
  const skipIndices = duplicaten.map((d) => d.rij_index);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>Bevestig import</DialogTitle>
          <DialogDescription>
            Controle op duplicaten uitgevoerd — bevestig hieronder hoe je verder wilt.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Totaal</p>
              <p className="text-2xl font-semibold">{totaal}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Uniek</p>
              <p className="text-2xl font-semibold text-success">{uniek}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Duplicaten</p>
              <p className="text-2xl font-semibold text-warning-foreground">{duplicaten.length}</p>
            </div>
          </div>

          {duplicaten.length === 0 ? (
            <div className="flex items-center gap-2 rounded-md border border-success/30 bg-success/5 p-3 text-sm">
              <CheckCircle2 className="h-4 w-4 text-success" />
              Geen duplicaten gevonden. Alle {totaal} rijen worden geïmporteerd.
            </div>
          ) : (
            <>
              <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/5 p-3 text-sm">
                <AlertTriangle className="h-4 w-4 text-warning-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">{duplicaten.length} mogelijke duplicaten gevonden</p>
                  <p className="text-xs text-muted-foreground">Vergelijk op e-mail, telefoon, website en bedrijfsnaam (genormaliseerd). Duplicaten worden standaard overgeslagen.</p>
                </div>
              </div>
              <ScrollArea className="h-56 rounded-md border w-full">
                <ul className="divide-y text-sm w-full">
                  {duplicaten.map((d) => {
                    const rij = rijen[d.rij_index] ?? {};
                    return (
                      <li key={d.rij_index} className="p-2 flex items-start justify-between gap-2 w-full min-w-0">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">
                            Rij {d.rij_index + 1}: {rij.bedrijfsnaam || rij.contactpersoon || rij.email || "—"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {rij.email ?? ""} {rij.telefoon ? `· ${rij.telefoon}` : ""}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1 justify-end shrink-0 max-w-[45%]">
                          {d.redenen.map((r, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] whitespace-nowrap">{r}</Badge>
                          ))}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </ScrollArea>
            </>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={bezig}>
            Annuleren
          </Button>
          {duplicaten.length > 0 && (
            <Button variant="outline" onClick={() => onBevestig([])} disabled={bezig}>
              {bezig ? <Loader2 className="h-4 w-4 animate-spin" /> : `Importeer alles (${totaal})`}
            </Button>
          )}
          <Button onClick={() => onBevestig(skipIndices)} disabled={bezig || uniek === 0}>
            {bezig ? <Loader2 className="h-4 w-4 animate-spin" /> : duplicaten.length > 0
              ? `Importeer ${uniek} unieke`
              : `Bevestig import (${uniek})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}