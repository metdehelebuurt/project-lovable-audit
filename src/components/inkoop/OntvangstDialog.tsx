import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateOntvangst, type OntvangstRegel } from "@/hooks/inkoop/useInkoopOntvangsten";
import { matchProductOpRegel } from "@/lib/voorraad";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUpsertSerienummer } from "@/hooks/logistiek/useSerienummers";
import { Badge } from "@/components/ui/badge";

interface ProductOptie {
  id: string;
  naam: string;
  eenheid: string | null;
  merk: string | null;
  model: string | null;
  artikelnummer: string | null;
  ean_code: string | null;
  product_code: string | null;
  categorie?: string | null;
  omvormer_modulair?: boolean | null;
  heeft_backup_box?: boolean | null;
  heeft_serienummer?: boolean | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  inkooporderId: string;
  partnerId: string;
  inkooporderRegels: { product_id?: string | null; omschrijving: string; aantal: number }[];
}

export default function OntvangstDialog({ open, onOpenChange, inkooporderId, partnerId, inkooporderRegels }: Props) {
  const { profile } = useAuth();
  const create = useCreateOntvangst({ partnerId, inkooporderId });
  const upsertSn = useUpsertSerienummer();

  const { data: producten = [] } = useQuery({
    queryKey: ["producten-voor-ontvangst", partnerId],
    queryFn: async () => {
      const { data } = await supabase
        .from("producten")
        .select("id, naam, eenheid, merk, model, artikelnummer, ean_code, product_code, categorie, omvormer_modulair, heeft_backup_box, heeft_serienummer")
        .or(`partner_id.eq.${partnerId},partner_id.is.null`);
      return (data ?? []) as ProductOptie[];
    },
    enabled: open,
  });

  const [datum, setDatum] = useState(() => new Date().toISOString().slice(0, 10));
  const [opmerking, setOpmerking] = useState("");
  // per regel-index → array van { batterij, omvormer, backup_box } per stuk
  const [snInputs, setSnInputs] = useState<Record<number, Array<{ batterij: string; omvormer: string; backup_box: string }>>>({});

  const initialeRegels: OntvangstRegel[] = useMemo(() => {
    if (!open) return [];
    return inkooporderRegels.map((r) => {
      const match = matchProductOpRegel(r.omschrijving, producten);
      return {
        product_id: r.product_id ?? match?.id ?? null,
        omschrijving: r.omschrijving,
        besteld_aantal: r.aantal,
        ontvangen_aantal: r.aantal,
        opmerking: null,
      };
    });
  }, [open, inkooporderRegels, producten]);

  const [regels, setRegels] = useState<OntvangstRegel[]>([]);

  useEffect(() => {
    if (!open) {
      setRegels([]);
      setSnInputs({});
      return;
    }
    if (initialeRegels.length === 0) return;
    setRegels((prev) => {
      if (prev.length === 0) return initialeRegels;
      let isGewijzigd = false;
      const volgendeRegels = prev.map((regel, index) => {
        const productId = regel.product_id ?? initialeRegels[index]?.product_id ?? null;
        if (productId === regel.product_id) return regel;
        isGewijzigd = true;
        return { ...regel, product_id: productId };
      });
      return isGewijzigd ? volgendeRegels : prev;
    });
  }, [initialeRegels, open]);

  const updateRegel = (i: number, patch: Partial<OntvangstRegel>) => {
    setRegels((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };

  const productVoorRegel = (r: OntvangstRegel): ProductOptie | undefined =>
    producten.find((p) => p.id === r.product_id);

  const heeftLosseComponentenSn = (p?: ProductOptie) =>
    !!p && (Boolean(p.omvormer_modulair) || Boolean(p.heeft_backup_box));

  const getSnRij = (i: number, stukIdx: number) =>
    snInputs[i]?.[stukIdx] ?? { batterij: "", omvormer: "", backup_box: "" };

  const updateSn = (i: number, stukIdx: number, veld: "batterij" | "omvormer" | "backup_box", value: string) => {
    setSnInputs((prev) => {
      const rij = [...(prev[i] ?? [])];
      while (rij.length <= stukIdx) rij.push({ batterij: "", omvormer: "", backup_box: "" });
      rij[stukIdx] = { ...rij[stukIdx], [veld]: value };
      return { ...prev, [i]: rij };
    });
  };

  const opslaan = async () => {
    await create.mutateAsync({
      ontvangstdatum: datum,
      ontvangen_door: profile?.id ?? null,
      regels,
      opmerking: opmerking || null,
    });

    // Serienummers per stuk boeken voor modulaire / backup-box producten
    for (let i = 0; i < regels.length; i++) {
      const r = regels[i];
      const p = productVoorRegel(r);
      if (!p || !heeftLosseComponentenSn(p)) continue;
      const rij = snInputs[i] ?? [];
      for (const stuk of rij) {
        const entries: Array<{ type: "batterij" | "omvormer" | "backup_box"; sn: string }> = [
          { type: "batterij", sn: stuk.batterij.trim() },
          ...(p.omvormer_modulair ? [{ type: "omvormer" as const, sn: stuk.omvormer.trim() }] : []),
          ...(p.heeft_backup_box ? [{ type: "backup_box" as const, sn: stuk.backup_box.trim() }] : []),
        ];
        for (const e of entries) {
          if (!e.sn) continue;
          try {
            await upsertSn.mutateAsync({
              partner_id: partnerId,
              product_id: p.id,
              serienummer: e.sn,
              status: "voorraad",
              levering_datum: datum,
              component_type: e.type,
            } as any);
          } catch {
            /* duplicate SN's worden stil overgeslagen */
          }
        }
      }
    }

    onOpenChange(false);
    setRegels([]);
    setOpmerking("");
    setSnInputs({});
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setRegels([]); setOpmerking(""); } }}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
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
                      <TableHead className="min-w-56">Product</TableHead>
                    <TableHead className="text-right">Besteld</TableHead>
                    <TableHead className="text-right w-32">Ontvangen</TableHead>
                    <TableHead>Opmerking</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {regels.map((r, i) => (
                    <>
                    <TableRow key={i}>
                      <TableCell>
                        <div>{r.omschrijving}</div>
                        {!r.product_id && (
                          <div className="text-xs text-warning">Geen product gekoppeld — voorraad wordt niet bijgewerkt</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={r.product_id ?? "geen-product"}
                          onValueChange={(value) => updateRegel(i, { product_id: value === "geen-product" ? null : value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Kies product" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="geen-product">Geen product</SelectItem>
                            {producten.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.naam}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                    {(() => {
                      const p = productVoorRegel(r);
                      if (!heeftLosseComponentenSn(p)) return null;
                      const aantal = Math.max(0, Math.floor(Number(r.ontvangen_aantal) || 0));
                      if (aantal === 0) return null;
                      return (
                        <TableRow key={`sn-${i}`} className="bg-muted/30">
                          <TableCell colSpan={5} className="py-2">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                <Badge variant="outline" className="border-primary/40 text-primary">Losse serienummers</Badge>
                                Vul per stuk de serienummers in van batterij{p!.omvormer_modulair ? ", omvormer" : ""}{p!.heeft_backup_box ? " en backup box" : ""}.
                              </div>
                              {Array.from({ length: aantal }).map((_, stukIdx) => {
                                const rij = getSnRij(i, stukIdx);
                                return (
                                  <div key={stukIdx} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                                    <div className="text-xs text-muted-foreground">Stuk #{stukIdx + 1}</div>
                                    <div>
                                      <Label className="text-xs">SN batterij</Label>
                                      <Input value={rij.batterij} onChange={(e) => updateSn(i, stukIdx, "batterij", e.target.value)} placeholder="Batterij SN" />
                                    </div>
                                    {p!.omvormer_modulair && (
                                      <div>
                                        <Label className="text-xs">SN omvormer</Label>
                                        <Input value={rij.omvormer} onChange={(e) => updateSn(i, stukIdx, "omvormer", e.target.value)} placeholder="Omvormer SN" />
                                      </div>
                                    )}
                                    {p!.heeft_backup_box && (
                                      <div>
                                        <Label className="text-xs">SN backup box</Label>
                                        <Input value={rij.backup_box} onChange={(e) => updateSn(i, stukIdx, "backup_box", e.target.value)} placeholder="Backup box SN" />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })()}
                    </>
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