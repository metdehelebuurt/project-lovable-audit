import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft, Mail, Phone, MapPin, Building2, Globe, Pencil,
  FileText, ClipboardCheck, Plus, Sparkles, Loader2, RefreshCw,
  MessageSquare, StickyNote, Send, Trash2, Clock, User, TrendingUp,
  Save, ExternalLink, X, Check, PhoneCall, PhoneOff, CalendarIcon, Home,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { AfspraakDialog } from "@/components/shared/AfspraakDialog";
import {
  QuickStat, TabButton, InfoRow, OffertesLijst, SchouwenLijst, AfsprakenLijst,
  SnelleActies, SamenvattingCard, ActiviteitTijdlijn,
  formatDate, formatDateTime, formatCurrency,
} from "@/components/detail/DetailComponents";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type LeadStatus = Database["public"]["Enums"]["lead_status"];

const pipelineSteps: { key: LeadStatus; label: string }[] = [
  { key: "nieuw", label: "Nieuw" },
  { key: "contact_geprobeerd", label: "Contact geprobeerd" },
  { key: "gekwalificeerd", label: "Gekwalificeerd" },
  { key: "offerte_verzonden", label: "Offerte verzonden" },
  { key: "klant", label: "Klant" },
];

const subStatuses: { key: LeadStatus; label: string; icon: React.ElementType }[] = [
  { key: "geen_gehoor", label: "Geen gehoor", icon: PhoneOff },
  { key: "voicemail", label: "Voicemail", icon: Phone },
  { key: "terugbellen", label: "Terugbellen", icon: PhoneCall },
  { key: "gesproken", label: "Gesproken", icon: Phone },
  { key: "afspraak_gepland", label: "Afspraak gepland", icon: CalendarIcon },
];

const statusIdx = (s: LeadStatus) => {
  const i = pipelineSteps.findIndex(p => p.key === s);
  return i >= 0 ? i : -1;
};

