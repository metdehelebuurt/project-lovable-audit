import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ArrowLeft, Mail, Phone, MapPin, Building2, FileText, ClipboardCheck,
  Wrench, CalendarIcon, Plus, Video, PhoneCall,
} from "lucide-react";
import { AfspraakDialog } from "@/components/shared/AfspraakDialog";

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
const formatCurrency = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

const KlantDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [afspraakOpen, setAfspraakOpen] = useState(false);

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

  const { data: opdrachten = [] } = useQuery({
    queryKey: ["klant-opdrachten", klant?.offerte_id],
    queryFn: async () => {
      if (!klant?.offerte_id) return [];
      const { data, error } = await supabase.from("opdrachten")
        .select("id, klant_naam, status, totaal_bedrag, created_at")
        .eq("offerte_id", klant.offerte_id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!klant?.offerte_id,
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

  const saveNotities = async (notities: string) => {
    const { error } = await supabase.from("klanten" as any).update({ notities } as any).eq("id", id!);
    if (error) toast.error(error.message);
    else {
      toast.success("Notities opgeslagen");
      queryClient.invalidateQueries({ queryKey: ["klant", id] });
    }
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Laden...</div>;
  if (!klant) return <div className="p-8 text-center text-muted-foreground">Klant niet gevonden</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/klanten")} className="rounded-xl">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-foreground">{klant.voornaam} {klant.achternaam}</h1>
          <p className="text-muted-foreground text-sm">{klant.email}</p>
        </div>
        <Badge className="bg-green-600 text-white">Klant</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact card */}
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Contactgegevens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {klant.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />{klant.email}</div>}
            {klant.telefoon && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{klant.telefoon}</div>}
            {klant.adres && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" />{klant.adres}, {klant.postcode} {klant.plaats}</div>}
            {klant.bedrijfsnaam && <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" />{klant.bedrijfsnaam}</div>}
            <div className="pt-3 border-t text-xs text-muted-foreground">
              Klant sinds: {formatDate(klant.created_at)}
            </div>
          </CardContent>
        </Card>

        {/* Main tabs */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="overzicht">
            <TabsList className="rounded-xl">
              <TabsTrigger value="overzicht" className="rounded-lg">Overzicht</TabsTrigger>
              <TabsTrigger value="afspraken" className="rounded-lg">Afspraken ({afspraken.length})</TabsTrigger>
              <TabsTrigger value="offertes" className="rounded-lg">Offertes ({offertes.length})</TabsTrigger>
              <TabsTrigger value="schouwen" className="rounded-lg">Schouwen ({schouwen.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="overzicht">
              <div className="space-y-4">
                {/* Quick stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Card className="rounded-xl border-0 shadow-sm">
                    <CardContent className="pt-4 pb-3 text-center">
                      <p className="text-2xl font-bold text-foreground">{offertes.length}</p>
                      <p className="text-xs text-muted-foreground">Offertes</p>
                    </CardContent>
                  </Card>
                  <Card className="rounded-xl border-0 shadow-sm">
                    <CardContent className="pt-4 pb-3 text-center">
                      <p className="text-2xl font-bold text-foreground">{opdrachten.length}</p>
                      <p className="text-xs text-muted-foreground">Opdrachten</p>
                    </CardContent>
                  </Card>
                  <Card className="rounded-xl border-0 shadow-sm">
                    <CardContent className="pt-4 pb-3 text-center">
                      <p className="text-2xl font-bold text-foreground">{schouwen.length}</p>
                      <p className="text-xs text-muted-foreground">Schouwen</p>
                    </CardContent>
                  </Card>
                  <Card className="rounded-xl border-0 shadow-sm">
                    <CardContent className="pt-4 pb-3 text-center">
                      <p className="text-2xl font-bold text-foreground">{afspraken.length}</p>
                      <p className="text-xs text-muted-foreground">Afspraken</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Notities */}
                <Card className="rounded-2xl border-0 shadow-sm">
                  <CardContent className="pt-6">
                    <label className="text-sm font-medium block mb-2">Notities</label>
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
            </TabsContent>

            <TabsContent value="afspraken">
              <Card className="rounded-2xl border-0 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-base">Afspraken</CardTitle>
                  <Button size="sm" onClick={() => setAfspraakOpen(true)} className="gap-1">
                    <Plus className="h-3.5 w-3.5" /> Afspraak inplannen
                  </Button>
                </CardHeader>
                <CardContent>
                  {afspraken.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">Geen afspraken</p>
                  ) : (
                    <div className="space-y-3">
                      {afspraken.map((a: any) => (
                        <div key={a.id} className="flex items-center justify-between p-3 rounded-xl border">
                          <div className="flex items-center gap-3">
                            {a.type === "belafspraak" ? <PhoneCall className="h-5 w-5 text-emerald-600" /> :
                             a.type === "op_afstand" ? <Video className="h-5 w-5 text-primary" /> :
                             <MapPin className="h-5 w-5 text-primary" />}
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

            <TabsContent value="offertes">
              <Card className="rounded-2xl border-0 shadow-sm">
                <CardContent className="pt-6">
                  {offertes.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">Geen offertes</p>
                  ) : (
                    <div className="space-y-3">
                      {offertes.map((o: any) => (
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
                <CardContent className="pt-6">
                  {schouwen.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">Geen schouwen</p>
                  ) : (
                    <div className="space-y-3">
                      {schouwen.map((s: any) => (
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
