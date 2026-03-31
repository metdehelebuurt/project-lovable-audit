import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Plus, Download, CheckCircle } from "lucide-react";

interface Factuur {
  id: string;
  factuurnummer: string;
  partner_id: string;
  bedrag_excl_btw: number;
  btw_bedrag: number;
  totaal_bedrag: number;
  korting_bedrag: number;
  periode_start: string;
  periode_eind: string;
  status: string;
  betaald_op: string | null;
  betaald_via: string | null;
  pdf_url: string | null;
  notities: string | null;
  created_at: string;
  partners?: { naam: string } | null;
}

const statusKleuren: Record<string, string> = {
  concept: "bg-muted text-foreground",
  verstuurd: "bg-blue-100 text-blue-800",
  betaald: "bg-green-100 text-green-800",
  vervallen: "bg-red-100 text-red-800",
};

export default function FactuurBeheer() {
  const [facturen, setFacturen] = useState<Factuur[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("alle");
  const [payDialog, setPayDialog] = useState(false);
  const [selected, setSelected] = useState<Factuur | null>(null);
  const [payForm, setPayForm] = useState({ betaald_via: "bankoverschrijving", notities: "" });
  const [saving, setSaving] = useState(false);
  const [newDialog, setNewDialog] = useState(false);
  const [partners, setPartners] = useState<{ id: string; naam: string }[]>([]);
  const [newForm, setNewForm] = useState({
    partner_id: "", bedrag_excl_btw: 0, btw_bedrag: 0, korting_bedrag: 0,
    periode_start: "", periode_eind: "", notities: "",
  });

  const fetchFacturen = async () => {
    const { data } = await supabase.from("facturen").select("*, partners(naam)").order("created_at", { ascending: false });
    if (data) setFacturen(data as any);
    setLoading(false);
  };

  const fetchPartners = async () => {
    const { data } = await supabase.from("partners").select("id, naam").order("naam");
    if (data) setPartners(data);
  };

  useEffect(() => { fetchFacturen(); fetchPartners(); }, []);

  const filtered = facturen.filter(f => filter === "alle" || f.status === filter);

  const markBetaald = async () => {
    if (!selected) return;
    setSaving(true);
    const { error } = await supabase.from("facturen").update({
      status: "betaald",
      betaald_op: new Date().toISOString(),
      betaald_via: payForm.betaald_via,
      notities: payForm.notities || selected.notities,
    } as any).eq("id", selected.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Betaling geregistreerd");
    setPayDialog(false);
    fetchFacturen();
  };

  const generateFactuurnummer = () => {
    const now = new Date();
    return `F${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`;
  };

  const createFactuur = async () => {
    if (!newForm.partner_id || !newForm.periode_start || !newForm.periode_eind) {
      toast.error("Vul alle verplichte velden in"); return;
    }
    setSaving(true);
    const totaal = newForm.bedrag_excl_btw + newForm.btw_bedrag - newForm.korting_bedrag;
    const { error } = await supabase.from("facturen").insert({
      partner_id: newForm.partner_id,
      factuurnummer: generateFactuurnummer(),
      bedrag_excl_btw: newForm.bedrag_excl_btw,
      btw_bedrag: newForm.btw_bedrag,
      totaal_bedrag: totaal,
      korting_bedrag: newForm.korting_bedrag,
      periode_start: newForm.periode_start,
      periode_eind: newForm.periode_eind,
      status: "concept",
      notities: newForm.notities || null,
    } as any);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Factuur aangemaakt");
    setNewDialog(false);
    setNewForm({ partner_id: "", bedrag_excl_btw: 0, btw_bedrag: 0, korting_bedrag: 0, periode_start: "", periode_eind: "", notities: "" });
    fetchFacturen();
  };

  if (loading) return <p className="text-sm text-muted-foreground">Laden...</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle statussen</SelectItem>
            <SelectItem value="concept">Concept</SelectItem>
            <SelectItem value="verstuurd">Verstuurd</SelectItem>
            <SelectItem value="betaald">Betaald</SelectItem>
            <SelectItem value="vervallen">Vervallen</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" onClick={() => setNewDialog(true)}><Plus className="h-4 w-4 mr-1" />Factuur aanmaken</Button>
      </div>

      <Card className="rounded-2xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nr.</TableHead>
              <TableHead>Partner</TableHead>
              <TableHead>Periode</TableHead>
              <TableHead>Bedrag</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Betaald op</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(f => (
              <TableRow key={f.id}>
                <TableCell className="font-mono text-sm">{f.factuurnummer}</TableCell>
                <TableCell>{(f.partners as any)?.naam ?? "-"}</TableCell>
                <TableCell className="text-sm">
                  {format(new Date(f.periode_start), "d MMM", { locale: nl })} — {format(new Date(f.periode_eind), "d MMM yyyy", { locale: nl })}
                </TableCell>
                <TableCell className="font-medium">€{f.totaal_bedrag.toFixed(2)}</TableCell>
                <TableCell><Badge className={statusKleuren[f.status] ?? ""}>{f.status}</Badge></TableCell>
                <TableCell className="text-sm">{f.betaald_op ? format(new Date(f.betaald_op), "d MMM yyyy", { locale: nl }) : "-"}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {f.status !== "betaald" && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" onClick={() => { setSelected(f); setPayDialog(true); }}>
                        <CheckCircle className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Geen facturen gevonden</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pay dialog */}
      <Dialog open={payDialog} onOpenChange={setPayDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Betaling registreren</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm">Factuur: <strong>{selected?.factuurnummer}</strong> — €{selected?.totaal_bedrag.toFixed(2)}</p>
            <div><Label>Betaald via</Label>
              <Select value={payForm.betaald_via} onValueChange={v => setPayForm(p => ({ ...p, betaald_via: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bankoverschrijving">Bankoverschrijving</SelectItem>
                  <SelectItem value="ideal">iDEAL</SelectItem>
                  <SelectItem value="creditcard">Creditcard</SelectItem>
                  <SelectItem value="contant">Contant</SelectItem>
                  <SelectItem value="overig">Overig</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Notities</Label><Textarea value={payForm.notities} onChange={e => setPayForm(p => ({ ...p, notities: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialog(false)}>Annuleren</Button>
            <Button onClick={markBetaald} disabled={saving}>{saving ? "Verwerken..." : "Betaling registreren"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New invoice dialog */}
      <Dialog open={newDialog} onOpenChange={setNewDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nieuwe factuur</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Partner</Label>
              <Select value={newForm.partner_id} onValueChange={v => setNewForm(p => ({ ...p, partner_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecteer partner" /></SelectTrigger>
                <SelectContent>
                  {partners.map(p => <SelectItem key={p.id} value={p.id}>{p.naam}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Periode start</Label><Input type="date" value={newForm.periode_start} onChange={e => setNewForm(p => ({ ...p, periode_start: e.target.value }))} /></div>
              <div><Label>Periode eind</Label><Input type="date" value={newForm.periode_eind} onChange={e => setNewForm(p => ({ ...p, periode_eind: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Excl. BTW (€)</Label><Input type="number" value={newForm.bedrag_excl_btw} onChange={e => setNewForm(p => ({ ...p, bedrag_excl_btw: +e.target.value }))} /></div>
              <div><Label>BTW (€)</Label><Input type="number" value={newForm.btw_bedrag} onChange={e => setNewForm(p => ({ ...p, btw_bedrag: +e.target.value }))} /></div>
              <div><Label>Korting (€)</Label><Input type="number" value={newForm.korting_bedrag} onChange={e => setNewForm(p => ({ ...p, korting_bedrag: +e.target.value }))} /></div>
            </div>
            <div><Label>Notities</Label><Textarea value={newForm.notities} onChange={e => setNewForm(p => ({ ...p, notities: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewDialog(false)}>Annuleren</Button>
            <Button onClick={createFactuur} disabled={saving}>{saving ? "Aanmaken..." : "Factuur aanmaken"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
