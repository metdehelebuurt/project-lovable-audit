import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Pencil } from "lucide-react";

export default function KortingenAffiliates() {
  const [commissies, setCommissies] = useState<any[]>([]);
  const [kortingscodes, setKortingscodes] = useState<any[]>([]);
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState<any>(null);
  const [commissiePercentage, setCommissiePercentage] = useState(10);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      const [{ data: comm }, { data: codes }, { data: affUsers }] = await Promise.all([
        supabase.from("affiliate_commissies").select("*, partners(naam)").order("created_at", { ascending: false }),
        supabase.from("kortingscodes").select("*").order("created_at", { ascending: false }),
        supabase.from("users").select("id, voornaam, achternaam, email").eq("rol", "affiliate" as any),
      ]);
      if (comm) setCommissies(comm);
      if (codes) setKortingscodes(codes);
      if (affUsers) setAffiliates(affUsers);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const openEditAffiliate = (aff: any) => {
    setSelectedAffiliate(aff);
    setCommissiePercentage(10);
    setEditDialog(true);
  };

  const saveCommissie = async () => {
    toast.success(`Commissie voor ${selectedAffiliate?.voornaam} ingesteld op ${commissiePercentage}%`);
    setEditDialog(false);
  };

  if (loading) return <p className="text-sm text-muted-foreground">Laden...</p>;

  const statusKleuren: Record<string, string> = {
    gepland: "bg-blue-100 text-blue-800",
    uitbetaald: "bg-green-100 text-green-800",
    geannuleerd: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      {/* Affiliates overzicht */}
      <Card className="rounded-2xl">
        <CardHeader><CardTitle className="text-base">Affiliates</CardTitle></CardHeader>
        <CardContent>
          {affiliates.length === 0 ? (
            <p className="text-sm text-muted-foreground">Geen affiliates gevonden</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Naam</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {affiliates.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.voornaam} {a.achternaam}</TableCell>
                    <TableCell>{a.email}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => openEditAffiliate(a)}>
                        <Pencil className="h-3.5 w-3.5 mr-1" />Commissie
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Commissie overzicht */}
      <Card className="rounded-2xl">
        <CardHeader><CardTitle className="text-base">Commissies</CardTitle></CardHeader>
        <CardContent>
          {commissies.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nog geen commissies geregistreerd</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Bedrag</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Datum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissies.map(c => (
                  <TableRow key={c.id}>
                    <TableCell>{c.partners?.naam ?? "-"}</TableCell>
                    <TableCell className="capitalize">{c.type}</TableCell>
                    <TableCell className="font-medium">€{c.bedrag?.toFixed(2) ?? "0.00"}</TableCell>
                    <TableCell>
                      <Badge className={statusKleuren[c.status] ?? ""}>{c.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(c.created_at), "d MMM yyyy", { locale: nl })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Kortingscodes */}
      <Card className="rounded-2xl">
        <CardHeader><CardTitle className="text-base">Kortingscodes</CardTitle></CardHeader>
        <CardContent>
          {kortingscodes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Geen kortingscodes</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Waarde</TableHead>
                  <TableHead>Gebruikt</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kortingscodes.map(k => (
                  <TableRow key={k.id}>
                    <TableCell className="font-mono">{k.code}</TableCell>
                    <TableCell>{k.korting_type}</TableCell>
                    <TableCell>{k.korting_type === "percentage" ? `${k.korting_waarde}%` : `€${k.korting_waarde}`}</TableCell>
                    <TableCell>{k.aantal_gebruikt}{k.max_gebruik ? `/${k.max_gebruik}` : ""}</TableCell>
                    <TableCell>
                      <Badge className={k.actief ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {k.actief ? "Actief" : "Inactief"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Commissie instellen</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm">Affiliate: <strong>{selectedAffiliate?.voornaam} {selectedAffiliate?.achternaam}</strong></p>
            <div><Label>Commissie percentage (%)</Label><Input type="number" value={commissiePercentage} onChange={e => setCommissiePercentage(+e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>Annuleren</Button>
            <Button onClick={saveCommissie}>Opslaan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
