import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Package, Pencil, Save, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import InstallatieProductenEditor, { type InstallatieProductRegel } from "./InstallatieProductenEditor";
import type { Installatie } from "./api/installatieApi";
import { updateInstallatie } from "./api/installatieApi";

function normaliseer(raw: unknown): InstallatieProductRegel[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((r) => {
    const obj = (r ?? {}) as Record<string, unknown>;
    return {
      product_id: (obj.product_id as string | undefined) ?? null,
      omschrijving: String(obj.omschrijving ?? ""),
      aantal: Number(obj.aantal ?? 1),
    };
  });
}

export default function InstallatieProductenCard({
  installatie,
  onChanged,
}: {
  installatie: Installatie;
  onChanged?: () => void;
}) {
  const initieel = normaliseer(installatie.producten);
  const [edit, setEdit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [regels, setRegels] = useState<InstallatieProductRegel[]>(initieel);

  useEffect(() => {
    setRegels(normaliseer(installatie.producten));
  }, [installatie.id, installatie.producten]);

  const opslaan = async () => {
    setBusy(true);
    try {
      await updateInstallatie(installatie.id, {
        producten: regels as unknown as Installatie["producten"],
      });
      toast.success("Producten opgeslagen");
      setEdit(false);
      onChanged?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Opslaan mislukt");
    } finally {
      setBusy(false);
    }
  };

  const importerenUitOpdracht = async () => {
    if (!installatie.opdracht_id) {
      toast.error("Geen gekoppelde opdracht");
      return;
    }
    const { data, error } = await supabase
      .from("opdrachten")
      .select("regels")
      .eq("id", installatie.opdracht_id)
      .maybeSingle();
    if (error || !data) {
      toast.error("Kon opdracht niet ophalen");
      return;
    }
    const bron = normaliseer(data.regels);
    if (bron.length === 0) {
      toast.info("Opdracht heeft geen productregels");
      return;
    }
    setRegels(bron);
    setEdit(true);
    toast.success(`${bron.length} regels overgenomen — vergeet niet op te slaan`);
  };

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" /> Producten / werkzaamheden
        </CardTitle>
        <div className="flex gap-1">
          {installatie.opdracht_id ? (
            <Button variant="ghost" size="sm" onClick={importerenUitOpdracht} title="Importeer regels uit gekoppelde opdracht">
              <RefreshCw className="h-4 w-4 mr-1" /> Uit opdracht
            </Button>
          ) : null}
          {edit ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setRegels(normaliseer(installatie.producten));
                  setEdit(false);
                }}
                disabled={busy}
              >
                <X className="h-4 w-4 mr-1" /> Annuleren
              </Button>
              <Button size="sm" onClick={opslaan} disabled={busy}>
                <Save className="h-4 w-4 mr-1" /> {busy ? "Opslaan…" : "Opslaan"}
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setEdit(true)}>
              <Pencil className="h-4 w-4 mr-1" /> Wijzigen
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {edit ? (
          <InstallatieProductenEditor
            partnerId={installatie.partner_id}
            value={regels}
            onChange={setRegels}
          />
        ) : regels.length === 0 ? (
          <p className="text-sm text-muted-foreground">Geen producten gekoppeld</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Omschrijving</TableHead>
                <TableHead className="text-right w-20">Aantal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regels.map((r, i) => (
                <TableRow key={i}>
                  <TableCell>{r.omschrijving || "—"}</TableCell>
                  <TableCell className="text-right">{r.aantal ?? 1}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}