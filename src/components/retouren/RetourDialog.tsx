import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateRetour, type RetourRegel, type RetourType } from "@/hooks/retouren/useRetouren";
import { Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultType?: RetourType;
  context?: {
    opdracht_id?: string;
    installatie_id?: string;
    klant_id?: string;
    leverancier_id?: string;
    inkooporder_id?: string;
    suggestRegels?: { omschrijving: string; aantal: number; product_id?: string | null }[];
  };
}

export default function RetourDialog({ open, onOpenChange, defaultType = "klant_retour", context }: Props) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const create = useCreateRetour(profile?.partner_id, profile?.id);

  const [type, setType] = useState<RetourType>(defaultType);
  const [reden, setReden] = useState("");
  const [oplossing, setOplossing] = useState<"creditnota" | "vervangend_product" | "reparatie" | "geen">("geen");
  const [notities, setNotities] = useState("");
  const [regels, setRegels] = useState<RetourRegel[]>(
    context?.suggestRegels?.map((r) => ({
      product_id: r.product_id ?? null,
      omschrijving: r.omschrijving,
      aantal: r.aantal,
    })) ?? [{ product_id: null, omschrijving: "", aantal: 1 }]
  );

  const addRegel = () => setRegels((p) => [...p, { product_id: null, omschrijving: "", aantal: 1 }]);
  const removeRegel = (i: number) => setRegels((p) => p.filter((_, idx) => idx !== i));
  const updateRegel = (i: number, patch: Partial<RetourRegel>) =>
    setRegels((p) => p.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const opslaan = async () => {
    if (!reden.trim() || regels.length === 0) return;
    const result = await create.mutateAsync({
      type,
      reden,
      regels: regels.filter((r) => r.omschrijving.trim()),
      oplossing,
      notities: notities || null,
      opdracht_id: context?.opdracht_id ?? null,
      installatie_id: context?.installatie_id ?? null,
      klant_id: context?.klant_id ?? null,
      leverancier_id: context?.leverancier_id ?? null,
      inkooporder_id: context?.inkooporder_id ?? null,
    });
    onOpenChange(false);
    if (result?.id) navigate(`/retouren/${result.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Retour aanmelden</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Type retour</Label>
              <Select value={type} onValueChange={(v) => setType(v as RetourType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="klant_retour">Klant naar ons</SelectItem>
                  <SelectItem value="leverancier_retour">Wij naar leverancier</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Gewenste oplossing</Label>
              <Select value={oplossing} onValueChange={(v) => setOplossing(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="geen">Nog onbekend</SelectItem>
                  <SelectItem value="creditnota">Creditnota</SelectItem>
                  <SelectItem value="vervangend_product">Vervangend product</SelectItem>
                  <SelectItem value="reparatie">Reparatie</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Reden *</Label>
            <Textarea value={reden} onChange={(e) => setReden(e.target.value)} rows={2} placeholder="Bijv. defect bij aankomst, verkeerde versie geleverd..." />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Geretourneerde producten</Label>
              <Button size="sm" variant="outline" onClick={addRegel}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Regel
              </Button>
            </div>
            <div className="space-y-2">
              {regels.map((r, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <Input
                    placeholder="Omschrijving"
                    value={r.omschrijving}
                    onChange={(e) => updateRegel(i, { omschrijving: e.target.value })}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Aantal"
                    value={r.aantal}
                    onChange={(e) => updateRegel(i, { aantal: parseFloat(e.target.value) || 1 })}
                    className="w-24"
                  />
                  <Input
                    placeholder="Serienr (optioneel)"
                    value={r.serienummer ?? ""}
                    onChange={(e) => updateRegel(i, { serienummer: e.target.value })}
                    className="w-40"
                  />
                  <Button size="icon" variant="ghost" onClick={() => removeRegel(i)} disabled={regels.length === 1}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Interne notities</Label>
            <Textarea value={notities} onChange={(e) => setNotities(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuleren</Button>
          <Button onClick={opslaan} disabled={!reden.trim() || create.isPending}>
            Retour aanmaken
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}