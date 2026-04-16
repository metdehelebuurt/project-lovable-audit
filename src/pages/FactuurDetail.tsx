import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DocumentRegelEditor } from "@/components/financieel/DocumentRegelEditor";
import { formatCurrency, type OfferteRegel } from "@/types/offerte";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send, CheckCircle, XCircle, Copy, FileText, Download, Pencil } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FinancieelPDF } from "@/components/financieel/FinancieelPDF";

const typeLabels: Record<string, string> = {
  verkoopfactuur: "Verkoopfactuur",
  creditnota: "Creditnota",
  inkoopfactuur: "Inkoopfactuur",
  inkooporder: "Inkooporder",
  pakbon: "Pakbon",
};

const statusColors: Record<string, string> = {
  concept: "bg-muted text-muted-foreground",
  verzonden: "bg-blue-100 text-blue-800",
  betaald: "bg-green-100 text-green-800",
  verlopen: "bg-red-100 text-red-800",
  gecrediteerd: "bg-orange-100 text-orange-800",
  ontvangen: "bg-blue-100 text-blue-800",
  goedgekeurd: "bg-green-100 text-green-800",
  deels_ontvangen: "bg-yellow-100 text-yellow-800",
  volledig_ontvangen: "bg-green-100 text-green-800",
  aangemaakt: "bg-muted text-muted-foreground",
  afgeleverd: "bg-green-100 text-green-800",
};

