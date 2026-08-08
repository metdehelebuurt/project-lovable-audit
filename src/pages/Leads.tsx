import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Users, FileText, ClipboardCheck, LayoutList, Columns3, GripVertical, Phone, Mail, MapPin, Layers, List } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import ImportExportButtons from "@/components/shared/ImportExportButtons";
import type { Database } from "@/integrations/supabase/types";
import { DuplicatenBanner } from "@/components/leads/duplicaten/DuplicatenBanner";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];
type LeadStatus = Database["public"]["Enums"]["lead_status"];

const statusLabels: Record<LeadStatus, string> = {
  nieuw: "Nieuw", contact_geprobeerd: "Contact geprobeerd", geen_gehoor: "Geen gehoor",
  voicemail: "Voicemail", terugbellen: "Terugbellen", gesproken: "Gesproken",
  afspraak_gepland: "Afspraak gepland", gekwalificeerd: "Gekwalificeerd",
  offerte_verzonden: "Offerte verzonden", klant: "Klant", verloren: "Verloren",
};
const statusColors: Record<LeadStatus, string> = {
  nieuw: "bg-primary/10 text-primary", contact_geprobeerd: "bg-sky-100 text-sky-700",
  geen_gehoor: "bg-orange-100 text-orange-700", voicemail: "bg-amber-100 text-amber-700",
  terugbellen: "bg-yellow-100 text-yellow-700", gesproken: "bg-teal-100 text-teal-700",
  afspraak_gepland: "bg-indigo-100 text-indigo-700",
  gekwalificeerd: "bg-success-light text-success",
  offerte_verzonden: "bg-warning-light text-warning-foreground", klant: "bg-success text-success-foreground",
  verloren: "bg-error-light text-error",
};

// Kanban: alle 10 kolommen (uitgebreide modus)
const kanbanColumnsAll: { status: LeadStatus; color: string }[] = [
  { status: "nieuw", color: "border-t-primary" },
  { status: "contact_geprobeerd", color: "border-t-sky-500" },
  { status: "geen_gehoor", color: "border-t-orange-500" },
  { status: "terugbellen", color: "border-t-yellow-500" },
  { status: "gesproken", color: "border-t-teal-500" },
  { status: "afspraak_gepland", color: "border-t-indigo-500" },
  { status: "gekwalificeerd", color: "border-t-emerald-500" },
  { status: "offerte_verzonden", color: "border-t-amber-500" },
  { status: "klant", color: "border-t-green-600" },
  { status: "verloren", color: "border-t-red-500" },
];

// Kanban: 5 gegroepeerde kolommen (standaard)
type KanbanGroup = { label: string; statuses: LeadStatus[]; color: string; defaultDrop: LeadStatus };
const kanbanGroups: KanbanGroup[] = [
  { label: "Nieuw", statuses: ["nieuw"], color: "border-t-primary", defaultDrop: "nieuw" },
  { label: "Contact", statuses: ["contact_geprobeerd", "geen_gehoor", "terugbellen", "gesproken"], color: "border-t-sky-500", defaultDrop: "contact_geprobeerd" },
  { label: "Gekwalificeerd", statuses: ["afspraak_gepland", "gekwalificeerd"], color: "border-t-emerald-500", defaultDrop: "gekwalificeerd" },
  { label: "Offerte", statuses: ["offerte_verzonden"], color: "border-t-amber-500", defaultDrop: "offerte_verzonden" },
  { label: "Afgerond", statuses: ["klant", "verloren"], color: "border-t-green-600", defaultDrop: "klant" },
];

const DEFAULT_BRONNEN = ["website", "telefoon", "referral", "advertentie", "beurs", "social media", "overig"];

interface LeadFormData {
  voornaam: string; achternaam: string; email: string; telefoon: string;
  bedrijfsnaam: string; adres: string; postcode: string; plaats: string;
  bron: string; notities: string;
}
const emptyForm: LeadFormData = {
  voornaam: "", achternaam: "", email: "", telefoon: "",
  bedrijfsnaam: "", adres: "", postcode: "", plaats: "",
  bron: "", notities: "",
};

