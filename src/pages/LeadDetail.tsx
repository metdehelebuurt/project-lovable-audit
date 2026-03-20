import { useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  ArrowLeft, Mail, Phone, MapPin, Building2, Globe, Pencil,
  FileText, ClipboardCheck, Plus, Sparkles, Loader2, RefreshCw, Video, CalendarIcon,
  MessageSquare, StickyNote, Send, Trash2, Clock, User, TrendingUp,
  Activity, Save, ExternalLink,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { AfspraakDialog } from "@/components/shared/AfspraakDialog";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type LeadStatus = Database["public"]["Enums"]["lead_status"];

const pipelineSteps: { key: LeadStatus; label: string }[] = [
  { key: "nieuw", label: "Nieuw" },
  { key: "gekwalificeerd", label: "Gekwalificeerd" },
  { key: "offerte_verzonden", label: "Offerte" },
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

const LeadDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [aiSignals, setAiSignals] = useState<AiSignal[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [afspraakOpen, setAfspraakOpen] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [editingField, setEditingField] = useState<string | null>(null);

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
      setEditingField(null);
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

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Laden...</div>;
  if (!lead) return <div className="p-8 text-center text-muted-foreground">Lead niet gevonden</div>;

  const currentIdx = statusIdx(lead.lead_status);
  const isLost = lead.lead_status === "verloren";
  const totalOfferteValue = offertes.reduce((sum, o) => sum + o.totaal_bedrag, 0);
  const acceptedOffertes = offertes.filter(o => o.status === "geaccepteerd").length;
  const daysSinceCreated = Math.floor((Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/leads")} className="rounded-xl">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-foreground">{lead.voornaam} {lead.achternaam}</h1>
            <Badge className={statusColors[lead.lead_status]}>{lead.lead_status.replace(/_/g, " ")}</Badge>
          </div>
          <p className="text-muted-foreground text-sm">{lead.email} {lead.bedrijfsnaam && `• ${lead.bedrijfsnaam}`}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={() => setAfspraakOpen(true)}>
            <CalendarIcon className="h-4 w-4" /> Afspraak
          </Button>
          <Button size="sm" className="rounded-xl gap-1.5" onClick={handleNewOfferte}>
            <FileText className="h-4 w-4" /> Offerte
          </Button>
        </div>
      </div>

      {/* Pipeline Stepper */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="pt-6 pb-4">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted" />
            {pipelineSteps.map((step, i) => {
              const isActive = i === currentIdx && !isLost;
              const isDone = i < currentIdx && !isLost;
              return (
                <button
                  key={step.key}
                  onClick={() => statusMutation.mutate(step.key)}
                  disabled={statusMutation.isPending}
                  className="relative z-10 flex flex-col items-center gap-2 group"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    isActive ? "bg-primary text-primary-foreground ring-4 ring-primary/20" :
                    isDone ? "bg-primary/80 text-primary-foreground" :
                    "bg-muted text-muted-foreground group-hover:bg-muted-foreground/20"
                  }`}>
                    {isDone ? "✓" : i + 1}
                  </div>
                  <span className={`text-xs font-medium ${isActive ? "text-primary" : isDone ? "text-foreground" : "text-muted-foreground"}`}>
                    {step.label}
                  </span>
                </button>
              );
            })}
            <button
              onClick={() => statusMutation.mutate("verloren")}
              disabled={statusMutation.isPending}
              className="relative z-10 flex flex-col items-center gap-2 group"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                isLost ? "bg-destructive text-destructive-foreground ring-4 ring-destructive/20" :
                "bg-muted text-muted-foreground group-hover:bg-destructive/20"
              }`}>✕</div>
              <span className={`text-xs font-medium ${isLost ? "text-destructive" : "text-muted-foreground"}`}>Verloren</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickStat label="Offertes" value={offertes.length} icon={FileText} />
        <QuickStat label="Offertewaarde" value={formatCurrency(totalOfferteValue)} icon={TrendingUp} />
        <QuickStat label="Schouwen" value={schouwen.length} icon={ClipboardCheck} />
        <QuickStat label="Dagen in pipeline" value={daysSinceCreated} icon={Clock} />
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="overzicht">
            <TabsList className="rounded-xl bg-muted/50 p-1 flex-wrap h-auto gap-0.5">
              <TabsTrigger value="overzicht" className="rounded-lg text-xs">Overzicht</TabsTrigger>
              <TabsTrigger value="notities" className="rounded-lg text-xs">Notities ({notities.length})</TabsTrigger>
              <TabsTrigger value="communicatie" className="rounded-lg text-xs">Communicatie ({berichten.length})</TabsTrigger>
              <TabsTrigger value="afspraken" className="rounded-lg text-xs">Afspraken ({afspraken.length})</TabsTrigger>
              <TabsTrigger value="offertes" className="rounded-lg text-xs">Offertes ({offertes.length})</TabsTrigger>
              <TabsTrigger value="schouwen" className="rounded-lg text-xs">Schouwen ({schouwen.length})</TabsTrigger>
              <TabsTrigger value="documenten" className="rounded-lg text-xs">Documenten ({documenten.length})</TabsTrigger>
              <TabsTrigger value="activiteit" className="rounded-lg text-xs">Activiteit</TabsTrigger>
            </TabsList>

            {/* ─── OVERZICHT ─── */}
            <TabsContent value="overzicht">
              <Card className="rounded-2xl border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" /> Contactgegevens
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InfoRow icon={Mail} label="E-mail" value={lead.email} field="email" lead={lead} onSave={(v) => updateLeadMutation.mutate({ email: v })} />
                    <InfoRow icon={Phone} label="Telefoon" value={lead.telefoon} field="telefoon" lead={lead} onSave={(v) => updateLeadMutation.mutate({ telefoon: v })} />
                    <InfoRow icon={MapPin} label="Adres" value={lead.adres ? `${lead.adres}, ${lead.postcode || ""} ${lead.plaats || ""}` : null} />
                    <InfoRow icon={Building2} label="Bedrijf" value={lead.bedrijfsnaam} field="bedrijfsnaam" lead={lead} onSave={(v) => updateLeadMutation.mutate({ bedrijfsnaam: v })} />
                    <InfoRow icon={Globe} label="Bron" value={lead.bron} />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Aangemaakt: {formatDateTime(lead.created_at)}</span>
                    <span>Laatst gewijzigd: {formatDateTime(lead.updated_at)}</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── NOTITIES ─── */}
            <TabsContent value="notities">
              <Card className="rounded-2xl border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <StickyNote className="h-4 w-4 text-primary" /> Notities
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add note */}
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

                  {/* Notes list */}
                  {notities.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">Nog geen notities. Voeg je eerste notitie toe.</p>
                  ) : (
                    <div className="space-y-3">
                      {notities.map((n: any) => (
                        <div key={n.id} className="p-3 rounded-xl border bg-card group relative">
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-3 w-3 text-primary" />
                            </div>
                            <span className="text-xs font-medium text-foreground">
                              {n.user?.voornaam} {n.user?.achternaam}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {formatDateTime(n.created_at)}
                            </span>
                            {(n.user_id === profile?.id) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => deleteNoteMutation.mutate(n.id)}
                              >
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
            </TabsContent>

            {/* ─── COMMUNICATIE ─── */}
            <TabsContent value="communicatie">
              <Card className="rounded-2xl border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" /> Berichten
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {berichten.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">Geen berichten gevonden. Berichten worden gekoppeld via offertes.</p>
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
            </TabsContent>

            {/* ─── AFSPRAKEN ─── */}
            <TabsContent value="afspraken">
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
                              <p className="text-xs text-muted-foreground">
                                {formatDate(a.datum)}
                                {a.start_tijd && ` • ${a.start_tijd.slice(0, 5)}`}
                                {a.eind_tijd && ` - ${a.eind_tijd.slice(0, 5)}`}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">{a.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── OFFERTES ─── */}
            <TabsContent value="offertes">
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
            </TabsContent>

            {/* ─── SCHOUWEN ─── */}
            <TabsContent value="schouwen">
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
            </TabsContent>

            {/* ─── DOCUMENTEN ─── */}
            <TabsContent value="documenten">
              <Card className="rounded-2xl border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" /> Documenten
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {documenten.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">Geen documenten gekoppeld aan deze lead.</p>
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
            </TabsContent>

            {/* ─── ACTIVITEIT ─── */}
            <TabsContent value="activiteit">
              <Card className="rounded-2xl border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" /> Tijdlijn
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Combine events into timeline */}
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
            </TabsContent>
          </Tabs>
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
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Totaal offertes</span>
                <span className="font-medium">{offertes.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Geaccepteerd</span>
                <span className="font-medium">{acceptedOffertes}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Offertewaarde</span>
                <span className="font-medium">{formatCurrency(totalOfferteValue)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Schouwen</span>
                <span className="font-medium">{schouwen.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Afspraken</span>
                <span className="font-medium">{afspraken.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Notities</span>
                <span className="font-medium">{notities.length}</span>
              </div>
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
                  <a href={`mailto:${lead.email}`}>
                    <Mail className="h-3.5 w-3.5" /> E-mail versturen
                  </a>
                </Button>
              )}
              {lead.telefoon && (
                <Button variant="outline" size="sm" className="w-full justify-start rounded-xl gap-2 text-xs" asChild>
                  <a href={`tel:${lead.telefoon}`}>
                    <Phone className="h-3.5 w-3.5" /> Bellen
                  </a>
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

/* ─── Editable Info Row ─── */
const InfoRow = ({ icon: Icon, label, value, field, lead, onSave }: {
  icon: React.ElementType; label: string; value: string | null | undefined;
  field?: string; lead?: any; onSave?: (v: string) => void;
}) => {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || "");

  if (editing && field && onSave) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
        <Input
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          className="h-7 text-sm rounded-lg"
          autoFocus
          onKeyDown={e => {
            if (e.key === "Enter") { onSave(editValue); setEditing(false); }
            if (e.key === "Escape") setEditing(false);
          }}
        />
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { onSave(editValue); setEditing(false); }}>
          <Save className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 text-sm p-2 rounded-lg hover:bg-muted/30 transition-colors ${field && onSave ? "cursor-pointer group" : ""}`}
      onClick={() => { if (field && onSave) { setEditValue(value || ""); setEditing(true); } }}
    >
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="flex-1 truncate">{value || <span className="text-muted-foreground italic">Niet ingevuld</span>}</span>
      {field && onSave && <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
    </div>
  );
};

export default LeadDetail;
