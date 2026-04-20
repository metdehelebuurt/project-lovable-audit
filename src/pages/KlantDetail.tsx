import { useState } from "react";
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
import { toast } from "sonner";
import {
  ArrowLeft, Mail, Phone, MapPin, Building2, Pencil,
  FileText, ClipboardCheck, Wrench, Loader2, Save,
  User, TrendingUp, CalendarIcon, StickyNote, Send, Trash2, LifeBuoy,
} from "lucide-react";
import { AfspraakDialog } from "@/components/shared/AfspraakDialog";
import {
  QuickStat, TabButton, InfoRow, OffertesLijst, SchouwenLijst, AfsprakenLijst,
  OpdrachtenLijst, SnelleActies, SamenvattingCard, ActiviteitTijdlijn,
  formatDate, formatDateTime, formatCurrency,
} from "@/components/detail/DetailComponents";
import EmailTab from "@/components/email/EmailTab";
import EmailAddressList from "@/components/email/EmailAddressList";

const KlantDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [afspraakOpen, setAfspraakOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overzicht");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [newNote, setNewNote] = useState("");

  /* ─── Queries ─── */
  const { data: klant, isLoading } = useQuery({
    queryKey: ["klant", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("klanten" as any).select("*").eq("id", id!).single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!id,
  });

  const { data: offertes = [] } = useQuery({
    queryKey: ["klant-offertes", klant?.lead_id],
    queryFn: async () => {
      if (!klant?.lead_id) return [];
      const { data, error } = await supabase.from("offertes")
        .select("id, offertenummer, status, totaal_bedrag, created_at")
        .eq("lead_id", klant.lead_id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!klant?.lead_id,
  });

  // Opdrachten via lead_id (alle opdrachten van deze klant)
  const { data: opdrachten = [] } = useQuery({
    queryKey: ["klant-opdrachten", klant?.lead_id],
    queryFn: async () => {
      if (!klant?.lead_id) return [];
      const { data, error } = await supabase.from("opdrachten")
        .select("id, klant_naam, klant_adres, klant_email, status, totaal_bedrag, created_at, toegewezen_monteur_id")
        .eq("lead_id", klant.lead_id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!klant?.lead_id,
  });

  const { data: schouwen = [] } = useQuery({
    queryKey: ["klant-schouwen", klant?.lead_id],
    queryFn: async () => {
      if (!klant?.lead_id) return [];
      const { data, error } = await supabase.from("schouwen")
        .select("id, schouw_nummer, categorie, status, geplande_datum")
        .eq("lead_id", klant.lead_id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!klant?.lead_id,
  });

  const { data: afspraken = [] } = useQuery({
    queryKey: ["klant-afspraken", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("afspraken" as any)
        .select("*").eq("klant_id", id!).order("datum", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!id,
  });

  const { data: installaties = [] } = useQuery({
    queryKey: ["klant-installaties", klant?.lead_id],
    queryFn: async () => {
      if (!klant?.lead_id) return [];
      const { data, error } = await supabase.from("installaties")
        .select("id, consument_naam, status, geplande_startdatum, geplande_einddatum, created_at")
        .eq("lead_id", klant.lead_id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!klant?.lead_id,
  });

  /* ─── Mutations ─── */
  const updateKlantMutation = useMutation({
    mutationFn: async (fields: any) => {
      const { error } = await supabase.from("klanten" as any).update(fields as any).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["klant", id] });
      setIsEditing(false);
      toast.success("Gegevens bijgewerkt");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const saveNotities = async (notities: string) => {
    const { error } = await supabase.from("klanten" as any).update({ notities } as any).eq("id", id!);
    if (error) toast.error(error.message);
    else {
      toast.success("Notities opgeslagen");
      queryClient.invalidateQueries({ queryKey: ["klant", id] });
    }
  };

  const handleNewOfferte = () => {
    if (!klant) return;
    sessionStorage.setItem("offerte-prefill", JSON.stringify({
      lead: { id: klant.lead_id, voornaam: klant.voornaam, achternaam: klant.achternaam, email: klant.email, telefoon: klant.telefoon, adres: klant.adres, postcode: klant.postcode, plaats: klant.plaats },
    }));
    navigate("/offertes/nieuw");
  };

  const startEditing = () => {
    if (!klant) return;
    setEditForm({
      voornaam: klant.voornaam, achternaam: klant.achternaam, email: klant.email || "",
      extra_emails: Array.isArray(klant.extra_emails) ? klant.extra_emails : [],
      telefoon: klant.telefoon || "", bedrijfsnaam: klant.bedrijfsnaam || "",
      adres: klant.adres || "", postcode: klant.postcode || "", plaats: klant.plaats || "",
    });
    setIsEditing(true);
  };

  const saveEdit = () => {
    const cleaned: any = { ...editForm };
    for (const key of ["email", "telefoon", "bedrijfsnaam", "adres", "postcode", "plaats"]) {
      if (cleaned[key] === "") cleaned[key] = null;
    }
    cleaned.extra_emails = (cleaned.extra_emails || []).filter((e: string) => e && e.trim());
    updateKlantMutation.mutate(cleaned);
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Laden...</div>;
  if (!klant) return <div className="p-8 text-center text-muted-foreground">Klant niet gevonden</div>;

  const totalOpdrachtenValue = opdrachten.reduce((sum: number, o: any) => sum + (o.totaal_bedrag || 0), 0);
  const totalOfferteValue = offertes.reduce((sum: number, o: any) => sum + o.totaal_bedrag, 0);

  const tabs = [
    { key: "overzicht", label: "Overzicht" },
    { key: "email", label: "E-mail" },
    { key: "offertes", label: "Offertes", count: offertes.length },
    { key: "opdrachten", label: "Opdrachten", count: opdrachten.length },
    { key: "schouwen", label: "Schouwen", count: schouwen.length },
    { key: "afspraken", label: "Afspraken", count: afspraken.length },
    { key: "activiteit", label: "Activiteit" },
  ];

  // Timeline events
  const timelineEvents = [
    ...offertes.map((o: any) => ({ type: "offerte", date: o.created_at, label: `Offerte ${o.offertenummer}`, detail: `${formatCurrency(o.totaal_bedrag)} • ${o.status}` })),
    ...opdrachten.map((o: any) => ({ type: "opdracht", date: o.created_at, label: `Opdracht ${o.klant_naam}`, detail: `${formatCurrency(o.totaal_bedrag)} • ${o.status}` })),
    ...schouwen.map((s: any) => ({ type: "schouw", date: s.geplande_datum, label: `Schouw ${s.schouw_nummer}`, detail: s.categorie })),
    ...afspraken.map((a: any) => ({ type: "afspraak", date: a.datum, label: a.titel, detail: a.type })),
    ...installaties.map((inst: any) => ({ type: "opdracht", date: inst.created_at, label: `Installatie ${inst.consument_naam || ""}`, detail: inst.status })),
    { type: "created", date: klant.created_at, label: "Klant aangemaakt", detail: `${klant.voornaam} ${klant.achternaam}` },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/klanten")} className="rounded-xl mt-1">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold text-foreground">{klant.voornaam} {klant.achternaam}</h1>
            <Badge className="bg-green-600 text-white">Klant</Badge>
          </div>
          {/* Inline contact info */}
          <div className="flex items-center gap-4 text-muted-foreground text-sm mt-1 flex-wrap">
            {klant.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{klant.email}</span>}
            {klant.telefoon && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{klant.telefoon}</span>}
            {klant.adres && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{klant.adres}, {klant.postcode} {klant.plaats}</span>}
            {klant.bedrijfsnaam && <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{klant.bedrijfsnaam}</span>}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">Klant sinds {formatDate(klant.created_at)}</span>
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
          <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={() => {
            const params = new URLSearchParams({ bron: "klant", klant_id: klant.id });
            if (klant.lead_id) params.set("lead_id", klant.lead_id);
            navigate(`/helpdesk/tickets/nieuw?${params.toString()}`);
          }}>
            <LifeBuoy className="h-4 w-4" /> Ticket
          </Button>
          <Button size="sm" className="rounded-xl gap-1.5" onClick={handleNewOfferte}>
            <FileText className="h-4 w-4" /> Offerte
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <QuickStat label="Offertes" value={offertes.length} icon={FileText} />
        <QuickStat label="Opdrachten" value={opdrachten.length} icon={Wrench} />
        <QuickStat label="Opdrachtwaarde" value={formatCurrency(totalOpdrachtenValue)} icon={TrendingUp} />
        <QuickStat label="Schouwen" value={schouwen.length} icon={ClipboardCheck} />
        <QuickStat label="Afspraken" value={afspraken.length} icon={CalendarIcon} />
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
            <div className="space-y-4">
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
                        <div><Label className="text-xs">Voornaam *</Label><Input value={editForm.voornaam || ""} onChange={e => setEditForm((p: any) => ({ ...p, voornaam: e.target.value }))} className="rounded-xl" /></div>
                        <div><Label className="text-xs">Achternaam *</Label><Input value={editForm.achternaam || ""} onChange={e => setEditForm((p: any) => ({ ...p, achternaam: e.target.value }))} className="rounded-xl" /></div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                          <EmailAddressList
                            primary={editForm.email || ""}
                            onPrimaryChange={(v) => setEditForm((p: any) => ({ ...p, email: v }))}
                            extras={editForm.extra_emails || []}
                            onExtrasChange={(v) => setEditForm((p: any) => ({ ...p, extra_emails: v }))}
                          />
                        </div>
                        <div><Label className="text-xs">Telefoon</Label><Input value={editForm.telefoon || ""} onChange={e => setEditForm((p: any) => ({ ...p, telefoon: e.target.value }))} className="rounded-xl" /></div>
                      </div>
                      <div><Label className="text-xs">Bedrijfsnaam</Label><Input value={editForm.bedrijfsnaam || ""} onChange={e => setEditForm((p: any) => ({ ...p, bedrijfsnaam: e.target.value }))} className="rounded-xl" /></div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2"><Label className="text-xs">Adres</Label><Input value={editForm.adres || ""} onChange={e => setEditForm((p: any) => ({ ...p, adres: e.target.value }))} className="rounded-xl" /></div>
                        <div><Label className="text-xs">Postcode</Label><Input value={editForm.postcode || ""} onChange={e => setEditForm((p: any) => ({ ...p, postcode: e.target.value }))} className="rounded-xl" /></div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><Label className="text-xs">Plaats</Label><Input value={editForm.plaats || ""} onChange={e => setEditForm((p: any) => ({ ...p, plaats: e.target.value }))} className="rounded-xl" /></div>
                      </div>
                      <div className="flex gap-2 justify-end pt-2">
                        <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setIsEditing(false)}>Annuleren</Button>
                        <Button size="sm" className="rounded-xl gap-1.5" onClick={saveEdit} disabled={updateKlantMutation.isPending}>
                          {updateKlantMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                          Opslaan
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <InfoRow icon={Mail} label="E-mail" value={klant.email} />
                        <InfoRow icon={Phone} label="Telefoon" value={klant.telefoon} />
                        <InfoRow icon={MapPin} label="Adres" value={klant.adres ? `${klant.adres}, ${klant.postcode || ""} ${klant.plaats || ""}`.trim() : null} />
                        <InfoRow icon={Building2} label="Bedrijf" value={klant.bedrijfsnaam} />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Klant sinds: {formatDateTime(klant.created_at)}</span>
                        <span>Laatst gewijzigd: {formatDateTime(klant.updated_at)}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notities */}
              <Card className="rounded-2xl border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><StickyNote className="h-4 w-4 text-primary" /> Notities</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    defaultValue={klant.notities || ""}
                    rows={4}
                    className="rounded-xl"
                    placeholder="Notities over deze klant..."
                    onBlur={e => {
                      if (e.target.value !== (klant.notities || "")) saveNotities(e.target.value);
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* OFFERTES */}
          {activeTab === "offertes" && <OffertesLijst offertes={offertes} onNew={handleNewOfferte} />}

          {/* OPDRACHTEN */}
          {activeTab === "opdrachten" && <OpdrachtenLijst opdrachten={opdrachten} onNavigate={(oid) => navigate(`/opdrachten/${oid}`)} />}

          {/* SCHOUWEN */}
          {activeTab === "schouwen" && <SchouwenLijst schouwen={schouwen} onNew={() => navigate("/schouwen")} />}

          {/* AFSPRAKEN */}
          {activeTab === "afspraken" && <AfsprakenLijst afspraken={afspraken} onNew={() => setAfspraakOpen(true)} />}

          {/* E-MAIL */}
          {activeTab === "email" && (
            <EmailTab
              klantId={id}
              email={klant.email}
              emails={[klant.email, ...(klant.extra_emails || [])].filter(Boolean)}
            />
          )}

          {/* ACTIVITEIT */}
          {activeTab === "activiteit" && <ActiviteitTijdlijn events={timelineEvents} />}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <SamenvattingCard items={[
            { label: "Totaal offertes", value: offertes.length },
            { label: "Offertewaarde", value: formatCurrency(totalOfferteValue) },
            { label: "Opdrachten", value: opdrachten.length },
            { label: "Opdrachtwaarde", value: formatCurrency(totalOpdrachtenValue) },
            { label: "Schouwen", value: schouwen.length },
            { label: "Afspraken", value: afspraken.length },
            { label: "Installaties", value: installaties.length },
          ]} />

          <SnelleActies
            onAfspraak={() => setAfspraakOpen(true)}
            onOfferte={handleNewOfferte}
            onSchouw={() => navigate("/schouwen")}
            email={klant.email}
            telefoon={klant.telefoon}
          />
        </div>
      </div>

      <AfspraakDialog
        open={afspraakOpen}
        onOpenChange={setAfspraakOpen}
        klantId={id}
        defaultTitle={`Afspraak ${klant.voornaam} ${klant.achternaam}`}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["klant-afspraken", id] })}
      />
    </div>
  );
};

export default KlantDetail;