const Leads = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("alle");
  const [viewMode, setViewMode] = useState<"tabel" | "kanban">("tabel");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [form, setForm] = useState<LeadFormData>(emptyForm);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<LeadStatus | "">("");
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [kanbanMode, setKanbanMode] = useState<"grouped" | "extended">("grouped");
  const [dropTargetGroup, setDropTargetGroup] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const isSuperadmin = profile?.rol === "superadmin";
  const isAdmin = profile?.rol === "partner_admin" || profile?.rol === "partner_staff";

  // Fetch partner-specific lead sources
  const { data: bronOptions = DEFAULT_BRONNEN } = useQuery({
    queryKey: ["partner-lead-bronnen", profile?.partner_id],
    queryFn: async () => {
      if (!profile?.partner_id) return DEFAULT_BRONNEN;
      const { data } = await supabase.from("partners").select("lead_bronnen").eq("id", profile.partner_id).single();
      if (data?.lead_bronnen && Array.isArray(data.lead_bronnen)) return data.lead_bronnen as string[];
      return DEFAULT_BRONNEN;
    },
    enabled: !!profile,
  });

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Lead[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { id?: string } & LeadFormData) => {
      const { id, ...rest } = data;
      const record: any = {
        ...rest,
        telefoon: rest.telefoon || null, bedrijfsnaam: rest.bedrijfsnaam || null,
        adres: rest.adres || null, postcode: rest.postcode || null,
        plaats: rest.plaats || null, bron: rest.bron || null, notities: rest.notities || null,
      };
      if (id) {
        const { error } = await supabase.from("leads").update(record).eq("id", id);
        if (error) throw error;
      } else {
        record.partner_id = profile?.partner_id;
        record.owner_user_id = profile?.id;
        if (!record.partner_id && isSuperadmin) throw new Error("Superadmin moet een partner selecteren");
        const { error } = await supabase.from("leads").insert(record as LeadInsert);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success(editingLead ? "Lead bijgewerkt" : "Lead aangemaakt");
      closeDialog();
    },
    onError: (err: Error) => toast.error("Fout", { description: err.message }),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: LeadStatus }) => {
      const { error } = await supabase.from("leads").update({ lead_status: status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Status bijgewerkt");
    },
    onError: (err: Error) => toast.error("Fout", { description: err.message }),
  });

  const bulkStatusMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: LeadStatus }) => {
      const { error } = await supabase.from("leads").update({ lead_status: status }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success(`${selected.size} leads bijgewerkt`);
      setSelected(new Set());
      setBulkStatus("");
    },
    onError: (err: Error) => toast.error("Fout", { description: err.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Fetch lead voor audit-log snapshot
      const { data: leadSnapshot } = await supabase.from("leads").select("*").eq("id", id).maybeSingle();
      // Clean up FK references before deleting
      await Promise.all([
        supabase.from("lead_notities").delete().eq("lead_id", id),
        supabase.from("lead_contactmomenten").delete().eq("lead_id", id),
        supabase.from("lead_eigenschappen").delete().eq("lead_id", id),
      ]);
      // Unlink offertes and klanten
      await supabase.from("offertes").update({ lead_id: null } as any).eq("lead_id", id);
      await supabase.from("klanten").update({ lead_id: null } as any).eq("lead_id", id);
      await supabase.from("schouwen").delete().eq("lead_id", id);
      await supabase.from("afspraken").delete().eq("lead_id", id);
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
      // Audit-log
      await supabase.from("audit_log").insert({
        actie: "lead_verwijderd",
        entity_type: "lead",
        entity_id: id,
        actor_id: profile?.id ?? null,
        partner_id: profile?.partner_id ?? null,
        oude_waarde: leadSnapshot ?? null,
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead verwijderd");
    },
    onError: (err: Error) => toast.error("Fout", { description: err.message }),
  });

  const openCreate = () => { setEditingLead(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (l: Lead) => {
    setEditingLead(l);
    setForm({
      voornaam: l.voornaam, achternaam: l.achternaam, email: l.email,
      telefoon: l.telefoon || "", bedrijfsnaam: l.bedrijfsnaam || "",
      adres: l.adres || "", postcode: l.postcode || "", plaats: l.plaats || "",
      bron: l.bron || "", notities: l.notities || "",
    });
    setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditingLead(null); setForm(emptyForm); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(editingLead ? { ...form, id: editingLead.id } : form);
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(l => l.id)));
  };

  const handleBulkUpdate = () => {
    if (!bulkStatus || selected.size === 0) return;
    bulkStatusMutation.mutate({ ids: Array.from(selected), status: bulkStatus as LeadStatus });
  };

  const filtered = leads.filter(l => {
    const matchSearch = `${l.voornaam} ${l.achternaam} ${l.email} ${l.plaats ?? ""}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "alle" || l.lead_status === statusFilter;
    return matchSearch && matchStatus;
  });

  const canDelete = isSuperadmin || isAdmin;

  // Drag & drop handlers for kanban
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggedLeadId(leadId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetStatus: LeadStatus) => {
    e.preventDefault();
    if (draggedLeadId) {
      const lead = leads.find(l => l.id === draggedLeadId);
      if (lead && lead.lead_status !== targetStatus) {
        statusMutation.mutate({ id: draggedLeadId, status: targetStatus });
      }
    }
    setDraggedLeadId(null);
  };

  return (
    <div className="space-y-6">
      <DuplicatenBanner />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-foreground">Leads</h1>
          <p className="text-muted-foreground mt-1 text-sm">Beheer leads en prospects</p>
        </div>
        <div className="flex gap-2">
          <ImportExportButtons
            entityType="leads"
            exportData={leads}
            exportColumns={[
              { key: "voornaam", label: "Voornaam" }, { key: "achternaam", label: "Achternaam" },
              { key: "email", label: "E-mail" }, { key: "telefoon", label: "Telefoon" },
              { key: "bedrijfsnaam", label: "Bedrijfsnaam" }, { key: "adres", label: "Adres" },
              { key: "postcode", label: "Postcode" }, { key: "plaats", label: "Plaats" },
              { key: "bron", label: "Bron" }, { key: "lead_status", label: "Status" },
            ]}
            exportFilename="leads-export"
            queryKey={["leads"]}
          />
          {/* View toggle */}
          <div className="flex rounded-xl border overflow-hidden">
            <button
              onClick={() => setViewMode("tabel")}
              className={`px-3 py-2 text-sm flex items-center gap-1.5 transition-colors ${viewMode === "tabel" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"}`}
            >
              <LayoutList className="h-4 w-4" />
              <span className="hidden sm:inline">Lijst</span>
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-2 text-sm flex items-center gap-1.5 transition-colors ${viewMode === "kanban" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"}`}
            >
              <Columns3 className="h-4 w-4" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
          </div>
          <Button onClick={openCreate} data-tour="leads:nieuw" className="rounded-pill gap-2">
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Nieuwe Lead</span><span className="sm:hidden">Nieuw</span>
          </Button>
        </div>
      </div>

      {/* Search + filters (shared) */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Zoek leads..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-xl" />
        </div>
        {viewMode === "tabel" && (
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="alle">Alle statussen</SelectItem>
              {(Object.keys(statusLabels) as LeadStatus[]).map(s => (
                <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {viewMode === "kanban" && (
          <div className="flex rounded-lg border overflow-hidden">
            <button
              onClick={() => setKanbanMode("grouped")}
              className={`px-3 py-1.5 text-xs flex items-center gap-1.5 transition-colors ${kanbanMode === "grouped" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"}`}
            >
              <Layers className="h-3.5 w-3.5" />
              Gegroepeerd
            </button>
            <button
              onClick={() => setKanbanMode("extended")}
              className={`px-3 py-1.5 text-xs flex items-center gap-1.5 transition-colors ${kanbanMode === "extended" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"}`}
            >
              <List className="h-3.5 w-3.5" />
              Uitgebreid
            </button>
          </div>
        )}
      </div>

      {/* Bulk actions */}
      {viewMode === "tabel" && selected.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
          <span className="text-sm font-medium">{selected.size} geselecteerd</span>
          <Select value={bulkStatus} onValueChange={v => setBulkStatus(v as LeadStatus)}>
            <SelectTrigger className="w-44 h-8 rounded-lg"><SelectValue placeholder="Nieuwe status..." /></SelectTrigger>
            <SelectContent>
              {(Object.keys(statusLabels) as LeadStatus[]).map(s => (
                <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleBulkUpdate} disabled={!bulkStatus || bulkStatusMutation.isPending} className="rounded-pill">
            {bulkStatusMutation.isPending ? "Bijwerken..." : "Status wijzigen"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())} className="rounded-pill">Deselecteer</Button>
        </div>
      )}

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Laden...</p>
      ) : viewMode === "kanban" ? (
        /* ==================== KANBAN VIEW ==================== */
        <TooltipProvider delayDuration={300}>
          <div className="flex gap-3">
            {kanbanMode === "grouped" ? (
              /* --- GROUPED: 5 kolommen --- */
              kanbanGroups.map(group => {
                const colLeads = filtered.filter(l => group.statuses.includes(l.lead_status));
                return (
                  <div
                    key={group.label}
                    className={`flex-1 min-w-0 rounded-2xl bg-muted/30 border border-border/50 border-t-4 ${group.color} flex flex-col`}
                    onDragOver={handleDragOver}
                    onDrop={e => {
                      e.preventDefault();
                      if (draggedLeadId) {
                        const lead = leads.find(l => l.id === draggedLeadId);
                        if (lead) {
                          // Als lead al in deze groep zit, niet wijzigen
                          if (!group.statuses.includes(lead.lead_status)) {
                            if (group.statuses.length === 1) {
                              statusMutation.mutate({ id: draggedLeadId, status: group.statuses[0] });
                            } else {
                              setDropTargetGroup(group.label);
                              // Toon substatus keuze — voor nu default
                              statusMutation.mutate({ id: draggedLeadId, status: group.defaultDrop });
                            }
                          }
                        }
                        setDraggedLeadId(null);
                      }
                    }}
                  >
                    <div className="px-3 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm text-foreground">{group.label}</h3>
                        <span className="text-xs bg-background border rounded-full px-2 py-0.5 text-muted-foreground font-medium">
                          {colLeads.length}
                        </span>
                      </div>
                    </div>
                    <div className="px-2 pb-2 space-y-1.5 flex-1 overflow-y-auto max-h-[calc(100vh-320px)]">
                      {colLeads.length === 0 ? (
                        <div className="text-center py-6 text-xs text-muted-foreground">Sleep hierheen</div>
                      ) : colLeads.map(lead => (
                        <Tooltip key={lead.id}>
                          <TooltipTrigger asChild>
                            <div
                              draggable
                              onDragStart={e => handleDragStart(e, lead.id)}
                              onClick={() => navigate(`/leads/${lead.id}`)}
                              className={`bg-background rounded-lg border shadow-sm px-3 py-2 cursor-pointer hover:shadow-md transition-all group ${
                                draggedLeadId === lead.id ? "opacity-50 scale-95" : ""
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1.5">
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-sm text-foreground truncate">
                                    {lead.voornaam} {lead.achternaam}
                                  </p>
                                </div>
                                <GripVertical className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground shrink-0 cursor-grab" />
                              </div>
                              <div className="flex items-center gap-1.5 mt-1">
                                {lead.bedrijfsnaam && (
                                  <span className="text-xs text-muted-foreground truncate">{lead.bedrijfsnaam}</span>
                                )}
                                {group.statuses.length > 1 && (
                                  <Badge className={`${statusColors[lead.lead_status]} text-[10px] px-1.5 py-0 ml-auto shrink-0`}>
                                    {statusLabels[lead.lead_status]}
                                  </Badge>
                                )}
                                {lead.bron && group.statuses.length <= 1 && (
                                  <span className="text-[10px] bg-muted rounded px-1.5 py-0 text-muted-foreground capitalize ml-auto shrink-0">{lead.bron}</span>
                                )}
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="text-xs space-y-1 max-w-[200px]">
                            {lead.email && <div className="flex items-center gap-1.5"><Mail className="h-3 w-3 shrink-0" /><span className="truncate">{lead.email}</span></div>}
                            {lead.telefoon && <div className="flex items-center gap-1.5"><Phone className="h-3 w-3 shrink-0" />{lead.telefoon}</div>}
                            {lead.plaats && <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3 shrink-0" />{lead.plaats}</div>}
                            {lead.bron && <div className="capitalize">Bron: {lead.bron}</div>}
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              /* --- EXTENDED: alle 10 kolommen --- */
              kanbanColumnsAll.map(col => {
                const colLeads = filtered.filter(l => l.lead_status === col.status);
                return (
                  <div
                    key={col.status}
                    className={`flex-1 min-w-0 rounded-2xl bg-muted/30 border border-border/50 border-t-4 ${col.color} flex flex-col`}
                    onDragOver={handleDragOver}
                    onDrop={e => handleDrop(e, col.status)}
                  >
                    <div className="px-2 py-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-semibold text-xs text-foreground truncate">{statusLabels[col.status]}</h3>
                        <span className="text-[10px] bg-background border rounded-full px-1.5 py-0 text-muted-foreground font-medium">
                          {colLeads.length}
                        </span>
                      </div>
                    </div>
                    <div className="px-1.5 pb-1.5 space-y-1 flex-1 overflow-y-auto max-h-[calc(100vh-320px)]">
                      {colLeads.length === 0 ? (
                        <div className="text-center py-4 text-[10px] text-muted-foreground">Sleep hierheen</div>
                      ) : colLeads.map(lead => (
                        <Tooltip key={lead.id}>
                          <TooltipTrigger asChild>
                            <div
                              draggable
                              onDragStart={e => handleDragStart(e, lead.id)}
                              onClick={() => navigate(`/leads/${lead.id}`)}
                              className={`bg-background rounded-lg border shadow-sm px-2 py-1.5 cursor-pointer hover:shadow-md transition-all group ${
                                draggedLeadId === lead.id ? "opacity-50 scale-95" : ""
                              }`}
                            >
                              <p className="font-medium text-xs text-foreground truncate">
                                {lead.voornaam} {lead.achternaam}
                              </p>
                              {lead.bedrijfsnaam && (
                                <p className="text-[10px] text-muted-foreground truncate">{lead.bedrijfsnaam}</p>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="text-xs space-y-1 max-w-[200px]">
                            {lead.email && <div className="flex items-center gap-1.5"><Mail className="h-3 w-3 shrink-0" /><span className="truncate">{lead.email}</span></div>}
                            {lead.telefoon && <div className="flex items-center gap-1.5"><Phone className="h-3 w-3 shrink-0" />{lead.telefoon}</div>}
                            {lead.plaats && <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3 shrink-0" />{lead.plaats}</div>}
                            {lead.bron && <div className="capitalize">Bron: {lead.bron}</div>}
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </TooltipProvider>
      ) : (
        /* ==================== TABLE VIEW ==================== */
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="pt-6">
            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Geen leads gevonden</p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <Checkbox checked={selected.size === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} />
                        </TableHead>
                        <TableHead>Naam</TableHead>
                        <TableHead>E-mail</TableHead>
                        <TableHead>Telefoon</TableHead>
                        <TableHead>Plaats</TableHead>
                        <TableHead>Bron</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Acties</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map(lead => (
                        <TableRow key={lead.id} className={`${selected.has(lead.id) ? "bg-muted/50" : ""} cursor-pointer hover:bg-muted/30`} onClick={() => navigate(`/leads/${lead.id}`)}>
                          <TableCell onClick={e => e.stopPropagation()}>
                            <Checkbox checked={selected.has(lead.id)} onCheckedChange={() => toggleSelect(lead.id)} />
                          </TableCell>
                          <TableCell className="font-medium text-primary hover:underline">{lead.voornaam} {lead.achternaam}</TableCell>
                          <TableCell>{lead.email}</TableCell>
                          <TableCell>{lead.telefoon || "—"}</TableCell>
                          <TableCell>{lead.plaats || "—"}</TableCell>
                          <TableCell className="capitalize">{lead.bron || "—"}</TableCell>
                          <TableCell onClick={e => e.stopPropagation()}>
                            <Select value={lead.lead_status} onValueChange={v => statusMutation.mutate({ id: lead.id, status: v as LeadStatus })}>
                              <SelectTrigger className="w-44 h-8 overflow-hidden">
                                <Badge className={`${statusColors[lead.lead_status]} max-w-full whitespace-nowrap truncate block`}>
                                  {statusLabels[lead.lead_status]}
                                </Badge>
                              </SelectTrigger>
                              <SelectContent>
                                {(Object.keys(statusLabels) as LeadStatus[]).map(s => (
                                  <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" title="Offerte maken" onClick={() => {
                                sessionStorage.setItem("offerte-prefill", JSON.stringify({
                                  lead: { id: lead.id, voornaam: lead.voornaam, achternaam: lead.achternaam, email: lead.email, telefoon: lead.telefoon, adres: lead.adres, postcode: lead.postcode, plaats: lead.plaats },
                                }));
                                navigate("/offertes/nieuw");
                              }}>
                                <FileText className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" title="Schouw plannen" onClick={() => navigate("/schouwen")}>
                                <ClipboardCheck className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => openEdit(lead)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {canDelete && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Lead verwijderen</AlertDialogTitle>
                                      <AlertDialogDescription>Weet je zeker dat je {lead.voornaam} {lead.achternaam} wilt verwijderen?</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Annuleren</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => deleteMutation.mutate(lead.id)} className="bg-destructive text-destructive-foreground">Verwijderen</AlertDialogAction>
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

                {/* Mobile cards */}
                <div className="md:hidden space-y-3">
                  {filtered.map(lead => (
                    <div
                      key={lead.id}
                      className="rounded-xl border border-border p-4 bg-card cursor-pointer active:scale-[0.98] transition-transform"
                      onClick={() => navigate(`/leads/${lead.id}`)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-foreground truncate">{lead.voornaam} {lead.achternaam}</p>
                          <p className="text-sm text-muted-foreground truncate">{lead.email}</p>
                        </div>
                        <Badge className={`${statusColors[lead.lead_status]} ml-2 flex-shrink-0`}>{statusLabels[lead.lead_status]}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                        {lead.telefoon && <span>{lead.telefoon}</span>}
                        {lead.plaats && <span>{lead.plaats}</span>}
                        {lead.bron && <span className="capitalize">{lead.bron}</span>}
                      </div>
                      <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                          sessionStorage.setItem("offerte-prefill", JSON.stringify({ lead: { id: lead.id, voornaam: lead.voornaam, achternaam: lead.achternaam, email: lead.email, telefoon: lead.telefoon, adres: lead.adres, postcode: lead.postcode, plaats: lead.plaats } }));
                          navigate("/offertes/nieuw");
                        }}>
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(lead)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {canDelete && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Lead verwijderen</AlertDialogTitle>
                                <AlertDialogDescription>Weet je zeker dat je {lead.voornaam} {lead.achternaam} wilt verwijderen?</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuleren</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteMutation.mutate(lead.id)} className="bg-destructive text-destructive-foreground">Verwijderen</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLead ? "Lead bewerken" : "Nieuwe lead"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>Voornaam *</Label><Input value={form.voornaam} onChange={e => setForm(p => ({ ...p, voornaam: e.target.value }))} required className="rounded-xl" /></div>
              <div><Label>Achternaam *</Label><Input value={form.achternaam} onChange={e => setForm(p => ({ ...p, achternaam: e.target.value }))} required className="rounded-xl" /></div>
            </div>
            <div><Label>E-mailadres *</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required className="rounded-xl" /></div>
            <div><Label>Telefoon</Label><Input value={form.telefoon} onChange={e => setForm(p => ({ ...p, telefoon: e.target.value }))} className="rounded-xl" /></div>
            <div><Label>Bedrijfsnaam</Label><Input value={form.bedrijfsnaam} onChange={e => setForm(p => ({ ...p, bedrijfsnaam: e.target.value }))} className="rounded-xl" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2"><Label>Adres</Label><Input value={form.adres} onChange={e => setForm(p => ({ ...p, adres: e.target.value }))} className="rounded-xl" /></div>
              <div><Label>Postcode</Label><Input value={form.postcode} onChange={e => setForm(p => ({ ...p, postcode: e.target.value }))} className="rounded-xl" /></div>
            </div>
            <div><Label>Plaats</Label><Input value={form.plaats} onChange={e => setForm(p => ({ ...p, plaats: e.target.value }))} className="rounded-xl" /></div>
            <div>
              <Label>Bron</Label>
              <Select value={form.bron || "none"} onValueChange={v => setForm(p => ({ ...p, bron: v === "none" ? "" : v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecteer bron" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Geen</SelectItem>
                  {bronOptions.map(b => <SelectItem key={b} value={b} className="capitalize">{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Notities</Label><Textarea value={form.notities} onChange={e => setForm(p => ({ ...p, notities: e.target.value }))} className="rounded-xl" rows={3} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog} className="rounded-pill">Annuleren</Button>
              <Button type="submit" className="rounded-pill" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Opslaan..." : editingLead ? "Bijwerken" : "Aanmaken"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Leads;
