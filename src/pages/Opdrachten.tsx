import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ClipboardCheck, Eye, Wrench, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import MonteurToewijsDialog from "@/components/installaties/MonteurToewijsDialog";
import { toast } from "sonner";

const statusLabels: Record<string, string> = {
  nieuw: "Nieuw",
  bevestigd: "Bevestigd",
  schouw_gepland: "Schouw gepland",
  installatie_gepland: "Installatie gepland",
  in_uitvoering: "In uitvoering",
  afgerond: "Afgerond",
  geannuleerd: "Geannuleerd",
};

const statusColors: Record<string, string> = {
  nieuw: "bg-primary/10 text-primary",
  bevestigd: "bg-accent/50 text-accent-foreground",
  schouw_gepland: "bg-primary/10 text-primary",
  installatie_gepland: "bg-primary/10 text-primary",
  in_uitvoering: "bg-warning/10 text-warning-foreground",
  afgerond: "bg-success-light text-success",
  geannuleerd: "bg-error-light text-error",
};

const Opdrachten = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("alle");
  const [planDialog, setPlanDialog] = useState<any | null>(null);
  const isInstallateur = profile?.rol === "installateur";

  const { data: opdrachten = [], isLoading } = useQuery({
    queryKey: ["opdrachten", profile?.id, isInstallateur],
    queryFn: async () => {
      let query = supabase
        .from("opdrachten")
        .select("*")
        .order("created_at", { ascending: false });
      if (isInstallateur && profile?.id) {
        query = query.eq("toegewezen_monteur_id", profile.id);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!profile,
  });

  const filtered = opdrachten.filter((o: any) => {
    const matchSearch = `${o.klant_naam ?? ""} ${o.klant_email ?? ""}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "alle" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const formatCurrency = (n: number) => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

  const planbareStatussen = new Set(["bevestigd", "schouw_gepland", "installatie_gepland", "in_uitvoering"]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {isInstallateur ? "Mijn opdrachten" : "Verkooporders"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isInstallateur ? "Aan jou toegewezen werkopdrachten" : "Geaccepteerde offertes verwerken en opvolgen"}
          </p>
        </div>
        {!isInstallateur && (
          <Button onClick={() => navigate("/opdrachten/nieuw")} className="gap-2">
            <Plus className="h-4 w-4" /> Nieuwe verkooporder
          </Button>
        )}
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Zoek verkooporders..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-xl" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="alle">Alle statussen</SelectItem>
                {Object.entries(statusLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Laden...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Geen verkooporders gevonden</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Klant</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Totaal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aangemaakt</TableHead>
                    <TableHead className="text-right">Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((o: any) => (
                    <TableRow key={o.id} className="cursor-pointer" onClick={() => navigate(`/opdrachten/${o.id}`)}>
                      <TableCell className="font-medium">{o.klant_naam}</TableCell>
                      <TableCell>{o.klant_email}</TableCell>
                      <TableCell>{formatCurrency(o.totaal_bedrag || 0)}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[o.status] || ""}>{statusLabels[o.status] || o.status}</Badge>
                      </TableCell>
                      <TableCell>{new Date(o.created_at).toLocaleDateString("nl-NL")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {!isInstallateur && planbareStatussen.has(o.status) && !o.installatie_id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Installatie plannen"
                              onClick={(e) => { e.stopPropagation(); setPlanDialog(o); }}
                            >
                              <Wrench className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); navigate(`/opdrachten/${o.id}`); }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {planDialog && (
        <MonteurToewijsDialog
          open={!!planDialog}
          onOpenChange={(o) => { if (!o) setPlanDialog(null); }}
          opdracht={{
            id: planDialog.id,
            partner_id: planDialog.partner_id,
            offerte_id: planDialog.offerte_id,
            lead_id: planDialog.lead_id,
            klant_id: planDialog.klant_id ?? null,
            klant_naam: planDialog.klant_naam,
            klant_email: planDialog.klant_email,
            klant_telefoon: planDialog.klant_telefoon,
            klant_adres: planDialog.klant_adres,
            klant_postcode: planDialog.klant_postcode,
            klant_plaats: planDialog.klant_plaats,
            regels: planDialog.regels,
            werkomschrijving: planDialog.notities ?? planDialog.werkomschrijving ?? null,
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["opdrachten"] });
            toast.success("Installatie ingepland");
            setPlanDialog(null);
          }}
        />
      )}
    </div>
  );
};

export default Opdrachten;
