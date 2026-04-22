import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateOntvangst, type OntvangstRegel } from "@/hooks/inkoop/useInkoopOntvangsten";
import { matchProductOpRegel } from "@/lib/voorraad";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  inkooporderId: string;
  partnerId: string;
  inkooporderRegels: { omschrijving: string; aantal: number }[];
}

export default function OntvangstDialog({ open, onOpenChange, inkooporderId, partnerId, inkooporderRegels }: Props) {
  const { profile } = useAuth();
  const create = useCreateOntvangst({ partnerId, inkooporderId });

  const { data: producten = [] } = useQuery({
    queryKey: ["producten-voor-ontvangst", partnerId],
    queryFn: async () => {
      const { data } = await supabase
        .from("producten")
        .select("id, naam, eenheid")
        .or(`partner_id.eq.${partnerId},partner_id.is.null`);
      return data ?? [];
    },
    enabled: open,
  });

  const [datum, setDatum] = useState(() => new Date().toISOString().slice(0, 10));
  const [opmerking, setOpmerking] = useState("");

  const initialeRegels: OntvangstRegel[] = useMemo(() => {
    if (!open) return [];
    return inkooporderRegels.map((r) => {
      const match = matchProductOpRegel(r.omschrijving, producten as any);
      return {
        product_id: match?.id ?? null,
        omschrijving: r.omschrijving,
        besteld_aantal: r.aantal,
        ontvangen_aantal: r.aantal,
        opmerking: null,
      };
    });
  }, [open, inkooporderRegels, producten]);

  const [regels, setRegels] = useState<OntvangstRegel[]>([]);

  // Reset bij openen
  const ensureRegels = () => {
    if (regels.length === 0 && initialeRegels.length > 0) {
      setRegels(initialeRegels);
    }
  };
  ensureRegels();

  const updateRegel = (i: number, patch: Partial<OntvangstRegel>) => {
    setRegels((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };

  const opslaan = async () => {
    await create.mutateAsync({
      ontvangstdatum: datum,
      ontvangen_door: profile?.id ?? null,
      regels,
      opmerking: opmerking || null,
    });
    onOpenChange(false);
    setRegels([]);
    setOpmerking("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setRegels([]); setOpmerking(""); } }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ontvangst registreren</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Ontvangstdatum</Label>
              <Input type="date" value={datum} onChange={(e) => setDatum(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Regels — wat is er werkelijk binnengekomen?</Label>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Omschrijving</TableHead>
                    <TableHead className="text-right">Besteld</TableHead>
                    <TableHead className="text-right w-32">Ontvangen</TableHead>
                    <TableHead>Opmerking</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {regels.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div>{r.omschrijving}</div>
                        {!r.product_id && (
                          <div className="text-xs text-warning">Geen product gekoppeld — voorraad wordt niet bijgewerkt</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">{r.besteld_aantal}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={r.ontvangen_aantal}
                          onChange={(e) => updateRegel(i, { ontvangen_aantal: parseFloat(e.target.value) || 0 })}
                          className="text-right"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={r.opmerking ?? ""}
                          onChange={(e) => updateRegel(i, { opmerking: e.target.value })}
                          placeholder="Optioneel"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Algemene opmerking</Label>
            <Textarea value={opmerking} onChange={(e) => setOpmerking(e.target.value)} rows={2} placeholder="Bijv. doos beschadigd, deellevering..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuleren</Button>
          <Button onClick={opslaan} disabled={create.isPending || regels.length === 0}>
            Ontvangst registreren
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}