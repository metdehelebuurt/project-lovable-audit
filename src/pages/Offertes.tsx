import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
import { Plus, Pencil, Trash2, Search, FileText, Eye, X, Check, XCircle, MessageSquare, FileDown, Send, Link2, Copy } from "lucide-react";
import ImportExportButtons from "@/components/shared/ImportExportButtons";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import type { Database, Json } from "@/integrations/supabase/types";

type Offerte = Database["public"]["Tables"]["offertes"]["Row"];
type OfferteStatus = Database["public"]["Enums"]["offerte_status"];
type Product = Database["public"]["Tables"]["producten"]["Row"];

const statusLabels: Record<OfferteStatus, string> = {
  concept: "Concept",
  verzonden: "Verzonden",
  geaccepteerd: "Geaccepteerd",
  afgewezen: "Afgewezen",
  verlopen: "Verlopen",
};

const statusColors: Record<OfferteStatus, string> = {
  concept: "bg-muted text-muted-foreground",
  verzonden: "bg-primary/10 text-primary",
  geaccepteerd: "bg-success-light text-success",
  afgewezen: "bg-error-light text-error",
  verlopen: "bg-warning-light text-warning-foreground",
};

interface OfferteRegel {
  product_id?: string;
  omschrijving: string;
  offerte_tekst?: string;
  aantal: number;
  prijs_per_stuk: number;
  btw_percentage: number;
  korting_percentage: number;
}

interface OfferteFormData {
  lead_id: string;
  schouw_id: string;
  klant_naam: string;
  klant_email: string;
  klant_telefoon: string;
  klant_adres: string;
  klant_postcode: string;
  klant_plaats: string;
  geldig_tot: string;
  betalingsvoorwaarden: string;
  notities: string;
  regels: OfferteRegel[];
  include_schouw: boolean;
  include_energieadvies: boolean;
}

const emptyRegel: OfferteRegel = {
  omschrijving: "",
  aantal: 1,
  prijs_per_stuk: 0,
  btw_percentage: 21,
  korting_percentage: 0,
};

const emptyForm: OfferteFormData = {
  lead_id: "",
  schouw_id: "",
  klant_naam: "",
  klant_email: "",
  klant_telefoon: "",
  klant_adres: "",
  klant_postcode: "",
  klant_plaats: "",
  geldig_tot: "",
  betalingsvoorwaarden: "30 dagen netto",
  notities: "",
  regels: [{ ...emptyRegel }],
  include_schouw: false,
  include_energieadvies: false,
};

const generateOfferteNummer = () => {
  const d = new Date();
  const yy = d.getFullYear().toString().slice(2);
  const mm = (d.getMonth() + 1).toString().padStart(2, "0");
  const dd = d.getDate().toString().padStart(2, "0");
  const rand = Math.floor(Math.random() * 9999).toString().padStart(4, "0");
  return `OF-${yy}${mm}${dd}-${rand}`;
};

