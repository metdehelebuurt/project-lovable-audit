import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { fetchRapportenOverzicht, type OpleverrapportOverzicht } from "@/components/oplever/api/opleverApi";
import OpleverStatusBadge from "@/components/oplever/StatusBadge";
import { Plus, FileText, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { fetchOpleverPdfVersies } from "@/components/oplever/api/opleverPdfVersies";

export default function Opleveringen() {
  const { profile } = useAuth();
  const nav = useNavigate();
  const [rows, setRows] = useState<OpleverrapportOverzicht[]>([]);
  const [zoek, setZoek] = useState("");
  const [busy, setBusy] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.partner_id) return;
    fetchRapportenOverzicht(profile.partner_id)
      .then(setRows)
      .catch((e) => toast({ title: "Laden mislukt", description: e.message, variant: "destructive" }))
      .finally(() => setBusy(false));
  }, [profile?.partner_id]);

  const filtered = useMemo(() => {
    const q = zoek.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      r.rapportnummer.toLowerCase().includes(q) ||
      r.scope_omschrijving?.toLowerCase().includes(q) ||
      r.klant_naam?.toLowerCase().includes(q) ||
      r.opdracht_nummer?.toLowerCase().includes(q)
    );
  }, [rows, zoek]);

  const handleDownload = async (r: OpleverrapportOverzicht) => {
    try {
      setDownloadingId(r.id);
      let pdfPath = r.pdf_url;
      if (!pdfPath) {
        const versies = await fetchOpleverPdfVersies(r.id);
        pdfPath = versies[0]?.pdf_path ?? null;
      }
      if (!pdfPath) {
        toast({
          title: "Nog geen PDF beschikbaar",
          description: "Open het rapport en klik op 'PDF downloaden' om een versie te genereren.",
        });
        nav(`/opleveringen/${r.id}`);
        return;
      }
      const { data, error } = await supabase.storage
        .from("oplever-media")
        .createSignedUrl(pdfPath, 300, { download: `${r.rapportnummer ?? "opleverrapport"}.pdf` });
      if (error || !data?.signedUrl) throw new Error(error?.message ?? "Geen download-link");
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Download mislukt";
      toast({ title: "Download mislukt", description: msg, variant: "destructive" });
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Opleveringen</h1>
          <p className="text-sm text-muted-foreground">NEN 1010 opleverrapporten</p>
        </div>
        <Button onClick={() => nav("/opleveringen/nieuw")}>
          <Plus className="h-4 w-4 mr-2" /> Nieuw rapport
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rapporten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Zoek op nummer of omvang…" value={zoek} onChange={(e) => setZoek(e.target.value)} />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rapportnummer</TableHead>
                <TableHead>Verkooporder</TableHead>
                <TableHead>Klant</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Opleverdatum</TableHead>
                <TableHead>Omvang</TableHead>
                <TableHead className="text-right">Actie</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {busy ? (
                <TableRow><TableCell colSpan={7}>Laden…</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Geen rapporten gevonden</TableCell></TableRow>
              ) : filtered.map((r) => (
                <TableRow key={r.id} className="hover:bg-muted/40">
                  <TableCell className="font-mono text-sm">{r.rapportnummer}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{r.opdracht_nummer ?? "—"}</TableCell>
                  <TableCell className="max-w-[220px] truncate">{r.klant_naam ?? "—"}</TableCell>
                  <TableCell><OpleverStatusBadge status={r.status} /></TableCell>
                  <TableCell>{r.opleverdatum ?? "—"}</TableCell>
                  <TableCell className="max-w-xs truncate">{r.scope_omschrijving ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(r)}
                        disabled={downloadingId === r.id}
                        title={r.pdf_url ? "PDF downloaden" : "Genereer eerst een PDF in het rapport"}
                      >
                        <Download className="h-3.5 w-3.5 mr-1" />
                        {downloadingId === r.id ? "Bezig…" : "PDF"}
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/opleveringen/${r.id}`}>
                          <FileText className="h-3.5 w-3.5 mr-1" /> Openen
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