export default function FactuurDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useAuth();
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pdfOpen, setPdfOpen] = useState(false);

  const [installatieData, setInstallatieData] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("financiele_documenten")
      .select("*, klanten(voornaam, achternaam, bedrijfsnaam, email, adres, postcode, plaats, telefoon), leveranciers(naam, email, adres, postcode, plaats, telefoon, btw_nummer, kvk_nummer)")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error) toast({ title: "Fout", description: error.message, variant: "destructive" });
        else {
          setDoc(data);
          if (data?.installatie_id) {
            supabase.from("installaties")
              .select("consument_naam, geplande_startdatum, geplande_einddatum, status")
              .eq("id", data.installatie_id)
              .single()
              .then(({ data: inst }) => setInstallatieData(inst));
          }
        }
        setLoading(false);
      });
  }, [id]);

  const { data: partnerData } = useQuery({
    queryKey: ["partner-branding", profile?.partner_id],
    queryFn: async () => {
      const { data } = await supabase.from("partners")
        .select("naam, adres, postcode, plaats, email, telefoonnummer, kvk, btw, logo_url, primaire_kleur")
        .eq("id", profile!.partner_id)
        .single();
      return data;
    },
    enabled: !!profile?.partner_id,
  });

  const updateStatus = async (newStatus: string) => {
    const updates: any = { status: newStatus };
    if (newStatus === "betaald") updates.betaald_op = new Date().toISOString();
    if (newStatus === "verzonden") updates.verzonden_op = new Date().toISOString();

    const { error } = await supabase.from("financiele_documenten").update(updates).eq("id", id);
    if (error) {
      toast({ title: "Fout", description: error.message, variant: "destructive" });
    } else {
      setDoc({ ...doc, ...updates });
      toast({ title: "Status bijgewerkt" });
    }
  };

  const handleCreditnota = async () => {
    if (!doc) return;
    navigate(`/financieel/nieuw/creditnota?bron=${doc.id}`);
  };

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-96" /></div>;
  }

  if (!doc) {
    return <div className="text-center py-12 text-muted-foreground">Document niet gevonden</div>;
  }

  const regels = (doc.regels || []) as OfferteRegel[];
  const eenmalig = doc.eenmalige_relatie as any;
  const relatie = doc.klanten
    ? doc.klanten.bedrijfsnaam || `${doc.klanten.voornaam} ${doc.klanten.achternaam}`
    : doc.leveranciers?.naam
    ? doc.leveranciers.naam
    : eenmalig?.naam || "—";
  const relatieDetails = doc.klanten || doc.leveranciers || eenmalig;

  // Build klant data for PDF from eenmalige_relatie if no klant linked
  const pdfKlant = doc.klanten
    ? doc.klanten
    : eenmalig
    ? {
        voornaam: eenmalig.naam,
        achternaam: "",
        bedrijfsnaam: eenmalig.naam,
        email: eenmalig.email,
        adres: eenmalig.adres,
        postcode: eenmalig.postcode,
        plaats: eenmalig.plaats,
        telefoon: eenmalig.telefoon,
      }
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/financieel")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{doc.documentnummer}</h1>
              <Badge className={statusColors[doc.status] || ""} variant="secondary">
                {doc.status.replace("_", " ")}
              </Badge>
            </div>
            <p className="text-muted-foreground">{typeLabels[doc.type]} — {relatie}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Bewerken knop voor concept documenten */}
          {doc.status === "concept" && (
            <Button variant="outline" onClick={() => navigate(`/financieel/bewerken/${doc.type}/${id}`)}>
              <Pencil className="h-4 w-4 mr-2" /> Bewerken
            </Button>
          )}

          {/* Verkoopfactuur flow: concept → verzonden → betaald */}
          {doc.status === "concept" && (
            <Button onClick={() => updateStatus("verzonden")}>
              <Send className="h-4 w-4 mr-2" /> Verzenden
            </Button>
          )}
          {doc.status === "verzonden" && doc.type === "verkoopfactuur" && (
            <Button onClick={() => updateStatus("betaald")} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-2" /> Betaald markeren
            </Button>
          )}
          {doc.status === "verzonden" && doc.type === "verkoopfactuur" && (
            <Button variant="outline" onClick={() => updateStatus("verlopen")}>
              <XCircle className="h-4 w-4 mr-2" /> Verlopen markeren
            </Button>
          )}

          {/* Inkoopfactuur flow */}
          {doc.type === "inkoopfactuur" && doc.status === "concept" && (
            <Button onClick={() => updateStatus("ontvangen")}>
              <CheckCircle className="h-4 w-4 mr-2" /> Ontvangen
            </Button>
          )}
          {doc.type === "inkoopfactuur" && doc.status === "ontvangen" && (
            <Button onClick={() => updateStatus("goedgekeurd")}>
              <CheckCircle className="h-4 w-4 mr-2" /> Goedkeuren
            </Button>
          )}
          {doc.type === "inkoopfactuur" && doc.status === "goedgekeurd" && (
            <Button onClick={() => updateStatus("betaald")} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-2" /> Betaald markeren
            </Button>
          )}

          {/* Inkooporder flow */}
          {doc.type === "inkooporder" && doc.status === "verzonden" && (
            <>
              <Button variant="outline" onClick={() => updateStatus("deels_ontvangen")}>
                Deels ontvangen
              </Button>
              <Button onClick={() => updateStatus("volledig_ontvangen")} className="bg-green-600 hover:bg-green-700">
                Volledig ontvangen
              </Button>
            </>
          )}
          {doc.type === "inkooporder" && doc.status === "deels_ontvangen" && (
            <Button onClick={() => updateStatus("volledig_ontvangen")} className="bg-green-600 hover:bg-green-700">
              Volledig ontvangen
            </Button>
          )}

          {/* Pakbon flow */}
          {doc.type === "pakbon" && doc.status === "concept" && (
            <Button onClick={() => updateStatus("aangemaakt")}>
              Aanmaken
            </Button>
          )}
          {doc.type === "pakbon" && doc.status === "aangemaakt" && (
            <Button onClick={() => updateStatus("verzonden")}>
              <Send className="h-4 w-4 mr-2" /> Verzonden
            </Button>
          )}
          {doc.type === "pakbon" && doc.status === "verzonden" && (
            <Button onClick={() => updateStatus("afgeleverd")} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-2" /> Afgeleverd
            </Button>
          )}

          {/* Creditnota vanuit betaalde verkoopfactuur */}
          {doc.type === "verkoopfactuur" && doc.status === "betaald" && (
            <Button variant="outline" onClick={handleCreditnota}>
              <Copy className="h-4 w-4 mr-2" /> Creditnota
            </Button>
          )}
          <Button variant="outline" onClick={() => setPdfOpen(true)}>
            <FileText className="h-4 w-4 mr-2" /> PDF Preview
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span>{typeLabels[doc.type]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Factuurdatum</span>
              <span>{new Date(doc.factuurdatum).toLocaleDateString("nl-NL")}</span>
            </div>
            {doc.vervaldatum && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vervaldatum</span>
                <span>{new Date(doc.vervaldatum).toLocaleDateString("nl-NL")}</span>
              </div>
            )}
            {doc.betaald_op && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Betaald op</span>
                <span>{new Date(doc.betaald_op).toLocaleDateString("nl-NL")}</span>
              </div>
            )}
            <div className="border-t pt-3 space-y-1">
              <p className="font-medium">{relatie}</p>
              {eenmalig && !doc.klanten && (
                <Badge variant="outline" className="text-xs mb-1">Eenmalige relatie</Badge>
              )}
              {relatieDetails?.email && <p className="text-muted-foreground">{relatieDetails.email}</p>}
              {relatieDetails?.adres && <p className="text-muted-foreground">{relatieDetails.adres}</p>}
              {(relatieDetails?.postcode || relatieDetails?.plaats) && (
                <p className="text-muted-foreground">{relatieDetails.postcode} {relatieDetails.plaats}</p>
              )}
              {relatieDetails?.telefoon && <p className="text-muted-foreground">{relatieDetails.telefoon}</p>}
            </div>
            {doc.notities && (
              <div className="border-t pt-3">
                <p className="text-muted-foreground text-xs mb-1">Notities</p>
                <p>{doc.notities}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Regels</CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentRegelEditor regels={regels} onChange={() => {}} readOnly />
          </CardContent>
        </Card>
      </div>

      {/* PDF Preview Dialog */}
      <Dialog open={pdfOpen} onOpenChange={setPdfOpen}>
        <DialogContent className="max-w-[240mm] max-h-[95vh] overflow-y-auto p-0">
          <div className="no-print sticky top-0 z-10 bg-background border-b p-4 flex items-center justify-between">
            <DialogHeader><DialogTitle>PDF Preview — {doc.documentnummer}</DialogTitle></DialogHeader>
            <Button size="sm" onClick={() => window.print()}>
              <Download className="h-4 w-4 mr-2" /> PDF downloaden
            </Button>
          </div>
          <FinancieelPDF
            doc={{ ...doc, regels }}
            klant={pdfKlant}
            leverancier={doc.leveranciers}
            partner={partnerData}
            installatie={installatieData}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