const allStatusColors: Record<LeadStatus, string> = {
  nieuw: "bg-primary/10 text-primary",
  contact_geprobeerd: "bg-sky-100 text-sky-700",
  geen_gehoor: "bg-orange-100 text-orange-700",
  voicemail: "bg-amber-100 text-amber-700",
  terugbellen: "bg-yellow-100 text-yellow-700",
  gesproken: "bg-teal-100 text-teal-700",
  afspraak_gepland: "bg-indigo-100 text-indigo-700",
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
const woningtypeOptions = ["vrijstaand", "twee_onder_een_kap", "hoekwoning", "tussenwoning", "appartement", "bungalow", "overig"];
const daktypeOptions = ["schuin_pannen", "schuin_leien", "plat", "gemengd", "overig"];
const energielabelOptions = ["A++++", "A+++", "A++", "A+", "A", "B", "C", "D", "E", "F", "G"];
const contactTypeOptions = [
  { value: "call", label: "Telefoongesprek" },
  { value: "voicemail", label: "Voicemail" },
  { value: "email", label: "E-mail" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "bezoek", label: "Bezoek" },
  { value: "overig", label: "Overig" },
];
const contactResultaatOptions = [
  { value: "bereikt", label: "Bereikt" },
  { value: "geen_gehoor", label: "Geen gehoor" },
  { value: "voicemail", label: "Voicemail" },
  { value: "terugbelverzoek", label: "Terugbelverzoek" },
];

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
  const [contactForm, setContactForm] = useState({ type: "call", richting: "uitgaand", resultaat: "", notitie: "" });

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

  const { data: ownerUser } = useQuery({
    queryKey: ["user", lead?.owner_user_id],
    queryFn: async () => {
      const { data } = await supabase.from("users").select("voornaam, achternaam").eq("id", lead!.owner_user_id).single();
      return data;
    },
    enabled: !!lead?.owner_user_id,
  });

  const { data: assignedUser } = useQuery({
    queryKey: ["user", lead?.toegewezen_aan],
    queryFn: async () => {
      if (!lead?.toegewezen_aan) return null;
      const { data } = await supabase.from("users").select("voornaam, achternaam").eq("id", lead.toegewezen_aan).single();
      return data;
    },
    enabled: !!lead?.toegewezen_aan,
  });

  const { data: eigenschappen } = useQuery({
    queryKey: ["lead-eigenschappen", id],
    queryFn: async () => {
      const { data } = await supabase.from("lead_eigenschappen" as any).select("*").eq("lead_id", id!).maybeSingle();
      return data as any;
    },
    enabled: !!id,
  });

  const { data: contactmomenten = [] } = useQuery({
    queryKey: ["lead-contactmomenten", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("lead_contactmomenten" as any)
        .select("*, user:users(voornaam, achternaam)")
        .eq("lead_id", id!)
        .order("created_at", { ascending: false });
      return (data || []) as any[];
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
        .from("offerte_berichten").select("*").in("offerte_id", offerteIds)
        .order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!id && offertes.length > 0,
  });

  const { data: documenten = [] } = useQuery({
    queryKey: ["lead-documenten", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documenten").select("*").eq("entity_id", id!).eq("entity_type", "lead")
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
        lead_id: id!, user_id: profile!.id, partner_id: profile!.partner_id, inhoud,
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

  const saveEigenschappenMutation = useMutation({
    mutationFn: async (data: any) => {
      if (eigenschappen?.id) {
        const { error } = await supabase.from("lead_eigenschappen" as any).update(data as any).eq("id", eigenschappen.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("lead_eigenschappen" as any).insert({
          ...data, lead_id: id!, partner_id: profile!.partner_id,
        } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-eigenschappen", id] });
      toast.success("Klantdata opgeslagen");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const addContactMutation = useMutation({
    mutationFn: async (data: { type: string; richting: string; resultaat: string; notitie: string }) => {
      const { error } = await supabase.from("lead_contactmomenten" as any).insert({
        lead_id: id!, user_id: profile!.id, partner_id: profile!.partner_id,
        type: data.type, richting: data.richting,
        resultaat: data.resultaat || null,
        notitie: data.notitie || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-contactmomenten", id] });
      setContactForm({ type: "call", richting: "uitgaand", resultaat: "", notitie: "" });
      toast.success("Contactmoment gelogd");
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
      lead: { id: lead.id, voornaam: lead.voornaam, achternaam: lead.achternaam, email: lead.email, telefoon: lead.telefoon, adres: lead.adres, postcode: lead.postcode, plaats: lead.plaats },
    }));
    navigate("/offertes/nieuw");
  };

  const startEditing = () => {
    if (!lead) return;
    setEditForm({
      voornaam: lead.voornaam, achternaam: lead.achternaam, email: lead.email,
      telefoon: lead.telefoon || "", bedrijfsnaam: lead.bedrijfsnaam || "",
      adres: lead.adres || "", postcode: lead.postcode || "", plaats: lead.plaats || "",
      bron: lead.bron || "", notities: lead.notities || "",
    });
    setIsEditing(true);
  };

  const saveEdit = () => {
    const cleaned: any = { ...editForm };
    for (const key of ["telefoon", "bedrijfsnaam", "adres", "postcode", "plaats", "bron", "notities"]) {
      if (cleaned[key] === "") cleaned[key] = null;
    }
    updateLeadMutation.mutate(cleaned);
  };

  const [eigForm, setEigForm] = useState<any>({});
  useEffect(() => {
    if (eigenschappen) {
      setEigForm({
        woningtype: eigenschappen.woningtype || "",
        bouwjaar: eigenschappen.bouwjaar || "",
        daktype: eigenschappen.daktype || "",
        dakrichting: eigenschappen.dakrichting || "",
        aantal_panelen: eigenschappen.aantal_panelen || "",
        huidig_verbruik_kwh: eigenschappen.huidig_verbruik_kwh || "",
        huidige_energielabel: eigenschappen.huidige_energielabel || "",
        gewenst_energielabel: eigenschappen.gewenst_energielabel || "",
        warmtepomp_interesse: eigenschappen.warmtepomp_interesse || false,
        batterij_interesse: eigenschappen.batterij_interesse || false,
        laadpaal_interesse: eigenschappen.laadpaal_interesse || false,
        isolatie_interesse: eigenschappen.isolatie_interesse || false,
      });
    }
  }, [eigenschappen]);

  const saveEigenschappen = () => {
    const data: any = { ...eigForm };
    data.bouwjaar = data.bouwjaar ? parseInt(data.bouwjaar) : null;
    data.aantal_panelen = data.aantal_panelen ? parseInt(data.aantal_panelen) : null;
    data.huidig_verbruik_kwh = data.huidig_verbruik_kwh ? parseInt(data.huidig_verbruik_kwh) : null;
    for (const k of ["woningtype", "daktype", "dakrichting", "huidige_energielabel", "gewenst_energielabel"]) {
      if (!data[k]) data[k] = null;
    }
    saveEigenschappenMutation.mutate(data);
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
    { key: "klantdata", label: "Klantdata" },
    { key: "notities", label: "Notities", count: notities.length },
    { key: "communicatie", label: "Communicatie", count: berichten.length + contactmomenten.length },
    { key: "afspraken", label: "Afspraken", count: afspraken.length },
    { key: "offertes", label: "Offertes", count: offertes.length },
    { key: "schouwen", label: "Schouwen", count: schouwen.length },
    { key: "documenten", label: "Documenten", count: documenten.length },
    { key: "activiteit", label: "Activiteit" },
  ];

  // Build timeline events
  const timelineEvents = [
    ...notities.map((n: any) => ({ type: "notitie", date: n.created_at, label: `Notitie door ${n.user?.voornaam || "Onbekend"}`, detail: n.inhoud?.substring(0, 80) })),
    ...contactmomenten.map((c: any) => ({ type: "contact", date: c.created_at, label: `${c.type} (${c.richting})${c.resultaat ? " — " + c.resultaat.replace(/_/g, " ") : ""}`, detail: c.notitie?.substring(0, 80) || `Door ${c.user?.voornaam || "Onbekend"}` })),
    ...offertes.map(o => ({ type: "offerte", date: o.created_at, label: `Offerte ${o.offertenummer} aangemaakt`, detail: formatCurrency(o.totaal_bedrag) })),
    ...schouwen.map(s => ({ type: "schouw", date: s.geplande_datum, label: `Schouw ${s.schouw_nummer}`, detail: s.categorie })),
    ...afspraken.map((a: any) => ({ type: "afspraak", date: a.datum, label: a.titel, detail: a.type })),
    { type: "created", date: lead.created_at, label: "Lead aangemaakt", detail: `${lead.voornaam} ${lead.achternaam}` },
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
            <Badge className={allStatusColors[lead.lead_status]}>{lead.lead_status.replace(/_/g, " ")}</Badge>
          </div>
          {/* Inline contact info */}
          <div className="flex items-center gap-4 text-muted-foreground text-sm mt-1 flex-wrap">
            {lead.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{lead.email}</span>}
            {lead.telefoon && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{lead.telefoon}</span>}
            {lead.adres && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{lead.adres}, {lead.postcode} {lead.plaats}</span>}
            {lead.bedrijfsnaam && <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{lead.bedrijfsnaam}</span>}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {ownerUser && (
              <span className="flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                <User className="h-3 w-3" /> Eigenaar: {ownerUser.voornaam} {ownerUser.achternaam}
              </span>
            )}
            {assignedUser && (
              <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                <User className="h-3 w-3" /> Toegewezen: {assignedUser.voornaam} {assignedUser.achternaam}
              </span>
            )}
          </div>
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
            const isActive = step.key === lead.lead_status && !isLost;
            const isDone = i < currentIdx && currentIdx >= 0 && !isLost;
            return (
              <button
                key={step.key}
                onClick={() => statusMutation.mutate(step.key)}
                disabled={statusMutation.isPending}
                className={`flex-1 py-3 px-3 text-xs font-medium transition-all relative ${
                  isActive ? "bg-primary text-primary-foreground" :
                  isDone ? "bg-primary/15 text-primary" :
                  "bg-muted/40 text-muted-foreground hover:bg-muted"
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  {isDone && <Check className="h-3.5 w-3.5" />}
                  <span>{step.label}</span>
                </div>
              </button>
            );
          })}
          <button
            onClick={() => statusMutation.mutate("verloren")}
            disabled={statusMutation.isPending}
            className={`px-4 py-3 text-xs font-medium transition-all ${
              isLost ? "bg-destructive text-destructive-foreground" : "bg-muted/40 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            }`}
          >
            <div className="flex items-center gap-1.5"><X className="h-3.5 w-3.5" /><span>Verloren</span></div>
          </button>
        </div>
        <div className="flex border-t border-border">
          {subStatuses.map((sub) => {
            const SubIcon = sub.icon;
            const isActive = lead.lead_status === sub.key;
            return (
              <button
                key={sub.key}
                onClick={() => statusMutation.mutate(sub.key)}
                disabled={statusMutation.isPending}
                className={`flex-1 py-2 px-2 text-[11px] font-medium transition-all ${
                  isActive ? "bg-primary/10 text-primary border-b-2 border-primary" : "text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <SubIcon className="h-3 w-3" />
                  <span>{sub.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Quick Stats */}
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
            <TabButton key={tab.key} active={activeTab === tab.key} label={tab.label} count={tab.count} onClick={() => setActiveTab(tab.key)} />
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* OVERZICHT */}
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

          {/* KLANTDATA */}
          {activeTab === "klantdata" && (
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Home className="h-4 w-4 text-primary" /> Klantdata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-sm font-medium mb-3">Woninggegevens</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Woningtype</Label>
                      <Select value={eigForm.woningtype || "none"} onValueChange={v => setEigForm((p: any) => ({ ...p, woningtype: v === "none" ? "" : v }))}>
                        <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecteer" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">—</SelectItem>
                          {woningtypeOptions.map(w => <SelectItem key={w} value={w} className="capitalize">{w.replace(/_/g, " ")}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Bouwjaar</Label>
                      <Input type="number" value={eigForm.bouwjaar || ""} onChange={e => setEigForm((p: any) => ({ ...p, bouwjaar: e.target.value }))} className="rounded-xl" placeholder="bijv. 1990" />
                    </div>
                    <div>
                      <Label className="text-xs">Daktype</Label>
                      <Select value={eigForm.daktype || "none"} onValueChange={v => setEigForm((p: any) => ({ ...p, daktype: v === "none" ? "" : v }))}>
                        <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecteer" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">—</SelectItem>
                          {daktypeOptions.map(d => <SelectItem key={d} value={d} className="capitalize">{d.replace(/_/g, " ")}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Dakrichting</Label>
                      <Input value={eigForm.dakrichting || ""} onChange={e => setEigForm((p: any) => ({ ...p, dakrichting: e.target.value }))} className="rounded-xl" placeholder="bijv. Zuid, Oost-West" />
                    </div>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-3">Energiegegevens</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Huidig verbruik (kWh/jaar)</Label>
                      <Input type="number" value={eigForm.huidig_verbruik_kwh || ""} onChange={e => setEigForm((p: any) => ({ ...p, huidig_verbruik_kwh: e.target.value }))} className="rounded-xl" placeholder="bijv. 3500" />
                    </div>
                    <div>
                      <Label className="text-xs">Aantal panelen</Label>
                      <Input type="number" value={eigForm.aantal_panelen || ""} onChange={e => setEigForm((p: any) => ({ ...p, aantal_panelen: e.target.value }))} className="rounded-xl" />
                    </div>
                    <div>
                      <Label className="text-xs">Huidig energielabel</Label>
                      <Select value={eigForm.huidige_energielabel || "none"} onValueChange={v => setEigForm((p: any) => ({ ...p, huidige_energielabel: v === "none" ? "" : v }))}>
                        <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecteer" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">—</SelectItem>
                          {energielabelOptions.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Gewenst energielabel</Label>
                      <Select value={eigForm.gewenst_energielabel || "none"} onValueChange={v => setEigForm((p: any) => ({ ...p, gewenst_energielabel: v === "none" ? "" : v }))}>
                        <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecteer" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">—</SelectItem>
                          {energielabelOptions.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-3">Interesses</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: "warmtepomp_interesse", label: "Warmtepomp" },
                      { key: "batterij_interesse", label: "Thuisbatterij" },
                      { key: "laadpaal_interesse", label: "Laadpaal" },
                      { key: "isolatie_interesse", label: "Isolatie" },
                    ].map(item => (
                      <div key={item.key} className="flex items-center gap-2">
                        <Switch checked={eigForm[item.key] || false} onCheckedChange={v => setEigForm((p: any) => ({ ...p, [item.key]: v }))} />
                        <Label className="text-sm">{item.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button onClick={saveEigenschappen} disabled={saveEigenschappenMutation.isPending} className="rounded-xl gap-1.5">
                    {saveEigenschappenMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Opslaan
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* NOTITIES */}
          {activeTab === "notities" && (
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><StickyNote className="h-4 w-4 text-primary" /> Notities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Schrijf een notitie..." className="rounded-xl flex-1 min-h-[60px]" rows={2} />
                  <Button size="icon" className="rounded-xl h-auto self-end" disabled={!newNote.trim() || addNoteMutation.isPending}
                    onClick={() => newNote.trim() && addNoteMutation.mutate(newNote.trim())}>
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
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center"><User className="h-3 w-3 text-primary" /></div>
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

          {/* COMMUNICATIE */}
          {activeTab === "communicatie" && (
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" /> Communicatie</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {contactmomenten.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Contactmomenten</p>
                    {contactmomenten.map((c: any) => (
                      <div key={c.id} className="p-3 rounded-xl border bg-card">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[10px]">{c.type}</Badge>
                          <Badge variant="outline" className="text-[10px]">{c.richting}</Badge>
                          {c.resultaat && <Badge className="text-[10px] bg-primary/10 text-primary">{c.resultaat.replace(/_/g, " ")}</Badge>}
                          <span className="text-[10px] text-muted-foreground ml-auto">{formatDateTime(c.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>{c.user?.voornaam} {c.user?.achternaam}</span>
                        </div>
                        {c.notitie && <p className="text-sm text-foreground mt-1">{c.notitie}</p>}
                      </div>
                    ))}
                  </div>
                )}
                {berichten.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Offerte berichten</p>
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
                {contactmomenten.length === 0 && berichten.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">Geen communicatie gevonden.</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* AFSPRAKEN */}
          {activeTab === "afspraken" && <AfsprakenLijst afspraken={afspraken} onNew={() => setAfspraakOpen(true)} />}

          {/* OFFERTES */}
          {activeTab === "offertes" && <OffertesLijst offertes={offertes} onNew={handleNewOfferte} />}

          {/* SCHOUWEN */}
          {activeTab === "schouwen" && <SchouwenLijst schouwen={schouwen} onNew={() => navigate("/schouwen")} />}

          {/* DOCUMENTEN */}
          {activeTab === "documenten" && (
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Documenten</CardTitle>
              </CardHeader>
              <CardContent>
                {documenten.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Geen documenten gekoppeld.</p>
                ) : (
                  <div className="space-y-2">
                    {documenten.map((d: any) => (
                      <a key={d.id} href={d.bestand_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-xl border hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center"><FileText className="h-4 w-4 text-primary" /></div>
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

          {/* ACTIVITEIT */}
          {activeTab === "activiteit" && <ActiviteitTijdlijn events={timelineEvents} />}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Log contact widget */}
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <PhoneCall className="h-4 w-4 text-primary" /> Log contactmoment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px]">Type</Label>
                  <Select value={contactForm.type} onValueChange={v => setContactForm(p => ({ ...p, type: v }))}>
                    <SelectTrigger className="h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {contactTypeOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[10px]">Richting</Label>
                  <Select value={contactForm.richting} onValueChange={v => setContactForm(p => ({ ...p, richting: v }))}>
                    <SelectTrigger className="h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="uitgaand">Uitgaand</SelectItem>
                      <SelectItem value="inkomend">Inkomend</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-[10px]">Resultaat</Label>
                <Select value={contactForm.resultaat || "none"} onValueChange={v => setContactForm(p => ({ ...p, resultaat: v === "none" ? "" : v }))}>
                  <SelectTrigger className="h-8 text-xs rounded-lg"><SelectValue placeholder="Optioneel" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {contactResultaatOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px]">Notitie</Label>
                <Input value={contactForm.notitie} onChange={e => setContactForm(p => ({ ...p, notitie: e.target.value }))} className="h-8 text-xs rounded-lg" placeholder="Korte notitie..." />
              </div>
              <Button size="sm" className="w-full rounded-xl text-xs" onClick={() => addContactMutation.mutate(contactForm)} disabled={addContactMutation.isPending}>
                {addContactMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
                Loggen
              </Button>
            </CardContent>
          </Card>

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

          <SamenvattingCard items={[
            { label: "Totaal offertes", value: offertes.length },
            { label: "Geaccepteerd", value: acceptedOffertes },
            { label: "Offertewaarde", value: formatCurrency(totalOfferteValue) },
            { label: "Schouwen", value: schouwen.length },
            { label: "Afspraken", value: afspraken.length },
            { label: "Contactmomenten", value: contactmomenten.length },
            { label: "Notities", value: notities.length },
          ]} />

          <SnelleActies
            onAfspraak={() => setAfspraakOpen(true)}
            onOfferte={handleNewOfferte}
            onSchouw={() => navigate("/schouwen")}
            email={lead.email}
            telefoon={lead.telefoon}
          />
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

export default LeadDetail;
