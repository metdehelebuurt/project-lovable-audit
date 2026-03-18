import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ArrowLeft, Mail, Phone, MapPin, Building2, Globe, Pencil,
  FileText, ClipboardCheck, Plus, Sparkles, Loader2, RefreshCw, Video, CalendarIcon,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { AfspraakDialog } from "@/components/shared/AfspraakDialog";

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
const formatCurrency = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

const LeadDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [aiSignals, setAiSignals] = useState<AiSignal[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [afspraakOpen, setAfspraakOpen] = useState(false);

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

  const notitiesMutation = useMutation({
    mutationFn: async (notities: string) => {
      const { error } = await supabase.from("leads").update({ notities }).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead", id] });
      toast.success("Notities opgeslagen");
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

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/leads")} className="rounded-xl">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-foreground">{lead.voornaam} {lead.achternaam}</h1>
          <p className="text-muted-foreground text-sm">{lead.email}</p>
        </div>
        <Badge className={statusColors[lead.lead_status]}>{lead.lead_status.replace(/_/g, " ")}</Badge>
      </div>

      {/* Pipeline Stepper */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="pt-6 pb-4">
          <div className="flex items-center justify-between relative">
            {/* Connecting line */}
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
            {/* Verloren button */}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="overzicht">
            <TabsList className="rounded-xl">
              <TabsTrigger value="overzicht" className="rounded-lg">Overzicht</TabsTrigger>
              <TabsTrigger value="offertes" className="rounded-lg">Offertes ({offertes.length})</TabsTrigger>
              <TabsTrigger value="schouwen" className="rounded-lg">Schouwen ({schouwen.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="overzicht">
              <Card className="rounded-2xl border-0 shadow-sm">
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" /><span>{lead.email}</span></div>
                    {lead.telefoon && <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" /><span>{lead.telefoon}</span></div>}
                    {lead.adres && <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-muted-foreground" /><span>{lead.adres}, {lead.postcode} {lead.plaats}</span></div>}
                    {lead.bedrijfsnaam && <div className="flex items-center gap-2 text-sm"><Building2 className="h-4 w-4 text-muted-foreground" /><span>{lead.bedrijfsnaam}</span></div>}
                    {lead.bron && <div className="flex items-center gap-2 text-sm"><Globe className="h-4 w-4 text-muted-foreground" /><span className="capitalize">{lead.bron}</span></div>}
                  </div>

                  <div className="pt-4 border-t">
                    <label className="text-sm font-medium text-foreground block mb-2">Notities</label>
                    <Textarea
                      defaultValue={lead.notities || ""}
                      className="rounded-xl"
                      rows={4}
                      placeholder="Notities over deze lead..."
                      onBlur={e => {
                        if (e.target.value !== (lead.notities || "")) {
                          notitiesMutation.mutate(e.target.value);
                        }
                      }}
                    />
                  </div>

                  <div className="text-xs text-muted-foreground pt-2">
                    Aangemaakt: {formatDate(lead.created_at)} • Laatst gewijzigd: {formatDate(lead.updated_at)}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="offertes">
              <Card className="rounded-2xl border-0 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-base">Offertes</CardTitle>
                  <Button size="sm" onClick={handleNewOfferte} className="rounded-pill gap-1">
                    <Plus className="h-3.5 w-3.5" /> Nieuwe offerte
                  </Button>
                </CardHeader>
                <CardContent>
                  {offertes.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">Geen offertes voor deze lead</p>
                  ) : (
                    <div className="space-y-3">
                      {offertes.map(o => (
                        <Link key={o.id} to={`/offertes/${o.id}/pdf`} className="flex items-center justify-between p-3 rounded-xl border hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
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

            <TabsContent value="schouwen">
              <Card className="rounded-2xl border-0 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-base">Schouwen</CardTitle>
                  <Button size="sm" onClick={() => navigate("/schouwen")} className="rounded-pill gap-1">
                    <Plus className="h-3.5 w-3.5" /> Nieuwe schouw
                  </Button>
                </CardHeader>
                <CardContent>
                  {schouwen.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">Geen schouwen voor deze lead</p>
                  ) : (
                    <div className="space-y-3">
                      {schouwen.map(s => (
                        <div key={s.id} className="flex items-center justify-between p-3 rounded-xl border">
                          <div className="flex items-center gap-3">
                            <ClipboardCheck className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{s.schouw_nummer}</p>
                              <p className="text-xs text-muted-foreground">{s.categorie} • {formatDate(s.geplande_datum)}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">{s.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* AI Signals Sidebar */}
        <div className="space-y-6">
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">AI Koopsignalen</CardTitle>
              </div>
              <Button size="sm" variant="outline" onClick={fetchAiSignals} disabled={aiLoading} className="rounded-pill gap-1">
                {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Analyseer
              </Button>
            </CardHeader>
            <CardContent>
              {aiSignals.length === 0 && !aiLoading ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Klik op "Analyseer" om AI-koopsignalen te genereren op basis van de leaddata.
                </p>
              ) : aiLoading ? (
                <div className="flex items-center justify-center py-8 gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Analyseren...
                </div>
              ) : (
                <div className="space-y-3">
                  {aiSignals.map((signal, i) => (
                    <div key={i} className={`rounded-xl p-3 border-l-4 ${
                      signal.prioriteit === "hoog" ? "border-l-destructive bg-destructive/5" :
                      signal.prioriteit === "middel" ? "border-l-amber-500 bg-amber-50" :
                      "border-l-emerald-500 bg-emerald-50"
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold">{signal.titel}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {signal.prioriteit}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{signal.beschrijving}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick stats */}
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Offertes</span>
                  <span className="font-medium">{offertes.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Schouwen</span>
                  <span className="font-medium">{schouwen.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Totaal offertewaarde</span>
                  <span className="font-medium">{formatCurrency(offertes.reduce((sum, o) => sum + o.totaal_bedrag, 0))}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LeadDetail;
