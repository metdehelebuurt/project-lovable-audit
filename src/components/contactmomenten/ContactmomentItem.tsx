import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Pencil, Trash2, User as UserIcon, Loader2,
  Phone, Mail, MessageSquare, Voicemail, MapPin, MessageCircle, ArrowDownLeft, ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";

const TYPE_OPTIONS = [
  { value: "call", label: "Telefoongesprek" },
  { value: "voicemail", label: "Voicemail" },
  { value: "email", label: "E-mail" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "bezoek", label: "Bezoek" },
  { value: "overig", label: "Overig" },
];

const RESULTAAT_OPTIONS = [
  { value: "bereikt", label: "Bereikt" },
  { value: "geen_gehoor", label: "Geen gehoor" },
  { value: "voicemail", label: "Voicemail" },
  { value: "terugbelverzoek", label: "Terugbelverzoek" },
];

const TYPE_ICON: Record<string, typeof Phone> = {
  call: Phone,
  voicemail: Voicemail,
  email: Mail,
  whatsapp: MessageCircle,
  bezoek: MapPin,
  overig: MessageSquare,
};

const RESULTAAT_VARIANT: Record<string, string> = {
  bereikt: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  geen_gehoor: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  voicemail: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  terugbelverzoek: "bg-purple-500/10 text-purple-600 border-purple-500/20",
};

function typeLabel(t: string) {
  return TYPE_OPTIONS.find((o) => o.value === t)?.label ?? t;
}
function resultaatLabel(r: string) {
  return RESULTAAT_OPTIONS.find((o) => o.value === r)?.label ?? r.replace(/_/g, " ");
}

function toLocalDateTime(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface Props {
  contact: any;
  compact?: boolean;
  onChanged?: () => void;
}

export default function ContactmomentItem({ contact, compact = false, onChanged }: Props) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const canManagePartnerWide = profile?.rol === "superadmin"
    || profile?.rol === "partner_admin"
    || profile?.rol === "partner_staff";
  const canManage = canManagePartnerWide || profile?.id === contact.user_id;

  const [form, setForm] = useState({
    type: contact.type ?? "call",
    richting: contact.richting ?? "uitgaand",
    resultaat: contact.resultaat ?? "",
    notitie: contact.notitie ?? "",
    gebeurd_op: toLocalDateTime(contact.gebeurd_op ?? contact.created_at),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["contactmomenten"] });
    queryClient.invalidateQueries({ queryKey: ["lead-contactmomenten"] });
    queryClient.invalidateQueries({ queryKey: ["klant-contactmomenten"] });
    queryClient.invalidateQueries({ queryKey: ["entiteit-historie"] });
    onChanged?.();
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("lead_contactmomenten" as any)
        .update({
          type: form.type,
          richting: form.richting,
          resultaat: form.resultaat || null,
          notitie: form.notitie?.trim() || null,
          gebeurd_op: new Date(form.gebeurd_op).toISOString(),
        } as any)
        .eq("id", contact.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Contactmoment bijgewerkt");
      setEditOpen(false);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("lead_contactmomenten" as any)
        .delete()
        .eq("id", contact.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Contactmoment verwijderd");
      setConfirmDelete(false);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <div className={compact ? "text-xs border rounded-lg p-2 group" : "p-3 rounded-xl border bg-card group"}>
        <div className={`flex items-center gap-2 ${compact ? "" : "mb-1"}`}>
          {compact ? (
            <span className="font-medium">
              {TYPE_OPTIONS.find((t) => t.value === contact.type)?.label || contact.type}
              {" · "}
              <span className="text-muted-foreground">{contact.richting}</span>
            </span>
          ) : (
            <>
              <Badge variant="outline" className="text-[10px]">{contact.type}</Badge>
              <Badge variant="outline" className="text-[10px]">{contact.richting}</Badge>
              {contact.resultaat && (
                <Badge className="text-[10px] bg-primary/10 text-primary">
                  {contact.resultaat.replace(/_/g, " ")}
                </Badge>
              )}
            </>
          )}
          <span className={`${compact ? "text-[10px]" : "text-[10px]"} text-muted-foreground ml-auto`}>
            {new Date(contact.gebeurd_op || contact.created_at).toLocaleString("nl-NL", {
              dateStyle: "short", timeStyle: "short",
            })}
          </span>
          {canManage && (
            <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setEditOpen(true)}
                aria-label="Bewerken"
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:text-destructive"
                onClick={() => setConfirmDelete(true)}
                aria-label="Verwijderen"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
        {compact ? (
          <>
            {contact.resultaat && (
              <p className="text-[11px] text-muted-foreground">
                {contact.resultaat.replace(/_/g, " ")}
              </p>
            )}
            {contact.notitie && <p className="text-[11px] mt-0.5">{contact.notitie}</p>}
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <UserIcon className="h-3 w-3" />
              <span>{contact.user?.voornaam} {contact.user?.achternaam}</span>
            </div>
            {contact.notitie && <p className="text-sm text-foreground mt-1">{contact.notitie}</p>}
          </>
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Contactmoment bewerken</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v }))}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Richting</Label>
                <Select value={form.richting} onValueChange={(v) => setForm((p) => ({ ...p, richting: v }))}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uitgaand">Uitgaand</SelectItem>
                    <SelectItem value="inkomend">Inkomend</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Datum & tijd</Label>
              <Input
                type="datetime-local"
                value={form.gebeurd_op}
                onChange={(e) => setForm((p) => ({ ...p, gebeurd_op: e.target.value }))}
                className="h-9"
              />
            </div>
            <div>
              <Label className="text-xs">Resultaat</Label>
              <Select
                value={form.resultaat || "none"}
                onValueChange={(v) => setForm((p) => ({ ...p, resultaat: v === "none" ? "" : v }))}
              >
                <SelectTrigger className="h-9"><SelectValue placeholder="Optioneel" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {RESULTAAT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Notitie</Label>
              <Textarea
                value={form.notitie}
                onChange={(e) => setForm((p) => ({ ...p, notitie: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Annuleren</Button>
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
              Opslaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Contactmoment verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Deze actie kan niet ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); deleteMutation.mutate(); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}