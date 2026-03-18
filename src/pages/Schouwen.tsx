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
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, ClipboardList, Eye, FileText, ChevronLeft, ChevronRight, Check, PlayCircle, CalendarPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";
import { categoryChecklists } from "@/components/schouwen/SchouwChecklists";
import SchouwMediaUpload, { type SchouwFoto } from "@/components/schouwen/SchouwMediaUpload";

type Schouw = Database["public"]["Tables"]["schouwen"]["Row"];
type SchouwCategorie = Database["public"]["Enums"]["schouw_categorie"];
type SchouwStatus = Database["public"]["Enums"]["schouw_status"];

const categorieLabels: Record<SchouwCategorie, string> = {
  zonnepanelen: "Zonnepanelen", warmtepomp: "Warmtepomp",
  isolatie_dak: "Isolatie dak", isolatie_muur: "Isolatie muur",
  isolatie_vloer: "Isolatie vloer", hr_glas: "HR++ glas",
  ventilatie: "Ventilatie", thuisbatterij: "Thuisbatterij",
};

const statusLabels: Record<SchouwStatus, string> = {
  gepland: "Gepland", uitgevoerd: "Uitgevoerd", geannuleerd: "Geannuleerd",
};

const statusColors: Record<SchouwStatus, string> = {
  gepland: "bg-primary/10 text-primary",
  uitgevoerd: "bg-success-light text-success",
  geannuleerd: "bg-error-light text-error",
};

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
    { key: "dakconstructie_materiaal", label: "Dakconstructie materiaal", type: "text" },
    { key: "aantal_groepen_vrij", label: "Aantal vrije groepen meterkast", type: "number" },
  ],
  warmtepomp: [
    { key: "huidig_verwarmingssysteem", label: "Huidig verwarmingssysteem", type: "select", options: ["cv_ketel", "stadsverwarming", "elektrisch", "anders"] },
    { key: "woningtype", label: "Woningtype", type: "select", options: ["vrijstaand", "2_onder_1_kap", "hoekwoning", "tussenwoning", "appartement"] },
    { key: "bouwjaar", label: "Bouwjaar", type: "number" },
    { key: "woonoppervlakte_m2", label: "Woonoppervlakte (m²)", type: "number" },
    { key: "isolatieniveau", label: "Isolatieniveau", type: "select", options: ["goed", "matig", "slecht"] },
    { key: "radiatoren_type", label: "Radiatoren type", type: "select", options: ["regulier", "laagtemperatuur", "vloerverwarming", "combinatie"] },
    { key: "buitenruimte_geschikt", label: "Buitenruimte geschikt", type: "select", options: ["ja", "nee", "beperkt"] },
    { key: "elektrische_aansluiting", label: "Elektrische aansluiting (A)", type: "number" },
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
  fotos: SchouwFoto[];
  checklist: Record<string, boolean>;
  aandachtspunten: string;
}

const emptyForm: SchouwFormData = {
  lead_id: "", categorie: "zonnepanelen", geplande_datum: "",
  consument_naam: "", klant_email: "", notities: "", gegevens: {},
  fotos: [], checklist: {}, aandachtspunten: "",
};

const generateSchouwNummer = () => {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 9999).toString().padStart(4, "0");
  return `SCH-${year}-${rand}`;
};

type WizardMode = "plan" | "execute";

const PLAN_STEPS = [
  { label: "Basisgegevens", description: "Lead, categorie & datum" },
  { label: "Samenvatting", description: "Controleren & inplannen" },
];

