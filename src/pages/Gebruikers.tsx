import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Users, KeyRound } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type UserRow = Database["public"]["Tables"]["users"]["Row"];
type AppRole = Database["public"]["Enums"]["app_role"];

const rolLabels: Record<AppRole, string> = {
  superadmin: "Platformbeheerder",
  partner_admin: "Organisatiebeheerder",
  partner_staff: "Medewerker",
  adviseur: "Energieadviseur",
  installateur: "Installateur",
  consument: "Consument",
};

const rolColors: Record<AppRole, string> = {
  superadmin: "bg-primary/10 text-primary",
  partner_admin: "bg-accent text-accent-foreground",
  partner_staff: "bg-secondary text-secondary-foreground",
  adviseur: "bg-success-light text-success",
  installateur: "bg-warning-light text-warning-foreground",
  consument: "bg-muted text-muted-foreground",
};

interface UserFormData {
  voornaam: string;
  achternaam: string;
  email: string;
  telefoon: string;
  rol: AppRole;
  partner_id: string;
  password: string;
}

const emptyForm: UserFormData = {
  voornaam: "", achternaam: "", email: "", telefoon: "",
  rol: "adviseur", partner_id: "", password: "",
};

interface GebruikersProps {
  filterRol?: AppRole;
  title?: string;
  description?: string;
}

