import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Link } from "react-router-dom";
import ProductImageUpload from "@/components/producten/ProductImageUpload";
import SpecsEditor from "@/components/producten/SpecsEditor";
import ProductDatasheetSection from "@/components/producten/ProductDatasheetSection";
import KostprijsHistoriePopover from "@/components/producten/KostprijsHistoriePopover";
import type { Database } from "@/integrations/supabase/types";

type Product = Database["public"]["Tables"]["producten"]["Row"];
type ProductCategorie = Database["public"]["Enums"]["product_categorie"];
type ProductStatus = Database["public"]["Enums"]["product_status"];

export interface ProductFormData {
  naam: string;
  categorie: ProductCategorie;
  merk: string;
  model: string;
  omschrijving: string;
  offerte_tekst: string;
  prijs_excl_btw: number;
  kostprijs: number | null;
  eenheid: string;
  voorraad: number | null;
  min_voorraad: number | null;
  btw_percentage: number;
  max_korting_euro: number | null;
  max_korting_percentage: number | null;
  product_code: string;
  leverancier: string;
  artikelnummer: string;
  ean_code: string;
  levertijd: string;
  garantie_jaren: number | null;
  certificeringen: string;
  status: ProductStatus;
  afbeelding_url: string | null;
  afbeeldingen: string[];
  specs: Record<string, string>;
  datasheet_url: string | null;
  datasheet_type: string | null;
  heeft_serienummer: boolean;
  is_assemblage: boolean;
  prijs_strategie: "vast" | "som_componenten";
  marge_opslag_percentage: number;
  omvormer_modulair: boolean;
  heeft_backup_box: boolean;
}

interface Props {
  form: ProductFormData;
  setForm: (updater: (p: ProductFormData) => ProductFormData) => void;
  editingProduct: Product | null;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  categorieLabels: Record<ProductCategorie, string>;
  statusLabels: Record<ProductStatus, string>;
  merken?: string[];
}

