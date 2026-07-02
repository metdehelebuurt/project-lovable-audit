import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Loader2, Split, Layers } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { LeverancierGroep } from "@/lib/inkoopSplitPerLeverancier";

interface InkoopSplitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groepen: LeverancierGroep[];
  partnerId: string;
  opdrachtId: string | null;
  createdBy: string;
  /** Callback als de gebruiker kiest om alles op de huidige inkooporder te zetten. */
  onMerge: () => void;
}

const fmtEur = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

export const InkoopSplitDialog = ({
  open,
  onOpenChange,
  groepen,
  partnerId,
  opdrachtId,
  createdBy,
  onMerge,
}: InkoopSplitDialogProps) => {
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const totalRegels = groepen.reduce((s, g) => s + g.regels.length, 0);
  const zonderLeverancier = groepen.find((g) => g.leverancier_id === null);
  const inzetbareGroepen = groepen.filter((g) => g.leverancier_id !== null);

  const handleSplit = async () => {
    if (inzetbareGroepen.length === 0) {
      toast({
        title: "Geen leveranciers gekoppeld",
        description: "Wijs eerst leveranciers toe aan de producten of kies 'Samenvoegen'.",
        variant: "destructive",
      });
      return;
    }
    setBusy(true);
    try {
      const aangemaakt: { id: string; nummer: string; leverancier: string }[] = [];
      for (const groep of inzetbareGroepen) {
        const subtotaal = groep.regels.reduce(
          (s, r) => s + Number(r.aantal ?? 0) * Number(r.prijs_per_stuk ?? 0),
          0,
        );
        const btwBedrag = groep.regels.reduce(
          (s, r) =>
            s +
            (Number(r.aantal ?? 0) * Number(r.prijs_per_stuk ?? 0) * Number(r.btw_percentage ?? 21)) /
              100,
          0,
        );
        const { data: numData } = await supabase.rpc("generate_financieel_documentnummer", {
          _partner_id: partnerId,
          _type: "inkooporder",
          _subtype: null,
        });
        const doc: any = {
          partner_id: partnerId,
          type: "inkooporder",
          documentnummer: numData || `IO-${Date.now()}`,
          status: "concept",
          leverancier_id: groep.leverancier_id,
          opdracht_id: opdrachtId,
          regels: groep.regels,
          subtotaal,
          btw_bedrag: btwBedrag,
          totaal_bedrag: subtotaal + btwBedrag,
          korting_totaal: 0,
          betalingstermijn_dagen: 30,
          factuurdatum: new Date().toISOString().split("T")[0],
          vervaldatum: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
          created_by: createdBy,
        };
        const { data, error } = await supabase
          .from("financiele_documenten")
          .insert(doc)
          .select("id, documentnummer")
          .single();
        if (error) throw error;
        aangemaakt.push({
          id: data.id,
          nummer: data.documentnummer,
          leverancier: groep.leverancier_naam,
        });
      }
      toast({
        title: `${aangemaakt.length} inkooporders aangemaakt`,
        description: aangemaakt.map((a) => `${a.nummer} — ${a.leverancier}`).join(" · "),
      });
      onOpenChange(false);
      if (aangemaakt.length > 0) navigate(`/financieel/${aangemaakt[0].id}`);
    } catch (e: any) {
      toast({
        title: "Aanmaken mislukt",
        description: e?.message ?? String(e),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Split className="h-5 w-5" />
            Meerdere leveranciers gedetecteerd
          </DialogTitle>
          <DialogDescription>
            De {totalRegels} bestelregels komen van {groepen.length} verschillende leveranciers. Splits de bestelling zodat elke leverancier een eigen inkooporder krijgt, of voeg alles samen op één order.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-[50vh] overflow-y-auto">
          {groepen.map((g, idx) => {
            const totaal = g.regels.reduce(
              (s, r) => s + Number(r.aantal ?? 0) * Number(r.prijs_per_stuk ?? 0),
              0,
            );
            return (
              <div
                key={`${g.leverancier_id ?? "none"}-${idx}`}
                className="rounded-lg border p-3 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium flex items-center gap-2">
                    {g.leverancier_id === null ? (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    ) : (
                      <Layers className="h-4 w-4 text-muted-foreground" />
                    )}
                    {g.leverancier_naam}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline">{g.regels.length} regel(s)</Badge>
                    <span className="text-muted-foreground">{fmtEur(totaal)}</span>
                  </div>
                </div>
                <ul className="text-xs text-muted-foreground space-y-0.5 pl-6 list-disc">
                  {g.regels.slice(0, 4).map((r, i) => (
                    <li key={i} className="truncate">
                      {r.aantal}× {r.omschrijving}
                    </li>
                  ))}
                  {g.regels.length > 4 && <li>… en {g.regels.length - 4} meer</li>}
                </ul>
              </div>
            );
          })}
        </div>

        {zonderLeverancier && (
          <Alert variant="default" className="border-amber-300 bg-amber-50 text-amber-900">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {zonderLeverancier.regels.length} regel(s) hebben nog geen leverancier. Deze worden overgeslagen bij splitsen — koppel eerst een leverancier via <em>Producten → Leveranciers</em> of kies <em>Samenvoegen</em>.
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            Annuleren
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              onMerge();
              onOpenChange(false);
            }}
            disabled={busy}
          >
            Toch samenvoegen (1 order)
          </Button>
          <Button onClick={handleSplit} disabled={busy || inzetbareGroepen.length === 0}>
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Bezig...
              </>
            ) : (
              `${inzetbareGroepen.length} inkooporders aanmaken`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InkoopSplitDialog;