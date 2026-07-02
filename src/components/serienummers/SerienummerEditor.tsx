import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, ScanBarcode, Layers } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  useSerienummersVoorInstallatie,
  useUpsertSerienummer,
  useDeleteSerienummer,
} from "@/hooks/logistiek/useSerienummers";
import { matchProductOpRegel } from "@/lib/voorraad";
import { toast } from "sonner";

interface Props {
  installatieId: string;
  partnerId: string;
  opdrachtId?: string | null;
  klantId?: string | null;
  regels?: Array<{ omschrijving: string; aantal: number }>;
}

const SerienummerEditor = ({ installatieId, partnerId, opdrachtId, klantId, regels = [] }: Props) => {
  const { data: items = [] } = useSerienummersVoorInstallatie(installatieId);
  const upsert = useUpsertSerienummer();
  const del = useDeleteSerienummer();
  const [productId, setProductId] = useState<string>("");
  const [serienr, setSerienr] = useState("");
  const [garantieJaren, setGarantieJaren] = useState<string>("5");
  const [componentType, setComponentType] = useState<"" | "batterij" | "omvormer" | "backup_box">("");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);

  const { data: producten = [] } = useQuery({
    queryKey: ["partner-producten", partnerId],
    enabled: !!partnerId,
    queryFn: async () => {
      const { data } = await supabase
        .from("producten")
        .select("id, naam, merk, model, categorie, artikelnummer, ean_code, product_code, omvormer_modulair, heeft_backup_box")
        .eq("partner_id", partnerId)
        .order("naam");
      return data ?? [];
    },
  });

  // Haal ook de originele orderregels uit de gekoppelde opdracht op — deze bevat
  // álle regels (inclusief assemblage / losse componenten) die niet altijd naar
  // installatie.producten zijn gekopieerd.
  const { data: opdrachtRegels = [] } = useQuery({
    queryKey: ["opdracht-regels-voor-serienummers", opdrachtId],
    enabled: !!opdrachtId,
    queryFn: async () => {
      const { data } = await supabase
        .from("opdrachten")
        .select("regels")
        .eq("id", opdrachtId!)
        .maybeSingle();
      const raw = (data?.regels ?? []) as unknown;
      if (!Array.isArray(raw)) return [] as Array<{ omschrijving: string; aantal: number }>;
      return raw.map((r) => {
        const o = (r ?? {}) as Record<string, unknown>;
        return {
          omschrijving: String(o.omschrijving ?? ""),
          aantal: Number(o.aantal ?? 1) || 1,
        };
      });
    },
  });

  // Combineer de meegegeven regels (installatie.producten) met de orderregels.
  // We dedupliceren op omschrijving zodat dezelfde regel niet dubbel telt.
  const alleRegels = useMemo(() => {
    const gecombineerd = [...regels, ...opdrachtRegels];
    const seen = new Set<string>();
    const uniek: Array<{ omschrijving: string; aantal: number }> = [];
    gecombineerd.forEach((r) => {
      const key = r.omschrijving.trim().toLowerCase();
      if (!key || seen.has(key)) return;
      seen.add(key);
      uniek.push(r);
    });
    return uniek;
  }, [regels, opdrachtRegels]);

  // Alle producten uit de orderregels (incl. assemblage / meerdere regels).
  // We houden per regel het aantal bij zodat we voortgang kunnen tonen.
  const geplandePlekken = useMemo(() => {
    if (!alleRegels.length || !producten.length) return [] as Array<{ product: any; aantal: number; omschrijving: string }>;
    return alleRegels
      .map((r) => {
        const m = matchProductOpRegel(r.omschrijving, producten);
        if (!m) return null;
        return { product: m, aantal: Number(r.aantal ?? 1) || 1, omschrijving: r.omschrijving };
      })
      .filter(Boolean) as Array<{ product: any; aantal: number; omschrijving: string }>;
  }, [alleRegels, producten]);

  // Uniek gesuggereerde producten voor de dropdown (★ bovenaan).
  const gesuggereerd = useMemo(() => {
    const seen = new Set<string>();
    const uniek: any[] = [];
    geplandePlekken.forEach((g) => {
      if (!seen.has(g.product.id)) {
        seen.add(g.product.id);
        uniek.push(g.product);
      }
    });
    return uniek;
  }, [geplandePlekken]);

  useEffect(() => {
    if (!productId && gesuggereerd[0]) setProductId((gesuggereerd[0] as any).id);
  }, [gesuggereerd, productId]);

  // Als het gekozen product géén losse componenten heeft, reset component_type.
  const gekozenProduct: any = useMemo(
    () => producten.find((p: any) => p.id === productId),
    [producten, productId],
  );
  const heeftLosseComponenten = Boolean(
    gekozenProduct && (gekozenProduct.omvormer_modulair || gekozenProduct.heeft_backup_box),
  );
  useEffect(() => {
    if (!heeftLosseComponenten && componentType) setComponentType("");
  }, [heeftLosseComponenten, componentType]);

  // Aantal geregistreerde serienummers per product_id
  const geregistreerdPerProduct = useMemo(() => {
    const map = new Map<string, number>();
    items.forEach((s: any) => {
      if (!s.product_id) return;
      map.set(s.product_id, (map.get(s.product_id) ?? 0) + 1);
    });
    return map;
  }, [items]);

  const jarenNaarMaanden = (jaren: string) => {
    const j = parseFloat(jaren.replace(",", "."));
    if (!Number.isFinite(j) || j <= 0) return 0;
    return Math.round(j * 12);
  };

  const handleAdd = async () => {
    if (!productId || !serienr.trim()) return;
    const months = jarenNaarMaanden(garantieJaren);
    const garantieEind = months > 0
      ? new Date(Date.now() + months * 30 * 86400000).toISOString().slice(0, 10)
      : null;
    await upsert.mutateAsync({
      partner_id: partnerId,
      product_id: productId,
      serienummer: serienr.trim(),
      installatie_id: installatieId,
      opdracht_id: opdrachtId ?? null,
      klant_id: klantId ?? null,
      levering_datum: new Date().toISOString().slice(0, 10),
      garantie_maanden: months || null,
      garantie_einddatum: garantieEind,
      status: "geinstalleerd",
      component_type: componentType || null,
    } as any);
    setSerienr("");
  };

  const handleBulkAdd = async () => {
    if (!productId) {
      toast.error("Kies eerst een product");
      return;
    }
    const lijst = bulkText
      .split(/[\n,;\t]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (lijst.length === 0) {
      toast.error("Geen serienummers gevonden");
      return;
    }
    const months = jarenNaarMaanden(garantieJaren);
    const garantieEind = months > 0
      ? new Date(Date.now() + months * 30 * 86400000).toISOString().slice(0, 10)
      : null;
    setBulkBusy(true);
    let ok = 0;
    let fout = 0;
    for (const sn of lijst) {
      try {
        await upsert.mutateAsync({
          partner_id: partnerId,
          product_id: productId,
          serienummer: sn,
          installatie_id: installatieId,
          opdracht_id: opdrachtId ?? null,
          klant_id: klantId ?? null,
          levering_datum: new Date().toISOString().slice(0, 10),
          garantie_maanden: months || null,
          garantie_einddatum: garantieEind,
          status: "geinstalleerd",
          component_type: componentType || null,
        } as any);
        ok += 1;
      } catch {
        fout += 1;
      }
    }
    setBulkBusy(false);
    if (ok > 0) toast.success(`${ok} serienummer(s) toegevoegd${fout > 0 ? ` · ${fout} overgeslagen (duplicaat)` : ""}`);
    else if (fout > 0) toast.error(`${fout} serienummer(s) konden niet worden toegevoegd`);
    if (fout === 0) {
      setBulkText("");
      setBulkOpen(false);
    }
  };

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ScanBarcode className="h-4 w-4 text-primary" /> Serienummers registreren
          <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="ml-auto">
                <Layers className="h-4 w-4" /> Meerdere tegelijk
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bulk serienummers toevoegen</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Eén serienummer per regel (komma of puntkomma mag ook). Het gekozen product en garantie hierboven worden gebruikt.
                </p>
                <div>
                  <Label className="text-xs">Product</Label>
                  <div className="text-sm font-medium">
                    {producten.find((p: any) => p.id === productId)?.naam ?? "— Kies eerst een product hierboven —"}
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Serienummers</Label>
                  <Textarea
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    rows={8}
                    placeholder={"SN001\nSN002\nSN003"}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setBulkOpen(false)}>Annuleren</Button>
                <Button type="button" onClick={handleBulkAdd} disabled={!productId || !bulkText.trim() || bulkBusy}>
                  {bulkBusy ? "Toevoegen…" : "Toevoegen"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid sm:grid-cols-12 gap-2">
          <div className="sm:col-span-5">
            <Label className="text-xs">Product</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger><SelectValue placeholder="Kies product" /></SelectTrigger>
              <SelectContent className="max-h-72 overflow-y-auto">
                {gesuggereerd.length > 0 && (
                  <>
                    {gesuggereerd.map((p: any) => (
                      <SelectItem key={`s-${p.id}`} value={p.id}>★ {p.naam}{p.merk ? ` — ${p.merk}` : ""}</SelectItem>
                    ))}
                  </>
                )}
                {producten
                  .filter((p: any) => !gesuggereerd.find((g: any) => g.id === p.id))
                  .map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.naam}{p.merk ? ` — ${p.merk}` : ""}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-4">
            <Label className="text-xs">Serienummer</Label>
            <Input
              value={serienr}
              onChange={(e) => setSerienr(e.target.value)}
              placeholder="Scan of typ"
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
            />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs">Garantie (jaren)</Label>
            <Input
              type="number"
              min={0}
              step="0.5"
              value={garantieJaren}
              onChange={(e) => setGarantieJaren(e.target.value)}
            />
          </div>
          <div className="sm:col-span-1 flex items-end">
            <Button onClick={handleAdd} disabled={!productId || !serienr.trim() || upsert.isPending} className="w-full" aria-label="Toevoegen">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {heeftLosseComponenten && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
            <Label className="text-xs">Type component voor dit serienummer</Label>
            <Select value={componentType || "batterij"} onValueChange={(v) => setComponentType(v as any)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="batterij">Batterij</SelectItem>
                {gekozenProduct?.omvormer_modulair && <SelectItem value="omvormer">Omvormer</SelectItem>}
                {gekozenProduct?.heeft_backup_box && <SelectItem value="backup_box">Backup box</SelectItem>}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Dit product heeft losse componenten. Kies per SN welk onderdeel het betreft.
            </p>
          </div>
        )}

        {geplandePlekken.length > 0 && (
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="text-xs font-medium text-muted-foreground mb-2">Verwacht volgens order</div>
            <div className="space-y-1">
              {geplandePlekken.map((g, i) => {
                const gedaan = geregistreerdPerProduct.get(g.product.id) ?? 0;
                const compleet = gedaan >= g.aantal;
                return (
                  <div key={`${g.product.id}-${i}`} className="flex items-center justify-between gap-2 text-sm">
                    <div className="min-w-0 truncate">
                      <span className="font-medium">{g.product.naam}</span>
                      {g.product.merk ? <span className="text-muted-foreground"> — {g.product.merk}</span> : null}
                    </div>
                    <div className={`text-xs font-mono shrink-0 ${compleet ? "text-success" : "text-warning"}`}>
                      {gedaan}/{g.aantal}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nog geen serienummers geregistreerd.</p>
        ) : (
          <div className="space-y-1">
            {items.map((s) => (
              <div key={s.id} className="flex items-center gap-2 text-sm border rounded-lg px-3 py-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{s.product_naam ?? "Product"}</div>
                  <div className="text-xs text-muted-foreground">
                    SN: <span className="font-mono">{s.serienummer}</span>
                    {s.garantie_einddatum && ` · Garantie t/m ${new Date(s.garantie_einddatum).toLocaleDateString("nl-NL")}`}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => del.mutate(s.id)} aria-label="Verwijder">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SerienummerEditor;