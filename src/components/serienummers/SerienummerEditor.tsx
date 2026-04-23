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
  const [garantieMaanden, setGarantieMaanden] = useState<string>("60");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);

  const { data: producten = [] } = useQuery({
    queryKey: ["partner-producten", partnerId],
    enabled: !!partnerId,
    queryFn: async () => {
      const { data } = await supabase
        .from("producten")
        .select("id, naam, merk, model, categorie")
        .eq("partner_id", partnerId)
        .order("naam");
      return data ?? [];
    },
  });

  // Voorgestelde producten op basis van orderregels
  const gesuggereerd = useMemo(() => {
    if (!regels.length || !producten.length) return [];
    const ids = new Set<string>();
    regels.forEach((r) => {
      const m = matchProductOpRegel(r.omschrijving, producten);
      if (m) ids.add(m.id);
    });
    return Array.from(ids).map((id) => producten.find((p: any) => p.id === id)).filter(Boolean);
  }, [regels, producten]);

  useEffect(() => {
    if (!productId && gesuggereerd[0]) setProductId((gesuggereerd[0] as any).id);
  }, [gesuggereerd, productId]);

  const handleAdd = async () => {
    if (!productId || !serienr.trim()) return;
    const months = parseInt(garantieMaanden) || 0;
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
    });
    setSerienr("");
  };

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ScanBarcode className="h-4 w-4 text-primary" /> Serienummers registreren
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
            <Label className="text-xs">Garantie (mnd)</Label>
            <Input type="number" min={0} value={garantieMaanden} onChange={(e) => setGarantieMaanden(e.target.value)} />
          </div>
          <div className="sm:col-span-1 flex items-end">
            <Button onClick={handleAdd} disabled={!productId || !serienr.trim() || upsert.isPending} className="w-full" aria-label="Toevoegen">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

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