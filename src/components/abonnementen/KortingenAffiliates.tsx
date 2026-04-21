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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Pencil, Plus } from "lucide-react";

interface Affiliate { id: string; voornaam: string | null; achternaam: string | null; email: string }
interface Commissie { id: string; type: string; bedrag: number; status: string; created_at: string; partners?: { naam: string } | null }
interface Kortingscode {
  id: string; code: string; korting_type: string; korting_waarde: number;
  max_gebruik: number | null; aantal_gebruikt: number; geldig_tot: string | null; actief: boolean;
}

const statusKleuren: Record<string, string> = {
  gepland: "bg-blue-100 text-blue-800",
  uitbetaald: "bg-green-100 text-green-800",
  geannuleerd: "bg-red-100 text-red-800",
};

export default function KortingenAffiliates() {
  const [commissies, setCommissies] = useState<Commissie[]>([]);
  const [kortingscodes, setKortingscodes] = useState<Kortingscode[]>([]);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);

  const [editDialog, setEditDialog] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
  const [commissiePercentage, setCommissiePercentage] = useState(10);
  const [saving, setSaving] = useState(false);

  const [codeDialog, setCodeDialog] = useState(false);
  const [codeForm, setCodeForm] = useState({
    code: "", korting_type: "percentage", korting_waarde: 10,
    max_gebruik: "" as string, geldig_tot: "" as string, actief: true,
  });

  const fetchAll = async () => {
    const [{ data: comm }, { data: codes }, { data: affUsers }] = await Promise.all([
      supabase.from("affiliate_commissies").select("*, partners(naam)").order("created_at", { ascending: false }),
      supabase.from("kortingscodes").select("*").order("created_at", { ascending: false }),
      supabase.from("users").select("id, voornaam, achternaam, email").eq("rol", "affiliate"),
    ]);
    if (comm) setCommissies(comm as Commissie[]);
    if (codes) setKortingscodes(codes as Kortingscode[]);
    if (affUsers) setAffiliates(affUsers as Affiliate[]);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const openEditAffiliate = async (aff: Affiliate) => {
    setSelectedAffiliate(aff);
    // Haal huidige percentage op uit affiliate_referrals (eerste record als indicatie)
    const { data } = await supabase
      .from("affiliate_referrals")
      .select("commissie_percentage")
      .eq("affiliate_id", aff.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setCommissiePercentage(data?.commissie_percentage ?? 10);
    setEditDialog(true);
  };

  const saveCommissie = async () => {
    if (!selectedAffiliate) return;
    setSaving(true);
    const { error } = await supabase
      .from("affiliate_referrals")
      .update({ commissie_percentage: commissiePercentage })
      .eq("affiliate_id", selectedAffiliate.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Commissie bijgewerkt naar ${commissiePercentage}%`);
    setEditDialog(false);
  };

  const saveCode = async () => {
    if (!codeForm.code.trim()) { toast.error("Code is verplicht"); return; }
    setSaving(true);
    const { error } = await supabase.from("kortingscodes").insert({
      code: codeForm.code.toUpperCase().trim(),
      korting_type: codeForm.korting_type,
      korting_waarde: codeForm.korting_waarde,
      max_gebruik: codeForm.max_gebruik ? +codeForm.max_gebruik : null,
      geldig_tot: codeForm.geldig_tot || null,
      actief: codeForm.actief,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Kortingscode aangemaakt");
    setCodeDialog(false);
    setCodeForm({ code: "", korting_type: "percentage", korting_waarde: 10, max_gebruik: "", geldig_tot: "", actief: true });
    fetchAll();
  };

  const toggleCode = async (k: Kortingscode) => {
    const { error } = await supabase.from("kortingscodes").update({ actief: !k.actief }).eq("id", k.id);
    if (error) { toast.error(error.message); return; }
    toast.success(k.actief ? "Code gedeactiveerd" : "Code geactiveerd");
    fetchAll();
  };

  if (loading) return <p className="text-sm text-muted-foreground">Laden...</p>;

  return (
    <div className="space-y-6">
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
                {affiliates.map((a) => (
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
                {commissies.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.partners?.naam ?? "-"}</TableCell>
                    <TableCell className="capitalize">{c.type}</TableCell>
                    <TableCell className="font-medium">€{c.bedrag?.toFixed(2) ?? "0.00"}</TableCell>
                    <TableCell><Badge className={statusKleuren[c.status] ?? ""}>{c.status}</Badge></TableCell>
                    <TableCell className="text-sm">{format(new Date(c.created_at), "d MMM yyyy", { locale: nl })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Kortingscodes</CardTitle>
            <Button size="sm" onClick={() => setCodeDialog(true)}>
              <Plus className="h-4 w-4 mr-1" />Nieuwe code
            </Button>
          </div>
        </CardHeader>
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
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kortingscodes.map((k) => (
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
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => toggleCode(k)}>
                        {k.actief ? "Deactiveren" : "Activeren"}
                      </Button>
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
            <div>
              <Label>Commissie percentage (%)</Label>
              <Input type="number" value={commissiePercentage} onChange={(e) => setCommissiePercentage(+e.target.value)} />
              <p className="text-xs text-muted-foreground mt-1">
                Wijzigt het percentage op alle bestaande referrals van deze affiliate.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>Annuleren</Button>
            <Button onClick={saveCommissie} disabled={saving}>{saving ? "Opslaan..." : "Opslaan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={codeDialog} onOpenChange={setCodeDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nieuwe kortingscode</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Code</Label>
              <Input
                value={codeForm.code}
                onChange={(e) => setCodeForm((p) => ({ ...p, code: e.target.value }))}
                placeholder="WELKOM2026"
                className="uppercase font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={codeForm.korting_type} onValueChange={(v) => setCodeForm((p) => ({ ...p, korting_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="vast_bedrag">Vast bedrag</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Waarde {codeForm.korting_type === "percentage" ? "(%)" : "(€)"}</Label>
                <Input type="number" value={codeForm.korting_waarde} onChange={(e) => setCodeForm((p) => ({ ...p, korting_waarde: +e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Max gebruik</Label>
                <Input type="number" placeholder="∞" value={codeForm.max_gebruik} onChange={(e) => setCodeForm((p) => ({ ...p, max_gebruik: e.target.value }))} />
              </div>
              <div>
                <Label>Geldig tot</Label>
                <Input type="date" value={codeForm.geldig_tot} onChange={(e) => setCodeForm((p) => ({ ...p, geldig_tot: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={codeForm.actief} onCheckedChange={(v) => setCodeForm((p) => ({ ...p, actief: v }))} />
              <Label>Direct actief</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCodeDialog(false)}>Annuleren</Button>
            <Button onClick={saveCode} disabled={saving}>{saving ? "Aanmaken..." : "Code aanmaken"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
