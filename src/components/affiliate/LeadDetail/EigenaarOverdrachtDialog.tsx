import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchAffiliateOpties, useAdminOverdrachtLead } from "@/hooks/affiliate/useAdminOverdrachtLead";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  leadId: string;
  huidigeEigenaarId: string | null;
}

export function EigenaarOverdrachtDialog({ open, onOpenChange, leadId, huidigeEigenaarId }: Props) {
  const { data: opties = [], isLoading } = useQuery({
    enabled: open,
    queryKey: ["affiliate-opties"],
    queryFn: fetchAffiliateOpties,
  });
  const overdracht = useAdminOverdrachtLead();
  const [nieuw, setNieuw] = useState<string>("");
  const [notitie, setNotitie] = useState("");

  const indienen = async () => {
    if (!nieuw) return;
    await overdracht.mutateAsync({ lead_id: leadId, nieuwe_eigenaar_id: nieuw, notitie: notitie.trim() || null });
    onOpenChange(false);
    setNieuw(""); setNotitie("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Lead overdragen</DialogTitle>
          <DialogDescription>
            Kies de nieuwe eigenaar. De wijziging wordt gelogd in de historie.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Nieuwe eigenaar</Label>
            <Select value={nieuw} onValueChange={setNieuw} disabled={isLoading}>
              <SelectTrigger><SelectValue placeholder={isLoading ? "Laden…" : "Selecteer affiliate"} /></SelectTrigger>
              <SelectContent>
                {opties
                  .filter((o) => o.id !== huidigeEigenaarId)
                  .map((o) => {
                    const naam = [o.voornaam, o.achternaam].filter(Boolean).join(" ").trim() || o.email;
                    return <SelectItem key={o.id} value={o.id}>{naam} · {o.email}</SelectItem>;
                  })}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Notitie (optioneel)</Label>
            <Textarea rows={3} value={notitie} onChange={(e) => setNotitie(e.target.value)} placeholder="Reden voor overdracht…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={overdracht.isPending}>Annuleren</Button>
          <Button onClick={indienen} disabled={!nieuw || overdracht.isPending}>Overdragen</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}