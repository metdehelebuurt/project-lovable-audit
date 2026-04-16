import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, FileText, Download, Eye, TrendingUp, TrendingDown, Clock, CheckCircle } from "lucide-react";
import { formatCurrency } from "@/types/offerte";
import { useToast } from "@/hooks/use-toast";
import { FinancieelDashboard } from "@/components/financieel/FinancieelDashboard";
import { BTWOverzicht } from "@/components/financieel/BTWOverzicht";
import { DebiteurenCrediteuren } from "@/components/financieel/DebiteurenCrediteuren";

type DocType = "verkoopfactuur" | "creditnota" | "inkoopfactuur" | "inkooporder" | "pakbon";

const typeLabels: Record<DocType, string> = {
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

export default function Financieel() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overzicht");

  useEffect(() => {
    if (!profile?.partner_id) return;
    const fetchDocs = async () => {
      const { data, error } = await supabase
        .from("financiele_documenten")
        .select("*, klanten(voornaam, achternaam, bedrijfsnaam), leveranciers(naam)")
        .eq("partner_id", profile.partner_id)
        .order("created_at", { ascending: false });
      if (error) {
        toast({ title: "Fout", description: error.message, variant: "destructive" });
      } else {
        setDocs(data || []);
      }
      setLoading(false);
    };
    fetchDocs();
  }, [profile?.partner_id]);

  const filteredDocs = (types: DocType[]) => docs.filter((d) => types.includes(d.type));

  const renderTable = (items: any[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nummer</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Relatie</TableHead>
          <TableHead>Datum</TableHead>
          <TableHead>Bedrag</TableHead>
          <TableHead>Status</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
              Geen documenten gevonden
            </TableCell>
          </TableRow>
        ) : (
          items.map((doc) => {
            const relatie = doc.klanten
              ? doc.klanten.bedrijfsnaam || `${doc.klanten.voornaam} ${doc.klanten.achternaam}`
              : doc.leveranciers?.naam || "—";
            return (
              <TableRow
                key={doc.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => navigate(`/financieel/${doc.id}`)}
              >
                <TableCell className="font-mono text-sm">{doc.documentnummer}</TableCell>
                <TableCell>{typeLabels[doc.type as DocType]}</TableCell>
                <TableCell>{relatie}</TableCell>
                <TableCell>{new Date(doc.factuurdatum).toLocaleDateString("nl-NL")}</TableCell>
                <TableCell className="font-medium">{formatCurrency(doc.totaal_bedrag)}</TableCell>
                <TableCell>
                  <Badge className={statusColors[doc.status] || ""} variant="secondary">
                    {doc.status.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/financieel/${doc.id}`); }}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financieel</h1>
          <p className="text-muted-foreground">Beheer al je financiële documenten op één plek</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate("/financieel/nieuw/verkoopfactuur")}>
            <Plus className="h-4 w-4 mr-2" /> Verkoopfactuur
          </Button>
          <Button variant="outline" onClick={() => navigate("/financieel/nieuw/inkoopfactuur")}>
            <Plus className="h-4 w-4 mr-2" /> Inkoopfactuur
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overzicht">Dashboard</TabsTrigger>
          <TabsTrigger value="verkoop">Verkoop</TabsTrigger>
          <TabsTrigger value="inkoop">Inkoop</TabsTrigger>
          <TabsTrigger value="pakbonnen">Pakbonnen</TabsTrigger>
          <TabsTrigger value="openstaand">Openstaand</TabsTrigger>
          <TabsTrigger value="btw">BTW</TabsTrigger>
        </TabsList>

        <TabsContent value="overzicht">
          <FinancieelDashboard docs={docs} loading={loading} />
        </TabsContent>

        <TabsContent value="verkoop">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Verkoopfacturen & Creditnota's</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => navigate("/financieel/nieuw/verkoopfactuur")}>
                  <Plus className="h-4 w-4 mr-1" /> Factuur
                </Button>
                <Button size="sm" variant="outline" onClick={() => navigate("/financieel/nieuw/creditnota")}>
                  <Plus className="h-4 w-4 mr-1" /> Creditnota
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {renderTable(filteredDocs(["verkoopfactuur", "creditnota"]))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inkoop">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Inkoopfacturen & Inkooporders</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => navigate("/financieel/nieuw/inkoopfactuur")}>
                  <Plus className="h-4 w-4 mr-1" /> Inkoopfactuur
                </Button>
                <Button size="sm" variant="outline" onClick={() => navigate("/financieel/nieuw/inkooporder")}>
                  <Plus className="h-4 w-4 mr-1" /> Inkooporder
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {renderTable(filteredDocs(["inkoopfactuur", "inkooporder"]))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pakbonnen">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Pakbonnen</CardTitle>
              <Button size="sm" onClick={() => navigate("/financieel/nieuw/pakbon")}>
                <Plus className="h-4 w-4 mr-1" /> Pakbon
              </Button>
            </CardHeader>
            <CardContent>
              {renderTable(filteredDocs(["pakbon"]))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="openstaand">
          <DebiteurenCrediteuren docs={docs} />
        </TabsContent>

        <TabsContent value="btw">
          <BTWOverzicht docs={docs} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
