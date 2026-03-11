import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, ClipboardList, Eye, FileText } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Schouw = Database["public"]["Tables"]["schouwen"]["Row"];
type SchouwCategorie = Database["public"]["Enums"]["schouw_categorie"];
type SchouwStatus = Database["public"]["Enums"]["schouw_status"];

const categorieLabels: Record<SchouwCategorie, string> = {
  zonnepanelen: "Zonnepanelen",
  warmtepomp: "Warmtepomp",
  isolatie_dak: "Isolatie dak",
  isolatie_muur: "Isolatie muur",
  isolatie_vloer: "Isolatie vloer",
  hr_glas: "HR++ glas",
  ventilatie: "Ventilatie",
  thuisbatterij: "Thuisbatterij",
};

const statusLabels: Record<SchouwStatus, string> = {
  gepland: "Gepland",
  uitgevoerd: "Uitgevoerd",
  geannuleerd: "Geannuleerd",
};

const statusColors: Record<SchouwStatus, string> = {
  gepland: "bg-primary/10 text-primary",
  uitgevoerd: "bg-success-light text-success",
  geannuleerd: "bg-error-light text-error",
};

// Category-specific field definitions
const categoryFields: Record<SchouwCategorie, { key: string; label: string; type: "text" | "number" | "select"; options?: string[] }[]> = {
  zonnepanelen: [
    { key: "daktype", label: "Daktype", type: "select", options: ["schuin", "plat", "combinatie"] },
    { key: "dakbedekking", label: "Dakbedekking", type: "select", options: ["pannen", "bitumen", "metaal", "riet", "leien"] },
    { key: "dakoppervlakte_m2", label: "Dakoppervlakte (m²)", type: "number" },
    { key: "orientatie", label: "Oriëntatie", type: "select", options: ["noord", "oost", "zuid", "west", "NO", "NW", "ZO", "ZW"] },
    { key: "hellingshoek", label: "Hellingshoek (°)", type: "number" },
    { key: "schaduw", label: "Schaduw", type: "select", options: ["geen", "licht", "matig", "veel"] },
    { key: "meterkast_geschikt", label: "Meterkast geschikt", type: "select", options: ["ja", "nee", "aanpassing_nodig"] },
    { key: "kabelroute_lengte_m", label: "Kabelroute lengte (m)", type: "number" },
  ],
  warmtepomp: [
    { key: "huidig_verwarmingssysteem", label: "Huidig verwarmingssysteem", type: "select", options: ["cv_ketel", "stadsverwarming", "elektrisch", "anders"] },
    { key: "woningtype", label: "Woningtype", type: "select", options: ["vrijstaand", "2_onder_1_kap", "hoekwoning", "tussenwoning", "appartement"] },
    { key: "bouwjaar", label: "Bouwjaar", type: "number" },
    { key: "woonoppervlakte_m2", label: "Woonoppervlakte (m²)", type: "number" },
    { key: "isolatieniveau", label: "Isolatieniveau", type: "select", options: ["goed", "matig", "slecht"] },
    { key: "radiatoren_type", label: "Radiatoren type", type: "select", options: ["regulier", "laagtemperatuur", "vloerverwarming", "combinatie"] },
    { key: "buitenruimte_geschikt", label: "Buitenruimte geschikt", type: "select", options: ["ja", "nee", "beperkt"] },
  ],
  isolatie_dak: [
    { key: "daktype", label: "Daktype", type: "select", options: ["schuin", "plat"] },
    { key: "oppervlakte_m2", label: "Oppervlakte (m²)", type: "number" },
    { key: "huidige_isolatie", label: "Huidige isolatie", type: "select", options: ["geen", "dun", "matig", "goed"] },
    { key: "dakconstructie", label: "Dakconstructie", type: "text" },
    { key: "vochtproblemen", label: "Vochtproblemen", type: "select", options: ["ja", "nee"] },
  ],
  isolatie_muur: [
    { key: "muurtype", label: "Muurtype", type: "select", options: ["spouwmuur", "massief", "houtskelet"] },
    { key: "oppervlakte_m2", label: "Oppervlakte (m²)", type: "number" },
    { key: "spouwbreedte_mm", label: "Spouwbreedte (mm)", type: "number" },
    { key: "huidige_isolatie", label: "Huidige isolatie", type: "select", options: ["geen", "dun", "matig", "goed"] },
    { key: "vochtproblemen", label: "Vochtproblemen", type: "select", options: ["ja", "nee"] },
  ],
  isolatie_vloer: [
    { key: "vloertype", label: "Vloertype", type: "select", options: ["kruipruimte", "begane_grond", "souterrain"] },
    { key: "oppervlakte_m2", label: "Oppervlakte (m²)", type: "number" },
    { key: "kruipruimte_hoogte_cm", label: "Kruipruimte hoogte (cm)", type: "number" },
    { key: "huidige_isolatie", label: "Huidige isolatie", type: "select", options: ["geen", "dun", "matig", "goed"] },
    { key: "vochtproblemen", label: "Vochtproblemen", type: "select", options: ["ja", "nee"] },
  ],
  hr_glas: [
    { key: "aantal_ramen", label: "Aantal ramen", type: "number" },
    { key: "huidig_glastype", label: "Huidig glastype", type: "select", options: ["enkel", "dubbel", "hr", "hr_plus", "hr_plusplus"] },
    { key: "kozijn_materiaal", label: "Kozijn materiaal", type: "select", options: ["hout", "kunststof", "aluminium"] },
    { key: "kozijn_staat", label: "Kozijn staat", type: "select", options: ["goed", "matig", "slecht"] },
    { key: "totaal_m2", label: "Totaal glasoppervlakte (m²)", type: "number" },
  ],
  ventilatie: [
    { key: "huidig_systeem", label: "Huidig systeem", type: "select", options: ["natuurlijk", "mechanisch_afzuiging", "gebalanceerd", "geen"] },
    { key: "aantal_kamers", label: "Aantal kamers", type: "number" },
    { key: "vochtklachten", label: "Vochtklachten", type: "select", options: ["ja", "nee"] },
    { key: "co2_klachten", label: "CO2 klachten", type: "select", options: ["ja", "nee"] },
  ],
  thuisbatterij: [
    { key: "zonnepanelen_aanwezig", label: "Zonnepanelen aanwezig", type: "select", options: ["ja", "nee"] },
    { key: "zonnepanelen_wp", label: "Vermogen zonnepanelen (Wp)", type: "number" },
    { key: "omvormer_type", label: "Omvormer type", type: "text" },
    { key: "meterkast_geschikt", label: "Meterkast geschikt", type: "select", options: ["ja", "nee", "aanpassing_nodig"] },
    { key: "gewenste_capaciteit_kwh", label: "Gewenste capaciteit (kWh)", type: "number" },
  ],
};

