import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { nl } from "date-fns/locale";
import { Plus, CheckCircle, Wand2, Link2, Trash2, ExternalLink } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Factuur {
  id: string; factuurnummer: string; partner_id: string;
  bedrag_excl_btw: number; btw_bedrag: number; totaal_bedrag: number; korting_bedrag: number;
  periode_start: string; periode_eind: string; status: string;
  betaald_op: string | null; betaald_via: string | null; pdf_url: string | null;
  notities: string | null; created_at: string; partners?: { naam: string } | null;
  mollie_payment_id?: string | null;
  mollie_payment_status?: string | null;
  mollie_checkout_url?: string | null;
}

const statusKleuren: Record<string, string> = {
  concept: "bg-muted text-foreground",
  verstuurd: "bg-blue-100 text-blue-800",
  betaald: "bg-green-100 text-green-800",
  vervallen: "bg-red-100 text-red-800",
};

async function nextFactuurnummer(): Promise<string> {
  const { data, error } = await supabase.rpc("generate_abonnement_factuurnummer");
  if (error || !data) {
    // Fallback: jaar + tijdstempel
    return `AB-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
  }
  return data as string;
}

export default function FactuurBeheer() {
  const [facturen, setFacturen] = useState<Factuur[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("alle");
  const [payDialog, setPayDialog] = useState(false);
  const [selected, setSelected] = useState<Factuur | null>(null);
  const [payForm, setPayForm] = useState({ betaald_via: "bankoverschrijving", notities: "" });
  const [saving, setSaving] = useState(false);
  const [newDialog, setNewDialog] = useState(false);
  const [bulkDialog, setBulkDialog] = useState(false);
  const [partners, setPartners] = useState<{ id: string; naam: string }[]>([]);
  const [btwPercentage, setBtwPercentage] = useState(21);
  const [newForm, setNewForm] = useState({
    partner_id: "", bedrag_excl_btw: 0, korting_bedrag: 0,
    periode_start: "", periode_eind: "", notities: "",
  });

  const vorigeMaand = subMonths(new Date(), 1);
  const [bulkForm, setBulkForm] = useState({
    periode_start: format(startOfMonth(vorigeMaand), "yyyy-MM-dd"),
    periode_eind: format(endOfMonth(vorigeMaand), "yyyy-MM-dd"),
  });

  const fetchFacturen = async () => {
    const { data } = await supabase.from("facturen").select("*, partners(naam)").order("created_at", { ascending: false });
    if (data) setFacturen(data as Factuur[]);
    setLoading(false);
  };

  const fetchPartners = async () => {
    const { data } = await supabase.from("partners").select("id, naam").order("naam");
    if (data) setPartners(data);
  };

  useEffect(() => { fetchFacturen(); fetchPartners(); }, []);

  const filtered = facturen.filter((f) => filter === "alle" || f.status === filter);

  const markBetaald = async () => {
    if (!selected) return;
    setSaving(true);
    const { error } = await supabase.from("facturen").update({
      status: "betaald",
      betaald_op: new Date().toISOString(),
      betaald_via: payForm.betaald_via,
      notities: payForm.notities || selected.notities,
    }).eq("id", selected.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Betaling geregistreerd");
    setPayDialog(false);
    fetchFacturen();
  };

  const createFactuur = async () => {
    if (!newForm.partner_id || !newForm.periode_start || !newForm.periode_eind) {
      toast.error("Vul alle verplichte velden in"); return;
    }
    setSaving(true);
    const btw = +(newForm.bedrag_excl_btw * (btwPercentage / 100)).toFixed(2);
    const totaal = +(newForm.bedrag_excl_btw + btw - newForm.korting_bedrag).toFixed(2);
    const factuurnummer = await nextFactuurnummer();
    const { error } = await supabase.from("facturen").insert({
      partner_id: newForm.partner_id,
      factuurnummer,
      bedrag_excl_btw: newForm.bedrag_excl_btw,
      btw_bedrag: btw,
      totaal_bedrag: totaal,
      korting_bedrag: newForm.korting_bedrag,
      periode_start: newForm.periode_start,
      periode_eind: newForm.periode_eind,
      status: "concept",
      notities: newForm.notities || null,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Factuur ${factuurnummer} aangemaakt`);
    setNewDialog(false);
    setNewForm({ partner_id: "", bedrag_excl_btw: 0, korting_bedrag: 0, periode_start: "", periode_eind: "", notities: "" });
    fetchFacturen();
  };

  const generateMaandfacturen = async () => {
    setSaving(true);
    const { data: actieveAbos } = await supabase
      .from("abonnementen")
      .select("id, partner_id, maand_bedrag, korting_vast_bedrag, korting_percentage")
      .eq("status", "actief");

    if (!actieveAbos || actieveAbos.length === 0) {
      setSaving(false);
      toast.error("Geen actieve abonnementen gevonden");
      return;
    }

    // Haal add-ons per partner
    const { data: addons } = await supabase
      .from("abonnement_addon_aankopen")
      .select("partner_id, maand_bedrag")
      .eq("status", "actief");

    const addonPerPartner = new Map<string, number>();
    (addons ?? []).forEach((a) => {
      addonPerPartner.set(a.partner_id, (addonPerPartner.get(a.partner_id) ?? 0) + (a.maand_bedrag || 0));
    });

    let aangemaakt = 0;
    let mislukt = 0;
    for (const abo of actieveAbos) {
      const basisBedrag = (abo.maand_bedrag || 0) + (addonPerPartner.get(abo.partner_id) ?? 0);
      const kortingPct = ((abo.korting_percentage as number | null) ?? 0);
      const kortingVast = ((abo.korting_vast_bedrag as number | null) ?? 0);
      const korting = +(basisBedrag * (kortingPct / 100) + kortingVast).toFixed(2);
      const exclBtw = +(basisBedrag - korting).toFixed(2);
      const btw = +(exclBtw * (btwPercentage / 100)).toFixed(2);
      const totaal = +(exclBtw + btw).toFixed(2);
      const factuurnummer = await nextFactuurnummer();

      const { error } = await supabase.from("facturen").insert({
        partner_id: abo.partner_id,
        abonnement_id: abo.id,
        factuurnummer,
        bedrag_excl_btw: exclBtw,
        btw_bedrag: btw,
        totaal_bedrag: totaal,
        korting_bedrag: korting,
        periode_start: bulkForm.periode_start,
        periode_eind: bulkForm.periode_eind,
        status: "concept",
      });
      if (error) mislukt++; else aangemaakt++;
    }

    setSaving(false);
    setBulkDialog(false);
    if (aangemaakt > 0) toast.success(`${aangemaakt} factuur/facturen aangemaakt${mislukt > 0 ? ` (${mislukt} mislukt)` : ""}`);
    else toast.error("Geen facturen aangemaakt");
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
        <div className="flex gap-2 items-center">
          <Label className="text-sm">BTW %</Label>
          <Input
            type="number"
            value={btwPercentage}
            onChange={(e) => setBtwPercentage(+e.target.value)}
            className="w-20"
          />
          <Button size="sm" variant="outline" onClick={() => setBulkDialog(true)}>
            <Wand2 className="h-4 w-4 mr-1" />Genereer maandfacturen
          </Button>
          <Button size="sm" onClick={() => setNewDialog(true)}>
            <Plus className="h-4 w-4 mr-1" />Factuur aanmaken
          </Button>
        </div>
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
            {filtered.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-mono text-sm">{f.factuurnummer}</TableCell>
                <TableCell>{f.partners?.naam ?? "-"}</TableCell>
                <TableCell className="text-sm">
                  {format(new Date(f.periode_start), "d MMM", { locale: nl })} — {format(new Date(f.periode_eind), "d MMM yyyy", { locale: nl })}
                </TableCell>
                <TableCell className="font-medium">€{f.totaal_bedrag.toFixed(2)}</TableCell>
                <TableCell><Badge className={statusKleuren[f.status] ?? ""}>{f.status}</Badge></TableCell>
                <TableCell className="text-sm">{f.betaald_op ? format(new Date(f.betaald_op), "d MMM yyyy", { locale: nl }) : "-"}</TableCell>
                <TableCell>
                  {f.status !== "betaald" && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" onClick={() => { setSelected(f); setPayDialog(true); }}>
                      <CheckCircle className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Geen facturen gevonden</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={payDialog} onOpenChange={setPayDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Betaling registreren</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm">Factuur: <strong>{selected?.factuurnummer}</strong> — €{selected?.totaal_bedrag.toFixed(2)}</p>
            <div>
              <Label>Betaald via</Label>
              <Select value={payForm.betaald_via} onValueChange={(v) => setPayForm((p) => ({ ...p, betaald_via: v }))}>
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
            <div><Label>Notities</Label><Textarea value={payForm.notities} onChange={(e) => setPayForm((p) => ({ ...p, notities: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialog(false)}>Annuleren</Button>
            <Button onClick={markBetaald} disabled={saving}>{saving ? "Verwerken..." : "Betaling registreren"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={newDialog} onOpenChange={setNewDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nieuwe factuur</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Partner</Label>
              <Select value={newForm.partner_id} onValueChange={(v) => setNewForm((p) => ({ ...p, partner_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecteer partner" /></SelectTrigger>
                <SelectContent>
                  {partners.map((p) => <SelectItem key={p.id} value={p.id}>{p.naam}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Periode start</Label><Input type="date" value={newForm.periode_start} onChange={(e) => setNewForm((p) => ({ ...p, periode_start: e.target.value }))} /></div>
              <div><Label>Periode eind</Label><Input type="date" value={newForm.periode_eind} onChange={(e) => setNewForm((p) => ({ ...p, periode_eind: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Excl. BTW (€)</Label><Input type="number" value={newForm.bedrag_excl_btw} onChange={(e) => setNewForm((p) => ({ ...p, bedrag_excl_btw: +e.target.value }))} /></div>
              <div><Label>Korting (€)</Label><Input type="number" value={newForm.korting_bedrag} onChange={(e) => setNewForm((p) => ({ ...p, korting_bedrag: +e.target.value }))} /></div>
            </div>
            <p className="text-xs text-muted-foreground">
              BTW {btwPercentage}% wordt automatisch berekend ({(newForm.bedrag_excl_btw * (btwPercentage / 100)).toFixed(2)} €).
              Totaal: €{(newForm.bedrag_excl_btw + (newForm.bedrag_excl_btw * (btwPercentage / 100)) - newForm.korting_bedrag).toFixed(2)}
            </p>
            <div><Label>Notities</Label><Textarea value={newForm.notities} onChange={(e) => setNewForm((p) => ({ ...p, notities: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewDialog(false)}>Annuleren</Button>
            <Button onClick={createFactuur} disabled={saving}>{saving ? "Aanmaken..." : "Factuur aanmaken"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkDialog} onOpenChange={setBulkDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Maandfacturen genereren</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Maakt voor elk actief abonnement een concept-factuur op basis van het maandbedrag, actieve add-ons en eventuele korting.
              BTW: {btwPercentage}%.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Periode start</Label><Input type="date" value={bulkForm.periode_start} onChange={(e) => setBulkForm((p) => ({ ...p, periode_start: e.target.value }))} /></div>
              <div><Label>Periode eind</Label><Input type="date" value={bulkForm.periode_eind} onChange={(e) => setBulkForm((p) => ({ ...p, periode_eind: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialog(false)}>Annuleren</Button>
            <Button onClick={generateMaandfacturen} disabled={saving}>{saving ? "Bezig..." : "Genereer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