const Offertes = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("alle");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialog, setViewDialog] = useState<Offerte | null>(null);
  const [editingOfferte, setEditingOfferte] = useState<Offerte | null>(null);
  const [form, setForm] = useState<OfferteFormData>(emptyForm);
  const [feedbackText, setFeedbackText] = useState("");
  const [emailDialog, setEmailDialog] = useState<Offerte | null>(null);
  const [emailTo, setEmailTo] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [shareDialog, setShareDialog] = useState<Offerte | null>(null);
  const [shareLink, setShareLink] = useState("");
  const [generatingLink, setGeneratingLink] = useState(false);
  const queryClient = useQueryClient();

  const isSuperadmin = profile?.rol === "superadmin";
  const isAdmin = profile?.rol === "partner_admin" || profile?.rol === "partner_staff";
  const isConsument = profile?.rol === "consument";
  const canDelete = isSuperadmin || isAdmin;
  const canCreate = isSuperadmin || isAdmin || profile?.rol === "adviseur";
  // Auto-open edit dialog from Schouw link or redirect new to dedicated page
  useEffect(() => {
    const schouwId = searchParams.get("schouw_id");
    const leadId = searchParams.get("lead_id");
    const isNieuw = searchParams.get("nieuw") === "1";

    if ((schouwId || isNieuw) && canCreate) {
      // Redirect to dedicated new offerte page
      const params = new URLSearchParams();
      if (schouwId) params.set("schouw_id", schouwId);
      if (leadId) params.set("lead_id", leadId);
      const klantNaam = searchParams.get("klant_naam");
      const klantEmail = searchParams.get("klant_email");
      if (klantNaam) params.set("klant_naam", klantNaam);
      if (klantEmail) params.set("klant_email", klantEmail);
      navigate(`/offertes/nieuw?${params.toString()}`);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, canCreate]);

  const { data: offertes = [], isLoading } = useQuery({
    queryKey: ["offertes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("offertes").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["leads-for-offertes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("id, voornaam, achternaam, email, telefoon, adres, postcode, plaats");
      if (error) throw error;
      return data;
    },
  });

  const { data: schouwen = [] } = useQuery({
    queryKey: ["schouwen-for-offertes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("schouwen").select("id, schouw_nummer, categorie, consument_naam");
      if (error) throw error;
      return data;
    },
  });

  const { data: producten = [] } = useQuery({
    queryKey: ["producten-for-offertes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("producten").select("*").eq("status", "actief").order("naam");
      if (error) throw error;
      return data as Product[];
    },
  });

  // Calculate totals
  const totals = useMemo(() => {
    let subtotaal = 0;
    let btwBedrag = 0;
    form.regels.forEach(r => {
      const regelSubtotaal = r.aantal * r.prijs_per_stuk * (1 - r.korting_percentage / 100);
      subtotaal += regelSubtotaal;
      btwBedrag += regelSubtotaal * (r.btw_percentage / 100);
    });
    return { subtotaal, btwBedrag, totaal: subtotaal + btwBedrag };
  }, [form.regels]);

  const saveMutation = useMutation({
    mutationFn: async (data: { id?: string } & OfferteFormData) => {
      const { id, regels, ...rest } = data;
      const record: any = {
        klant_naam: rest.klant_naam,
        klant_email: rest.klant_email,
        klant_telefoon: rest.klant_telefoon || null,
        klant_adres: rest.klant_adres || null,
        klant_postcode: rest.klant_postcode || null,
        klant_plaats: rest.klant_plaats || null,
        geldig_tot: rest.geldig_tot,
        betalingsvoorwaarden: rest.betalingsvoorwaarden || null,
        notities: rest.notities || null,
        lead_id: rest.lead_id || null,
        schouw_id: rest.schouw_id || null,
        regels: regels as unknown as Json,
        subtotaal: totals.subtotaal,
        btw_bedrag: totals.btwBedrag,
        totaal_bedrag: totals.totaal,
        include_schouw: rest.include_schouw,
        include_energieadvies: rest.include_energieadvies,
      };

      if (id) {
        const { error } = await supabase.from("offertes").update(record).eq("id", id);
        if (error) throw error;
      } else {
        record.partner_id = profile?.partner_id;
        record.adviseur_id = profile?.id;
        record.offertenummer = generateOfferteNummer();
        if (!record.partner_id && isSuperadmin) {
          throw new Error("Superadmin moet een partner selecteren");
        }
        const { error } = await supabase.from("offertes").insert(record);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offertes"] });
      toast.success(editingOfferte ? "Offerte bijgewerkt" : "Offerte aangemaakt");
      closeDialog();
    },
    onError: (err: Error) => toast.error("Fout", { description: err.message }),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OfferteStatus }) => {
      const { error } = await supabase.from("offertes").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offertes"] });
      toast.success("Status bijgewerkt");
    },
    onError: (err: Error) => toast.error("Fout", { description: err.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("offertes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offertes"] });
      toast.success("Offerte verwijderd");
    },
    onError: (err: Error) => toast.error("Fout", { description: err.message }),
  });

  const openCreate = () => {
    navigate("/offertes/nieuw");
  };

  const openEdit = (o: Offerte) => {
    setEditingOfferte(o);
    const regels = Array.isArray(o.regels) ? (o.regels as unknown as OfferteRegel[]) : [{ ...emptyRegel }];
    setForm({
      lead_id: o.lead_id || "",
      schouw_id: o.schouw_id || "",
      klant_naam: o.klant_naam,
      klant_email: o.klant_email,
      klant_telefoon: o.klant_telefoon || "",
      klant_adres: o.klant_adres || "",
      klant_postcode: o.klant_postcode || "",
      klant_plaats: o.klant_plaats || "",
      geldig_tot: o.geldig_tot,
      betalingsvoorwaarden: o.betalingsvoorwaarden || "",
      notities: o.notities || "",
      regels,
      include_schouw: (o as any).include_schouw ?? false,
      include_energieadvies: (o as any).include_energieadvies ?? false,
    });
    setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditingOfferte(null); setForm(emptyForm); };

  const handleLeadSelect = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      setForm(p => ({
        ...p,
        lead_id: leadId,
        klant_naam: `${lead.voornaam} ${lead.achternaam}`,
        klant_email: lead.email,
        klant_telefoon: lead.telefoon || "",
        klant_adres: lead.adres || "",
        klant_postcode: lead.postcode || "",
        klant_plaats: lead.plaats || "",
      }));
    }
  };

  const addRegel = () => setForm(p => ({ ...p, regels: [...p.regels, { ...emptyRegel }] }));
  const removeRegel = (idx: number) => setForm(p => ({ ...p, regels: p.regels.filter((_, i) => i !== idx) }));
  const updateRegel = (idx: number, field: keyof OfferteRegel, value: string | number) => {
    setForm(p => ({
      ...p,
      regels: p.regels.map((r, i) => i === idx ? { ...r, [field]: value } : r),
    }));
  };

  const selectProduct = (idx: number, productId: string) => {
    const product = producten.find(p => p.id === productId);
    if (product) {
      setForm(p => ({
        ...p,
        regels: p.regels.map((r, i) => i === idx ? {
          ...r,
          product_id: product.id,
          omschrijving: `${product.naam}${product.merk ? ` — ${product.merk}` : ""}${product.model ? ` ${product.model}` : ""}`,
          prijs_per_stuk: product.prijs_excl_btw,
          btw_percentage: product.btw_percentage ?? 21,
        } : r),
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.regels.length === 0) { toast.error("Voeg minimaal één regel toe"); return; }
    saveMutation.mutate(editingOfferte ? { ...form, id: editingOfferte.id } : form);
  };

  const filtered = offertes.filter(o => {
    const matchSearch = `${o.offertenummer} ${o.klant_naam}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "alle" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const formatCurrency = (n: number) => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Offertes</h1>
          <p className="text-muted-foreground mt-1">Offertes aanmaken en beheren</p>
        </div>
        <div className="flex gap-2">
          <ImportExportButtons
            entityType="offertes"
            exportData={offertes}
            exportColumns={[
              { key: "offertenummer", label: "Nummer" }, { key: "klant_naam", label: "Klant" },
              { key: "klant_email", label: "E-mail" }, { key: "subtotaal", label: "Subtotaal" },
              { key: "btw_bedrag", label: "BTW" }, { key: "totaal_bedrag", label: "Totaal" },
              { key: "status", label: "Status" }, { key: "geldig_tot", label: "Geldig tot" },
            ]}
            exportFilename="offertes-export"
            showImport={false}
            queryKey={["offertes"]}
          />
          {canCreate && (
            <Button onClick={openCreate} className="rounded-pill gap-2">
              <Plus className="h-4 w-4" /> Nieuwe Offerte
            </Button>
          )}
        </div>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Zoek offertes..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-xl" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="alle">Alle statussen</SelectItem>
                {(Object.keys(statusLabels) as OfferteStatus[]).map(s => (
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
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Geen offertes gevonden</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nummer</TableHead>
                    <TableHead>Klant</TableHead>
                    <TableHead>Totaal</TableHead>
                    <TableHead>Geldig tot</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(o => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-sm">{o.offertenummer}</TableCell>
                      <TableCell className="font-medium">{o.klant_naam}</TableCell>
                      <TableCell>{formatCurrency(o.totaal_bedrag)}</TableCell>
                      <TableCell>{new Date(o.geldig_tot).toLocaleDateString("nl-NL")}</TableCell>
                      <TableCell>
                        <Select value={o.status} onValueChange={v => statusMutation.mutate({ id: o.id, status: v as OfferteStatus })}>
                          <SelectTrigger className="w-40 h-8">
                            <Badge className={statusColors[o.status]}>{statusLabels[o.status]}</Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.keys(statusLabels) as OfferteStatus[]).map(s => (
                              <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => navigate(`/offertes/${o.id}/pdf`)} title="PDF">
                            <FileDown className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => { setEmailDialog(o); setEmailTo(o.klant_email); }} title="Verstuur per e-mail">
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={async () => {
                            setShareDialog(o);
                            if ((o as any).share_token) {
                              setShareLink(`${window.location.origin}/offerte/${(o as any).share_token}`);
                            } else {
                              setGeneratingLink(true);
                              const token = crypto.randomUUID();
                              const { error } = await supabase.from("offertes").update({
                                share_token: token,
                                share_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                              } as any).eq("id", o.id);
                              if (!error) {
                                setShareLink(`${window.location.origin}/offerte/${token}`);
                                queryClient.invalidateQueries({ queryKey: ["offertes"] });
                              } else {
                                toast.error("Link genereren mislukt");
                              }
                              setGeneratingLink(false);
                            }
                          }} title="Deel link">
                            <Link2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setViewDialog(o)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {o.status === "concept" && (
                            <Button variant="ghost" size="icon" onClick={() => openEdit(o)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Offerte verwijderen</AlertDialogTitle>
                                  <AlertDialogDescription>Weet je zeker dat je offerte {o.offertenummer} wilt verwijderen?</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuleren</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteMutation.mutate(o.id)} className="bg-destructive text-destructive-foreground">Verwijderen</AlertDialogAction>
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingOfferte ? "Offerte bewerken" : "Nieuwe offerte"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Klantgegevens */}
            <div className="space-y-4">
              <h3 className="font-medium text-foreground">Klantgegevens</h3>
              <div>
                <Label>Koppel aan lead</Label>
                <Select value={form.lead_id || "none"} onValueChange={v => v !== "none" && handleLeadSelect(v)}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecteer lead (optioneel)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Geen lead</SelectItem>
                    {leads.map(l => (
                      <SelectItem key={l.id} value={l.id}>{l.voornaam} {l.achternaam} — {l.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Koppel aan schouw</Label>
                <Select value={form.schouw_id || "none"} onValueChange={v => setForm(p => ({ ...p, schouw_id: v === "none" ? "" : v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecteer schouw (optioneel)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Geen schouw</SelectItem>
                    {schouwen.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.schouw_nummer} — {s.consument_naam}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Klantnaam *</Label><Input value={form.klant_naam} onChange={e => setForm(p => ({ ...p, klant_naam: e.target.value }))} required className="rounded-xl" /></div>
                <div><Label>E-mail *</Label><Input type="email" value={form.klant_email} onChange={e => setForm(p => ({ ...p, klant_email: e.target.value }))} required className="rounded-xl" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label>Telefoon</Label><Input value={form.klant_telefoon} onChange={e => setForm(p => ({ ...p, klant_telefoon: e.target.value }))} className="rounded-xl" /></div>
                <div><Label>Adres</Label><Input value={form.klant_adres} onChange={e => setForm(p => ({ ...p, klant_adres: e.target.value }))} className="rounded-xl" /></div>
                <div><Label>Postcode</Label><Input value={form.klant_postcode} onChange={e => setForm(p => ({ ...p, klant_postcode: e.target.value }))} className="rounded-xl" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label>Plaats</Label><Input value={form.klant_plaats} onChange={e => setForm(p => ({ ...p, klant_plaats: e.target.value }))} className="rounded-xl" /></div>
                <div><Label>Geldig tot *</Label><Input type="date" value={form.geldig_tot} onChange={e => setForm(p => ({ ...p, geldig_tot: e.target.value }))} required className="rounded-xl" /></div>
                <div><Label>Betalingsvoorwaarden</Label><Input value={form.betalingsvoorwaarden} onChange={e => setForm(p => ({ ...p, betalingsvoorwaarden: e.target.value }))} className="rounded-xl" /></div>
              </div>
            </div>

            {/* Offerteregels */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-foreground">Offerteregels</h3>
                <Button type="button" variant="outline" size="sm" onClick={addRegel} className="rounded-pill gap-1">
                  <Plus className="h-3 w-3" /> Regel toevoegen
                </Button>
              </div>
              {form.regels.map((regel, idx) => (
                <div key={idx} className="border rounded-xl p-4 space-y-3 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Regel {idx + 1}</span>
                    {form.regels.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeRegel(idx)} className="h-6 w-6 text-destructive">
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div>
                    <Label>Product uit catalogus</Label>
                    <Select value={regel.product_id || "none"} onValueChange={v => v !== "none" && selectProduct(idx, v)}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecteer product (optioneel)" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Handmatig invoeren</SelectItem>
                        {producten.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.naam} — {formatCurrency(p.prijs_excl_btw)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Omschrijving *</Label><Input value={regel.omschrijving} onChange={e => updateRegel(idx, "omschrijving", e.target.value)} required className="rounded-xl" /></div>
                  <div className="grid grid-cols-4 gap-3">
                    <div><Label>Aantal</Label><Input type="number" min={1} value={regel.aantal} onChange={e => updateRegel(idx, "aantal", Number(e.target.value))} className="rounded-xl" /></div>
                    <div><Label>Prijs excl. BTW</Label><Input type="number" step="0.01" min={0} value={regel.prijs_per_stuk} onChange={e => updateRegel(idx, "prijs_per_stuk", Number(e.target.value))} className="rounded-xl" /></div>
                    <div><Label>BTW %</Label><Input type="number" min={0} max={100} value={regel.btw_percentage} onChange={e => updateRegel(idx, "btw_percentage", Number(e.target.value))} className="rounded-xl" /></div>
                    <div><Label>Korting %</Label><Input type="number" min={0} max={100} value={regel.korting_percentage} onChange={e => updateRegel(idx, "korting_percentage", Number(e.target.value))} className="rounded-xl" /></div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    Subtotaal: {formatCurrency(regel.aantal * regel.prijs_per_stuk * (1 - regel.korting_percentage / 100))}
                  </div>
                </div>
              ))}

              {/* Totalen */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotaal excl. BTW</span>
                  <span>{formatCurrency(totals.subtotaal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">BTW</span>
                  <span>{formatCurrency(totals.btwBedrag)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Totaal incl. BTW</span>
                  <span>{formatCurrency(totals.totaal)}</span>
                </div>
              </div>
            </div>

            {/* Opties */}
            {form.schouw_id && (
              <div className="space-y-3 border-t pt-4">
                <h3 className="font-medium text-foreground">PDF-opties</h3>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="include_schouw"
                    checked={form.include_schouw}
                    onCheckedChange={(c) => setForm(p => ({ ...p, include_schouw: !!c }))}
                  />
                  <Label htmlFor="include_schouw" className="cursor-pointer">Schouwgegevens opnemen in offerte PDF</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="include_energieadvies"
                    checked={form.include_energieadvies}
                    onCheckedChange={(c) => setForm(p => ({ ...p, include_energieadvies: !!c }))}
                  />
                  <Label htmlFor="include_energieadvies" className="cursor-pointer">Energieadvies opnemen in offerte PDF</Label>
                </div>
              </div>
            )}

            <div>
              <Label>Notities</Label>
              <Textarea value={form.notities} onChange={e => setForm(p => ({ ...p, notities: e.target.value }))} className="rounded-xl" rows={3} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog} className="rounded-pill">Annuleren</Button>
              <Button type="submit" className="rounded-pill" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Opslaan..." : editingOfferte ? "Bijwerken" : "Aanmaken"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewDialog} onOpenChange={() => setViewDialog(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Offerte {viewDialog?.offertenummer}</DialogTitle>
          </DialogHeader>
          {viewDialog && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Badge className={statusColors[viewDialog.status]}>{statusLabels[viewDialog.status]}</Badge>
                <span className="text-sm text-muted-foreground">Geldig tot {new Date(viewDialog.geldig_tot).toLocaleDateString("nl-NL")}</span>
                <Button variant="outline" size="sm" className="ml-auto rounded-pill gap-1" onClick={() => navigate(`/offertes/${viewDialog.id}/pdf`)}>
                  <FileDown className="h-4 w-4" /> PDF
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-muted-foreground">Klant</Label><p className="font-medium">{viewDialog.klant_naam}</p></div>
                <div><Label className="text-muted-foreground">E-mail</Label><p>{viewDialog.klant_email}</p></div>
                <div><Label className="text-muted-foreground">Telefoon</Label><p>{viewDialog.klant_telefoon || "—"}</p></div>
                <div><Label className="text-muted-foreground">Adres</Label><p>{viewDialog.klant_adres ? `${viewDialog.klant_adres}, ${viewDialog.klant_postcode} ${viewDialog.klant_plaats}` : "—"}</p></div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium text-foreground mb-3">Regels</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Omschrijving</TableHead>
                      <TableHead className="text-right">Aantal</TableHead>
                      <TableHead className="text-right">Prijs</TableHead>
                      <TableHead className="text-right">BTW</TableHead>
                      <TableHead className="text-right">Korting</TableHead>
                      <TableHead className="text-right">Subtotaal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(viewDialog.regels) ? viewDialog.regels as unknown as OfferteRegel[] : []).map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>{r.omschrijving}</TableCell>
                        <TableCell className="text-right">{r.aantal}</TableCell>
                        <TableCell className="text-right">{formatCurrency(r.prijs_per_stuk)}</TableCell>
                        <TableCell className="text-right">{r.btw_percentage}%</TableCell>
                        <TableCell className="text-right">{r.korting_percentage}%</TableCell>
                        <TableCell className="text-right">{formatCurrency(r.aantal * r.prijs_per_stuk * (1 - r.korting_percentage / 100))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4 space-y-1 text-right">
                  <p className="text-sm"><span className="text-muted-foreground">Subtotaal:</span> {formatCurrency(viewDialog.subtotaal)}</p>
                  <p className="text-sm"><span className="text-muted-foreground">BTW:</span> {formatCurrency(viewDialog.btw_bedrag)}</p>
                  <p className="text-lg font-semibold">{formatCurrency(viewDialog.totaal_bedrag)}</p>
                </div>
              </div>

              {viewDialog.notities && (
                <div className="border-t pt-4">
                  <Label className="text-muted-foreground">Notities</Label>
                  <p className="whitespace-pre-wrap">{viewDialog.notities}</p>
                </div>
              )}

              {/* Consument: accept/reject/feedback */}
              {isConsument && viewDialog.status === "verzonden" && (
                <div className="border-t pt-4 space-y-4">
                  <h3 className="font-medium text-foreground">Reageren op deze offerte</h3>
                  <div className="flex gap-3">
                    <Button
                      className="rounded-pill gap-2 bg-success hover:bg-success/90 text-white"
                      onClick={() => {
                        statusMutation.mutate({ id: viewDialog.id, status: "geaccepteerd" });
                        setViewDialog({ ...viewDialog, status: "geaccepteerd" });
                      }}
                    >
                      <Check className="h-4 w-4" /> Accepteren
                    </Button>
                    <Button
                      variant="destructive"
                      className="rounded-pill gap-2"
                      onClick={() => {
                        statusMutation.mutate({ id: viewDialog.id, status: "afgewezen" });
                        setViewDialog({ ...viewDialog, status: "afgewezen" });
                      }}
                    >
                      <XCircle className="h-4 w-4" /> Afwijzen
                    </Button>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Feedback / vraag</Label>
                    <div className="flex gap-2">
                      <Textarea
                        value={feedbackText}
                        onChange={e => setFeedbackText(e.target.value)}
                        placeholder="Stel een vraag of geef feedback..."
                        className="rounded-xl flex-1"
                        rows={2}
                      />
                      <Button
                        variant="outline"
                        className="rounded-pill self-end gap-1"
                        disabled={!feedbackText.trim()}
                        onClick={async () => {
                          const existing = Array.isArray(viewDialog.feedback_berichten) ? viewDialog.feedback_berichten : [];
                          const newMsg = { auteur: profile?.voornaam + " " + profile?.achternaam, bericht: feedbackText.trim(), datum: new Date().toISOString(), rol: "consument" };
                          const updated = [...existing, newMsg];
                          await supabase.from("offertes").update({ feedback_berichten: updated as unknown as Json }).eq("id", viewDialog.id);
                          setViewDialog({ ...viewDialog, feedback_berichten: updated as unknown as Json });
                          setFeedbackText("");
                          toast.success("Feedback verzonden");
                          queryClient.invalidateQueries({ queryKey: ["offertes"] });
                        }}
                      >
                        <MessageSquare className="h-4 w-4" /> Verstuur
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Show existing feedback */}
              {viewDialog.feedback_berichten && Array.isArray(viewDialog.feedback_berichten) && (viewDialog.feedback_berichten as any[]).length > 0 && (
                <div className="border-t pt-4 space-y-3">
                  <h3 className="font-medium text-foreground">Feedback berichten</h3>
                  {(viewDialog.feedback_berichten as any[]).map((fb: any, i: number) => (
                    <div key={i} className="bg-muted/30 rounded-xl p-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span className="font-medium">{fb.auteur}</span>
                        <span>{new Date(fb.datum).toLocaleString("nl-NL")}</span>
                      </div>
                      <p className="text-sm">{fb.bericht}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* E-mail versturen dialog */}
      <Dialog open={!!emailDialog} onOpenChange={(open) => !open && setEmailDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Offerte per e-mail versturen</DialogTitle>
          </DialogHeader>
          {emailDialog && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!emailTo.trim()) { toast.error("Vul een e-mailadres in"); return; }
                setSendingEmail(true);
                try {
                  const { data, error } = await supabase.functions.invoke("send-offerte-email", {
                    body: { offerte_id: emailDialog.id, ontvanger_email: emailTo.trim() },
                  });
                  if (error || data?.error) {
                    toast.error("Versturen mislukt", { description: data?.error || error?.message });
                  } else {
                    toast.success("Offerte verstuurd", { description: `E-mail verzonden naar ${emailTo}` });
                    queryClient.invalidateQueries({ queryKey: ["offertes"] });
                    setEmailDialog(null);
                  }
                } catch {
                  toast.error("Versturen mislukt");
                }
                setSendingEmail(false);
              }}
              className="space-y-4"
            >
              <p className="text-sm text-muted-foreground">
                Offerte <span className="font-medium text-foreground">{emailDialog.offertenummer}</span> wordt per e-mail verstuurd naar de klant.
              </p>
              <div>
                <Label>Ontvanger e-mail</Label>
                <Input
                  type="email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  required
                  className="rounded-xl mt-1"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEmailDialog(null)} className="rounded-pill">Annuleren</Button>
                <Button type="submit" className="rounded-pill gap-2" disabled={sendingEmail}>
                  <Send className="h-4 w-4" />
                  {sendingEmail ? "Versturen..." : "Versturen"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      {/* Share link dialog */}
      <Dialog open={!!shareDialog} onOpenChange={(open) => !open && setShareDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Offertelink delen</DialogTitle>
          </DialogHeader>
          {shareDialog && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Deel deze link met <strong>{shareDialog.klant_naam}</strong> zodat zij de offerte online kunnen bekijken en accepteren.
              </p>
              {generatingLink ? (
                <p className="text-sm text-muted-foreground">Link genereren...</p>
              ) : shareLink ? (
                <div className="flex gap-2">
                  <Input value={shareLink} readOnly className="rounded-xl text-xs" />
                  <Button variant="outline" size="icon" onClick={() => {
                    navigator.clipboard.writeText(shareLink);
                    toast.success("Link gekopieerd!");
                  }} className="shrink-0">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ) : null}
              <p className="text-xs text-muted-foreground">De link is 30 dagen geldig. De klant kan de offerte bekijken en direct online accepteren.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Offertes;
