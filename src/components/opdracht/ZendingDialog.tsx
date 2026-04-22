import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpsertZending, type OpdrachtZending } from "@/hooks/logistiek/useZendingen";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  opdrachtId: string;
  partnerId: string;
  zending?: OpdrachtZending | null;
}

const VERVOERDERS = [
  { value: "postnl", label: "PostNL" },
  { value: "dhl", label: "DHL" },
  { value: "dpd", label: "DPD" },
  { value: "ups", label: "UPS" },
  { value: "gls", label: "GLS" },
  { value: "eigen_bezorging", label: "Eigen bezorging" },
  { value: "anders", label: "Anders" },
];

const STATUSSEN = [
  { value: "gepland", label: "Gepland" },
  { value: "onderweg", label: "Onderweg" },
  { value: "geleverd", label: "Geleverd" },
  { value: "geannuleerd", label: "Geannuleerd" },
];

const ZendingDialog = ({ open, onOpenChange, opdrachtId, partnerId, zending }: Props) => {
  const upsert = useUpsertZending();
  const [form, setForm] = useState({
    vervoerder: "eigen_bezorging",
    trackingnummer: "",
    status: "gepland" as OpdrachtZending["status"],
    verzenddatum: "",
    verwachte_leverdatum: "",
    afleverdatum: "",
    ontvangen_door: "",
    notitie: "",
  });

  useEffect(() => {
    if (zending) {
      setForm({
        vervoerder: zending.vervoerder,
        trackingnummer: zending.trackingnummer ?? "",
        status: zending.status,
        verzenddatum: zending.verzenddatum?.slice(0, 10) ?? "",
        verwachte_leverdatum: zending.verwachte_leverdatum ?? "",
        afleverdatum: zending.afleverdatum?.slice(0, 16) ?? "",
        ontvangen_door: zending.ontvangen_door ?? "",
        notitie: zending.notitie ?? "",
      });
    } else {
      setForm({
        vervoerder: "eigen_bezorging",
        trackingnummer: "",
        status: "gepland",
        verzenddatum: "",
        verwachte_leverdatum: "",
        afleverdatum: "",
        ontvangen_door: "",
        notitie: "",
      });
    }
  }, [zending, open]);

  const handleSave = async () => {
    await upsert.mutateAsync({
      id: zending?.id,
      opdracht_id: opdrachtId,
      partner_id: partnerId,
      vervoerder: form.vervoerder,
      trackingnummer: form.trackingnummer || null,
      status: form.status,
      verzenddatum: form.verzenddatum ? new Date(form.verzenddatum).toISOString() : null,
      verwachte_leverdatum: form.verwachte_leverdatum || null,
      afleverdatum: form.afleverdatum ? new Date(form.afleverdatum).toISOString() : null,
      ontvangen_door: form.ontvangen_door || null,
      notitie: form.notitie || null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{zending ? "Zending bewerken" : "Nieuwe zending"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Vervoerder</Label>
              <Select value={form.vervoerder} onValueChange={(v) => setForm({ ...form, vervoerder: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VERVOERDERS.map((v) => <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSSEN.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Trackingnummer</Label>
            <Input value={form.trackingnummer} onChange={(e) => setForm({ ...form, trackingnummer: e.target.value })} placeholder="bv. 3SAAA1234567" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Verzenddatum</Label>
              <Input type="date" value={form.verzenddatum} onChange={(e) => setForm({ ...form, verzenddatum: e.target.value })} />
            </div>
            <div>
              <Label>Verwachte levering</Label>
              <Input type="date" value={form.verwachte_leverdatum} onChange={(e) => setForm({ ...form, verwachte_leverdatum: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Afgeleverd op</Label>
              <Input type="datetime-local" value={form.afleverdatum} onChange={(e) => setForm({ ...form, afleverdatum: e.target.value })} />
            </div>
            <div>
              <Label>Ontvangen door</Label>
              <Input value={form.ontvangen_door} onChange={(e) => setForm({ ...form, ontvangen_door: e.target.value })} placeholder="naam" />
            </div>
          </div>
          <div>
            <Label>Notitie</Label>
            <Textarea rows={2} value={form.notitie} onChange={(e) => setForm({ ...form, notitie: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuleren</Button>
          <Button onClick={handleSave} disabled={upsert.isPending}>
            {upsert.isPending ? "Opslaan..." : "Opslaan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ZendingDialog;