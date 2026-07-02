import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { OfferteRegel, emptyOfferteRegel, regelSubtotaal, formatCurrency } from "@/types/offerte";
import { ProductSearchInput } from "./ProductSearchInput";

interface Props {
  regels: OfferteRegel[];
  onChange: (regels: OfferteRegel[]) => void;
  readOnly?: boolean;
  hidePricing?: boolean;
  /** Bij inkoopdocumenten: gebruik kostprijs (inkoop) in plaats van verkoopprijs. */
  voorInkoop?: boolean;
}

export function DocumentRegelEditor({ regels, onChange, readOnly, hidePricing, voorInkoop }: Props) {
  // Cache kostprijs per product_id om marge te tonen per regel
  const [kostprijsMap, setKostprijsMap] = useState<Record<string, number | null>>({});
  const productIds = useMemo(
    () => Array.from(new Set(regels.map((r) => r.product_id).filter((id): id is string => !!id))),
    [regels],
  );
  useEffect(() => {
    const missing = productIds.filter((id) => !(id in kostprijsMap));
    if (missing.length === 0) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("producten").select("id, kostprijs").in("id", missing);
      if (cancelled || !data) return;
      setKostprijsMap((prev) => {
        const next = { ...prev };
        for (const id of missing) next[id] = null;
        for (const row of data as { id: string; kostprijs: number | null }[]) {
          next[row.id] = row.kostprijs != null ? Number(row.kostprijs) : null;
        }
        return next;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [productIds, kostprijsMap]);

  const update = (idx: number, field: keyof OfferteRegel, value: any) => {
    const copy = [...regels];
    copy[idx] = { ...copy[idx], [field]: value };
    onChange(copy);
  };

  const applyProduct = (idx: number, p: {
    id: string;
    naam: string;
    merk: string | null;
    model: string | null;
    prijs_excl_btw: number | null;
    kostprijs: number | null;
    btw_percentage: number | null;
    offerte_tekst: string | null;
  }) => {
    const copy = [...regels];
    const label = [p.merk, p.model].filter(Boolean).join(" ") || p.naam;
    const gekozenPrijs = voorInkoop
      ? (p.kostprijs != null ? Number(p.kostprijs) : copy[idx].prijs_per_stuk)
      : (p.prijs_excl_btw != null ? Number(p.prijs_excl_btw) : copy[idx].prijs_per_stuk);
    copy[idx] = {
      ...copy[idx],
      product_id: p.id,
      omschrijving: label,
      offerte_tekst: p.offerte_tekst ?? copy[idx].offerte_tekst,
      prijs_per_stuk: gekozenPrijs,
      btw_percentage: p.btw_percentage != null ? Number(p.btw_percentage) : copy[idx].btw_percentage,
    };
    onChange(copy);
  };

  const addRegel = () => onChange([...regels, { ...emptyOfferteRegel }]);
  const removeRegel = (idx: number) => onChange(regels.filter((_, i) => i !== idx));

  const brutoTotaal = regels.reduce((s, r) => s + r.aantal * r.prijs_per_stuk, 0);
  const subtotaal = regels.reduce((s, r) => s + regelSubtotaal(r), 0);
  const kortingTotaal = brutoTotaal - subtotaal;
  const btwBedrag = regels.reduce((s, r) => s + regelSubtotaal(r) * (r.btw_percentage / 100), 0);
  const totaal = subtotaal + btwBedrag;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">Omschrijving</TableHead>
              <TableHead className="w-20">Aantal</TableHead>
              {!hidePricing && (
                <>
                  <TableHead className="w-28">Prijs</TableHead>
                  <TableHead className="w-20">BTW %</TableHead>
                  <TableHead className="w-28">Kortingstype</TableHead>
                  <TableHead className="w-24">Korting</TableHead>
                  <TableHead className="w-28 text-right">Subtotaal</TableHead>
                </>
              )}
              {!readOnly && <TableHead className="w-10"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {regels.map((r, i) => (
              <TableRow key={i}>
                <TableCell>
                  {readOnly ? r.omschrijving : (
                    <ProductSearchInput
                      value={r.omschrijving}
                      onChangeText={(v) => {
                        // Bij vrije typen: ontkoppel eventuele product_id
                        const copy = [...regels];
                        copy[i] = { ...copy[i], omschrijving: v, product_id: undefined };
                        onChange(copy);
                      }}
                      onPickProduct={(p) => applyProduct(i, p)}
                      placeholder="Zoek product of typ vrij..."
                      voorInkoop={voorInkoop}
                    />
                  )}
                </TableCell>
                <TableCell>
                  {readOnly ? r.aantal : (
                    <Input type="number" min={1} value={r.aantal} onChange={(e) => update(i, "aantal", Number(e.target.value))} />
                  )}
                </TableCell>
                {!hidePricing && (
                  <>
                    <TableCell>
                      {readOnly ? formatCurrency(r.prijs_per_stuk) : (
                        <Input type="number" step="0.01" value={r.prijs_per_stuk} onChange={(e) => update(i, "prijs_per_stuk", Number(e.target.value))} />
                      )}
                    </TableCell>
                    <TableCell>
                      {readOnly ? `${r.btw_percentage}%` : (
                        <Select value={String(r.btw_percentage)} onValueChange={(v) => update(i, "btw_percentage", Number(v))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="21">21%</SelectItem>
                            <SelectItem value="9">9%</SelectItem>
                            <SelectItem value="0">0%</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      {readOnly ? (
                        r.korting_type === "bedrag" ? "€ bedrag" : "% percentage"
                      ) : (
                        <Select
                          value={r.korting_type}
                          onValueChange={(v: "percentage" | "bedrag") => update(i, "korting_type", v)}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">% percentage</SelectItem>
                            <SelectItem value="bedrag">€ bedrag</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      {readOnly ? (
                        r.korting_type === "bedrag" ? formatCurrency(r.korting_bedrag || 0) : `${r.korting_percentage || 0}%`
                      ) : (
                        <Input
                          type="number"
                          step="0.01"
                          value={r.korting_type === "bedrag" ? r.korting_bedrag : r.korting_percentage}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            if (r.korting_type === "bedrag") update(i, "korting_bedrag", v);
                            else update(i, "korting_percentage", v);
                          }}
                          placeholder="0"
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(regelSubtotaal(r))}</TableCell>
                  </>
                )}
                {!readOnly && (
                  <TableCell>
                    <Button size="icon" variant="ghost" onClick={() => removeRegel(i)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {!readOnly && (
        <Button variant="outline" onClick={addRegel} className="w-full">
          <Plus className="h-4 w-4 mr-2" /> Regel toevoegen
        </Button>
      )}

      {!hidePricing && (
        <div className="flex justify-end">
          <div className="w-64 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotaal (bruto)</span>
              <span>{formatCurrency(brutoTotaal)}</span>
            </div>
            {kortingTotaal > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Korting</span>
                <span>-{formatCurrency(kortingTotaal)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">BTW</span>
              <span>{formatCurrency(btwBedrag)}</span>
            </div>
            <div className="flex justify-between font-bold text-base border-t pt-1">
              <span>Totaal</span>
              <span>{formatCurrency(totaal)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
