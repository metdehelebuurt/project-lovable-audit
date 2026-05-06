import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, Copy, AlertTriangle, Plus } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type ProductCategorie = Database["public"]["Enums"]["product_categorie"];

export interface AIProduct {
  naam: string;
  model: string;
  merk: string;
  omschrijving: string;
  prijs_excl_btw: number;
  garantie_jaren?: number;
  certificeringen?: string;
  specs?: Record<string, string>;
  categorie: ProductCategorie;
  warnings?: string[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  step: "input" | "preview";
  onStepChange: (s: "input" | "preview") => void;
  merk: string;
  onMerkChange: (m: string) => void;
  categorie: ProductCategorie;
  onCategorieChange: (c: ProductCategorie) => void;
  categorieLabels: Record<ProductCategorie, string>;
  loading: boolean;
  products: AIProduct[];
  selected: Set<number>;
  onToggleSelect: (i: number) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  onSelectNew: () => void;
  existingNames: string[];
  isDuplicate: (p: AIProduct, names: string[]) => boolean;
  onSearch: () => void;
  onImport: () => void;
  formatPrice: (n: number) => string;
}

export default function AiImportDialog(props: Props) {
  const {
    open, onClose, step, onStepChange,
    merk, onMerkChange, categorie, onCategorieChange, categorieLabels,
    loading, products, selected, onToggleSelect, onSelectAll, onSelectNone, onSelectNew,
    existingNames, isDuplicate, onSearch, onImport, formatPrice,
  } = props;

  const duplicateCount = products.filter((p) => isDuplicate(p, existingNames)).length;
  const warningCount = products.filter((p) => p.warnings && p.warnings.length > 0).length;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Product Import
          </DialogTitle>
        </DialogHeader>

        {step === "input" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Voer een merknaam en categorie in. AI zoekt automatisch het volledige productassortiment op met alle varianten en technische specificaties (tot 50 producten per keer).
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Merknaam *</Label>
                <Input placeholder="bijv. SolarEdge, Enphase, Daikin..." value={merk} onChange={(e) => onMerkChange(e.target.value)} className="rounded-xl" />
              </div>
              <div>
                <Label>Categorie *</Label>
                <Select value={categorie} onValueChange={(v) => onCategorieChange(v as ProductCategorie)}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(categorieLabels) as ProductCategorie[]).map((c) => (
                      <SelectItem key={c} value={c}>{categorieLabels[c]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} className="rounded-pill">Annuleren</Button>
              <Button onClick={onSearch} disabled={loading} className="rounded-pill gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {loading ? "Zoeken..." : "Producten ophalen"}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  <strong>{products.length}</strong> producten gevonden voor <strong>{merk}</strong> · <strong>{selected.size}</strong> geselecteerd
                </p>
                {(duplicateCount > 0 || warningCount > 0) && (
                  <div className="flex gap-2 text-xs">
                    {duplicateCount > 0 && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Copy className="h-3 w-3" /> {duplicateCount} duplica{duplicateCount === 1 ? "at" : "ten"}
                      </span>
                    )}
                    {warningCount > 0 && (
                      <span className="flex items-center gap-1 text-warning-foreground">
                        <AlertTriangle className="h-3 w-3" /> {warningCount} waarschuwing{warningCount === 1 ? "" : "en"}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={onSelectNew}>Selecteer nieuw</Button>
                <Button variant="ghost" size="sm" onClick={onSelectAll}>Alles</Button>
                <Button variant="ghost" size="sm" onClick={onSelectNone}>Niets</Button>
              </div>
            </div>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {products.map((product, idx) => {
                const duplicate = isDuplicate(product, existingNames);
                const hasWarnings = product.warnings && product.warnings.length > 0;
                return (
                  <Card key={idx} className={`rounded-xl border cursor-pointer transition-colors ${
                    selected.has(idx) ? "border-primary bg-primary/5" : duplicate ? "border-muted bg-muted/30 opacity-60" : "border-border"
                  }`} onClick={() => onToggleSelect(idx)}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox checked={selected.has(idx)} onCheckedChange={() => onToggleSelect(idx)} className="mt-1" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <p className="font-medium text-foreground truncate">{product.naam}</p>
                              {duplicate && <Badge variant="outline" className="text-xs shrink-0 border-warning-foreground text-warning-foreground"><Copy className="h-3 w-3 mr-1" /> Bestaat al</Badge>}
                              {hasWarnings && <Badge variant="outline" className="text-xs shrink-0 border-destructive text-destructive"><AlertTriangle className="h-3 w-3 mr-1" /> Let op</Badge>}
                            </div>
                            <p className="text-sm font-semibold text-primary whitespace-nowrap">{formatPrice(product.prijs_excl_btw)}</p>
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">{product.model} · {product.merk}</p>
                          {product.omschrijving && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.omschrijving}</p>}
                          {hasWarnings && (
                            <div className="mt-1.5 space-y-0.5">
                              {product.warnings!.map((w, wi) => (
                                <p key={wi} className="text-xs text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3 shrink-0" /> {w}</p>
                              ))}
                            </div>
                          )}
                          {product.specs && Object.keys(product.specs).length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {Object.entries(product.specs).slice(0, 6).map(([key, val]) => (
                                <Badge key={key} variant="outline" className="text-xs font-normal">{key}: {val}</Badge>
                              ))}
                              {Object.keys(product.specs).length > 6 && (
                                <Badge variant="outline" className="text-xs font-normal text-muted-foreground">+{Object.keys(product.specs).length - 6} meer</Badge>
                              )}
                            </div>
                          )}
                          <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                            {product.garantie_jaren && <span>Garantie: {product.garantie_jaren} jaar</span>}
                            {product.certificeringen && <span>{product.certificeringen}</span>}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onStepChange("input")} className="rounded-pill">Terug</Button>
              <Button onClick={onImport} disabled={loading || selected.size === 0} className="rounded-pill gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {loading ? "Importeren..." : `${selected.size} producten importeren`}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}