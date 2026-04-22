import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { schrijfMutatie, type VoorraadType } from "@/lib/voorraad";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productNaam: string;
  partnerId: string;
}

const VoorraadCorrectieDialog = ({ open, onOpenChange, productId, productNaam, partnerId }: Props) => {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [type, setType] = useState<VoorraadType>("inkomend");
  const [aantal, setAantal] = useState<string>("1");
  const [reden, setReden] = useState("");

  const mutate = useMutation({
    mutationFn: async () => {
      const a = Number(aantal);
      if (!a || a <= 0) throw new Error("Aantal moet groter zijn dan 0");
      await schrijfMutatie({
        partner_id: partnerId,
        product_id: productId,
        type,
        aantal: a,
        reden: reden || null,
        actor_id: profile?.id ?? null,
        referentie_type: "handmatig",
      });
    },
    onSuccess: () => {
      toast.success("Voorraad-mutatie geboekt");
      qc.invalidateQueries({ queryKey: ["voorraad-overzicht"] });
      qc.invalidateQueries({ queryKey: ["voorraad-mutaties", productId] });
      onOpenChange(false);
      setReden("");
      setAantal("1");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Voorraad-mutatie — {productNaam}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Type mutatie</Label>
            <Select value={type} onValueChange={(v) => setType(v as VoorraadType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="inkomend">Inkomend (bij)</SelectItem>
                <SelectItem value="uitgaand">Uitgaand (af)</SelectItem>
                <SelectItem value="correctie">Correctie (bij)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Aantal</Label>
            <Input type="number" min="1" value={aantal} onChange={(e) => setAantal(e.target.value)} />
          </div>
          <div>
            <Label>Reden (optioneel)</Label>
            <Textarea value={reden} onChange={(e) => setReden(e.target.value)} placeholder="Bv. inkoop, breuk, telcorrectie" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuleren</Button>
          <Button onClick={() => mutate.mutate()} disabled={mutate.isPending}>Boeken</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VoorraadCorrectieDialog;
