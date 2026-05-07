import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Globe, EyeOff, Loader2, Zap } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Product = Database["public"]["Tables"]["producten"]["Row"];
type ProductCategorie = Database["public"]["Enums"]["product_categorie"];

interface Props {
  producten: Product[];
  partnerId: string | null | undefined;
  hasWebshopModule: boolean;
  categorieLabels: Record<ProductCategorie, string>;
}

type BusyKey = "show" | "hide" | "all-show" | "all-hide" | null;

export default function BulkWebsiteToggle({ producten, partnerId, hasWebshopModule, categorieLabels }: Props) {
  const qc = useQueryClient();
  const [scope, setScope] = useState<string>("");
  const [busy, setBusy] = useState<BusyKey>(null);

  const partnerProducten = useMemo(
    () => producten.filter((p) => p.partner_id === partnerId),
    [producten, partnerId]
  );

  const actieveProducten = useMemo(
    () => partnerProducten.filter((p) => (p as any).status === "actief"),
    [partnerProducten]
  );

  const zichtbaarCount = useMemo(
    () => actieveProducten.filter((p) => (p as any).toon_op_website === true).length,
    [actieveProducten]
  );

  const merken = useMemo(() => {
    const s = new Set<string>();
    partnerProducten.forEach((p) => p.merk && s.add(p.merk));
    return Array.from(s).sort();
  }, [partnerProducten]);

  const categorieen = useMemo(() => {
    const s = new Set<ProductCategorie>();
    partnerProducten.forEach((p) => s.add(p.categorie));
    return Array.from(s);
  }, [partnerProducten]);

  const targetIds = useMemo(() => {
    if (!scope) return [];
    if (scope.startsWith("merk:")) {
      const m = scope.slice(5);
      return partnerProducten.filter((p) => p.merk === m).map((p) => p.id);
    }
    if (scope.startsWith("cat:")) {
      const c = scope.slice(4) as ProductCategorie;
      return partnerProducten.filter((p) => p.categorie === c).map((p) => p.id);
    }
    return [];
  }, [scope, partnerProducten]);

  const updateMany = async (ids: string[], toon: boolean) => {
    if (ids.length === 0) return 0;
    const { error } = await supabase
      .from("producten")
      .update({ toon_op_website: toon } as any)
      .in("id", ids);
    if (error) throw error;
    return ids.length;
  };

  const toggle = useMutation({
    mutationFn: async (toon: boolean) => updateMany(targetIds, toon),
    onSuccess: (count, toon) => {
      qc.invalidateQueries({ queryKey: ["producten"] });
      toast.success(`${count} producten ${toon ? "zichtbaar gemaakt" : "verborgen"} op website`);
      setBusy(null);
    },
    onError: (e: Error) => {
      toast.error("Bulk-actie mislukt", { description: e.message });
      setBusy(null);
    },
  });

  const toggleAll = useMutation({
    mutationFn: async (toon: boolean) => updateMany(actieveProducten.map((p) => p.id), toon),
    onSuccess: (count, toon) => {
      qc.invalidateQueries({ queryKey: ["producten"] });
      toast.success(
        `${count} actieve producten ${toon ? "direct online gezet" : "verborgen"} – nu zichtbaar in de Partner API`,
      );
      setBusy(null);
    },
    onError: (e: Error) => {
      toast.error("Bulk-actie mislukt", { description: e.message });
      setBusy(null);
    },
  });

  if (!hasWebshopModule) return null;
  if (partnerProducten.length === 0) return null;

  const handle = (toon: boolean) => {
    if (targetIds.length === 0) {
      toast.error("Kies eerst een merk of categorie");
      return;
    }
    setBusy(toon ? "show" : "hide");
    toggle.mutate(toon);
  };

  const handleAll = (toon: boolean) => {
    if (actieveProducten.length === 0) return;
    const verb = toon ? "online zetten" : "verbergen";
    const ok = window.confirm(
      `Weet je zeker dat je álle ${actieveProducten.length} actieve producten wilt ${verb}? Dit is direct zichtbaar in de Partner API.`,
    );
    if (!ok) return;
    setBusy(toon ? "all-show" : "all-hide");
    toggleAll.mutate(toon);
  };

  const totaal = actieveProducten.length;
  const verborgen = totaal - zichtbaarCount;

  return (
    <Card className="rounded-2xl border-0 shadow-sm p-4 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Globe className="h-4 w-4 text-primary" />
          <span className="font-medium">Zichtbaarheid op website &amp; API</span>
          <span className="text-muted-foreground">
            – {zichtbaarCount} van {totaal} actieve producten online
            {verborgen > 0 ? ` (${verborgen} nog verborgen)` : ""}
          </span>
        </div>
        <div className="flex gap-2 sm:ml-auto">
          <Button
            variant="outline"
            size="sm"
            className="rounded-pill gap-2"
            disabled={busy !== null || zichtbaarCount === 0}
            onClick={() => handleAll(false)}
          >
            {busy === "all-hide" ? <Loader2 className="h-4 w-4 animate-spin" /> : <EyeOff className="h-4 w-4" />}
            Alles verbergen
          </Button>
          <Button
            size="sm"
            className="rounded-pill gap-2"
            disabled={busy !== null || verborgen === 0}
            onClick={() => handleAll(true)}
          >
            {busy === "all-show" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Alles direct online ({verborgen})
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-t pt-3">
        <div className="text-xs text-muted-foreground">Of per merk / categorie:</div>
        <Select value={scope} onValueChange={setScope}>
          <SelectTrigger className="w-64 rounded-xl">
            <SelectValue placeholder="Kies merk of categorie..." />
          </SelectTrigger>
          <SelectContent>
            {merken.length > 0 && (
              <>
                <SelectItem value="__merken__" disabled>— Merken —</SelectItem>
                {merken.map((m) => (
                  <SelectItem key={`m-${m}`} value={`merk:${m}`}>{m}</SelectItem>
                ))}
              </>
            )}
            <SelectItem value="__cats__" disabled>— Categorieën —</SelectItem>
            {categorieen.map((c) => (
              <SelectItem key={`c-${c}`} value={`cat:${c}`}>{categorieLabels[c]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">{targetIds.length} producten</span>
        <div className="flex gap-2 sm:ml-auto">
          <Button
            variant="outline"
            size="sm"
            className="rounded-pill gap-2"
            disabled={busy !== null || targetIds.length === 0}
            onClick={() => handle(false)}
          >
            {busy === "hide" ? <Loader2 className="h-4 w-4 animate-spin" /> : <EyeOff className="h-4 w-4" />}
            Verberg
          </Button>
          <Button
            size="sm"
            className="rounded-pill gap-2"
            disabled={busy !== null || targetIds.length === 0}
            onClick={() => handle(true)}
          >
            {busy === "show" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
            Toon op website
          </Button>
        </div>
      </div>
    </Card>
  );
}
