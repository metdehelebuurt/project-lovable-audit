import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Wand2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useSNToewijzing, useOpslaanSNToewijzing, type SNAssignment, type SNTarget } from "@/hooks/logistiek/useSNToewijzing";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import SNToewijzingLog from "./SNToewijzingLog";

interface Regel { omschrijving: string; aantal: number }

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  opdrachtId: string;
  partnerId: string;
  regels: Regel[];
}

interface Slot {
  key: string;
  target: SNTarget;
  slotIndex: number;
  mode: "voorraad" | "handmatig";
  existingId: string | null; // gekozen SN uit voorraad of reeds toegewezen
  handmatig: string;
}

const initialSlots = (targets: SNTarget[], toegewezen: Record<string, { id: string; serienummer: string }[]>): Slot[] => {
  const usedById: Record<string, Set<string>> = {};
  const slots: Slot[] = [];
  targets.forEach((t) => {
    const pool = [...(toegewezen[t.componentProductId] || [])];
    const used = (usedById[t.componentProductId] ||= new Set());
    for (let i = 0; i < t.benodigd; i++) {
      const preset = pool.find((p) => !used.has(p.id));
      if (preset) used.add(preset.id);
      slots.push({
        key: `${t.regelIndex}-${t.componentProductId}-${i}`,
        target: t,
        slotIndex: i,
        mode: "voorraad",
        existingId: preset?.id ?? null,
        handmatig: "",
      });
    }
  });
  return slots;
};

