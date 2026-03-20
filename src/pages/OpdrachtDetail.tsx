import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ArrowLeft, Send, CalendarPlus, Wrench, Eye, XCircle, FileText, Download } from "lucide-react";
import { categoryFields, getSections } from "@/components/schouwen/SchouwCategoryFields";
import OrderbevestigingPDF from "@/components/OrderbevestigingPDF";

const statusLabels: Record<string, string> = {
  nieuw: "Nieuw", bevestigd: "Bevestigd", schouw_gepland: "Schouw gepland",
  installatie_gepland: "Installatie gepland", in_uitvoering: "In uitvoering",
  afgerond: "Afgerond", geannuleerd: "Geannuleerd",
};

const statusColors: Record<string, string> = {
  nieuw: "bg-primary/10 text-primary", bevestigd: "bg-accent/50 text-accent-foreground",
  schouw_gepland: "bg-primary/10 text-primary", installatie_gepland: "bg-primary/10 text-primary",
  in_uitvoering: "bg-warning/10 text-warning-foreground", afgerond: "bg-success-light text-success",
  geannuleerd: "bg-error-light text-error",
};

interface OfferteRegel {
  omschrijving: string;
  offerte_tekst?: string;
  aantal: number;
  prijs_per_stuk: number;
  btw_percentage: number;
  korting_percentage: number;
}

const OpdrachtDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [cancelDialog, setCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [installDialog, setInstallDialog] = useState(false);
  const [installForm, setInstallForm] = useState({ monteur_id: "", start: "", eind: "" });
  const [orderPdfOpen, setOrderPdfOpen] = useState(false);

  const { data: opdracht, isLoading } = useQuery({
    queryKey: ["opdracht", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opdrachten" as any)
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!id,
  });

  const { data: schouw } = useQuery({
    queryKey: ["schouw-for-opdracht", opdracht?.schouw_id],
    queryFn: async () => {
      const { data, error } = await supabase.from("schouwen").select("*").eq("id", opdracht.schouw_id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!opdracht?.schouw_id,
  });

  const { data: monteurs = [] } = useQuery({
    queryKey: ["installateurs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("users").select("id, voornaam, achternaam").eq("rol", "installateur");
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async (payload: Record<string, any>) => {
      const { error } = await supabase.from("opdrachten" as any).update(payload).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opdracht", id] });
      queryClient.invalidateQueries({ queryKey: ["opdrachten"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleConfirm = () => {
    updateStatus.mutate({ status: "bevestigd", bevestiging_verzonden_op: new Date().toISOString() });
    toast.success("Opdrachtbevestiging verzonden");
  };

  const handleCancel = () => {
    if (!cancelReason.trim()) { toast.error("Vul een annuleringsreden in"); return; }
    updateStatus.mutate({ status: "geannuleerd", annulering_reden: cancelReason });
    setCancelDialog(false);
    toast.success("Opdracht geannuleerd");
  };

  const handlePlanSchouw = () => {
    const params = new URLSearchParams();
    if (opdracht?.lead_id) params.set("lead_id", opdracht.lead_id);
    if (opdracht?.id) params.set("opdracht_id", opdracht.id);
    params.set("klant_naam", opdracht?.klant_naam || "");
    params.set("klant_email", opdracht?.klant_email || "");
    navigate(`/schouwen/nieuw?${params.toString()}`);
  };

  const handlePlanInstallatie = async () => {
    if (!installForm.monteur_id || !installForm.start) {
      toast.error("Selecteer een monteur en startdatum"); return;
    }
    const { data: inst, error } = await supabase.from("installaties").insert({
      partner_id: opdracht.partner_id,
      offerte_id: opdracht.offerte_id,
      lead_id: opdracht.lead_id || null,
      installateur_id: installForm.monteur_id,
      consument_naam: opdracht.klant_naam,
      geplande_startdatum: installForm.start,
      geplande_einddatum: installForm.eind || null,
      status: "gepland",
    }).select("id").single();
    if (error) { toast.error(error.message); return; }
    await supabase.from("opdrachten" as any).update({
      status: "installatie_gepland",
      installatie_id: inst.id,
      toegewezen_monteur_id: installForm.monteur_id,
    }).eq("id", id!);
    queryClient.invalidateQueries({ queryKey: ["opdracht", id] });
    setInstallDialog(false);
    toast.success("Installatie gepland en monteur toegewezen");
  };

  if (isLoading || !opdracht) return <div className="p-6 text-muted-foreground">Laden...</div>;

  const regels = (opdracht.regels || []) as OfferteRegel[];
  const formatCurrency = (n: number) => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);
  const isActive = !["afgerond", "geannuleerd"].includes(opdracht.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/opdrachten")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-foreground">Opdracht: {opdracht.klant_naam}</h1>
          <p className="text-muted-foreground text-sm">{opdracht.klant_email} • {opdracht.klant_telefoon}</p>
        </div>
        <Badge className={statusColors[opdracht.status] || ""}>{statusLabels[opdracht.status] || opdracht.status}</Badge>
      </div>

      {/* Actions */}
      {isActive && (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="py-4 flex flex-wrap gap-3">
            {opdracht.status === "nieuw" && (
              <Button onClick={handleConfirm} className="gap-2"><Send className="h-4 w-4" /> Opdrachtbevestiging versturen</Button>
            )}
            {!opdracht.schouw_id && (
              <Button variant="outline" onClick={handlePlanSchouw} className="gap-2"><CalendarPlus className="h-4 w-4" /> Schouw inplannen</Button>
            )}
            {!opdracht.installatie_id && (
              <Button variant="outline" onClick={() => setInstallDialog(true)} className="gap-2"><Wrench className="h-4 w-4" /> Installatie plannen</Button>
            )}
            <Button variant="destructive" onClick={() => setCancelDialog(true)} className="gap-2 ml-auto"><XCircle className="h-4 w-4" /> Annuleren</Button>
          </CardContent>
        </Card>
      )}

      {/* Klantgegevens */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader><CardTitle className="text-lg">Klantgegevens</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Naam:</span> {opdracht.klant_naam}</p>
            <p><span className="text-muted-foreground">E-mail:</span> {opdracht.klant_email}</p>
            <p><span className="text-muted-foreground">Telefoon:</span> {opdracht.klant_telefoon || "-"}</p>
            <p><span className="text-muted-foreground">Adres:</span> {opdracht.klant_adres || "-"}</p>
            <p><span className="text-muted-foreground">Postcode/Plaats:</span> {opdracht.klant_postcode || "-"} {opdracht.klant_plaats || ""}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader><CardTitle className="text-lg">Status</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Aangemaakt:</span> {new Date(opdracht.created_at).toLocaleDateString("nl-NL")}</p>
            {opdracht.bevestiging_verzonden_op && (
              <p><span className="text-muted-foreground">Bevestigd:</span> {new Date(opdracht.bevestiging_verzonden_op).toLocaleDateString("nl-NL")}</p>
            )}
            {opdracht.toegewezen_monteur_id && (
              <p><span className="text-muted-foreground">Monteur:</span> {monteurs.find(m => m.id === opdracht.toegewezen_monteur_id)?.voornaam || "Toegewezen"}</p>
            )}
            {opdracht.annulering_reden && (
              <p className="text-destructive"><span className="text-muted-foreground">Reden annulering:</span> {opdracht.annulering_reden}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Offerteregels */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader><CardTitle className="text-lg">Offerteregels</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Omschrijving</TableHead>
                <TableHead className="text-right">Aantal</TableHead>
                <TableHead className="text-right">Prijs</TableHead>
                <TableHead className="text-right">Subtotaal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regels.map((r, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div>{r.omschrijving}</div>
                    {r.offerte_tekst && <p className="text-xs text-muted-foreground mt-1">{r.offerte_tekst}</p>}
                  </TableCell>
                  <TableCell className="text-right">{r.aantal}</TableCell>
                  <TableCell className="text-right">{formatCurrency(r.prijs_per_stuk)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(r.aantal * r.prijs_per_stuk * (1 - (r.korting_percentage || 0) / 100))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="text-right mt-4 text-lg font-semibold">{formatCurrency(opdracht.totaal_bedrag || 0)}</div>
        </CardContent>
      </Card>

      {/* Schouwgegevens */}
      {schouw && (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Schouwgegevens — {schouw.schouw_nummer}</CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate(`/schouwen/${schouw.id}`)}>
                <Eye className="h-4 w-4 mr-1" /> Bekijken
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {schouw.gegevens && typeof schouw.gegevens === "object" ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                {Object.entries(schouw.gegevens as Record<string, string>).map(([k, v]) => (
                  <div key={k}>
                    <span className="text-muted-foreground capitalize">{k.replace(/_/g, " ")}:</span>{" "}
                    <span className="font-medium">{v}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Geen gegevens beschikbaar</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Cancel dialog */}
      <Dialog open={cancelDialog} onOpenChange={setCancelDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Opdracht annuleren</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label>Reden voor annulering *</Label>
            <Textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Geef een reden op..." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialog(false)}>Terug</Button>
            <Button variant="destructive" onClick={handleCancel}>Bevestig annulering</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Install planning dialog */}
      <Dialog open={installDialog} onOpenChange={setInstallDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Installatie plannen</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Monteur *</Label>
              <Select value={installForm.monteur_id} onValueChange={v => setInstallForm(p => ({ ...p, monteur_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecteer monteur" /></SelectTrigger>
                <SelectContent>
                  {monteurs.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.voornaam} {m.achternaam}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Startdatum *</Label>
              <Input type="date" value={installForm.start} onChange={e => setInstallForm(p => ({ ...p, start: e.target.value }))} />
            </div>
            <div>
              <Label>Einddatum</Label>
              <Input type="date" value={installForm.eind} onChange={e => setInstallForm(p => ({ ...p, eind: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInstallDialog(false)}>Annuleren</Button>
            <Button onClick={handlePlanInstallatie}>Plan installatie</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OpdrachtDetail;