const EXECUTE_STEPS = [
  { label: "Basisgegevens", description: "Lead, categorie & datum" },
  { label: "Technische inspectie", description: "Categorie-specifieke velden" },
  { label: "Foto's & Video's", description: "Situatiefoto's uploaden" },
  { label: "Checklist", description: "Controles afvinken" },
  { label: "Samenvatting", description: "Controleren & afsluiten" },
];

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
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardMode, setWizardMode] = useState<WizardMode>("plan");
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
    mutationFn: async (data: { id?: string; markUitgevoerd?: boolean } & SchouwFormData) => {
      const { id, markUitgevoerd, ...rest } = data;
      const record: any = {
        categorie: rest.categorie,
        geplande_datum: rest.geplande_datum,
        consument_naam: rest.consument_naam || null,
        klant_email: rest.klant_email || null,
        notities: rest.notities || null,
        gegevens: Object.keys(rest.gegevens).length > 0 ? rest.gegevens : null,
        lead_id: rest.lead_id,
        fotos: rest.fotos.length > 0 ? rest.fotos : [],
        checklist: Object.keys(rest.checklist).length > 0 ? rest.checklist : {},
        aandachtspunten: rest.aandachtspunten || null,
      };

      if (markUitgevoerd) record.status = "uitgevoerd";

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
      const msg = wizardMode === "execute" ? "Schouw afgerond" : editingSchouw ? "Schouw bijgewerkt" : "Schouw ingepland";
      toast.success(msg);
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

  const openPlan = () => {
    setEditingSchouw(null); setForm(emptyForm); setWizardStep(0); setWizardMode("plan"); setDialogOpen(true);
  };

  const openExecute = (s: Schouw) => {
    setEditingSchouw(s);
    setForm({
      lead_id: s.lead_id,
      categorie: s.categorie,
      geplande_datum: s.geplande_datum,
      consument_naam: s.consument_naam || "",
      klant_email: s.klant_email || "",
      notities: s.notities || "",
      gegevens: (s.gegevens as Record<string, string>) || {},
      fotos: (s.fotos as unknown as SchouwFoto[]) || [],
      checklist: (s.checklist as Record<string, boolean>) || {},
      aandachtspunten: (s as any).aandachtspunten || "",
    });
    setWizardStep(0);
    setWizardMode("execute");
    setDialogOpen(true);
  };

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
      fotos: (s.fotos as unknown as SchouwFoto[]) || [],
      checklist: (s.checklist as Record<string, boolean>) || {},
      aandachtspunten: (s as any).aandachtspunten || "",
    });
    setWizardStep(0);
    setWizardMode("plan");
    setDialogOpen(true);
  };

  const closeDialog = () => { setDialogOpen(false); setEditingSchouw(null); setForm(emptyForm); setWizardStep(0); };

  const handleLeadSelect = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    setForm(p => ({
      ...p, lead_id: leadId,
      consument_naam: lead ? `${lead.voornaam} ${lead.achternaam}` : "",
      klant_email: lead?.email || "",
    }));
  };

  const updateGegevens = (key: string, value: string) => {
    setForm(p => ({ ...p, gegevens: { ...p.gegevens, [key]: value } }));
  };

  const toggleChecklist = (key: string) => {
    setForm(p => ({ ...p, checklist: { ...p.checklist, [key]: !p.checklist[key] } }));
  };

  const handleSubmit = () => {
    saveMutation.mutate({
      ...form,
      id: editingSchouw?.id,
      markUitgevoerd: wizardMode === "execute",
    });
  };

  const steps = wizardMode === "plan" ? PLAN_STEPS : EXECUTE_STEPS;
  const canGoNext = () => {
    if (wizardStep === 0) return !!form.lead_id && !!form.geplande_datum;
    return true;
  };

  const filtered = schouwen.filter(s => {
    const matchSearch = `${s.schouw_nummer} ${s.consument_naam ?? ""}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "alle" || s.status === statusFilter;
    const matchCat = categorieFilter === "alle" || s.categorie === categorieFilter;
    return matchSearch && matchStatus && matchCat;
  });

  const fields = categoryFields[form.categorie] || [];
  const selectedLead = leads.find(l => l.id === form.lead_id);
  const checklistItems = categoryChecklists[form.categorie] || [];

  // Determine actual wizard content step index
  const getStepContent = () => {
    if (wizardMode === "plan") {
      return wizardStep === 0 ? "basis" : "samenvatting";
    }
    const map = ["basis", "inspectie", "fotos", "checklist", "samenvatting"];
    return map[wizardStep] || "basis";
  };
  const stepContent = getStepContent();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Schouwen</h1>
          <p className="text-muted-foreground mt-1">Woninginspecties inplannen en uitvoeren</p>
        </div>
        {canCreate && (
          <Button onClick={() => navigate("/schouwen/nieuw")} className="rounded-pill gap-2">
            <CalendarPlus className="h-4 w-4" /> Schouw inplannen
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
                        <Badge className={statusColors[s.status]}>{statusLabels[s.status]}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {s.status === "gepland" && canCreate && (
                            <Button variant="default" size="sm" className="rounded-pill gap-1 h-8" onClick={() => openExecute(s)}>
                              <PlayCircle className="h-3.5 w-3.5" /> Starten
                            </Button>
                          )}
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

      {/* Wizard Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {wizardMode === "execute"
                ? `Schouw uitvoeren — ${editingSchouw?.schouw_nummer || ""}`
                : editingSchouw ? "Schouw bewerken" : "Schouw inplannen"}
            </DialogTitle>
          </DialogHeader>

          {/* Progress indicator */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              {steps.map((step, i) => (
                <div key={i} className={`flex items-center gap-1.5 ${i <= wizardStep ? "text-primary font-medium" : "text-muted-foreground"}`}>
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs border-2 ${
                    i < wizardStep ? "bg-primary text-primary-foreground border-primary" :
                    i === wizardStep ? "border-primary text-primary" :
                    "border-muted-foreground/30"
                  }`}>
                    {i < wizardStep ? <Check className="h-3 w-3" /> : i + 1}
                  </div>
                  <span className="hidden sm:inline">{step.label}</span>
                </div>
              ))}
            </div>
            <Progress value={((wizardStep + 1) / steps.length) * 100} className="h-1.5" />
          </div>

          {/* Step: Basisgegevens */}
          {stepContent === "basis" && (
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">Selecteer de lead, categorie en plandatum.</p>
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
                  <Select value={form.categorie} onValueChange={v => setForm(p => ({ ...p, categorie: v as SchouwCategorie, gegevens: {}, checklist: {} }))}>
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
          )}

          {/* Step: Technische inspectie */}
          {stepContent === "inspectie" && (
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">Vul de inspectiegegevens in voor <strong>{categorieLabels[form.categorie]}</strong>.</p>
              {fields.length > 0 ? (
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
                        <Input type={f.type} value={form.gegevens[f.key] || ""} onChange={e => updateGegevens(f.key, e.target.value)} className="rounded-xl" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Geen specifieke velden voor deze categorie.</p>
              )}
              <div>
                <Label>Notities</Label>
                <Textarea value={form.notities} onChange={e => setForm(p => ({ ...p, notities: e.target.value }))} className="rounded-xl" rows={3} />
              </div>
            </div>
          )}

          {/* Step: Foto's & Video's */}
          {stepContent === "fotos" && (
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">Upload foto's en video's van de situatie ter plaatse.</p>
              <SchouwMediaUpload
                schouwId={editingSchouw?.id || "new"}
                fotos={form.fotos}
                onFotosChange={fotos => setForm(p => ({ ...p, fotos }))}
              />
            </div>
          )}

          {/* Step: Checklist */}
          {stepContent === "checklist" && (
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">Vink de uitgevoerde controles af voor <strong>{categorieLabels[form.categorie]}</strong>.</p>
              <div className="space-y-3">
                {checklistItems.map(item => (
                  <div key={item.key} className="flex items-start gap-3 p-3 rounded-xl border hover:bg-accent/50 transition-colors">
                    <Checkbox
                      id={item.key}
                      checked={!!form.checklist[item.key]}
                      onCheckedChange={() => toggleChecklist(item.key)}
                    />
                    <div className="flex-1">
                      <label htmlFor={item.key} className="text-sm font-medium cursor-pointer">
                        {item.label}
                      </label>
                      {item.required && <span className="text-xs text-destructive ml-1">*</span>}
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <Label>Aandachtspunten</Label>
                <Textarea
                  value={form.aandachtspunten}
                  onChange={e => setForm(p => ({ ...p, aandachtspunten: e.target.value }))}
                  placeholder="Noteer bijzonderheden of aandachtspunten..."
                  className="rounded-xl" rows={3}
                />
              </div>
            </div>
          )}

          {/* Step: Samenvatting */}
          {stepContent === "samenvatting" && (
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">Controleer de gegevens{wizardMode === "execute" ? " en sluit de schouw af" : " en plan de schouw in"}.</p>
              <Card className="border">
                <CardContent className="pt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Lead:</span> <span className="font-medium">{selectedLead ? `${selectedLead.voornaam} ${selectedLead.achternaam}` : "—"}</span></div>
                    <div><span className="text-muted-foreground">Categorie:</span> <span className="font-medium">{categorieLabels[form.categorie]}</span></div>
                    <div><span className="text-muted-foreground">Datum:</span> <span className="font-medium">{form.geplande_datum ? new Date(form.geplande_datum).toLocaleDateString("nl-NL") : "—"}</span></div>
                    <div><span className="text-muted-foreground">Klant:</span> <span className="font-medium">{form.consument_naam || "—"}</span></div>
                  </div>

                  {/* Inspectie data (execute mode) */}
                  {wizardMode === "execute" && Object.keys(form.gegevens).filter(k => form.gegevens[k]).length > 0 && (
                    <div className="border-t pt-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Inspectiegegevens</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(form.gegevens).filter(([, v]) => v).map(([key, val]) => {
                          const fieldDef = fields.find(f => f.key === key);
                          return (
                            <div key={key}>
                              <span className="text-muted-foreground">{fieldDef?.label || key}:</span>{" "}
                              <span className="font-medium capitalize">{String(val).replace(/_/g, " ")}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Photos summary */}
                  {form.fotos.length > 0 && (
                    <div className="border-t pt-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Foto's ({form.fotos.length})</p>
                      <div className="flex gap-2 overflow-x-auto">
                        {form.fotos.slice(0, 6).map((f, i) => (
                          <img key={i} src={f.url} alt={f.label} className="h-16 w-16 rounded-lg object-cover border" />
                        ))}
                        {form.fotos.length > 6 && <div className="h-16 w-16 rounded-lg border flex items-center justify-center text-xs text-muted-foreground">+{form.fotos.length - 6}</div>}
                      </div>
                    </div>
                  )}

                  {/* Checklist summary */}
                  {wizardMode === "execute" && checklistItems.length > 0 && (
                    <div className="border-t pt-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                        Checklist ({Object.values(form.checklist).filter(Boolean).length}/{checklistItems.length})
                      </p>
                      <div className="grid grid-cols-2 gap-1 text-sm">
                        {checklistItems.map(item => (
                          <div key={item.key} className="flex items-center gap-1.5">
                            {form.checklist[item.key] ? <Check className="h-3.5 w-3.5 text-primary" /> : <span className="h-3.5 w-3.5 rounded-sm border border-muted-foreground/30 inline-block" />}
                            <span className={form.checklist[item.key] ? "" : "text-muted-foreground"}>{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {form.aandachtspunten && (
                    <div className="border-t pt-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Aandachtspunten</p>
                      <p className="text-sm whitespace-pre-wrap">{form.aandachtspunten}</p>
                    </div>
                  )}

                  {form.notities && (
                    <div className="border-t pt-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Notities</p>
                      <p className="text-sm whitespace-pre-wrap">{form.notities}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation buttons */}
          <DialogFooter className="flex justify-between sm:justify-between gap-2">
            <div>
              {wizardStep > 0 && (
                <Button type="button" variant="outline" onClick={() => setWizardStep(s => s - 1)} className="rounded-pill gap-1">
                  <ChevronLeft className="h-4 w-4" /> Vorige
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={closeDialog} className="rounded-pill">Annuleren</Button>
              {wizardStep < steps.length - 1 ? (
                <Button type="button" onClick={() => setWizardStep(s => s + 1)} className="rounded-pill gap-1" disabled={!canGoNext()}>
                  Volgende <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="button" onClick={handleSubmit} className="rounded-pill gap-1" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Opslaan..." : wizardMode === "execute" ? "Schouw afronden" : editingSchouw ? "Bijwerken" : "Inplannen"}
                  <Check className="h-4 w-4" />
                </Button>
              )}
            </div>
          </DialogFooter>
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

              {/* Foto's in view */}
              {viewDialog.fotos && (viewDialog.fotos as unknown as SchouwFoto[]).length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-medium text-foreground mb-3">Foto's</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {(viewDialog.fotos as unknown as SchouwFoto[]).map((foto, i) => (
                      <div key={i} className="relative rounded-xl overflow-hidden border">
                        <img src={foto.url} alt={foto.label} className="w-full h-24 object-cover" />
                        <div className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1">
                          <p className="text-xs text-white truncate">{foto.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Checklist in view */}
              {viewDialog.checklist && Object.keys(viewDialog.checklist as object).length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-medium text-foreground mb-3">Checklist</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {categoryChecklists[viewDialog.categorie]?.map(item => {
                      const checked = (viewDialog.checklist as Record<string, boolean>)?.[item.key];
                      return (
                        <div key={item.key} className="flex items-center gap-1.5 text-sm">
                          {checked ? <Check className="h-3.5 w-3.5 text-primary" /> : <span className="h-3.5 w-3.5 rounded-sm border border-muted-foreground/30 inline-block" />}
                          <span className={checked ? "" : "text-muted-foreground"}>{item.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {(viewDialog as any).aandachtspunten && (
                <div className="border-t pt-4">
                  <Label className="text-muted-foreground">Aandachtspunten</Label>
                  <p className="whitespace-pre-wrap">{(viewDialog as any).aandachtspunten}</p>
                </div>
              )}

              {viewDialog.notities && (
                <div className="border-t pt-4">
                  <Label className="text-muted-foreground">Notities</Label>
                  <p className="whitespace-pre-wrap">{viewDialog.notities}</p>
                </div>
              )}
              {canCreate && viewDialog.status === "uitgevoerd" && (
                <div className="border-t pt-4">
                  <Button
                    className="rounded-pill gap-2"
                    onClick={() => {
                      navigate(`/offertes?schouw_id=${viewDialog.id}&lead_id=${viewDialog.lead_id}&klant_naam=${encodeURIComponent(viewDialog.consument_naam || "")}&klant_email=${encodeURIComponent(viewDialog.klant_email || "")}`);
                    }}
                  >
                    <FileText className="h-4 w-4" /> Genereer offerte
                  </Button>
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