const SNToewijzingDialog = ({ open, onOpenChange, opdrachtId, partnerId, regels }: Props) => {
  const { data, isLoading } = useSNToewijzing(opdrachtId, partnerId, regels);
  const opslaan = useOpslaanSNToewijzing(opdrachtId, partnerId);
  const [slots, setSlots] = useState<Slot[]>([]);

  useEffect(() => {
    if (data) setSlots(initialSlots(data.targets, data.toegewezen));
  }, [data]);

  const gebruiktIds = useMemo(() => {
    const per: Record<string, Set<string>> = {};
    slots.forEach((s) => {
      if (s.mode === "voorraad" && s.existingId) {
        (per[s.target.componentProductId] ||= new Set()).add(s.existingId);
      }
    });
    return per;
  }, [slots]);

  const updateSlot = (key: string, patch: Partial<Slot>) => {
    setSlots((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  };

  const autoVullen = () => {
    if (!data) return;
    setSlots((prev) => {
      const gebruikt: Record<string, Set<string>> = {};
      return prev.map((s) => {
        if (s.mode === "handmatig" && s.handmatig.trim()) return s;
        const pid = s.target.componentProductId;
        const used = (gebruikt[pid] ||= new Set());
        // Behoud al gekozen SN indien nog geldig
        if (s.existingId && !used.has(s.existingId)) {
          used.add(s.existingId);
          return { ...s, mode: "voorraad", existingId: s.existingId };
        }
        const beschikbaar = data.beschikbaar[pid] || [];
        const reeds = data.toegewezen[pid] || [];
        const alle = [...reeds, ...beschikbaar];
        const vrij = alle.find((sn) => !used.has(sn.id));
        if (vrij) {
          used.add(vrij.id);
          return { ...s, mode: "voorraad", existingId: vrij.id, handmatig: "" };
        }
        return { ...s, mode: "voorraad", existingId: null };
      });
    });
  };

  const opslaanKlik = async () => {
    const assignments: SNAssignment[] = [];
    for (const s of slots) {
      if (s.mode === "voorraad" && s.existingId) {
        assignments.push({ product_id: s.target.componentProductId, serienummer: "", existing_id: s.existingId });
      } else if (s.mode === "handmatig" && s.handmatig.trim()) {
        assignments.push({ product_id: s.target.componentProductId, serienummer: s.handmatig.trim(), existing_id: null });
      }
    }
    // Filter voorraad-assignments zonder SN string
    const cleaned: SNAssignment[] = [];
    for (const a of assignments) {
      if (a.existing_id) cleaned.push(a);
      else if (a.serienummer) cleaned.push(a);
    }
    try {
      await opslaan.mutateAsync(cleaned);
      toast.success("Serienummers toegewezen");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Toewijzing mislukt");
    }
  };

  // Groepeer slots per regel + component
  const groepen = useMemo(() => {
    const map = new Map<string, { target: SNTarget; slots: Slot[] }>();
    slots.forEach((s) => {
      const k = `${s.target.regelIndex}-${s.target.componentProductId}`;
      if (!map.has(k)) map.set(k, { target: s.target, slots: [] });
      map.get(k)!.slots.push(s);
    });
    return Array.from(map.values());
  }, [slots]);

  const totaalBenodigd = slots.length;
  const totaalIngevuld = slots.filter((s) => (s.mode === "voorraad" && s.existingId) || (s.mode === "handmatig" && s.handmatig.trim())).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Serienummers toewijzen</DialogTitle>
          <DialogDescription>
            Wijs beschikbare serienummers uit voorraad toe aan deze opdracht, of voer nieuwe handmatig in (bijv. bij binnenkomst zonder inkoop-boeking).
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="toewijzen" className="w-full">
          <TabsList>
            <TabsTrigger value="toewijzen">Toewijzen</TabsTrigger>
            <TabsTrigger value="historie">Historie</TabsTrigger>
          </TabsList>
          <TabsContent value="toewijzen" className="space-y-4">
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" /> Laden...
          </div>
        )}

        {!isLoading && groepen.length === 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Geen producten met serienummers gevonden in deze opdracht. Zet "Heeft serienummer" aan op het product of stuklijst-component.
            </AlertDescription>
          </Alert>
        )}

        {groepen.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {totaalIngevuld} van {totaalBenodigd} slots ingevuld
              </div>
              <Button size="sm" variant="outline" onClick={autoVullen} className="gap-2">
                <Wand2 className="h-4 w-4" /> Auto toewijzen (FIFO)
              </Button>
            </div>

            {groepen.map(({ target, slots: gSlots }) => {
              const beschikbaar = data?.beschikbaar[target.componentProductId] || [];
              const reedsToegewezen = data?.toegewezen[target.componentProductId] || [];
              const usedSet = gebruiktIds[target.componentProductId] || new Set<string>();
              return (
                <div key={`${target.regelIndex}-${target.componentProductId}`} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-sm">
                        {[target.componentMerk, target.componentNaam].filter(Boolean).join(" ")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Regel: {target.regelOmschrijving} · {target.benodigd} × SN nodig
                        {target.perBundel > 1 && ` (${target.perBundel}/bundel × ${target.regelAantal} bundels)`}
                      </div>
                    </div>
                    <Badge variant="outline">{beschikbaar.length + reedsToegewezen.length} beschikbaar</Badge>
                  </div>
                  <div className="space-y-2">
                    {gSlots.map((s) => {
                      const opties = [...reedsToegewezen, ...beschikbaar];
                      return (
                        <div key={s.key} className="flex flex-wrap items-center gap-2">
                          <span className="text-xs w-6 text-muted-foreground">#{s.slotIndex + 1}</span>
                          <Select
                            value={s.mode}
                            onValueChange={(v) => updateSlot(s.key, { mode: v as Slot["mode"], existingId: null, handmatig: "" })}
                          >
                            <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="voorraad">Uit voorraad</SelectItem>
                              <SelectItem value="handmatig">Handmatig</SelectItem>
                            </SelectContent>
                          </Select>
                          {s.mode === "voorraad" ? (
                            <Select
                              value={s.existingId ?? ""}
                              onValueChange={(v) => updateSlot(s.key, { existingId: v || null })}
                            >
                              <SelectTrigger className="flex-1 min-w-[180px] h-9">
                                <SelectValue placeholder="Kies serienummer..." />
                              </SelectTrigger>
                              <SelectContent>
                                {opties.length === 0 && (
                                  <div className="px-2 py-1.5 text-xs text-muted-foreground">Geen voorraad-SN beschikbaar</div>
                                )}
                                {opties.map((sn) => {
                                  const inUse = usedSet.has(sn.id) && sn.id !== s.existingId;
                                  return (
                                    <SelectItem key={sn.id} value={sn.id} disabled={inUse}>
                                      {sn.serienummer}{inUse ? " (al gekozen)" : ""}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              className="flex-1 min-w-[180px] h-9"
                              placeholder="Voer serienummer in"
                              value={s.handmatig}
                              onChange={(e) => updateSlot(s.key, { handmatig: e.target.value })}
                            />
                          )}
                          {((s.mode === "voorraad" && s.existingId) || (s.mode === "handmatig" && s.handmatig.trim())) && (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
          </TabsContent>
          <TabsContent value="historie">
            <SNToewijzingLog opdrachtId={opdrachtId} />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuleren</Button>
          <Button onClick={opslaanKlik} disabled={opslaan.isPending || groepen.length === 0}>
            {opslaan.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Toewijzing opslaan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SNToewijzingDialog;