import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Settings, Users, Euro, TrendingUp, Save } from "lucide-react";

const AffiliateBeheer = () => {
  const queryClient = useQueryClient();

  // Fetch instellingen
  const { data: instellingen, isLoading: loadingSettings } = useQuery({
    queryKey: ["affiliate-instellingen"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_instellingen")
        .select("*")
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const [settings, setSettings] = useState<any>(null);

  // Sync settings state when data loads
  if (instellingen && !settings) {
    setSettings({ ...instellingen });
  }

  // Fetch all affiliates (users with rol=affiliate)
  const { data: affiliates = [] } = useQuery({
    queryKey: ["all-affiliates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("rol", "affiliate")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch all referrals
  const { data: allReferrals = [] } = useQuery({
    queryKey: ["all-referrals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_referrals")
        .select("*, partners:partner_id(naam, status), users:affiliate_id(voornaam, achternaam, email)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch all kortingscodes
  const { data: allCodes = [] } = useQuery({
    queryKey: ["all-kortingscodes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kortingscodes")
        .select("*, users:affiliate_id(voornaam, achternaam)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Save instellingen
  const saveSettings = useMutation({
    mutationFn: async () => {
      if (!settings || !instellingen) return;
      const { error } = await supabase
        .from("affiliate_instellingen")
        .update({
          max_korting_percentage: settings.max_korting_percentage,
          max_korting_vast_bedrag: settings.max_korting_vast_bedrag,
          standaard_commissie_percentage: settings.standaard_commissie_percentage,
          max_commissie_percentage: settings.max_commissie_percentage,
          min_abonnement_maanden: settings.min_abonnement_maanden,
          cookie_dagen: settings.cookie_dagen,
        })
        .eq("id", instellingen.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliate-instellingen"] });
      toast.success("Instellingen opgeslagen");
    },
    onError: (e: any) => toast.error("Fout: " + e.message),
  });

  const totalCommission = allReferrals.reduce((sum: number, r: any) => sum + (r.commissie_verdiend || 0), 0);
  const activePartners = allReferrals.filter((r: any) => r.status === "actief").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Affiliate Beheer</h1>
        <p className="text-muted-foreground">Beheer affiliates, instellingen en commissies</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{affiliates.length}</p>
                <p className="text-sm text-muted-foreground">Affiliates</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{activePartners}</p>
                <p className="text-sm text-muted-foreground">Aangebrachte partners</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Euro className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">€{totalCommission.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Totaal uitbetaald</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Settings className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{allCodes.length}</p>
                <p className="text-sm text-muted-foreground">Kortingscodes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="instellingen">
        <TabsList>
          <TabsTrigger value="instellingen">Instellingen</TabsTrigger>
          <TabsTrigger value="affiliates">Affiliates</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
          <TabsTrigger value="codes">Kortingscodes</TabsTrigger>
        </TabsList>

        {/* Instellingen Tab */}
        <TabsContent value="instellingen" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Globale affiliate instellingen</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {settings && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Max korting percentage (%)</Label>
                      <Input
                        type="number"
                        value={settings.max_korting_percentage}
                        onChange={(e) => setSettings((s: any) => ({ ...s, max_korting_percentage: parseFloat(e.target.value) || 0 }))}
                      />
                      <p className="text-xs text-muted-foreground">Maximale procentuele korting die een affiliate mag instellen</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Max korting vast bedrag (€)</Label>
                      <Input
                        type="number"
                        value={settings.max_korting_vast_bedrag}
                        onChange={(e) => setSettings((s: any) => ({ ...s, max_korting_vast_bedrag: parseFloat(e.target.value) || 0 }))}
                      />
                      <p className="text-xs text-muted-foreground">Maximaal vast bedrag korting per code</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Standaard commissie (%)</Label>
                      <Input
                        type="number"
                        value={settings.standaard_commissie_percentage}
                        onChange={(e) => setSettings((s: any) => ({ ...s, standaard_commissie_percentage: parseFloat(e.target.value) || 0 }))}
                      />
                      <p className="text-xs text-muted-foreground">Commissie voor nieuwe affiliates</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Max commissie (%)</Label>
                      <Input
                        type="number"
                        value={settings.max_commissie_percentage}
                        onChange={(e) => setSettings((s: any) => ({ ...s, max_commissie_percentage: parseFloat(e.target.value) || 0 }))}
                      />
                      <p className="text-xs text-muted-foreground">Plafond commissiepercentage</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Min abonnement maanden</Label>
                      <Input
                        type="number"
                        value={settings.min_abonnement_maanden}
                        onChange={(e) => setSettings((s: any) => ({ ...s, min_abonnement_maanden: parseInt(e.target.value) || 0 }))}
                      />
                      <p className="text-xs text-muted-foreground">Minimale looptijd voor commissie-uitkering</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Cookie tracking (dagen)</Label>
                      <Input
                        type="number"
                        value={settings.cookie_dagen}
                        onChange={(e) => setSettings((s: any) => ({ ...s, cookie_dagen: parseInt(e.target.value) || 0 }))}
                      />
                      <p className="text-xs text-muted-foreground">Hoe lang een affiliate cookie geldig blijft</p>
                    </div>
                  </div>
                  <Button onClick={() => saveSettings.mutate()} disabled={saveSettings.isPending}>
                    <Save className="h-4 w-4 mr-1" /> Opslaan
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Affiliates Tab */}
        <TabsContent value="affiliates">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Naam</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aangemeld</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {affiliates.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nog geen affiliates</TableCell></TableRow>
                )}
                {affiliates.map((a: any) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.voornaam} {a.achternaam}</TableCell>
                    <TableCell>{a.email}</TableCell>
                    <TableCell>
                      <Badge variant={a.status === "actief" ? "default" : "secondary"}>{a.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{new Date(a.created_at).toLocaleDateString("nl-NL")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Referrals Tab */}
        <TabsContent value="referrals">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Affiliate</TableHead>
                  <TableHead>Partner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Commissie %</TableHead>
                  <TableHead>Verdiend</TableHead>
                  <TableHead>Datum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allReferrals.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nog geen referrals</TableCell></TableRow>
                )}
                {allReferrals.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.users?.voornaam} {r.users?.achternaam}</TableCell>
                    <TableCell className="font-medium">{r.partners?.naam || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === "actief" ? "default" : "secondary"}>{r.status}</Badge>
                    </TableCell>
                    <TableCell>{r.commissie_percentage}%</TableCell>
                    <TableCell className="text-green-600 font-medium">€{(r.commissie_verdiend || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(r.created_at).toLocaleDateString("nl-NL")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Codes Tab */}
        <TabsContent value="codes">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Affiliate</TableHead>
                  <TableHead>Korting</TableHead>
                  <TableHead>Gebruik</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allCodes.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nog geen kortingscodes</TableCell></TableRow>
                )}
                {allCodes.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono font-bold">{c.code}</TableCell>
                    <TableCell>{c.users?.voornaam} {c.users?.achternaam}</TableCell>
                    <TableCell>{c.korting_type === "percentage" ? `${c.korting_waarde}%` : `€${c.korting_waarde}`}</TableCell>
                    <TableCell>{c.aantal_gebruikt}{c.max_gebruik ? `/${c.max_gebruik}` : ""}</TableCell>
                    <TableCell>
                      <Badge variant={c.actief ? "default" : "secondary"}>{c.actief ? "Actief" : "Inactief"}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AffiliateBeheer;
