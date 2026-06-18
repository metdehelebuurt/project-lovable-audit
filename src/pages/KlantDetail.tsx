import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { StickyNote } from "lucide-react";
import { AfspraakDialog } from "@/components/shared/AfspraakDialog";
import { AfspraakEditDialog } from "@/components/shared/AfspraakEditDialog";
import {
  OffertesLijst, SchouwenLijst, AfsprakenLijst,
  OpdrachtenLijst, InstallatiesLijst, OpleveringenLijst, SnelleActies, SamenvattingCard,
  formatCurrency,
} from "@/components/detail/DetailComponents";
import EmailTab from "@/components/email/EmailTab";
import { KlantTicketsList } from "@/components/helpdesk/KlantTicketsList";
import { fetchLaatsteVersieVoorRapporten, getSignedUrlForVersie } from "@/components/oplever/api/opleverPdfVersies";
import GeleverdeApparatuurLijst from "@/components/serienummers/GeleverdeApparatuurLijst";
import RetourDialog from "@/components/retouren/RetourDialog";
import GecombineerdeTijdlijn, { type ExtraEvent } from "@/components/historie/GecombineerdeTijdlijn";
import WoningProductenTab from "@/components/klanten/WoningProductenTab";
import KlantHeader from "@/components/klanten/detail/KlantHeader";
import KlantStatsRow from "@/components/klanten/detail/KlantStatsRow";
import KlantTabsNav, { type KlantTab } from "@/components/klanten/detail/KlantTabsNav";
import KlantContactCard from "@/components/klanten/detail/KlantContactCard";
import LogContactmomentCard from "@/components/contactmomenten/LogContactmomentCard";
import EntiteitDocumenten from "@/components/documenten/EntiteitDocumenten";

const KlantDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  useAuth();
  const queryClient = useQueryClient();
  const [afspraakOpen, setAfspraakOpen] = useState(false);
  const [editAfspraak, setEditAfspraak] = useState<any | null>(null);
  const [retourOpen, setRetourOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overzicht");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

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
        .select("*, adviseur:users!afspraken_adviseur_id_fkey(voornaam, achternaam)")
        .eq("klant_id", id!)
        .neq("status", "geannuleerd")
        .order("datum", { ascending: false });
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
        .select("id, installatienummer, consument_naam, werkadres, status, geplande_startdatum, geplande_einddatum, created_at")
        .eq("lead_id", klant.lead_id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!klant?.lead_id,
  });

  const { data: opleveringen = [] } = useQuery({
    queryKey: ["klant-opleveringen", id, klant?.lead_id, opdrachten.map((o: any) => o.id).join(",")],
    queryFn: async () => {
      if (!id) return [];
      const opdrachtIds = opdrachten.map((o: any) => o.id as string);
      const filters: string[] = [`klant_id.eq.${id}`];
      if (opdrachtIds.length > 0) filters.push(`opdracht_id.in.(${opdrachtIds.join(",")})`);
      const { data, error } = await supabase
        .from("opleverrapporten" as any)
        .select("id, rapportnummer, status, opleverdatum, created_at, gefinaliseerd_op, installatie_id, pdf_url")
        .or(filters.join(","))
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as any[];
      const installatieIds = rows.map((r) => r.installatie_id).filter(Boolean) as string[];
      let instMap: Record<string, string> = {};
      if (installatieIds.length > 0) {
        const { data: insts } = await supabase
          .from("installaties")
          .select("id, installatienummer")
          .in("id", installatieIds);
        instMap = Object.fromEntries((insts ?? []).map((i: any) => [i.id, i.installatienummer ?? ""]));
      }
      const versieMap = await fetchLaatsteVersieVoorRapporten(rows.map((r) => r.id));
      return rows.map((r) => ({
        ...r,
        installatienummer: r.installatie_id ? instMap[r.installatie_id] : null,
        versies: versieMap[r.id] ?? 0,
      }));
    },
    enabled: !!id,
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

  // Tabs: 5 hoofdgroepen i.p.v. 11 losse tabs
  const tabs: KlantTab[] = [
    { key: "overzicht", label: "Overzicht" },
    { key: "verkoop", label: "Verkoop", count: offertes.length + opdrachten.length },
    { key: "uitvoering", label: "Uitvoering", count: schouwen.length + installaties.length + opleveringen.length },
    { key: "communicatie", label: "Communicatie", count: afspraken.length },
    { key: "documenten", label: "Documenten" },
    { key: "activiteit", label: "Activiteit" },
  ];

  // Timeline events
  const timelineEvents: ExtraEvent[] = [
    ...offertes.map((o: any) => ({ type: "offerte", date: o.created_at, label: `Offerte ${o.offertenummer}`, detail: `${formatCurrency(o.totaal_bedrag)} • ${o.status}` })),
    ...opdrachten.map((o: any) => ({ type: "opdracht", date: o.created_at, label: `Opdracht ${o.klant_naam}`, detail: `${formatCurrency(o.totaal_bedrag)} • ${o.status}` })),
    ...schouwen.map((s: any) => ({ type: "schouw", date: s.geplande_datum, label: `Schouw ${s.schouw_nummer}`, detail: s.categorie })),
    ...afspraken.map((a: any) => ({ type: "afspraak", date: a.datum, label: a.titel, detail: a.type })),
    ...installaties.map((inst: any) => ({ type: "installatie" as const, date: inst.created_at, label: `Installatie ${inst.consument_naam || ""}`, detail: inst.status })),
    ...opleveringen.map((r: any) => ({
      type: "oplevering",
      date: r.created_at,
      label: `Opleverrapport ${r.rapportnummer}`,
      detail: r.status === "ondertekend" ? "Ondertekend door klant" : r.status,
    })),
    ...opleveringen
      .filter((r: any) => r.gefinaliseerd_op)
      .map((r: any) => ({
        type: "oplevering",
        date: r.gefinaliseerd_op,
        label: `Opleverrapport ${r.rapportnummer} ondertekend`,
        detail: "Definitief afgerond",
      })),
    { type: "created", date: klant.created_at, label: "Klant aangemaakt", detail: `${klant.voornaam} ${klant.achternaam}` },
  ] as ExtraEvent[];

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto">
      <KlantHeader
        klant={klant}
        isEditing={isEditing}
        onStartEdit={startEditing}
        onAfspraak={() => setAfspraakOpen(true)}
        onRetour={() => setRetourOpen(true)}
        onTicket={() => {
          const params = new URLSearchParams({ bron: "klant", klant_id: klant.id });
          if (klant.lead_id) params.set("lead_id", klant.lead_id);
          navigate(`/helpdesk/tickets/nieuw?${params.toString()}`);
        }}
        onOfferte={handleNewOfferte}
      />

      <KlantStatsRow
        stats={{
          offertes: offertes.length,
          opdrachten: opdrachten.length,
          orderwaarde: totalOpdrachtenValue,
          schouwen: schouwen.length,
          opleveringen: opleveringen.length,
          afspraken: afspraken.length,
        }}
      />

      <KlantTabsNav tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 xl:col-span-9 space-y-4 min-w-0">
          {/* OVERZICHT — contact + woning/producten + notities + tickets */}
          {activeTab === "overzicht" && (
            <div className="space-y-4">
              <KlantContactCard
                klant={klant}
                isEditing={isEditing}
                editForm={editForm}
                setEditForm={setEditForm}
                onStartEdit={startEditing}
                onCancelEdit={() => setIsEditing(false)}
                onSave={saveEdit}
                isSaving={updateKlantMutation.isPending}
              />

              <WoningProductenTab klantId={klant.id} leadId={klant.lead_id} />

              <Card className="rounded-2xl border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <StickyNote className="h-4 w-4 text-primary" /> Notities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    defaultValue={klant.notities || ""}
                    rows={4}
                    className="rounded-xl"
                    placeholder="Notities over deze klant..."
                    onBlur={(e) => {
                      if (e.target.value !== (klant.notities || "")) saveNotities(e.target.value);
                    }}
                  />
                </CardContent>
              </Card>

              <KlantTicketsList klantId={klant.id} leadId={klant.lead_id} />
            </div>
          )}

          {/* VERKOOP — offertes + verkooporders */}
          {activeTab === "verkoop" && (
            <div className="space-y-4">
              <OffertesLijst offertes={offertes} onNew={handleNewOfferte} />
              <OpdrachtenLijst opdrachten={opdrachten} onNavigate={(oid) => navigate(`/opdrachten/${oid}`)} />
            </div>
          )}

          {/* UITVOERING — schouwen, installaties, opleveringen, apparatuur */}
          {activeTab === "uitvoering" && (
            <div className="space-y-4">
              <SchouwenLijst schouwen={schouwen} onNew={() => navigate("/schouwen")} />
              <InstallatiesLijst installaties={installaties} onNavigate={(iid) => navigate(`/installaties/${iid}`)} />
              <OpleveringenLijst
                opleveringen={opleveringen as any}
                onNavigate={(rid) => navigate(`/opleveringen/${rid}`)}
                onNew={() => navigate(`/opleveringen/nieuw?klant=${klant.id}`)}
                onDownload={async (_rid, pdfUrl) => {
                  const url = await getSignedUrlForVersie(pdfUrl);
                  if (url) window.open(url, "_blank", "noopener,noreferrer");
                  else toast.error("Download niet beschikbaar");
                }}
              />
              <GeleverdeApparatuurLijst klantId={klant.id} leadId={klant.lead_id} />
            </div>
          )}

          {/* COMMUNICATIE — e-mail + afspraken */}
          {activeTab === "communicatie" && (
            <div className="space-y-4">
              <EmailTab
                klantId={id}
                email={klant.email}
                emails={[klant.email, ...(klant.extra_emails || [])].filter(Boolean)}
              />
              <AfsprakenLijst afspraken={afspraken} onNew={() => setAfspraakOpen(true)} onEdit={setEditAfspraak} />
              <LogContactmomentCard klantId={klant.id} leadId={klant.lead_id} showRecent />
            </div>
          )}

          {/* ACTIVITEIT */}
          {activeTab === "activiteit" && (
            <GecombineerdeTijdlijn entiteitType="klant" entiteitId={klant.id} extraEvents={timelineEvents} />
          )}

          {/* DOCUMENTEN */}
          {activeTab === "documenten" && klant.lead_id && (
            <EntiteitDocumenten entityType="lead" entityId={klant.lead_id} />
          )}
          {activeTab === "documenten" && !klant.lead_id && (
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Deze klant heeft geen gekoppelde lead. Documenten kunnen pas worden toegevoegd zodra er een lead aan deze klant gekoppeld is.
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar — alleen op desktop */}
        <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 space-y-4">
          <LogContactmomentCard klantId={klant.id} leadId={klant.lead_id} />

          <SamenvattingCard items={[
            { label: "Totaal offertes", value: offertes.length },
            { label: "Offertewaarde", value: formatCurrency(totalOfferteValue) },
            { label: "Verkooporders", value: opdrachten.length },
            { label: "Orderwaarde", value: formatCurrency(totalOpdrachtenValue) },
            { label: "Schouwen", value: schouwen.length },
            { label: "Afspraken", value: afspraken.length },
            { label: "Installaties", value: installaties.length },
            { label: "Opleveringen", value: opleveringen.length },
            { label: "Ondertekende rapporten", value: opleveringen.filter((r: any) => r.status === "ondertekend").length },
          ]} />

          <SnelleActies
            onAfspraak={() => setAfspraakOpen(true)}
            onOfferte={handleNewOfferte}
            onSchouw={() => navigate("/schouwen")}
            email={klant.email}
            telefoon={klant.telefoon}
          />
        </aside>
      </div>

      <AfspraakDialog
        open={afspraakOpen}
        onOpenChange={setAfspraakOpen}
        klantId={id}
        defaultTitle={`Afspraak ${klant.voornaam} ${klant.achternaam}`}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["klant-afspraken", id] })}
      />

      <AfspraakEditDialog
        open={!!editAfspraak}
        onOpenChange={(o) => { if (!o) setEditAfspraak(null); }}
        afspraak={editAfspraak}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["klant-afspraken", id] })}
      />

      <RetourDialog
        open={retourOpen}
        onOpenChange={setRetourOpen}
        defaultType="klant_retour"
        context={{ klant_id: klant.id }}
      />
    </div>
  );
};

export default KlantDetail;