interface SchouwFormData {
  lead_id: string;
  categorie: SchouwCategorie;
  geplande_datum: string;
  consument_naam: string;
  klant_email: string;
  notities: string;
  gegevens: Record<string, string>;
}

const emptyForm: SchouwFormData = {
  lead_id: "",
  categorie: "zonnepanelen",
  geplande_datum: "",
  consument_naam: "",
  klant_email: "",
  notities: "",
  gegevens: {},
};

const generateSchouwNummer = () => {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 9999).toString().padStart(4, "0");
  return `SCH-${year}-${rand}`;
};

import { useNavigate } from "react-router-dom";

const Schouwen = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("alle");
  const [categorieFilter, setCategorieFilter] = useState("alle");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialog, setViewDialog] = useState<Schouw | null>(null);
  const [editingSchouw, setEditingSchouw] = useState<Schouw | null>(null);
  const [form, setForm] = useState<SchouwFormData>(emptyForm);
  const queryClient = useQueryClient();

  const isSuperadmin = profile?.rol === "superadmin";
  const isAdmin = profile?.rol === "partner_admin" || profile?.rol === "partner_staff";
  const canDelete = isSuperadmin || isAdmin;
  const canCreate = isSuperadmin || isAdmin || profile?.rol === "adviseur";

  const { data: schouwen = [], isLoading } = useQuery({
    queryKey: ["schouwen"],
    queryFn: async () => {
      const { data, error } = await supabase.from("schouwen").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["leads-for-schouwen"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("id, voornaam, achternaam, email");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { id?: string } & SchouwFormData) => {
      const { id, ...rest } = data;
      const record: any = {
        categorie: rest.categorie,
        geplande_datum: rest.geplande_datum,
        consument_naam: rest.consument_naam || null,
        klant_email: rest.klant_email || null,
        notities: rest.notities || null,
        gegevens: Object.keys(rest.gegevens).length > 0 ? rest.gegevens : null,
        lead_id: rest.lead_id,
      };

      if (id) {
        const { error } = await supabase.from("schouwen").update(record).eq("id", id);
        if (error) throw error;
      } else {
        record.partner_id = profile?.partner_id;
        record.adviseur_id = profile?.id;
        record.schouw_nummer = generateSchouwNummer();
        if (!record.partner_id && isSuperadmin) {
          throw new Error("Superadmin moet een partner selecteren");
        }
        const { error } = await supabase.from("schouwen").insert(record);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schouwen"] });
      toast.success(editingSchouw ? "Schouw bijgewerkt" : "Schouw ingepland");
      closeDialog();
    },
    onError: (err: Error) => toast.error("Fout", { description: err.message }),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: SchouwStatus }) => {
      const { error } = await supabase.from("schouwen").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schouwen"] });
      toast.success("Status bijgewerkt");
    },
    onError: (err: Error) => toast.error("Fout", { description: err.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("schouwen").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schouwen"] });
      toast.success("Schouw verwijderd");
    },
    onError: (err: Error) => toast.error("Fout", { description: err.message }),
  });

  const openCreate = () => { setEditingSchouw(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (s: Schouw) => {
    setEditingSchouw(s);
    setForm({
      lead_id: s.lead_id,
      categorie: s.categorie,
      geplande_datum: s.geplande_datum,
      consument_naam: s.consument_naam || "",
      klant_email: s.klant_email || "",
      notities: s.notities || "",
      gegevens: (s.gegevens as Record<string, string>) || {},
    });
    setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditingSchouw(null); setForm(emptyForm); };

  const handleLeadSelect = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    setForm(p => ({
      ...p,
      lead_id: leadId,
      consument_naam: lead ? `${lead.voornaam} ${lead.achternaam}` : "",
      klant_email: lead?.email || "",
    }));
  };

  const updateGegevens = (key: string, value: string) => {
    setForm(p => ({ ...p, gegevens: { ...p.gegevens, [key]: value } }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(editingSchouw ? { ...form, id: editingSchouw.id } : form);
  };

  const filtered = schouwen.filter(s => {
    const matchSearch = `${s.schouw_nummer} ${s.consument_naam ?? ""}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "alle" || s.status === statusFilter;
    const matchCat = categorieFilter === "alle" || s.categorie === categorieFilter;
    return matchSearch && matchStatus && matchCat;
  });

  const fields = categoryFields[form.categorie] || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Schouwen</h1>
          <p className="text-muted-foreground mt-1">Woninginspecties beheren</p>
        </div>
        {canCreate && (
          <Button onClick={openCreate} className="rounded-pill gap-2">
            <Plus className="h-4 w-4" /> Nieuwe Schouw
          </Button>
        )}
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Zoek schouwen..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-xl" />
            </div>
            <Select value={categorieFilter} onValueChange={setCategorieFilter}>
              <SelectTrigger className="w-48 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="alle">Alle categorieën</SelectItem>
                {(Object.keys(categorieLabels) as SchouwCategorie[]).map(c => (
                  <SelectItem key={c} value={c}>{categorieLabels[c]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="alle">Alle statussen</SelectItem>
                {(Object.keys(statusLabels) as SchouwStatus[]).map(s => (
                  <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Laden...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Geen schouwen gevonden</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nummer</TableHead>
                    <TableHead>Klant</TableHead>
                    <TableHead>Categorie</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-sm">{s.schouw_nummer}</TableCell>
                      <TableCell className="font-medium">{s.consument_naam || "—"}</TableCell>
                      <TableCell><Badge variant="outline">{categorieLabels[s.categorie]}</Badge></TableCell>
                      <TableCell>{new Date(s.geplande_datum).toLocaleDateString("nl-NL")}</TableCell>
                      <TableCell>
                        <Select value={s.status} onValueChange={v => statusMutation.mutate({ id: s.id, status: v as SchouwStatus })}>
                          <SelectTrigger className="w-36 h-8">
                            <Badge className={statusColors[s.status]}>{statusLabels[s.status]}</Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.keys(statusLabels) as SchouwStatus[]).map(st => (
                              <SelectItem key={st} value={st}>{statusLabels[st]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setViewDialog(s)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {canDelete && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Schouw verwijderen</AlertDialogTitle>
                                  <AlertDialogDescription>Weet je zeker dat je schouw {s.schouw_nummer} wilt verwijderen?</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuleren</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteMutation.mutate(s.id)} className="bg-destructive text-destructive-foreground">Verwijderen</AlertDialogAction>
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSchouw ? "Schouw bewerken" : "Nieuwe schouw inplannen"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Lead & Category */}
            <div className="space-y-4">
              <h3 className="font-medium text-foreground">Basisgegevens</h3>
              <div>
                <Label>Lead *</Label>
                <Select value={form.lead_id || "none"} onValueChange={v => v !== "none" && handleLeadSelect(v)}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecteer lead" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" disabled>Selecteer lead</SelectItem>
                    {leads.map(l => (
                      <SelectItem key={l.id} value={l.id}>{l.voornaam} {l.achternaam} — {l.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Categorie *</Label>
                  <Select value={form.categorie} onValueChange={v => setForm(p => ({ ...p, categorie: v as SchouwCategorie, gegevens: {} }))}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(categorieLabels) as SchouwCategorie[]).map(c => (
                        <SelectItem key={c} value={c}>{categorieLabels[c]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Geplande datum *</Label>
                  <Input type="date" value={form.geplande_datum} onChange={e => setForm(p => ({ ...p, geplande_datum: e.target.value }))} required className="rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Klantnaam</Label><Input value={form.consument_naam} onChange={e => setForm(p => ({ ...p, consument_naam: e.target.value }))} className="rounded-xl" /></div>
                <div><Label>Klant e-mail</Label><Input type="email" value={form.klant_email} onChange={e => setForm(p => ({ ...p, klant_email: e.target.value }))} className="rounded-xl" /></div>
              </div>
            </div>

            {/* Step 2: Category-specific fields */}
            {fields.length > 0 && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium text-foreground">Inspectiegegevens — {categorieLabels[form.categorie]}</h3>
                <div className="grid grid-cols-2 gap-4">
                  {fields.map(f => (
                    <div key={f.key}>
                      <Label>{f.label}</Label>
                      {f.type === "select" ? (
                        <Select value={form.gegevens[f.key] || "none"} onValueChange={v => updateGegevens(f.key, v === "none" ? "" : v)}>
                          <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecteer..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">—</SelectItem>
                            {f.options?.map(o => <SelectItem key={o} value={o} className="capitalize">{o.replace(/_/g, " ")}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          type={f.type}
                          value={form.gegevens[f.key] || ""}
                          onChange={e => updateGegevens(f.key, e.target.value)}
                          className="rounded-xl"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label>Notities</Label>
              <Textarea value={form.notities} onChange={e => setForm(p => ({ ...p, notities: e.target.value }))} className="rounded-xl" rows={3} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog} className="rounded-pill">Annuleren</Button>
              <Button type="submit" className="rounded-pill" disabled={saveMutation.isPending || !form.lead_id || !form.geplande_datum}>
                {saveMutation.isPending ? "Opslaan..." : editingSchouw ? "Bijwerken" : "Inplannen"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewDialog} onOpenChange={() => setViewDialog(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schouw {viewDialog?.schouw_nummer}</DialogTitle>
          </DialogHeader>
          {viewDialog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-muted-foreground">Categorie</Label><p className="font-medium">{categorieLabels[viewDialog.categorie]}</p></div>
                <div><Label className="text-muted-foreground">Status</Label><Badge className={statusColors[viewDialog.status]}>{statusLabels[viewDialog.status]}</Badge></div>
                <div><Label className="text-muted-foreground">Klant</Label><p>{viewDialog.consument_naam || "—"}</p></div>
                <div><Label className="text-muted-foreground">E-mail</Label><p>{viewDialog.klant_email || "—"}</p></div>
                <div><Label className="text-muted-foreground">Geplande datum</Label><p>{new Date(viewDialog.geplande_datum).toLocaleDateString("nl-NL")}</p></div>
              </div>
              {viewDialog.gegevens && Object.keys(viewDialog.gegevens as object).length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-medium text-foreground mb-3">Inspectiegegevens</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(viewDialog.gegevens as Record<string, string>).map(([key, val]) => {
                      const fieldDef = categoryFields[viewDialog.categorie]?.find(f => f.key === key);
                      return (
                        <div key={key}>
                          <Label className="text-muted-foreground">{fieldDef?.label || key}</Label>
                          <p className="capitalize">{val ? String(val).replace(/_/g, " ") : "—"}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {viewDialog.notities && (
                <div className="border-t pt-4">
                  <Label className="text-muted-foreground">Notities</Label>
                  <p className="whitespace-pre-wrap">{viewDialog.notities}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Schouwen;
