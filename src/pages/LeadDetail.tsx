import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft, Mail, Phone, MapPin, Building2, Globe, Pencil,
  FileText, ClipboardCheck, Plus, Sparkles, Loader2, RefreshCw, Video, CalendarIcon,
  MessageSquare, StickyNote, Send, Trash2, Clock, User, TrendingUp,
  Activity, Save, ExternalLink, X, Check,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { AfspraakDialog } from "@/components/shared/AfspraakDialog";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type LeadStatus = Database["public"]["Enums"]["lead_status"];

const pipelineSteps: { key: LeadStatus; label: string }[] = [
  { key: "nieuw", label: "Nieuw" },
  { key: "gekwalificeerd", label: "Gekwalificeerd" },
  { key: "offerte_verzonden", label: "Offerte verzonden" },
  { key: "klant", label: "Klant" },
];

const statusIdx = (s: LeadStatus) => {
  const i = pipelineSteps.findIndex(p => p.key === s);
  return i >= 0 ? i : -1;
};

const statusColors: Record<LeadStatus, string> = {
  nieuw: "bg-primary/10 text-primary",
  gekwalificeerd: "bg-emerald-100 text-emerald-700",
  offerte_verzonden: "bg-amber-100 text-amber-700",
  klant: "bg-green-600 text-white",
  verloren: "bg-red-100 text-red-600",
};

interface AiSignal {
  titel: string;
  beschrijving: string;
  prioriteit: "hoog" | "middel" | "laag";
}