export default function ProductInlineForm({
  form, setForm, editingProduct, isPending, onClose, onSubmit, categorieLabels, statusLabels, merken = [],
}: Props) {
  const formProductId = editingProduct?.id || "new-product";
  const NONE_VALUE = "__none__";
  const merkOptions = Array.from(new Set(merken.filter((m) => !!m && m.trim() !== ""))).sort((a, b) => a.localeCompare(b));
  const currentMerk = form.merk?.trim() ?? "";
  const merkMissing = currentMerk !== "" && !merkOptions.some((m) => m.toLowerCase() === currentMerk.toLowerCase());

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {editingProduct ? "Product bewerken" : "Nieuw product"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Basisgegevens</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><Label>Productnaam *</Label><Input value={form.naam} onChange={e => setForm(p => ({ ...p, naam: e.target.value }))} required className="rounded-xl" /></div>
              <div>
                <Label>Categorie *</Label>
                <Select value={form.categorie} onValueChange={v => setForm(p => ({ ...p, categorie: v as ProductCategorie }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(categorieLabels) as ProductCategorie[]).map(c => (
                      <SelectItem key={c} value={c}>{categorieLabels[c]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v as ProductStatus }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(statusLabels) as ProductStatus[]).map(s => (
                      <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Merk</Label>
                <Select
                  value={currentMerk === "" ? NONE_VALUE : currentMerk}
                  onValueChange={(v) => setForm((p) => ({ ...p, merk: v === NONE_VALUE ? "" : v }))}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Kies een merk" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>— Geen merk —</SelectItem>
                    {merkMissing && (
                      <SelectItem value={currentMerk}>{currentMerk} (niet in merkenbeheer)</SelectItem>
                    )}
                    {merkOptions.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    Merk niet in de lijst? Voeg het eerst toe via Merkenbeheer.
                  </p>
                  <Link
                    to="/producten/merken"
                    className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1 shrink-0"
                  >
                    <Plus className="h-3 w-3" /> Nieuw merk
                  </Link>
                </div>
              </div>
              <div><Label>Model</Label><Input value={form.model} onChange={e => setForm(p => ({ ...p, model: e.target.value }))} className="rounded-xl" /></div>
              <div className="col-span-2"><Label>Omschrijving</Label><Textarea value={form.omschrijving} onChange={e => setForm(p => ({ ...p, omschrijving: e.target.value }))} className="rounded-xl" rows={3} /></div>
              <div className="col-span-2">
                <Label>Tekst op offerte</Label>
                <p className="text-xs text-muted-foreground mb-1">Deze tekst wordt automatisch getoond op offertes onder de productregel.</p>
                <Textarea value={form.offerte_tekst} onChange={e => setForm(p => ({ ...p, offerte_tekst: e.target.value }))} className="rounded-xl" rows={3} placeholder="Bijv. inclusief montage, 25 jaar vermogensgarantie..." />
              </div>
            </div>
          </div>

          {editingProduct && (
            <ProductImageUpload
              productId={formProductId}
              mainImage={form.afbeelding_url}
              galleryImages={form.afbeeldingen}
              merk={form.merk}
              naam={form.naam}
              onMainImageChange={(url) => setForm(p => ({ ...p, afbeelding_url: url }))}
              onGalleryChange={(urls) => setForm(p => ({ ...p, afbeeldingen: urls }))}
            />
          )}

          <SpecsEditor
            specs={form.specs}
            onChange={(specs) => setForm(p => ({ ...p, specs }))}
            categorie={form.categorie}
          />

          {editingProduct && (
            <ProductDatasheetSection
              productId={editingProduct.id}
              productData={{
                naam: form.naam, merk: form.merk, model: form.model,
                categorie: form.categorie, omschrijving: form.omschrijving,
                specs: form.specs, certificeringen: form.certificeringen,
                garantie_jaren: form.garantie_jaren,
                prijs_excl_btw: form.prijs_excl_btw,
                afbeelding_url: form.afbeelding_url,
              }}
              datasheetUrl={form.datasheet_url}
              datasheetType={form.datasheet_type}
              onDatasheetChange={(url, type) => setForm(p => ({ ...p, datasheet_url: url, datasheet_type: type }))}
              onSpecsUpdate={(specs) => setForm(p => ({ ...p, specs }))}
              onOmschrijvingUpdate={(omschrijving) => setForm(p => ({ ...p, omschrijving }))}
              partnerId={editingProduct.partner_id}
            />
          )}

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Prijzen & Voorraad</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Verkoopprijs excl. BTW *</Label><Input type="number" step="0.01" value={form.prijs_excl_btw} onChange={e => setForm(p => ({ ...p, prijs_excl_btw: parseFloat(e.target.value) || 0 }))} required className="rounded-xl" /></div>
              <div>
                <div className="flex items-center justify-between">
                  <Label>Inkoopprijs (kostprijs)</Label>
                  {editingProduct?.id && <KostprijsHistoriePopover productId={editingProduct.id} />}
                </div>
                <Input type="number" step="0.01" value={form.kostprijs ?? ""} onChange={e => setForm(p => ({ ...p, kostprijs: e.target.value ? parseFloat(e.target.value) : null }))} className="rounded-xl" />
                {form.kostprijs != null && form.prijs_excl_btw > 0 && (() => {
                  const marge = ((form.prijs_excl_btw - form.kostprijs) / form.prijs_excl_btw) * 100;
                  const kleur = marge >= 20 ? "text-success" : marge >= 10 ? "text-warning-foreground" : "text-error";
                  return <p className={`text-xs mt-1 font-medium ${kleur}`}>Marge: {marge.toFixed(1)}%</p>;
                })()}
              </div>
              <div><Label>BTW %</Label><Input type="number" value={form.btw_percentage} onChange={e => setForm(p => ({ ...p, btw_percentage: parseInt(e.target.value) || 21 }))} className="rounded-xl" /></div>
              <div>
                <Label>Eenheid</Label>
                <Select value={form.eenheid} onValueChange={v => setForm(p => ({ ...p, eenheid: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["stuk", "m2", "meter", "set", "uur"].map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Voorraad</Label><Input type="number" value={form.voorraad ?? ""} onChange={e => setForm(p => ({ ...p, voorraad: e.target.value ? parseInt(e.target.value) : null }))} className="rounded-xl" /></div>
              <div><Label>Min. voorraad (waarschuwing)</Label><Input type="number" min="0" value={form.min_voorraad ?? ""} onChange={e => setForm(p => ({ ...p, min_voorraad: e.target.value ? parseInt(e.target.value) : null }))} className="rounded-xl" /></div>
              <div><Label>Max korting €</Label><Input type="number" step="0.01" value={form.max_korting_euro ?? ""} onChange={e => setForm(p => ({ ...p, max_korting_euro: e.target.value ? parseFloat(e.target.value) : null }))} className="rounded-xl" /></div>
              <div><Label>Max korting %</Label><Input type="number" step="0.1" value={form.max_korting_percentage ?? ""} onChange={e => setForm(p => ({ ...p, max_korting_percentage: e.target.value ? parseFloat(e.target.value) : null }))} className="rounded-xl" /></div>
            </div>
            <div className="rounded-xl border p-4 space-y-3 bg-muted/30">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label className="text-sm">Heeft serienummer</Label>
                  <p className="text-xs text-muted-foreground">Bij oplevering wordt per stuk een SN gevraagd.</p>
                </div>
                <Switch checked={form.heeft_serienummer} onCheckedChange={(v) => setForm(p => ({ ...p, heeft_serienummer: v }))} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label className="text-sm">Samengesteld product (assemblage)</Label>
                  <p className="text-xs text-muted-foreground">Combineer meerdere producten tot één bundel. Beheer de stuklijst via de module Samengestelde producten.</p>
                </div>
                <Switch checked={form.is_assemblage} onCheckedChange={(v) => setForm(p => ({ ...p, is_assemblage: v }))} />
              </div>
              {form.is_assemblage && (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div>
                    <Label>Prijsstrategie</Label>
                    <Select value={form.prijs_strategie} onValueChange={(v) => setForm(p => ({ ...p, prijs_strategie: v as "vast" | "som_componenten" }))}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vast">Vaste bundelprijs</SelectItem>
                        <SelectItem value="som_componenten">Som van componenten + opslag</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {form.prijs_strategie === "som_componenten" && (
                    <div>
                      <Label>Opslag / marge (%)</Label>
                      <Input type="number" step="0.1" value={form.marge_opslag_percentage} onChange={e => setForm(p => ({ ...p, marge_opslag_percentage: parseFloat(e.target.value) || 0 }))} className="rounded-xl" />
                    </div>
                  )}
                  <div className="col-span-2 text-xs text-muted-foreground bg-primary/5 rounded-lg p-2 border border-primary/20">
                    {editingProduct ? (
                      <>
                        Componenten (stuklijst) beheer je in de speciale bundel-editor.{" "}
                        <Link to={`/producten/assemblages/${editingProduct.id}`} className="text-primary underline">
                          Open bundel-editor →
                        </Link>
                      </>
                    ) : (
                      <>Sla eerst op, dan kun je componenten toevoegen via <Link to="/producten/assemblages" className="text-primary underline">Samengestelde producten</Link>.</>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Leverancier & Codes</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Product code</Label><Input value={form.product_code} onChange={e => setForm(p => ({ ...p, product_code: e.target.value }))} className="rounded-xl" /></div>
              <div><Label>Leverancier</Label><Input value={form.leverancier} onChange={e => setForm(p => ({ ...p, leverancier: e.target.value }))} className="rounded-xl" /></div>
              <div><Label>Artikelnummer</Label><Input value={form.artikelnummer} onChange={e => setForm(p => ({ ...p, artikelnummer: e.target.value }))} className="rounded-xl" /></div>
              <div><Label>EAN code</Label><Input value={form.ean_code} onChange={e => setForm(p => ({ ...p, ean_code: e.target.value }))} className="rounded-xl" /></div>
              <div><Label>Levertijd</Label><Input value={form.levertijd} onChange={e => setForm(p => ({ ...p, levertijd: e.target.value }))} className="rounded-xl" /></div>
              <div><Label>Garantie (jaren)</Label><Input type="number" value={form.garantie_jaren ?? ""} onChange={e => setForm(p => ({ ...p, garantie_jaren: e.target.value ? parseInt(e.target.value) : null }))} className="rounded-xl" /></div>
              <div className="col-span-2"><Label>Certificeringen</Label><Input value={form.certificeringen} onChange={e => setForm(p => ({ ...p, certificeringen: e.target.value }))} className="rounded-xl" /></div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-pill">Annuleren</Button>
            <Button type="submit" className="rounded-pill" disabled={isPending}>
              {isPending ? "Opslaan..." : editingProduct ? "Bijwerken" : "Aanmaken"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}