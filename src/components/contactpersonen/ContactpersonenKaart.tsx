import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Users, Plus, Mail, Phone, Smartphone, Pencil, Trash2, Star, Briefcase,
} from "lucide-react";

export interface Contactpersoon {
  id: string;
  partner_id: string;
  lead_id: string | null;
  klant_id: string | null;
  voornaam: string;
  achternaam: string | null;
  functie: string | null;
  email: string | null;
  telefoon: string | null;
  mobiel: string | null;
  is_hoofdcontact: boolean;
  notitie: string | null;
  created_at: string;
  updated_at: string;
}

interface Props {
  entiteitType: "lead" | "klant";
  entiteitId: string;
  partnerId: string | null | undefined;
  title?: string;
}

type FormState = {
  voornaam: string;
  achternaam: string;
  functie: string;
  email: string;
  telefoon: string;
  mobiel: string;
  notitie: string;
  is_hoofdcontact: boolean;
};

const emptyForm: FormState = {
  voornaam: "",
  achternaam: "",
  functie: "",
  email: "",
  telefoon: "",
  mobiel: "",
  notitie: "",
  is_hoofdcontact: false,
};

export default function ContactpersonenKaart({
  entiteitType, entiteitId, partnerId, title = "Contactpersonen",
}: Props) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const scopeColumn = entiteitType === "lead" ? "lead_id" : "klant_id";
  const queryKey = ["contactpersonen", entiteitType, entiteitId];

  const canManage = useMemo(() => {
    const rol = profile?.rol;
    return (
      rol === "superadmin" || rol === "partner_admin" ||
      rol === "partner_staff" || rol === "backoffice" || rol === "adviseur"
    );
  }, [profile?.rol]);

  const { data: contactpersonen = [], isLoading } = useQuery({
    queryKey,
    enabled: !!entiteitId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contactpersonen" as any)
        .select("*")
        .eq(scopeColumn, entiteitId)
        .order("is_hoofdcontact", { ascending: false })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Contactpersoon[];
    },
  });

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (cp: Contactpersoon) => {
    setEditingId(cp.id);
    setForm({
      voornaam: cp.voornaam,
      achternaam: cp.achternaam ?? "",
      functie: cp.functie ?? "",
      email: cp.email ?? "",
      telefoon: cp.telefoon ?? "",
      mobiel: cp.mobiel ?? "",
      notitie: cp.notitie ?? "",
      is_hoofdcontact: cp.is_hoofdcontact,
    });
    setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.voornaam.trim()) throw new Error("Voornaam is verplicht");
      if (!partnerId && profile?.rol !== "superadmin") {
        throw new Error("Geen partner gekoppeld aan account");
      }

      const payload = {
        voornaam: form.voornaam.trim(),
        achternaam: form.achternaam.trim() || null,
        functie: form.functie.trim() || null,
        email: form.email.trim() || null,
        telefoon: form.telefoon.trim() || null,
        mobiel: form.mobiel.trim() || null,
        notitie: form.notitie.trim() || null,
        is_hoofdcontact: form.is_hoofdcontact,
      };

      // Als deze contact hoofdcontact wordt, andere hoofd-status resetten
      if (form.is_hoofdcontact) {
        const resetQuery = supabase
          .from("contactpersonen" as any)
          .update({ is_hoofdcontact: false } as any)
          .eq(scopeColumn, entiteitId)
          .eq("is_hoofdcontact", true);
        if (editingId) resetQuery.neq("id", editingId);
        const { error: resetError } = await resetQuery;
        if (resetError) throw resetError;
      }

      if (editingId) {
        const { error } = await supabase
          .from("contactpersonen" as any)
          .update(payload as any)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const insertPayload: any = {
          ...payload,
          partner_id: partnerId,
          [scopeColumn]: entiteitId,
          created_by: profile?.id ?? null,
        };
        const { error } = await supabase
          .from("contactpersonen" as any)
          .insert(insertPayload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(editingId ? "Contactpersoon bijgewerkt" : "Contactpersoon toegevoegd");
      setDialogOpen(false);
      resetForm();
    },
    onError: (err: Error) => toast.error("Opslaan mislukt", { description: err.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contactpersonen" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Contactpersoon verwijderd");
      setDeleteId(null);
    },
    onError: (err: Error) => toast.error("Verwijderen mislukt", { description: err.message }),
  });

  const setHoofdcontactMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error: resetError } = await supabase
        .from("contactpersonen" as any)
        .update({ is_hoofdcontact: false } as any)
        .eq(scopeColumn, entiteitId)
        .eq("is_hoofdcontact", true);
      if (resetError) throw resetError;
      const { error } = await supabase
        .from("contactpersonen" as any)
        .update({ is_hoofdcontact: true } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Hoofdcontact bijgewerkt");
    },
    onError: (err: Error) => toast.error("Fout", { description: err.message }),
  });

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" /> {title}
          {contactpersonen.length > 0 && (
            <Badge variant="secondary" className="ml-1">{contactpersonen.length}</Badge>
          )}
        </CardTitle>
        {canManage && (
          <Button size="sm" onClick={openCreate} className="rounded-pill gap-2">
            <Plus className="h-3.5 w-3.5" /> Contactpersoon
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Laden...</p>
        ) : contactpersonen.length === 0 ? (
          <div className="text-center py-6 border-2 border-dashed rounded-xl">
            <Users className="h-7 w-7 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nog geen extra contactpersonen</p>
            {canManage && (
              <Button variant="link" size="sm" onClick={openCreate} className="mt-1">
                Eerste contactpersoon toevoegen
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {contactpersonen.map((cp) => (
              <div
                key={cp.id}
                className="flex items-start gap-3 p-3 rounded-xl border hover:bg-muted/30 transition-colors"
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-medium text-sm">
                  {(cp.voornaam[0] || "?").toUpperCase()}{(cp.achternaam?.[0] || "").toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium truncate">
                      {cp.voornaam} {cp.achternaam ?? ""}
                    </p>
                    {cp.is_hoofdcontact && (
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 gap-1 h-5 px-1.5 text-[10px]">
                        <Star className="h-2.5 w-2.5 fill-current" /> Hoofdcontact
                      </Badge>
                    )}
                    {cp.functie && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Briefcase className="h-3 w-3" /> {cp.functie}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                    {cp.email && (
                      <a href={`mailto:${cp.email}`} className="flex items-center gap-1 hover:text-foreground">
                        <Mail className="h-3 w-3" /> {cp.email}
                      </a>
                    )}
                    {cp.telefoon && (
                      <a href={`tel:${cp.telefoon}`} className="flex items-center gap-1 hover:text-foreground">
                        <Phone className="h-3 w-3" /> {cp.telefoon}
                      </a>
                    )}
                    {cp.mobiel && (
                      <a href={`tel:${cp.mobiel}`} className="flex items-center gap-1 hover:text-foreground">
                        <Smartphone className="h-3 w-3" /> {cp.mobiel}
                      </a>
                    )}
                  </div>
                  {cp.notitie && (
                    <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{cp.notitie}</p>
                  )}
                </div>
                {canManage && (
                  <div className="flex items-center gap-1 shrink-0">
                    {!cp.is_hoofdcontact && (
                      <Button
                        variant="ghost" size="icon"
                        onClick={() => setHoofdcontactMutation.mutate(cp.id)}
                        disabled={setHoofdcontactMutation.isPending}
                        aria-label="Als hoofdcontact instellen"
                        title="Als hoofdcontact instellen"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => openEdit(cp)} aria-label="Bewerken">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="text-destructive"
                      onClick={() => setDeleteId(cp.id)}
                      aria-label="Verwijderen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Contactpersoon bewerken" : "Contactpersoon toevoegen"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Voornaam *</Label>
                <Input
                  value={form.voornaam}
                  onChange={(e) => setForm((p) => ({ ...p, voornaam: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs">Achternaam</Label>
                <Input
                  value={form.achternaam}
                  onChange={(e) => setForm((p) => ({ ...p, achternaam: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Functie</Label>
              <Input
                value={form.functie}
                onChange={(e) => setForm((p) => ({ ...p, functie: e.target.value }))}
                className="rounded-xl"
                placeholder="Bijv. Beslisser, Techniek, Boekhouding"
              />
            </div>
            <div>
              <Label className="text-xs">E-mail</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Telefoon</Label>
                <Input
                  value={form.telefoon}
                  onChange={(e) => setForm((p) => ({ ...p, telefoon: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs">Mobiel</Label>
                <Input
                  value={form.mobiel}
                  onChange={(e) => setForm((p) => ({ ...p, mobiel: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Notitie</Label>
              <Textarea
                value={form.notitie}
                onChange={(e) => setForm((p) => ({ ...p, notitie: e.target.value }))}
                className="rounded-xl"
                rows={2}
              />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={form.is_hoofdcontact}
                onCheckedChange={(v) => setForm((p) => ({ ...p, is_hoofdcontact: v === true }))}
              />
              <span>Instellen als hoofdcontact</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-pill" onClick={() => setDialogOpen(false)}>
              Annuleren
            </Button>
            <Button
              className="rounded-pill"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !form.voornaam.trim()}
            >
              {saveMutation.isPending ? "Opslaan..." : "Opslaan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Contactpersoon verwijderen</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je deze contactpersoon wilt verwijderen? Deze actie kan niet ongedaan gemaakt worden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Bezig..." : "Verwijderen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}