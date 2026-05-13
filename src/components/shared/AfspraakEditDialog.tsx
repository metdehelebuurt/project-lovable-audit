import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { CalendarIcon, Video, MapPin, Phone, User, Trash2 } from "lucide-react";

interface Afspraak {
  id: string;
  titel: string;
  type: string;
  datum: string;
  start_tijd: string | null;
  eind_tijd: string | null;
  locatie: string | null;
  notities: string | null;
  adviseur_id: string | null;
  status: string;
  lead_id: string | null;
  klant_id: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  afspraak: Afspraak | null;
  onSuccess?: () => void;
}

interface TeamUser { id: string; voornaam: string; achternaam: string; }

const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString("nl-NL") : "";
const trimT = (t?: string | null) => t ? t.slice(0, 5) : "";

export function AfspraakEditDialog({ open, onOpenChange, afspraak, onSuccess }: Props) {
  const { profile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [annuleerReden, setAnnuleerReden] = useState("");
  const [teamUsers, setTeamUsers] = useState<TeamUser[]>([]);
  const [form, setForm] = useState<Afspraak | null>(null);

  useEffect(() => {
    if (afspraak) setForm({ ...afspraak });
  }, [afspraak]);

  useEffect(() => {
    if (!open || !profile?.partner_id) return;
    supabase.from("users")
      .select("id, voornaam, achternaam")
      .eq("partner_id", profile.partner_id!)
      .in("rol", ["adviseur", "partner_staff", "partner_admin", "backoffice"])
      .eq("status", "actief")
      .then(({ data }) => { if (data) setTeamUsers(data as TeamUser[]); });
  }, [open, profile?.partner_id]);

  if (!form) return null;
  const update = (k: keyof Afspraak, v: any) => setForm(prev => prev ? { ...prev, [k]: v } : prev);

  async function resolveKlantNaam(): Promise<string | undefined> {
    if (!form) return;
    if (form.klant_id) {
      const { data } = await supabase.from("klanten").select("voornaam, achternaam").eq("id", form.klant_id).maybeSingle();
      return [data?.voornaam, data?.achternaam].filter(Boolean).join(" ") || undefined;
    }
    if (form.lead_id) {
      const { data } = await supabase.from("leads").select("voornaam, achternaam").eq("id", form.lead_id).maybeSingle();
      return [data?.voornaam, data?.achternaam].filter(Boolean).join(" ") || undefined;
    }
    return undefined;
  }

  async function adviseurEmail(id: string | null): Promise<string | undefined> {
    if (!id) return;
    const { data } = await supabase.from("users").select("email").eq("id", id).maybeSingle();
    return data?.email || undefined;
  }

  const handleSave = async () => {
    if (!form || !afspraak) return;
    if (!form.titel || !form.datum) { toast.error("Titel en datum zijn verplicht"); return; }
    setSaving(true);

    const wijzigingen: string[] = [];
    if (afspraak.datum !== form.datum) wijzigingen.push(`Datum: ${fmtDate(afspraak.datum)} → ${fmtDate(form.datum)}`);
    if ((afspraak.start_tijd || "") !== (form.start_tijd || "")) wijzigingen.push(`Starttijd: ${trimT(afspraak.start_tijd) || "—"} → ${trimT(form.start_tijd) || "—"}`);
    if ((afspraak.eind_tijd || "") !== (form.eind_tijd || "")) wijzigingen.push(`Eindtijd: ${trimT(afspraak.eind_tijd) || "—"} → ${trimT(form.eind_tijd) || "—"}`);
    if ((afspraak.locatie || "") !== (form.locatie || "")) wijzigingen.push(`Locatie: ${afspraak.locatie || "—"} → ${form.locatie || "—"}`);
    if (afspraak.titel !== form.titel) wijzigingen.push(`Titel: ${afspraak.titel} → ${form.titel}`);
    if (afspraak.type !== form.type) wijzigingen.push(`Type: ${afspraak.type} → ${form.type}`);
    const adviseurChanged = afspraak.adviseur_id !== form.adviseur_id;
    if (adviseurChanged) wijzigingen.push("Adviseur gewijzigd");

    const { error } = await supabase.from("afspraken" as any).update({
      titel: form.titel,
      type: form.type,
      datum: form.datum,
      start_tijd: form.start_tijd || null,
      eind_tijd: form.eind_tijd || null,
      locatie: form.locatie || null,
      notities: form.notities || null,
      adviseur_id: form.adviseur_id || null,
    } as any).eq("id", afspraak.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }

    try {
      const klantNaam = await resolveKlantNaam();
      const gewijzigdDoor = [profile?.voornaam, profile?.achternaam].filter(Boolean).join(" ") || undefined;

      // Mail nieuwe adviseur als zichzelf "ingepland" — anders gewijzigd
      const recipients = new Set<string>();
      if (adviseurChanged) {
        // oude adviseur informeren over annulering vanuit hun perspectief
        const oldEmail = await adviseurEmail(afspraak.adviseur_id);
        if (oldEmail && afspraak.adviseur_id !== profile?.id) {
          await supabase.functions.invoke("send-transactional-email", {
            body: {
              templateName: "afspraak-geannuleerd",
              recipientEmail: oldEmail,
              idempotencyKey: `afspraak-reassigned-${afspraak.id}-${Date.now()}`,
              templateData: {
                titel: afspraak.titel,
                datum: fmtDate(afspraak.datum),
                tijd: trimT(afspraak.start_tijd),
                klantNaam,
                geannuleerdDoor: gewijzigdDoor,
                reden: "Afspraak toegewezen aan andere adviseur",
              },
            },
          });
        }
        // nieuwe adviseur informeren als ingepland
        const newEmail = await adviseurEmail(form.adviseur_id);
        if (newEmail && form.adviseur_id !== profile?.id) {
          await supabase.functions.invoke("send-transactional-email", {
            body: {
              templateName: "afspraak-ingepland",
              recipientEmail: newEmail,
              idempotencyKey: `afspraak-ingepland-${afspraak.id}-${form.adviseur_id}`,
              templateData: {
                titel: form.titel,
                type: form.type,
                datum: fmtDate(form.datum),
                tijd: trimT(form.start_tijd),
                locatie: form.locatie || undefined,
                klantNaam,
                notities: form.notities || undefined,
                ingeplandDoor: gewijzigdDoor,
              },
            },
          });
        }
      } else if (wijzigingen.length > 0) {
        const email = await adviseurEmail(form.adviseur_id);
        if (email && form.adviseur_id !== profile?.id) recipients.add(email);
        for (const r of recipients) {
          await supabase.functions.invoke("send-transactional-email", {
            body: {
              templateName: "afspraak-gewijzigd",
              recipientEmail: r,
              idempotencyKey: `afspraak-gewijzigd-${afspraak.id}-${Date.now()}`,
              templateData: {
                titel: form.titel,
                datum: fmtDate(form.datum),
                tijd: trimT(form.start_tijd),
                locatie: form.locatie || undefined,
                klantNaam,
                wijzigingen,
                gewijzigdDoor,
              },
            },
          });
        }
      }
    } catch (e) {
      console.warn("afspraak-mail kon niet worden verzonden", e);
    }

    toast.success("Afspraak bijgewerkt");
    onOpenChange(false);
    onSuccess?.();
  };

  const handleDelete = async () => {
    if (!afspraak) return;
    setSaving(true);
    const { error } = await supabase.from("afspraken" as any).delete().eq("id", afspraak.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }

    try {
      const klantNaam = await resolveKlantNaam();
      const geannuleerdDoor = [profile?.voornaam, profile?.achternaam].filter(Boolean).join(" ") || undefined;
      const email = await adviseurEmail(afspraak.adviseur_id);
      if (email && afspraak.adviseur_id !== profile?.id) {
        await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "afspraak-geannuleerd",
            recipientEmail: email,
            idempotencyKey: `afspraak-geannuleerd-${afspraak.id}`,
            templateData: {
              titel: afspraak.titel,
              datum: fmtDate(afspraak.datum),
              tijd: trimT(afspraak.start_tijd),
              klantNaam,
              geannuleerdDoor,
              reden: annuleerReden || undefined,
            },
          },
        });
      }
    } catch (e) {
      console.warn("afspraak-geannuleerd mail kon niet worden verzonden", e);
    }

    toast.success("Afspraak geannuleerd");
    setConfirmDelete(false);
    setAnnuleerReden("");
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Afspraak bewerken
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Titel *</Label>
              <Input value={form.titel} onChange={e => update("titel", e.target.value)} />
            </div>
            <div>
              <Label>Adviseur</Label>
              <Select value={form.adviseur_id || ""} onValueChange={v => update("adviseur_id", v)}>
                <SelectTrigger><SelectValue placeholder="Selecteer adviseur" /></SelectTrigger>
                <SelectContent>
                  {teamUsers.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      <span className="flex items-center gap-2"><User className="h-3.5 w-3.5" />{u.voornaam} {u.achternaam}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={v => update("type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="thuisbezoek"><span className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> Thuisbezoek</span></SelectItem>
                  <SelectItem value="op_afstand"><span className="flex items-center gap-2"><Video className="h-3.5 w-3.5" /> Op afstand</span></SelectItem>
                  <SelectItem value="belafspraak"><span className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> Belafspraak</span></SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Datum *</Label>
                <Input type="date" value={form.datum} onChange={e => update("datum", e.target.value)} />
              </div>
              <div>
                <Label>Van</Label>
                <Input type="time" value={form.start_tijd ? form.start_tijd.slice(0,5) : ""} onChange={e => update("start_tijd", e.target.value)} />
              </div>
              <div>
                <Label>Tot</Label>
                <Input type="time" value={form.eind_tijd ? form.eind_tijd.slice(0,5) : ""} onChange={e => update("eind_tijd", e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Locatie</Label>
              <Input value={form.locatie || ""} onChange={e => update("locatie", e.target.value)} />
            </div>
            <div>
              <Label>Notities</Label>
              <Textarea value={form.notities || ""} onChange={e => update("notities", e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-between">
            <Button variant="destructive" onClick={() => setConfirmDelete(true)} disabled={saving} className="gap-2">
              <Trash2 className="h-4 w-4" /> Annuleren
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Sluiten</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? "Opslaan..." : "Opslaan"}</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Afspraak annuleren?</AlertDialogTitle>
            <AlertDialogDescription>
              De afspraak wordt verwijderd uit de agenda. De adviseur ontvangt een notificatie en e-mail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div>
            <Label>Reden (optioneel)</Label>
            <Textarea value={annuleerReden} onChange={e => setAnnuleerReden(e.target.value)} rows={2} placeholder="Bijv. klant heeft afgezegd" />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Terug</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={saving} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Annuleer afspraak
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}