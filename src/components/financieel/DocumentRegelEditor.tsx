import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronDown, ChevronRight, Package, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useProductMetaMap } from "@/hooks/producten/useProductMetaMap";
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
  const productIds = useMemo(
    () => Array.from(new Set(regels.map((r) => r.product_id).filter((id): id is string => !!id))),
    [regels],
  );
  const { data: metaMap = {} } = useProductMetaMap(productIds);
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
  const toggleExpand = (i: number) => setExpandedRows((p) => ({ ...p, [i]: !p[i] }));

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
              <>
              <TableRow key={`row-${i}`}>
                <TableCell>
                  {(() => {
                    const meta = r.product_id ? metaMap[r.product_id] : undefined;
                    const isAssemblage = !!meta?.is_assemblage && (meta?.componenten.length ?? 0) > 0;
                    return (
                      <div className="flex items-start gap-1">
                        {isAssemblage && (
                          <button
                            type="button"
                            onClick={() => toggleExpand(i)}
                            className="mt-2 text-muted-foreground hover:text-foreground"
                            title={expandedRows[i] ? "Componenten verbergen" : "Componenten tonen"}
                          >
                            {expandedRows[i] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                        )}
                        <div className="flex-1 min-w-0">
                          {readOnly ? (
                            <span className="flex items-center gap-2">
                              {isAssemblage && <Package className="h-3.5 w-3.5 text-muted-foreground" />}
                              {r.omschrijving}
                            </span>
                          ) : (
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
                          {!hidePricing && !voorInkoop && r.product_id && meta?.kostprijs != null && r.prijs_per_stuk > 0 && (() => {
                            const k = meta.kostprijs as number;
                    const marge = ((r.prijs_per_stuk - k) / r.prijs_per_stuk) * 100;
                    const kleur = marge >= 20
                      ? "bg-success/10 text-success"
                      : marge >= 10
                      ? "bg-warning/10 text-warning-foreground"
                      : "bg-destructive/10 text-destructive";
                    return (
                      <span
                        className={`inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${kleur}`}
                        title={`Kostprijs ${formatCurrency(k)} → Marge ${marge.toFixed(1)}%`}
                      >
                        Marge {marge.toFixed(1)}%
                      </span>
                    );
                  })()}
                          {isAssemblage && (
                            <span className="ml-2 inline-block text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                              Bundel · {meta!.componenten.length} onderdelen
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}
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
              {(() => {
                const meta = r.product_id ? metaMap[r.product_id] : undefined;
                if (!meta?.is_assemblage || !expandedRows[i] || meta.componenten.length === 0) return null;
                const colSpan = 1 + 1 + (hidePricing ? 0 : 5) + (readOnly ? 0 : 1);
                return (
                  <TableRow key={`sub-${i}`} className="bg-muted/30">
                    <TableCell colSpan={colSpan} className="py-2">
                      <div className="pl-6 text-xs">
                        <div className="font-medium text-muted-foreground mb-1">Componenten in deze bundel:</div>
                        <ul className="space-y-0.5">
                          {meta.componenten.map((c) => (
                            <li key={c.component_id} className="flex items-center gap-2">
                              <span className="text-muted-foreground">•</span>
                              <span>{c.aantal}× {[c.merk, c.naam].filter(Boolean).join(" ")}</span>
                              {c.heeft_serienummer && (
                                <span className="text-[9px] px-1 py-0.5 rounded bg-primary/10 text-primary">SN</span>
                              )}
                            </li>
                          ))}
                        </ul>
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