const bronOptions = ["website", "telefoon", "referral", "advertentie", "beurs", "overig"];

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
const formatDateTime = (d: string) =>
  new Date(d).toLocaleString("nl-NL", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const formatCurrency = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

/* ─── Quick Stat ─── */
const QuickStat = ({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5">
    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
      <Icon className="h-4 w-4 text-primary" />
    </div>
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-bold text-foreground">{value}</p>
    </div>
  </div>
);

/* ─── Tab Button ─── */
const TabButton = ({ active, label, count, onClick }: { active: boolean; label: string; count?: number; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
      active
        ? "border-primary text-primary"
        : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
    }`}
  >
    {label}
    {count !== undefined && (
      <span className={`ml-1.5 text-xs ${active ? "text-primary" : "text-muted-foreground"}`}>({count})</span>
    )}
  </button>
);

const LeadDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [aiSignals, setAiSignals] = useState<AiSignal[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [afspraakOpen, setAfspraakOpen] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [activeTab, setActiveTab] = useState("overzicht");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Lead>>({});

  /* ─── Queries ─── */
  const { data: lead, isLoading } = useQuery({
    queryKey: ["lead", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("*").eq("id", id!).single();
      if (error) throw error;
      return data as Lead;
    },
    enabled: !!id,
  });

  const { data: offertes = [] } = useQuery({
    queryKey: ["lead-offertes", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("offertes").select("id, offertenummer, klant_naam, status, totaal_bedrag, created_at").eq("lead_id", id!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: schouwen = [] } = useQuery({
    queryKey: ["lead-schouwen", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("schouwen").select("id, schouw_nummer, categorie, status, geplande_datum, consument_naam").eq("lead_id", id!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: afspraken = [] } = useQuery({
    queryKey: ["lead-afspraken", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("afspraken" as any)
        .select("*").eq("lead_id", id!).order("datum", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!id,
  });

  const { data: notities = [] } = useQuery({
    queryKey: ["lead-notities", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_notities" as any)
        .select("*, user:users(voornaam, achternaam)")
        .eq("lead_id", id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!id,
  });

  const { data: berichten = [] } = useQuery({
    queryKey: ["lead-berichten", id],
    queryFn: async () => {
      if (!offertes.length) return [];
      const offerteIds = offertes.map(o => o.id);
      const { data, error } = await supabase
        .from("offerte_berichten")
        .select("*")
        .in("offerte_id", offerteIds)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!id && offertes.length > 0,
  });

  const { data: documenten = [] } = useQuery({
    queryKey: ["lead-documenten", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documenten")
        .select("*")
        .eq("entity_id", id!)
        .eq("entity_type", "lead")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  /* ─── Mutations ─── */
  const statusMutation = useMutation({
    mutationFn: async (status: LeadStatus) => {
      const { error } = await supabase.from("leads").update({ lead_status: status }).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead", id] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Status bijgewerkt");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateLeadMutation = useMutation({
    mutationFn: async (fields: Partial<Lead>) => {
      const { error } = await supabase.from("leads").update(fields).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead", id] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setIsEditing(false);
      toast.success("Gegevens bijgewerkt");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const addNoteMutation = useMutation({
    mutationFn: async (inhoud: string) => {
      const { error } = await supabase.from("lead_notities" as any).insert({
        lead_id: id!,
        user_id: profile!.id,
        partner_id: profile!.partner_id,
        inhoud,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-notities", id] });
      setNewNote("");
      toast.success("Notitie toegevoegd");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase.from("lead_notities" as any).delete().eq("id", noteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-notities", id] });
      toast.success("Notitie verwijderd");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const fetchAiSignals = async () => {
    if (!id) return;
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-lead-signals", { body: { lead_id: id } });
      if (error) throw error;
      if (data?.signals) setAiSignals(data.signals);
      else toast.error("Geen signalen ontvangen");
    } catch (err: any) {
      toast.error("AI analyse mislukt", { description: err.message });
    }
    setAiLoading(false);
  };

  const handleNewOfferte = () => {
    if (!lead) return;
    sessionStorage.setItem("offerte-prefill", JSON.stringify({
      lead: {
        id: lead.id, voornaam: lead.voornaam, achternaam: lead.achternaam,
        email: lead.email, telefoon: lead.telefoon, adres: lead.adres,
        postcode: lead.postcode, plaats: lead.plaats,
      },
    }));
    navigate("/offertes/nieuw");
  };

  const startEditing = () => {
    if (!lead) return;
    setEditForm({
      voornaam: lead.voornaam,
      achternaam: lead.achternaam,
      email: lead.email,
      telefoon: lead.telefoon || "",
      bedrijfsnaam: lead.bedrijfsnaam || "",
      adres: lead.adres || "",
      postcode: lead.postcode || "",
      plaats: lead.plaats || "",
      bron: lead.bron || "",
      notities: lead.notities || "",
    });
    setIsEditing(true);
  };

  const saveEdit = () => {
    const cleaned: any = { ...editForm };
    // Convert empty strings to null for nullable fields
    for (const key of ["telefoon", "bedrijfsnaam", "adres", "postcode", "plaats", "bron", "notities"]) {
      if (cleaned[key] === "") cleaned[key] = null;
    }
    updateLeadMutation.mutate(cleaned);
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Laden...</div>;
  if (!lead) return <div className="p-8 text-center text-muted-foreground">Lead niet gevonden</div>;

  const currentIdx = statusIdx(lead.lead_status);
  const isLost = lead.lead_status === "verloren";
  const totalOfferteValue = offertes.reduce((sum, o) => sum + o.totaal_bedrag, 0);
  const acceptedOffertes = offertes.filter(o => o.status === "geaccepteerd").length;
  const daysSinceCreated = Math.floor((Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24));

  const tabs = [
    { key: "overzicht", label: "Overzicht" },
    { key: "notities", label: "Notities", count: notities.length },
    { key: "communicatie", label: "Communicatie", count: berichten.length },
    { key: "afspraken", label: "Afspraken", count: afspraken.length },
    { key: "offertes", label: "Offertes", count: offertes.length },
    { key: "schouwen", label: "Schouwen", count: schouwen.length },
    { key: "documenten", label: "Documenten", count: documenten.length },
    { key: "activiteit", label: "Activiteit" },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/leads")} className="rounded-xl mt-1">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold text-foreground">{lead.voornaam} {lead.achternaam}</h1>
            <Badge className={statusColors[lead.lead_status]}>{lead.lead_status.replace(/_/g, " ")}</Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">{lead.email}{lead.bedrijfsnaam && ` • ${lead.bedrijfsnaam}`}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!isEditing && (
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={startEditing}>
              <Pencil className="h-4 w-4" /> Bewerken
            </Button>
          )}
          <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={() => setAfspraakOpen(true)}>
            <CalendarIcon className="h-4 w-4" /> Afspraak
          </Button>
          <Button size="sm" className="rounded-xl gap-1.5" onClick={handleNewOfferte}>
            <FileText className="h-4 w-4" /> Offerte
          </Button>
        </div>
      </div>

      {/* Pipeline Bar */}
      <Card className="rounded-2xl border-0 shadow-sm overflow-hidden">
        <div className="flex">
          {pipelineSteps.map((step, i) => {
            const isActive = i === currentIdx && !isLost;
            const isDone = i < currentIdx && !isLost;
            return (
              <button
                key={step.key}
                onClick={() => statusMutation.mutate(step.key)}
                disabled={statusMutation.isPending}
                className={`flex-1 py-3.5 px-4 text-sm font-medium transition-all relative ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isDone
                    ? "bg-primary/15 text-primary"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  {isDone && <Check className="h-4 w-4" />}
                  <span>{step.label}</span>
                </div>
              </button>
            );
          })}
          <button
            onClick={() => statusMutation.mutate("verloren")}
            disabled={statusMutation.isPending}
            className={`px-5 py-3.5 text-sm font-medium transition-all ${
              isLost
                ? "bg-destructive text-destructive-foreground"
                : "bg-muted/40 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            }`}
          >
            <div className="flex items-center gap-2">
              <X className="h-4 w-4" />
              <span>Verloren</span>
            </div>
          </button>
        </div>
      </Card>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickStat label="Offertes" value={offertes.length} icon={FileText} />
        <QuickStat label="Offertewaarde" value={formatCurrency(totalOfferteValue)} icon={TrendingUp} />
        <QuickStat label="Schouwen" value={schouwen.length} icon={ClipboardCheck} />
        <QuickStat label="Dagen in pipeline" value={daysSinceCreated} icon={Clock} />
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border overflow-x-auto">
        <div className="flex gap-0 min-w-max">
          {tabs.map(tab => (
            <TabButton
              key={tab.key}
              active={activeTab === tab.key}
              label={tab.label}
              count={tab.count}
              onClick={() => setActiveTab(tab.key)}
            />
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">

          {/* ─── OVERZICHT ─── */}
          {activeTab === "overzicht" && (
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" /> Contactgegevens
                </CardTitle>
                {!isEditing && (
                  <Button variant="ghost" size="sm" onClick={startEditing} className="rounded-xl gap-1.5 text-xs">
                    <Pencil className="h-3.5 w-3.5" /> Bewerken
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><Label className="text-xs">Voornaam *</Label><Input value={editForm.voornaam || ""} onChange={e => setEditForm(p => ({ ...p, voornaam: e.target.value }))} className="rounded-xl" /></div>
                      <div><Label className="text-xs">Achternaam *</Label><Input value={editForm.achternaam || ""} onChange={e => setEditForm(p => ({ ...p, achternaam: e.target.value }))} className="rounded-xl" /></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><Label className="text-xs">E-mail *</Label><Input type="email" value={editForm.email || ""} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} className="rounded-xl" /></div>
                      <div><Label className="text-xs">Telefoon</Label><Input value={editForm.telefoon || ""} onChange={e => setEditForm(p => ({ ...p, telefoon: e.target.value }))} className="rounded-xl" /></div>
                    </div>
                    <div><Label className="text-xs">Bedrijfsnaam</Label><Input value={editForm.bedrijfsnaam || ""} onChange={e => setEditForm(p => ({ ...p, bedrijfsnaam: e.target.value }))} className="rounded-xl" /></div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2"><Label className="text-xs">Adres</Label><Input value={editForm.adres || ""} onChange={e => setEditForm(p => ({ ...p, adres: e.target.value }))} className="rounded-xl" /></div>
                      <div><Label className="text-xs">Postcode</Label><Input value={editForm.postcode || ""} onChange={e => setEditForm(p => ({ ...p, postcode: e.target.value }))} className="rounded-xl" /></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><Label className="text-xs">Plaats</Label><Input value={editForm.plaats || ""} onChange={e => setEditForm(p => ({ ...p, plaats: e.target.value }))} className="rounded-xl" /></div>
                      <div>
                        <Label className="text-xs">Bron</Label>
                        <Select value={editForm.bron || "none"} onValueChange={v => setEditForm(p => ({ ...p, bron: v === "none" ? "" : v }))}>
                          <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Geen</SelectItem>
                            {bronOptions.map(b => <SelectItem key={b} value={b} className="capitalize">{b}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div><Label className="text-xs">Notities</Label><Textarea value={editForm.notities || ""} onChange={e => setEditForm(p => ({ ...p, notities: e.target.value }))} className="rounded-xl" rows={3} /></div>
                    <div className="flex gap-2 justify-end pt-2">
                      <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setIsEditing(false)}>Annuleren</Button>
                      <Button size="sm" className="rounded-xl gap-1.5" onClick={saveEdit} disabled={updateLeadMutation.isPending}>
                        {updateLeadMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        Opslaan
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <InfoRow icon={Mail} label="E-mail" value={lead.email} />
                      <InfoRow icon={Phone} label="Telefoon" value={lead.telefoon} />
                      <InfoRow icon={MapPin} label="Adres" value={lead.adres ? `${lead.adres}, ${lead.postcode || ""} ${lead.plaats || ""}`.trim() : null} />
                      <InfoRow icon={Building2} label="Bedrijf" value={lead.bedrijfsnaam} />
                      <InfoRow icon={Globe} label="Bron" value={lead.bron} />
                      <InfoRow icon={MapPin} label="Plaats" value={lead.plaats} />
                    </div>
                    {lead.notities && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Notities</p>
                          <p className="text-sm text-foreground whitespace-pre-wrap">{lead.notities}</p>
                        </div>
                      </>
                    )}
                    <Separator />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Aangemaakt: {formatDateTime(lead.created_at)}</span>
                      <span>Laatst gewijzigd: {formatDateTime(lead.updated_at)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ─── NOTITIES ─── */}
          {activeTab === "notities" && (
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <StickyNote className="h-4 w-4 text-primary" /> Notities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Textarea
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    placeholder="Schrijf een notitie..."
                    className="rounded-xl flex-1 min-h-[60px]"
                    rows={2}
                  />
                  <Button
                    size="icon"
                    className="rounded-xl h-auto self-end"
                    disabled={!newNote.trim() || addNoteMutation.isPending}
                    onClick={() => newNote.trim() && addNoteMutation.mutate(newNote.trim())}
                  >
                    {addNoteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
                {notities.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Nog geen notities.</p>
                ) : (
                  <div className="space-y-3">
                    {notities.map((n: any) => (
                      <div key={n.id} className="p-3 rounded-xl border bg-card group relative">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-3 w-3 text-primary" />
                          </div>
                          <span className="text-xs font-medium text-foreground">{n.user?.voornaam} {n.user?.achternaam}</span>
                          <span className="text-[10px] text-muted-foreground">{formatDateTime(n.created_at)}</span>
                          {(n.user_id === profile?.id) && (
                            <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteNoteMutation.mutate(n.id)}>
                              <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                            </Button>
                          )}
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-wrap pl-8">{n.inhoud}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ─── COMMUNICATIE ─── */}
          {activeTab === "communicatie" && (
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" /> Berichten
                </CardTitle>
              </CardHeader>
              <CardContent>
                {berichten.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Geen berichten gevonden.</p>
                ) : (
                  <div className="space-y-3">
                    {berichten.map((b: any) => (
                      <div key={b.id} className={`p-3 rounded-xl border ${b.afzender_type === "partner" ? "bg-primary/5 border-primary/10" : "bg-card"}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[10px]">{b.afzender_type === "partner" ? "Partner" : "Klant"}</Badge>
                          <span className="text-xs font-medium">{b.afzender_naam}</span>
                          <span className="text-[10px] text-muted-foreground ml-auto">{formatDateTime(b.created_at)}</span>
                        </div>
                        <p className="text-sm text-foreground">{b.bericht}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ─── AFSPRAKEN ─── */}
          {activeTab === "afspraken" && (
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-primary" /> Afspraken
                </CardTitle>
                <Button size="sm" variant="outline" onClick={() => setAfspraakOpen(true)} className="rounded-xl gap-1">
                  <Plus className="h-3.5 w-3.5" /> Inplannen
                </Button>
              </CardHeader>
              <CardContent>
                {afspraken.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Geen afspraken</p>
                ) : (
                  <div className="space-y-2">
                    {afspraken.map((a: any) => (
                      <div key={a.id} className="flex items-center justify-between p-3 rounded-xl border hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                            {a.type === "op_afstand" ? <Video className="h-4 w-4 text-primary" /> : <MapPin className="h-4 w-4 text-primary" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{a.titel}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(a.datum)}{a.start_tijd && ` • ${a.start_tijd.slice(0, 5)}`}{a.eind_tijd && ` - ${a.eind_tijd.slice(0, 5)}`}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">{a.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ─── OFFERTES ─── */}
          {activeTab === "offertes" && (
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> Offertes
                </CardTitle>
                <Button size="sm" variant="outline" onClick={handleNewOfferte} className="rounded-xl gap-1">
                  <Plus className="h-3.5 w-3.5" /> Nieuwe offerte
                </Button>
              </CardHeader>
              <CardContent>
                {offertes.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Geen offertes</p>
                ) : (
                  <div className="space-y-2">
                    {offertes.map(o => (
                      <Link key={o.id} to={`/offertes/${o.id}/pdf`} className="flex items-center justify-between p-3 rounded-xl border hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{o.offertenummer}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(o.created_at)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold">{formatCurrency(o.totaal_bedrag)}</span>
                          <Badge variant="outline" className="text-xs">{o.status}</Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ─── SCHOUWEN ─── */}
          {activeTab === "schouwen" && (
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-primary" /> Schouwen
                </CardTitle>
                <Button size="sm" variant="outline" onClick={() => navigate("/schouwen")} className="rounded-xl gap-1">
                  <Plus className="h-3.5 w-3.5" /> Nieuwe schouw
                </Button>
              </CardHeader>
              <CardContent>
                {schouwen.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Geen schouwen</p>
                ) : (
                  <div className="space-y-2">
                    {schouwen.map(s => (
                      <Link key={s.id} to={`/schouwen/${s.id}`} className="flex items-center justify-between p-3 rounded-xl border hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                            <ClipboardCheck className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{s.schouw_nummer}</p>
                            <p className="text-xs text-muted-foreground">{s.categorie} • {formatDate(s.geplande_datum)}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">{s.status}</Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ─── DOCUMENTEN ─── */}
          {activeTab === "documenten" && (
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> Documenten
                </CardTitle>
              </CardHeader>
              <CardContent>
                {documenten.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Geen documenten gekoppeld.</p>
                ) : (
                  <div className="space-y-2">
                    {documenten.map((d: any) => (
                      <a key={d.id} href={d.bestand_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-xl border hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{d.naam}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(d.created_at)}</p>
                          </div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </a>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ─── ACTIVITEIT ─── */}
          {activeTab === "activiteit" && (
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" /> Tijdlijn
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    ...notities.map((n: any) => ({ type: "notitie", date: n.created_at, label: `Notitie door ${n.user?.voornaam || "Onbekend"}`, detail: n.inhoud?.substring(0, 80) })),
                    ...offertes.map(o => ({ type: "offerte", date: o.created_at, label: `Offerte ${o.offertenummer} aangemaakt`, detail: formatCurrency(o.totaal_bedrag) })),
                    ...schouwen.map(s => ({ type: "schouw", date: s.geplande_datum, label: `Schouw ${s.schouw_nummer}`, detail: s.categorie })),
                    ...afspraken.map((a: any) => ({ type: "afspraak", date: a.datum, label: a.titel, detail: a.type })),
                    { type: "created", date: lead.created_at, label: "Lead aangemaakt", detail: `${lead.voornaam} ${lead.achternaam}` },
                  ]
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 20)
                    .map((event, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <div className="flex flex-col items-center">
                          <div className={`h-2.5 w-2.5 rounded-full mt-1.5 ${
                            event.type === "notitie" ? "bg-primary" :
                            event.type === "offerte" ? "bg-amber-500" :
                            event.type === "schouw" ? "bg-emerald-500" :
                            event.type === "afspraak" ? "bg-blue-500" :
                            "bg-muted-foreground"
                          }`} />
                          {i < 19 && <div className="w-px h-full bg-border min-h-[20px]" />}
                        </div>
                        <div className="pb-3">
                          <p className="text-sm font-medium text-foreground">{event.label}</p>
                          <p className="text-xs text-muted-foreground">{event.detail}</p>
                          <p className="text-[10px] text-muted-foreground">{formatDateTime(event.date)}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* AI Signals */}
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">AI Koopsignalen</CardTitle>
              </div>
              <Button size="sm" variant="outline" onClick={fetchAiSignals} disabled={aiLoading} className="rounded-xl gap-1 h-7 text-xs">
                {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                Analyseer
              </Button>
            </CardHeader>
            <CardContent>
              {aiSignals.length === 0 && !aiLoading ? (
                <p className="text-xs text-muted-foreground text-center py-3">Klik op "Analyseer" voor AI-inzichten.</p>
              ) : aiLoading ? (
                <div className="flex items-center justify-center py-6 gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Analyseren...
                </div>
              ) : (
                <div className="space-y-2">
                  {aiSignals.map((signal, i) => (
                    <div key={i} className={`rounded-xl p-2.5 border-l-4 ${
                      signal.prioriteit === "hoog" ? "border-l-destructive bg-destructive/5" :
                      signal.prioriteit === "middel" ? "border-l-amber-500 bg-amber-500/5" :
                      "border-l-emerald-500 bg-emerald-500/5"
                    }`}>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs font-semibold">{signal.titel}</span>
                        <Badge variant="outline" className="text-[9px] px-1 py-0">{signal.prioriteit}</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{signal.beschrijving}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Samenvatting */}
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Samenvatting
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Totaal offertes</span><span className="font-medium">{offertes.length}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Geaccepteerd</span><span className="font-medium">{acceptedOffertes}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Offertewaarde</span><span className="font-medium">{formatCurrency(totalOfferteValue)}</span></div>
              <Separator />
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Schouwen</span><span className="font-medium">{schouwen.length}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Afspraken</span><span className="font-medium">{afspraken.length}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Notities</span><span className="font-medium">{notities.length}</span></div>
            </CardContent>
          </Card>

          {/* Snelle acties */}
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Snelle acties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start rounded-xl gap-2 text-xs" onClick={() => setAfspraakOpen(true)}>
                <CalendarIcon className="h-3.5 w-3.5" /> Afspraak inplannen
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start rounded-xl gap-2 text-xs" onClick={handleNewOfferte}>
                <FileText className="h-3.5 w-3.5" /> Offerte aanmaken
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start rounded-xl gap-2 text-xs" onClick={() => navigate("/schouwen")}>
                <ClipboardCheck className="h-3.5 w-3.5" /> Schouw inplannen
              </Button>
              {lead.email && (
                <Button variant="outline" size="sm" className="w-full justify-start rounded-xl gap-2 text-xs" asChild>
                  <a href={`mailto:${lead.email}`}><Mail className="h-3.5 w-3.5" /> E-mail versturen</a>
                </Button>
              )}
              {lead.telefoon && (
                <Button variant="outline" size="sm" className="w-full justify-start rounded-xl gap-2 text-xs" asChild>
                  <a href={`tel:${lead.telefoon}`}><Phone className="h-3.5 w-3.5" /> Bellen</a>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AfspraakDialog
        open={afspraakOpen}
        onOpenChange={setAfspraakOpen}
        leadId={id}
        defaultTitle={`Afspraak ${lead.voornaam} ${lead.achternaam}`}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["lead-afspraken", id] })}
      />
    </div>
  );
};

/* ─── Info Row (read-only) ─── */
const InfoRow = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null | undefined }) => (
  <div className="flex items-center gap-2 text-sm p-2 rounded-lg">
    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
    <span className="text-xs text-muted-foreground w-16 shrink-0">{label}</span>
    <span className="flex-1 truncate">{value || <span className="text-muted-foreground italic">—</span>}</span>
  </div>
);

export default LeadDetail;
