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
import { ArrowLeft, Send, CheckCircle, XCircle, Copy, FileText, Download } from "lucide-react";
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

  useEffect(() => {
    if (!id) return;
    supabase
      .from("financiele_documenten")
      .select("*, klanten(voornaam, achternaam, bedrijfsnaam, email, adres, postcode, plaats), leveranciers(naam, email, adres, postcode, plaats)")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error) toast({ title: "Fout", description: error.message, variant: "destructive" });
        else setDoc(data);
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
    navigate(`/financieel/nieuw/creditnota`);
  };

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-96" /></div>;
  }

  if (!doc) {
    return <div className="text-center py-12 text-muted-foreground">Document niet gevonden</div>;
  }

  const regels = (doc.regels || []) as OfferteRegel[];
  const relatie = doc.klanten
    ? doc.klanten.bedrijfsnaam || `${doc.klanten.voornaam} ${doc.klanten.achternaam}`
    : doc.leveranciers?.naam || "—";
  const relatieDetails = doc.klanten || doc.leveranciers;

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
        <div className="flex gap-2">
          {doc.status === "concept" && (
            <Button onClick={() => updateStatus("verzonden")}>
              <Send className="h-4 w-4 mr-2" /> Verzenden
            </Button>
          )}
          {doc.status === "verzonden" && (
            <Button onClick={() => updateStatus("betaald")} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-2" /> Betaald markeren
            </Button>
          )}
          {doc.type === "verkoopfactuur" && doc.status === "betaald" && (
            <Button variant="outline" onClick={handleCreditnota}>
              <Copy className="h-4 w-4 mr-2" /> Creditnota
            </Button>
          )}
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
              {relatieDetails?.email && <p className="text-muted-foreground">{relatieDetails.email}</p>}
              {relatieDetails?.adres && <p className="text-muted-foreground">{relatieDetails.adres}</p>}
              {relatieDetails?.postcode && relatieDetails?.plaats && (
                <p className="text-muted-foreground">{relatieDetails.postcode} {relatieDetails.plaats}</p>
              )}
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
    </div>
  );
}