const Gebruikers = ({ filterRol, title = "Gebruikers", description = "Beheer alle gebruikers" }: GebruikersProps) => {
  const { profile } = useAuth();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [form, setForm] = useState<UserFormData>(emptyForm);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordTarget, setPasswordTarget] = useState<UserRow | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const queryClient = useQueryClient();

  const isSuperadmin = profile?.rol === "superadmin";

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users", filterRol],
    queryFn: async () => {
      let query = supabase.from("users").select("*").order("created_at", { ascending: false });
      if (filterRol) query = query.eq("rol", filterRol);
      const { data, error } = await query;
      if (error) throw error;
      return data as UserRow[];
    },
  });

  const { data: partners = [] } = useQuery({
    queryKey: ["partners-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("partners").select("id, naam");
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const { data: result, error } = await supabase.functions.invoke("user-management", {
        body: {
          action: "create_user",
          email: data.email,
          password: data.password || undefined,
          voornaam: data.voornaam,
          achternaam: data.achternaam,
          rol: data.rol,
          partner_id: data.partner_id || (profile?.partner_id ?? undefined),
          telefoon: data.telefoon || undefined,
        },
      });
      if (error) throw error;
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Gebruiker aangemaakt");
      closeDialog();
    },
    onError: (err: Error) => toast.error("Fout", { description: err.message }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<UserRow> & { id: string }) => {
      const { error } = await supabase.from("users").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Gebruiker bijgewerkt");
      closeDialog();
    },
    onError: (err: Error) => toast.error("Fout", { description: err.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data: result, error } = await supabase.functions.invoke("user-management", {
        body: { action: "delete_user", user_id: userId },
      });
      if (error) throw error;
      if (result?.error) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Gebruiker verwijderd");
    },
    onError: (err: Error) => toast.error("Fout", { description: err.message }),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, password }: { userId: string; password: string }) => {
      const { data: result, error } = await supabase.functions.invoke("user-management", {
        body: { action: "reset_password", user_id: userId, new_password: password },
      });
      if (error) throw error;
      if (result?.error) throw new Error(result.error);
    },
    onSuccess: () => {
      toast.success("Wachtwoord gewijzigd");
      setPasswordDialogOpen(false);
      setPasswordTarget(null);
      setNewPassword("");
    },
    onError: (err: Error) => toast.error("Fout", { description: err.message }),
  });

  const openPasswordDialog = (u: UserRow) => {
    setPasswordTarget(u);
    setNewPassword("");
    setPasswordDialogOpen(true);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordTarget || newPassword.length < 8) {
      toast.error("Wachtwoord moet minimaal 8 karakters zijn");
      return;
    }
    resetPasswordMutation.mutate({ userId: passwordTarget.id, password: newPassword });
  };

  const openCreate = () => {
    setEditingUser(null);
    setForm({ ...emptyForm, rol: filterRol || "adviseur", partner_id: profile?.partner_id || "" });
    setDialogOpen(true);
  };

  const openEdit = (u: UserRow) => {
    setEditingUser(u);
    setForm({
      voornaam: u.voornaam, achternaam: u.achternaam, email: u.email,
      telefoon: u.telefoon || "", rol: u.rol, partner_id: u.partner_id || "", password: "",
    });
    setDialogOpen(true);
  };

  const closeDialog = () => { setDialogOpen(false); setEditingUser(null); setForm(emptyForm); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      updateMutation.mutate({
        id: editingUser.id,
        voornaam: form.voornaam,
        achternaam: form.achternaam,
        telefoon: form.telefoon || null,
      });
    } else {
      createMutation.mutate(form);
    }
  };

  const availableRoles: AppRole[] = isSuperadmin
    ? ["superadmin", "partner_admin", "partner_staff", "adviseur", "installateur", "consument"]
    : ["partner_staff", "adviseur", "installateur"];

  const filtered = users.filter(u =>
    `${u.voornaam} ${u.achternaam} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
          <p className="text-muted-foreground mt-1">{description}</p>
        </div>
        <Button onClick={openCreate} className="rounded-pill gap-2">
          <Plus className="h-4 w-4" /> Nieuwe gebruiker
        </Button>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Zoek gebruikers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-xl" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Laden...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Geen gebruikers gevonden</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Naam</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Telefoon</TableHead>
                    <TableHead className="text-right">Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(user => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.voornaam} {user.achternaam}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell><Badge className={rolColors[user.rol]}>{rolLabels[user.rol]}</Badge></TableCell>
                      <TableCell>
                        <Badge className={user.status === "actief" ? "bg-success-light text-success" : "bg-muted text-muted-foreground"}>
                          {user.status === "actief" ? "Actief" : "Inactief"}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.telefoon || "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(user)} title="Bewerken">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {user.id !== profile?.id && (
                            <Button variant="ghost" size="icon" onClick={() => openPasswordDialog(user)} title="Wachtwoord wijzigen">
                              <KeyRound className="h-4 w-4" />
                            </Button>
                          )}
                          {user.id !== profile?.id && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Gebruiker verwijderen</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Weet je zeker dat je {user.voornaam} {user.achternaam} wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuleren</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteMutation.mutate(user.id)} className="bg-destructive text-destructive-foreground">
                                    Verwijderen
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Gebruiker bewerken" : "Nieuwe gebruiker"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Voornaam *</Label><Input value={form.voornaam} onChange={e => setForm(p => ({ ...p, voornaam: e.target.value }))} required className="rounded-xl" /></div>
              <div><Label>Achternaam *</Label><Input value={form.achternaam} onChange={e => setForm(p => ({ ...p, achternaam: e.target.value }))} required className="rounded-xl" /></div>
            </div>
            <div><Label>E-mailadres *</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required disabled={!!editingUser} className="rounded-xl" /></div>
            {!editingUser && (
              <div><Label>Wachtwoord (leeg = auto)</Label><Input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Automatisch gegenereerd" className="rounded-xl" /></div>
            )}
            <div><Label>Telefoon</Label><Input value={form.telefoon} onChange={e => setForm(p => ({ ...p, telefoon: e.target.value }))} className="rounded-xl" /></div>
            {!editingUser && !filterRol && (
              <div>
                <Label>Rol *</Label>
                <Select value={form.rol} onValueChange={v => setForm(p => ({ ...p, rol: v as AppRole }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {availableRoles.map(r => (
                      <SelectItem key={r} value={r}>{rolLabels[r]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {!editingUser && isSuperadmin && form.rol !== "superadmin" && (
              <div>
                <Label>Partner *</Label>
                <Select value={form.partner_id} onValueChange={v => setForm(p => ({ ...p, partner_id: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecteer partner" /></SelectTrigger>
                  <SelectContent>
                    {partners.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.naam}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog} className="rounded-pill">Annuleren</Button>
              <Button type="submit" className="rounded-pill" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) ? "Opslaan..." : editingUser ? "Bijwerken" : "Aanmaken"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Wachtwoord wijzigen dialoog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Wachtwoord wijzigen</DialogTitle>
          </DialogHeader>
          {passwordTarget && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Nieuw wachtwoord instellen voor <span className="font-medium text-foreground">{passwordTarget.voornaam} {passwordTarget.achternaam}</span>
              </p>
              <div>
                <Label>Nieuw wachtwoord *</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Minimaal 8 karakters"
                  required
                  minLength={8}
                  className="rounded-xl"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setPasswordDialogOpen(false)} className="rounded-pill">Annuleren</Button>
                <Button type="submit" className="rounded-pill" disabled={resetPasswordMutation.isPending}>
                  {resetPasswordMutation.isPending ? "Opslaan..." : "Wachtwoord opslaan"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Gebruikers;
