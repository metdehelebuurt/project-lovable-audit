import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  ArrowLeft, Send, Link2, Copy, FileDown, Pencil, Trash2,
  Check, XCircle, MessageSquare, Calendar, MapPin, Phone, Mail,
  User, Clock, StickyNote, FileText, Bell, Receipt, PenLine
} from "lucide-react";
import type { Database, Json } from "@/integrations/supabase/types";
import { formatCurrency, regelSubtotaal as regelSub, ensureHtml, type OfferteRegel } from "@/types/offerte";
import EntiteitHistorieTab from "@/components/historie/EntiteitHistorieTab";
import OfferteEmailEditor from "@/components/offertes/OfferteEmailEditor";
import OfferteHerinneringen from "@/components/offertes/OfferteHerinneringen";
import TermijnschemaCard from "@/components/financieel/TermijnschemaCard";
import SignaturePad from "@/components/schouwen/SignaturePad";

type Offerte = Database["public"]["Tables"]["offertes"]["Row"];
type OfferteStatus = Database["public"]["Enums"]["offerte_status"];

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

const categorieLabelsMap: Record<string, string> = {
  prijs: "Prijs te hoog",
  concurrent: "Concurrent gekozen",
  geen_behoefte: "Geen behoefte meer",
  timing: "Timing niet goed",
  overig: "Overig",
};

// Using shared types from @/types/offerte

const OfferteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const [feedbackText, setFeedbackText] = useState("");
  const [notitieText, setNotitieText] = useState("");
  const [emailDialog, setEmailDialog] = useState(searchParams.get("email") === "true");
  const [shareDialog, setShareDialog] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [generatingLink, setGeneratingLink] = useState(false);

  // Delete dialog state
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteReden, setDeleteReden] = useState("");
  const [deleteKlant, setDeleteKlant] = useState(false);

  // Afwijzing dialog state
  const [afwijzingDialog, setAfwijzingDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<OfferteStatus | null>(null);
  const [afwijzingCategorie, setAfwijzingCategorie] = useState("");
  const [afwijzingReden, setAfwijzingReden] = useState("");

  // Ondertekenen dialog
  const [signDialog, setSignDialog] = useState(false);
  const [signOpenSendAfter, setSignOpenSendAfter] = useState(false);
  const [signatureDraft, setSignatureDraft] = useState<string | null>(null);
  const [signSaving, setSignSaving] = useState(false);

  const isSuperadmin = profile?.rol === "superadmin";
  const isAdmin = profile?.rol === "partner_admin" || profile?.rol === "partner_staff";
  const isConsument = profile?.rol === "consument";
  const canDelete = isSuperadmin || isAdmin;
  const canEdit = isSuperadmin || isAdmin || profile?.rol === "adviseur";

  const { data: offerte, isLoading } = useQuery({
    queryKey: ["offerte", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offertes")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: gekoppeldeFacturen = [] } = useQuery({
    queryKey: ["offerte-facturen", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financiele_documenten")
        .select("id, documentnummer, totaal_bedrag, status, factuurdatum")
        .eq("offerte_id", id!)
        .eq("type", "verkoopfactuur")
        .order("factuurdatum", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: async ({ status, afwijzing_reden, afwijzing_categorie }: { status: OfferteStatus; afwijzing_reden?: string; afwijzing_categorie?: string }) => {
      const update: any = { status };
      if (afwijzing_reden !== undefined) update.afwijzing_reden = afwijzing_reden;
      if (afwijzing_categorie !== undefined) update.afwijzing_categorie = afwijzing_categorie;
      const { error } = await supabase.from("offertes").update(update).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offerte", id] });
      queryClient.invalidateQueries({ queryKey: ["offertes"] });
      toast.success("Status bijgewerkt");
    },
    onError: (err: Error) => toast.error("Fout", { description: err.message }),
  });

  const handleStatusChange = (newStatus: OfferteStatus) => {
    if (newStatus === "afgewezen" || newStatus === "verlopen") {
      setPendingStatus(newStatus);
      setAfwijzingCategorie("");
      setAfwijzingReden("");
      setAfwijzingDialog(true);
    } else {
      statusMutation.mutate({ status: newStatus });
    }
  };

  const handleAfwijzingConfirm = () => {
    if (!pendingStatus) return;
    statusMutation.mutate({
      status: pendingStatus,
      afwijzing_reden: afwijzingReden || undefined,
      afwijzing_categorie: afwijzingCategorie || undefined,
    });
    setAfwijzingDialog(false);
    setPendingStatus(null);
  };

  const isSigned = !!(offerte as any)?.partner_handtekening_data;

  const openSignDialog = (sendAfter: boolean) => {
    setSignatureDraft((offerte as any)?.partner_handtekening_data || null);
    setSignOpenSendAfter(sendAfter);
    setSignDialog(true);
  };

  const handleSendClick = () => {
    if (isSigned) {
      setEmailDialog(true);
    } else {
      openSignDialog(true);
    }
  };

  const handleSignatureSave = async () => {
    if (!id) return;
    if (!signatureDraft) {
      toast.error("Plaats eerst een handtekening");
      return;
    }
    setSignSaving(true);
    const now = new Date().toISOString();
    const { error } = await supabase.from("offertes").update({
      partner_handtekening_data: signatureDraft,
      partner_handtekening_op: now,
    } as any).eq("id", id);
    setSignSaving(false);
    if (error) {
      toast.error("Handtekening opslaan mislukt", { description: error.message });
      return;
    }
    toast.success("Offerte ondertekend");
    queryClient.invalidateQueries({ queryKey: ["offerte", id] });
    setSignDialog(false);
    if (signOpenSendAfter) setEmailDialog(true);
  };

  const deleteMutation = useMutation({
    mutationFn: async ({ reden, verwijderKlant }: { reden: string; verwijderKlant: boolean }) => {
      const offerteId = id!;
      // Delete related records to avoid FK constraint violations
      await supabase.from("offerte_berichten").delete().eq("offerte_id", offerteId);
      await supabase.from("opdrachten").delete().eq("offerte_id", offerteId);
      await supabase.from("installaties").delete().eq("offerte_id", offerteId);
      // Unlink klanten referencing this offerte
      await supabase.from("klanten").update({ offerte_id: null }).eq("offerte_id", offerteId);
      // If user wants to delete associated customer too
      if (verwijderKlant) {
        const { data: linkedKlanten } = await supabase.from("klanten").select("id").eq("offerte_id", offerteId);
        if (linkedKlanten?.length) {
          for (const k of linkedKlanten) {
            await supabase.from("klanten").delete().eq("id", k.id);
          }
        }
      }
      // Now delete the offerte
      const { error } = await supabase.from("offertes").delete().eq("id", offerteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offertes"] });
      toast.success("Offerte verwijderd");
      navigate("/offertes");
    },
    onError: (err: Error) => toast.error("Fout bij verwijderen", { description: err.message }),
  });

  const saveNotitieMutation = useMutation({
    mutationFn: async (text: string) => {
      const existing = offerte?.notities || "";
      const timestamp = new Date().toLocaleString("nl-NL");
      const author = `${profile?.voornaam} ${profile?.achternaam}`;
      const newNotitie = `[${timestamp} — ${author}]\n${text}\n\n${existing}`;
      const { error } = await supabase.from("offertes").update({ notities: newNotitie }).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offerte", id] });
      setNotitieText("");
      toast.success("Notitie toegevoegd");
    },
    onError: (err: Error) => toast.error("Fout", { description: err.message }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!offerte) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/offertes")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Terug
        </Button>
        <p className="text-muted-foreground">Offerte niet gevonden.</p>
      </div>
    );
  }

  const regels = Array.isArray(offerte.regels)
    ? (offerte.regels as unknown as OfferteRegel[])
    : [];

  const templateConfig = offerte.template_config && typeof offerte.template_config === "object"
    ? (offerte.template_config as any) : {};
  const offerteKortingType = templateConfig.offerte_korting_type || "percentage";
  const offerteKortingWaarde = templateConfig.offerte_korting_waarde || 0;

  const handleShareLink = async () => {
    setShareDialog(true);
    if (offerte.share_token) {
      setShareLink(`${window.location.origin}/offerte/${offerte.share_token}`);
    } else {
      setGeneratingLink(true);
      const token = crypto.randomUUID();
      const { error } = await supabase.from("offertes").update({
        share_token: token,
        share_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any).eq("id", offerte.id);
      if (!error) {
        setShareLink(`${window.location.origin}/offerte/${token}`);
        queryClient.invalidateQueries({ queryKey: ["offerte", id] });
      } else {
        toast.error("Link genereren mislukt");
      }
      setGeneratingLink(false);
    }
  };

  // Email sending is now handled by OfferteEmailEditor component

  const handleFeedback = async () => {
    if (!feedbackText.trim()) return;
    const existing = Array.isArray(offerte.feedback_berichten) ? offerte.feedback_berichten : [];
    const newMsg = {
      auteur: `${profile?.voornaam} ${profile?.achternaam}`,
      bericht: feedbackText.trim(),
      datum: new Date().toISOString(),
      rol: profile?.rol || "consument",
    };
    const updated = [...existing, newMsg];
    await supabase.from("offertes").update({ feedback_berichten: updated as unknown as Json }).eq("id", offerte.id);
    queryClient.invalidateQueries({ queryKey: ["offerte", id] });
    setFeedbackText("");
    toast.success("Feedback verzonden");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/offertes")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-foreground">{offerte.offertenummer}</h1>
            <Badge className={statusColors[offerte.status]}>{statusLabels[offerte.status]}</Badge>
          </div>
          <p className="text-muted-foreground mt-0.5">{offerte.klant_naam}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-pill gap-2" onClick={() => navigate(`/offertes/${offerte.id}/pdf`)}>
            <FileDown className="h-4 w-4" /> PDF
          </Button>
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-pill gap-2"
              onClick={() => openSignDialog(false)}
              title={isSigned ? "Handtekening wijzigen" : "Offerte ondertekenen"}
            >
              <PenLine className="h-4 w-4" />
              {isSigned ? "Ondertekend" : "Ondertekenen"}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="rounded-pill gap-2"
            onClick={handleSendClick}
            title={isSigned ? "Offerte versturen" : "Onderteken en verstuur in één stap"}
          >
            <Send className="h-4 w-4" /> Versturen
          </Button>
          <Button variant="outline" size="sm" className="rounded-pill gap-2" onClick={handleShareLink}>
            <Link2 className="h-4 w-4" /> Delen
          </Button>
          {offerte.status === "geaccepteerd" && canEdit && (
            <Button variant="outline" size="sm" className="rounded-pill gap-2" onClick={() => navigate(`/financieel/nieuw/verkoopfactuur?offerte=${offerte.id}`)}>
              <Receipt className="h-4 w-4" />
              {gekoppeldeFacturen.filter((f: any) => f.status !== "concept").length > 0 ? "Termijnfactuur aanmaken" : "Factuur aanmaken"}
            </Button>
          )}
          {offerte.status === "concept" && canEdit && (
            <Button size="sm" className="rounded-pill gap-2" onClick={() => navigate(`/offertes/nieuw?edit=${offerte.id}`)}>
              <Pencil className="h-4 w-4" /> Bewerken
            </Button>
          )}
          {canDelete && (
            <>
              <Button variant="destructive" size="sm" className="rounded-pill gap-2" onClick={() => setDeleteDialog(true)}>
                <Trash2 className="h-4 w-4" /> Verwijderen
              </Button>
              <Dialog open={deleteDialog} onOpenChange={(open) => { setDeleteDialog(open); if (!open) { setDeleteReden(""); setDeleteKlant(false); } }}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Offerte verwijderen</DialogTitle>
                  </DialogHeader>
                  <p className="text-sm text-muted-foreground">
                    Weet je zeker dat je offerte <strong>{offerte.offertenummer}</strong> wilt verwijderen? Gerelateerde opdrachten en installaties worden ook verwijderd.
                  </p>
                  <div className="space-y-3">
                    <div>
                      <Label>Reden van verwijdering *</Label>
                      <Textarea
                        value={deleteReden}
                        onChange={(e) => setDeleteReden(e.target.value)}
                        placeholder="Geef een reden op voor het verwijderen..."
                        className="mt-1"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="deleteKlant"
                        checked={deleteKlant}
                        onCheckedChange={(v) => setDeleteKlant(v === true)}
                      />
                      <Label htmlFor="deleteKlant" className="text-sm cursor-pointer">
                        Bijbehorende klant ook verwijderen
                      </Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDeleteDialog(false)}>Annuleren</Button>
                    <Button
                      variant="destructive"
                      disabled={!deleteReden.trim() || deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate({ reden: deleteReden, verwijderKlant: deleteKlant })}
                    >
                      {deleteMutation.isPending ? "Bezig..." : "Definitief verwijderen"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Klantgegevens */}
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" /> Klantgegevens
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs">Naam</p>
                  <p className="font-medium">{offerte.klant_naam}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs flex items-center gap-1"><Mail className="h-3 w-3" /> E-mail</p>
                  <p>{offerte.klant_email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs flex items-center gap-1"><Phone className="h-3 w-3" /> Telefoon</p>
                  <p>{offerte.klant_telefoon || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs flex items-center gap-1"><MapPin className="h-3 w-3" /> Adres</p>
                  <p>{offerte.klant_adres
                    ? `${offerte.klant_adres}, ${offerte.klant_postcode} ${offerte.klant_plaats}`
                    : "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Offerteregels */}
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" /> Offerteregels
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
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
                    {regels.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="font-medium">{r.omschrijving}</div>
                          {r.offerte_tekst && <p className="text-xs text-muted-foreground mt-0.5 max-w-md">{r.offerte_tekst}</p>}
                        </TableCell>
                        <TableCell className="text-right">{r.aantal}</TableCell>
                        <TableCell className="text-right">{formatCurrency(r.prijs_per_stuk)}</TableCell>
                        <TableCell className="text-right">{r.btw_percentage}%</TableCell>
                        <TableCell className="text-right">
                          {r.korting_type === "bedrag"
                            ? formatCurrency(r.korting_bedrag || 0)
                            : `${r.korting_percentage || 0}%`}
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(regelSub(r))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 pt-4 border-t space-y-1.5 max-w-xs ml-auto text-sm">
                {(() => {
                  // Herbereken bruto subtotaal vanuit de regels
                  const brutoSub = regels.reduce((sum, r) => sum + regelSub(r), 0);
                  let kortingBedrag = 0;
                  if (offerteKortingWaarde > 0) {
                    kortingBedrag = offerteKortingType === "percentage"
                      ? brutoSub * (offerteKortingWaarde / 100)
                      : offerteKortingWaarde;
                  }
                  return (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotaal excl. BTW</span>
                        <span>{formatCurrency(brutoSub)}</span>
                      </div>
                      {kortingBedrag > 0 && (
                        <div className="flex justify-between text-success">
                          <span>Korting ({offerteKortingType === "percentage" ? `${offerteKortingWaarde}%` : "vast bedrag"})</span>
                          <span>-{formatCurrency(kortingBedrag)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotaal na korting</span>
                        <span>{formatCurrency(offerte.subtotaal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">BTW</span>
                        <span>{formatCurrency(offerte.btw_bedrag)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-semibold text-base pt-1">
                        <span>Totaal incl. BTW</span>
                        <span>{formatCurrency(offerte.totaal_bedrag)}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Offerte teksten */}
          {(offerte.introductie_tekst || offerte.garantie_voorwaarden || offerte.installatie_termijn || offerte.betalingsvoorwaarden) && (
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Offerte details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {offerte.introductie_tekst && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Introductietekst</p>
                    <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: ensureHtml(offerte.introductie_tekst) }} />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  {offerte.betalingsvoorwaarden && (
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Betalingsvoorwaarden</p>
                      <p>{offerte.betalingsvoorwaarden}</p>
                    </div>
                  )}
                  {offerte.installatie_termijn && (
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Installatietermijn</p>
                      <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: ensureHtml(offerte.installatie_termijn) }} />
                    </div>
                  )}
                </div>
                {offerte.garantie_voorwaarden && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Garantievoorwaarden</p>
                    <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: ensureHtml(offerte.garantie_voorwaarden) }} />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Feedback berichten */}
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" /> Feedback & berichten
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Input */}
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
                  onClick={handleFeedback}
                >
                  <Send className="h-4 w-4" /> Verstuur
                </Button>
              </div>

              {/* Existing messages */}
              {offerte.feedback_berichten && Array.isArray(offerte.feedback_berichten) && (offerte.feedback_berichten as any[]).length > 0 ? (
                <div className="space-y-3">
                  {(offerte.feedback_berichten as any[]).map((fb: any, i: number) => (
                    <div key={i} className="bg-muted/30 rounded-xl p-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span className="font-medium">{fb.auteur}</span>
                        <span>{new Date(fb.datum).toLocaleString("nl-NL")}</span>
                      </div>
                      <p className="text-sm">{fb.bericht}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nog geen berichten.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column - sidebar */}
        <div className="space-y-6">
          {/* Status & acties */}
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Status & acties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status wijzigen */}
              {offerte.status === "geaccepteerd" ? (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <Badge className={statusColors[offerte.status]}>{statusLabels[offerte.status]}</Badge>
                  {offerte.accepted_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Geaccepteerd op {new Date(offerte.accepted_at).toLocaleString("nl-NL")}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status wijzigen</p>
                  <Select value={offerte.status} onValueChange={v => handleStatusChange(v as OfferteStatus)}>
                    <SelectTrigger className="rounded-xl">
                      <Badge className={statusColors[offerte.status]}>{statusLabels[offerte.status]}</Badge>
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(statusLabels) as OfferteStatus[]).filter(s => s !== "geaccepteerd").map(s => (
                        <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Separator />

              {/* Metadata */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Geldig tot {new Date(offerte.geldig_tot).toLocaleDateString("nl-NL")}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Aangemaakt {new Date(offerte.created_at).toLocaleDateString("nl-NL")}</span>
                </div>
                {offerte.lead_id && (
                  <Button variant="link" className="p-0 h-auto text-sm" onClick={() => navigate(`/leads/${offerte.lead_id}`)}>
                    Bekijk gekoppelde lead →
                  </Button>
                )}
              </div>

              <Separator />

              {/* Afwijzingsreden tonen */}
              {(offerte.status === "afgewezen" || offerte.status === "verlopen") && (offerte as any).afwijzing_categorie && (
                <div className="bg-destructive/5 rounded-xl p-3 space-y-1">
                  <p className="text-xs font-medium text-destructive">Afwijzingsreden</p>
                  <Badge variant="outline" className="text-xs">{categorieLabelsMap[(offerte as any).afwijzing_categorie] || (offerte as any).afwijzing_categorie}</Badge>
                  {(offerte as any).afwijzing_reden && (
                    <p className="text-sm text-muted-foreground mt-1">{(offerte as any).afwijzing_reden}</p>
                  )}
                </div>
              )}

              {(offerte.status === "afgewezen" || offerte.status === "verlopen") && (offerte as any).afwijzing_categorie && <Separator />}

              {/* Consument acties */}
              {isConsument && offerte.status === "verzonden" && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Reageren</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="rounded-pill gap-1 bg-success hover:bg-success/90 text-white flex-1"
                      onClick={() => statusMutation.mutate({ status: "geaccepteerd" })}
                    >
                      <Check className="h-4 w-4" /> Accepteren
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="rounded-pill gap-1 flex-1"
                      onClick={() => handleStatusChange("afgewezen")}
                    >
                      <XCircle className="h-4 w-4" /> Afwijzen
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Opvolgingsherinneringen */}
          {offerte.partner_id && (
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" /> Opvolgingsherinneringen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <OfferteHerinneringen offerteId={offerte.id} partnerId={offerte.partner_id} />
              </CardContent>
            </Card>
          )}

          {/* Termijnschema */}
          {offerte.partner_id && (
            <TermijnschemaCard
              offerteId={offerte.id}
              offerteTotaal={Number(offerte.totaal_bedrag) || 0}
              partnerId={offerte.partner_id}
            />
          )}

          {/* Notities */}
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-muted-foreground" /> Notities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Textarea
                  value={notitieText}
                  onChange={e => setNotitieText(e.target.value)}
                  placeholder="Notitie toevoegen..."
                  className="rounded-xl flex-1"
                  rows={2}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-pill self-end"
                  disabled={!notitieText.trim() || saveNotitieMutation.isPending}
                  onClick={() => saveNotitieMutation.mutate(notitieText.trim())}
                >
                  Opslaan
                </Button>
              </div>
              {offerte.notities && (
                <div className="bg-muted/30 rounded-xl p-3 text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
                  {offerte.notities}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* E-mail editor */}
      {offerte && (
        <OfferteEmailEditor
          open={emailDialog}
          onOpenChange={setEmailDialog}
          offerte={{
            id: offerte.id,
            offertenummer: offerte.offertenummer,
            klant_naam: offerte.klant_naam,
            klant_email: offerte.klant_email,
            totaal_bedrag: offerte.totaal_bedrag,
            share_token: offerte.share_token,
            partner_id: offerte.partner_id,
          }}
          onSent={() => queryClient.invalidateQueries({ queryKey: ["offerte", id] })}
        />
      )}

      {/* Share link dialog */}
      <Dialog open={shareDialog} onOpenChange={setShareDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Offertelink delen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Deel deze link met <strong>{offerte.klant_naam}</strong> zodat zij de offerte online kunnen bekijken en accepteren.
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
        </DialogContent>
      </Dialog>

      {/* Afwijzing reden dialog */}
      <Dialog open={afwijzingDialog} onOpenChange={setAfwijzingDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {pendingStatus === "verlopen" ? "Reden voor verlopen" : "Reden voor afwijzing"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Geef aan waarom deze offerte {pendingStatus === "verlopen" ? "is verlopen" : "is afgewezen"}. Dit helpt bij het verbeteren van toekomstige offertes.
            </p>
            <div>
              <Label className="text-sm">Categorie</Label>
              <Select value={afwijzingCategorie} onValueChange={setAfwijzingCategorie}>
                <SelectTrigger className="rounded-xl mt-1">
                  <SelectValue placeholder="Selecteer een categorie..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categorieLabelsMap).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Toelichting (optioneel)</Label>
              <Textarea
                value={afwijzingReden}
                onChange={e => setAfwijzingReden(e.target.value)}
                placeholder="Voeg extra context toe..."
                className="rounded-xl mt-1"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAfwijzingDialog(false)} className="rounded-pill">Annuleren</Button>
            <Button onClick={handleAfwijzingConfirm} className="rounded-pill" variant="destructive">
              Bevestigen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Onderteken-dialog */}
      <Dialog open={signDialog} onOpenChange={(open) => { setSignDialog(open); if (!open) setSignatureDraft(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenLine className="h-4 w-4 text-primary" />
              Offerte ondertekenen
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Plaats hieronder uw handtekening. Deze verschijnt op de PDF en is verplicht voordat de offerte naar de klant kan worden verstuurd.
            </p>
            <div className="rounded-xl border bg-muted/30 p-2">
              <SignaturePad value={signatureDraft} onChange={setSignatureDraft} />
            </div>
            <p className="text-xs text-muted-foreground">
              Tip: u kunt de handtekening later wijzigen of het uitgebreide sjabloon opmaken via de PDF-editor.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSignDialog(false)} className="rounded-pill">
              Annuleren
            </Button>
            <Button
              onClick={handleSignatureSave}
              disabled={!signatureDraft || signSaving}
              className="rounded-pill gap-2"
            >
              {signSaving ? "Opslaan..." : signOpenSendAfter ? "Ondertekenen & versturen" : "Ondertekening opslaan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OfferteDetail;
