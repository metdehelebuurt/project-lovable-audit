import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Link2, Tag, Users, Euro, Copy, Plus, Trash2, TrendingUp } from "lucide-react";

const Affiliates = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const [linkCode, setLinkCode] = useState("");
  const [codeForm, setCodeForm] = useState({
    code: "",
    korting_type: "percentage" as "percentage" | "vast_bedrag",
    korting_waarde: "",
    max_gebruik: "",
    geldig_tot: "",
  });

  // Fetch affiliate instellingen (limits)
  const { data: instellingen } = useQuery({
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

  // Fetch links
  const { data: links = [] } = useQuery({
    queryKey: ["affiliate-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_links")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch kortingscodes
  const { data: codes = [] } = useQuery({
    queryKey: ["kortingscodes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kortingscodes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch referrals with partner info
  const { data: referrals = [] } = useQuery({
    queryKey: ["affiliate-referrals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_referrals")
        .select("*, partners:partner_id(naam, status, email)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Create link
  const createLink = useMutation({
    mutationFn: async (code: string) => {
      const { error } = await supabase.from("affiliate_links").insert({
        user_id: user!.id,
        code: code.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliate-links"] });
      setShowLinkDialog(false);
      setLinkCode("");
      toast.success("Affiliate link aangemaakt");
    },
    onError: (e: any) => toast.error("Fout: " + e.message),
  });

  // Create kortingscode
  const createCode = useMutation({
    mutationFn: async () => {
      const maxPct = instellingen?.max_korting_percentage ?? 25;
      const maxFixed = instellingen?.max_korting_vast_bedrag ?? 50;
      const waarde = parseFloat(codeForm.korting_waarde);

      if (codeForm.korting_type === "percentage" && waarde > maxPct) {
        throw new Error(`Maximum korting is ${maxPct}%`);
      }
      if (codeForm.korting_type === "vast_bedrag" && waarde > maxFixed) {
        throw new Error(`Maximum korting is €${maxFixed}`);
      }

      const { error } = await supabase.from("kortingscodes").insert({
        affiliate_id: user!.id,
        code: codeForm.code.toUpperCase().replace(/[^A-Z0-9]/g, ""),
        korting_type: codeForm.korting_type,
        korting_waarde: waarde,
        max_gebruik: codeForm.max_gebruik ? parseInt(codeForm.max_gebruik) : null,
        geldig_tot: codeForm.geldig_tot || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kortingscodes"] });
      setShowCodeDialog(false);
      setCodeForm({ code: "", korting_type: "percentage", korting_waarde: "", max_gebruik: "", geldig_tot: "" });
      toast.success("Kortingscode aangemaakt");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Delete link
  const deleteLink = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("affiliate_links").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliate-links"] });
      toast.success("Link verwijderd");
    },
  });

  // Delete code
  const deleteCode = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("kortingscodes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kortingscodes"] });
      toast.success("Code verwijderd");
    },
  });

  const activeReferrals = referrals.filter((r: any) => r.status === "actief");
  const totalCommission = referrals.reduce((sum: number, r: any) => sum + (r.commissie_verdiend || 0), 0);
  const totalClicks = links.reduce((sum: number, l: any) => sum + (l.clicks || 0), 0);

  const baseUrl = window.location.origin;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Gekopieerd naar klembord");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Affiliate Dashboard</h1>
        <p className="text-muted-foreground">Beheer je links, kortingscodes en volg je commissies</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{activeReferrals.length}</p>
                <p className="text-sm text-muted-foreground">Actieve klanten</p>
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
                <p className="text-sm text-muted-foreground">Totale commissie</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{totalClicks}</p>
                <p className="text-sm text-muted-foreground">Link kliks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Tag className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{codes.filter((c: any) => c.actief).length}</p>
                <p className="text-sm text-muted-foreground">Actieve codes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="links">
        <TabsList>
          <TabsTrigger value="links">Affiliate Links</TabsTrigger>
          <TabsTrigger value="codes">Kortingscodes</TabsTrigger>
          <TabsTrigger value="klanten">Aangebrachte Klanten</TabsTrigger>
        </TabsList>

        {/* Links Tab */}
        <TabsContent value="links" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Jouw affiliate links</h2>
            <Button onClick={() => setShowLinkDialog(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Nieuwe link
            </Button>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Kliks</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {links.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nog geen affiliate links aangemaakt</TableCell></TableRow>
                )}
                {links.map((link: any) => (
                  <TableRow key={link.id}>
                    <TableCell className="font-mono font-medium">{link.code}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                      {baseUrl}/signup?ref={link.code}
                    </TableCell>
                    <TableCell>{link.clicks}</TableCell>
                    <TableCell>
                      <Badge variant={link.actief ? "default" : "secondary"}>
                        {link.actief ? "Actief" : "Inactief"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => copyToClipboard(`${baseUrl}/signup?ref=${link.code}`)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteLink.mutate(link.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Codes Tab */}
        <TabsContent value="codes" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Jouw kortingscodes</h2>
              <p className="text-sm text-muted-foreground">
                Max: {instellingen?.max_korting_percentage ?? 25}% of €{instellingen?.max_korting_vast_bedrag ?? 50}
              </p>
            </div>
            <Button onClick={() => setShowCodeDialog(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Nieuwe code
            </Button>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Korting</TableHead>
                  <TableHead>Gebruik</TableHead>
                  <TableHead>Geldig tot</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nog geen kortingscodes aangemaakt</TableCell></TableRow>
                )}
                {codes.map((code: any) => (
                  <TableRow key={code.id}>
                    <TableCell className="font-mono font-bold">{code.code}</TableCell>
                    <TableCell>
                      {code.korting_type === "percentage" ? `${code.korting_waarde}%` : `€${code.korting_waarde}`}
                    </TableCell>
                    <TableCell>{code.aantal_gebruikt}{code.max_gebruik ? `/${code.max_gebruik}` : ""}</TableCell>
                    <TableCell>{code.geldig_tot || "Onbeperkt"}</TableCell>
                    <TableCell>
                      <Badge variant={code.actief ? "default" : "secondary"}>
                        {code.actief ? "Actief" : "Inactief"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => copyToClipboard(code.code)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteCode.mutate(code.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Klanten Tab */}
        <TabsContent value="klanten" className="space-y-4">
          <h2 className="text-lg font-semibold">Aangebrachte klanten</h2>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bedrijf</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Commissie %</TableHead>
                  <TableHead>Verdiend</TableHead>
                  <TableHead>Aangemeld op</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nog geen klanten aangebracht</TableCell></TableRow>
                )}
                {referrals.map((ref: any) => (
                  <TableRow key={ref.id}>
                    <TableCell className="font-medium">{ref.partners?.naam || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={ref.status === "actief" ? "default" : "secondary"}>
                        {ref.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{ref.commissie_percentage}%</TableCell>
                    <TableCell className="font-medium text-green-600">€{(ref.commissie_verdiend || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(ref.created_at).toLocaleDateString("nl-NL")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Link Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nieuwe affiliate link</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Link code (slug)</Label>
              <Input
                placeholder="bijv. jan-solar"
                value={linkCode}
                onChange={(e) => setLinkCode(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                URL wordt: {baseUrl}/signup?ref={linkCode.toLowerCase().replace(/[^a-z0-9-]/g, "-") || "..."}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkDialog(false)}>Annuleren</Button>
            <Button onClick={() => createLink.mutate(linkCode)} disabled={!linkCode.trim()}>Aanmaken</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Code Dialog */}
      <Dialog open={showCodeDialog} onOpenChange={setShowCodeDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nieuwe kortingscode</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input
                placeholder="bijv. SOLAR20"
                value={codeForm.code}
                onChange={(e) => setCodeForm(f => ({ ...f, code: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Type korting</Label>
                <Select value={codeForm.korting_type} onValueChange={(v: any) => setCodeForm(f => ({ ...f, korting_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="vast_bedrag">Vast bedrag (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Waarde</Label>
                <Input
                  type="number"
                  placeholder={codeForm.korting_type === "percentage" ? "bijv. 15" : "bijv. 25"}
                  value={codeForm.korting_waarde}
                  onChange={(e) => setCodeForm(f => ({ ...f, korting_waarde: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Max gebruik (optioneel)</Label>
                <Input
                  type="number"
                  placeholder="Onbeperkt"
                  value={codeForm.max_gebruik}
                  onChange={(e) => setCodeForm(f => ({ ...f, max_gebruik: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Geldig tot (optioneel)</Label>
                <Input
                  type="date"
                  value={codeForm.geldig_tot}
                  onChange={(e) => setCodeForm(f => ({ ...f, geldig_tot: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCodeDialog(false)}>Annuleren</Button>
            <Button onClick={() => createCode.mutate()} disabled={!codeForm.code.trim() || !codeForm.korting_waarde}>Aanmaken</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Affiliates;
