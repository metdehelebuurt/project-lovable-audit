import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, ArrowLeft, Users, Plus, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import InfoCallout from "./InfoCallout";

interface Row { email: string; rol: string; voornaam: string; achternaam: string; }
interface Props {
  partnerId: string;
  onNext: () => void;
  onPrev: () => void;
}

const ROLLEN = [
  { v: "partner_staff", l: "Medewerker" },
  { v: "adviseur", l: "Adviseur" },
  { v: "installateur", l: "Installateur / monteur" },
  { v: "backoffice", l: "Backoffice" },
  { v: "partner_admin", l: "Beheerder" },
];

const empty: Row = { email: "", rol: "partner_staff", voornaam: "", achternaam: "" };

export const StepTeam = ({ partnerId, onNext, onPrev }: Props) => {
  const [rows, setRows] = useState<Row[]>([{ ...empty }]);
  const [busy, setBusy] = useState(false);

  const add = () => rows.length < 10 && setRows(r => [...r, { ...empty }]);
  const remove = (i: number) => setRows(r => r.filter((_, idx) => idx !== i));
  const update = (i: number, patch: Partial<Row>) => setRows(r => r.map((row, idx) => idx === i ? { ...row, ...patch } : row));

  const verstuur = async () => {
    const valid = rows.filter(r => r.email.trim() && /^\S+@\S+\.\S+$/.test(r.email) && r.voornaam.trim());
    if (valid.length === 0) { onNext(); return; }
    setBusy(true);
    let ok = 0, fail = 0;
    for (const r of valid) {
      try {
        const { error } = await supabase.functions.invoke("user-management", {
          body: {
            action: "create_user",
            email: r.email.trim(),
            voornaam: r.voornaam.trim(),
            achternaam: r.achternaam.trim(),
            rol: r.rol,
            partner_id: partnerId,
          },
        });
        if (error) fail++; else ok++;
      } catch { fail++; }
    }
    setBusy(false);
    if (ok > 0) toast.success(`${ok} teamlid${ok > 1 ? "en" : ""} uitgenodigd`);
    if (fail > 0) toast.error(`${fail} uitnodiging${fail > 1 ? "en" : ""} mislukt`);
    onNext();
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Team uitnodigen</h2>
        <p className="text-sm text-muted-foreground mt-1">Nodig collega's uit zodat ze direct kunnen meewerken. Optioneel — je kunt dit altijd later doen.</p>
      </div>

      <InfoCallout title="Hoe het werkt">
        Elke collega ontvangt een uitnodigingsmail met inloggegevens. Bij eerste login moeten ze hun wachtwoord wijzigen.
      </InfoCallout>

      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-3"><Label className="text-xs">Voornaam</Label><Input value={r.voornaam} onChange={e => update(i, { voornaam: e.target.value })} className="rounded-xl mt-1" /></div>
            <div className="col-span-3"><Label className="text-xs">Achternaam</Label><Input value={r.achternaam} onChange={e => update(i, { achternaam: e.target.value })} className="rounded-xl mt-1" /></div>
            <div className="col-span-3"><Label className="text-xs">E-mail</Label><Input type="email" value={r.email} onChange={e => update(i, { email: e.target.value })} className="rounded-xl mt-1" placeholder="naam@bedrijf.nl" /></div>
            <div className="col-span-2"><Label className="text-xs">Rol</Label>
              <Select value={r.rol} onValueChange={v => update(i, { rol: v })}>
                <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{ROLLEN.map(rr => <SelectItem key={rr.v} value={rr.v}>{rr.l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-1">
              {rows.length > 1 && (
                <Button variant="ghost" size="icon" onClick={() => remove(i)} className="rounded-full"><X className="h-4 w-4" /></Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" onClick={add} disabled={rows.length >= 10} className="rounded-pill gap-2">
        <Plus className="h-4 w-4" /> Nog een collega
      </Button>

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onPrev} className="rounded-pill gap-2"><ArrowLeft className="h-4 w-4" /> Terug</Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onNext} className="rounded-pill">Overslaan</Button>
          <Button onClick={verstuur} disabled={busy} className="rounded-pill gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Versturen & volgende <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StepTeam;