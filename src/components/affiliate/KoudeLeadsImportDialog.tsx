import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, Download, Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Bron = Database["public"]["Enums"]["affiliate_lead_bron"];

interface ParsedRow {
  bedrijfsnaam: string;
  contactpersoon: string | null;
  email: string | null;
  telefoon: string | null;
  bron: Bron;
  trial_startdatum: string | null;
  warnings: string[];
}

const BRON_VALUES: Bron[] = ["platform_pool", "eigen_import", "referral_klik"];

const TEMPLATE = "bedrijfsnaam;contactpersoon;email;telefoon;bron;trial_startdatum\nVoorbeeld BV;Jan Jansen;jan@voorbeeld.nl;0612345678;platform_pool;2026-06-01\n";

function detectDelimiter(line: string): string {
  const counts = [";", ",", "\t"].map((d) => ({ d, n: line.split(d).length }));
  counts.sort((a, b) => b.n - a.n);
  return counts[0].n > 1 ? counts[0].d : ";";
}

function splitCsvLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (c === delim && !inQuotes) {
      out.push(cur); cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function normaliseHeader(h: string): string {
  return h.toLowerCase().replace(/['"]/g, "").replace(/[\s-]+/g, "_").trim();
}

function normaliseDate(input: string): string | null {
  if (!input) return null;
  const s = input.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (m) {
    const [, d, mo, y] = m;
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return null;
}

function parseCsv(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const delim = detectDelimiter(lines[0]);
  const headers = splitCsvLine(lines[0], delim).map(normaliseHeader);
  const idx = (key: string) => headers.indexOf(key);

  const iBedrijf = idx("bedrijfsnaam") >= 0 ? idx("bedrijfsnaam") : idx("bedrijf");
  const iNaam = idx("contactpersoon") >= 0 ? idx("contactpersoon") : idx("naam");
  const iEmail = idx("email") >= 0 ? idx("email") : idx("e_mail");
  const iTel = idx("telefoon") >= 0 ? idx("telefoon") : idx("phone");
  const iBron = idx("bron");
  const iTrial = idx("trial_startdatum") >= 0 ? idx("trial_startdatum") : idx("trial_start");

  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line, delim);
    const warnings: string[] = [];
    const bedrijfsnaam = (iBedrijf >= 0 ? cells[iBedrijf] : "") || "";
    if (!bedrijfsnaam) warnings.push("Bedrijfsnaam ontbreekt");

    let bron: Bron = "platform_pool";
    if (iBron >= 0 && cells[iBron]) {
      const v = cells[iBron].toLowerCase() as Bron;
      if (BRON_VALUES.includes(v)) bron = v;
      else warnings.push(`Onbekende bron '${cells[iBron]}', valt terug op platform_pool`);
    }

    let trial_startdatum: string | null = null;
    if (iTrial >= 0 && cells[iTrial]) {
      trial_startdatum = normaliseDate(cells[iTrial]);
      if (!trial_startdatum) warnings.push(`Ongeldige trial-startdatum '${cells[iTrial]}'`);
    }

    const email = iEmail >= 0 ? cells[iEmail] || null : null;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) warnings.push("Ongeldig e-mailadres");

    return {
      bedrijfsnaam,
      contactpersoon: (iNaam >= 0 ? cells[iNaam] : "") || null,
      email,
      telefoon: (iTel >= 0 ? cells[iTel] : "") || null,
      bron,
      trial_startdatum,
      warnings,
    };
  });
}

function downloadTemplate() {
  const blob = new Blob(["\uFEFF" + TEMPLATE], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "koude-leads-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function KoudeLeadsImportDialog({ open, onOpenChange }: Props) {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const reset = () => { setRows([]); setFileName(""); setSubmitting(false); };
  const close = () => { reset(); onOpenChange(false); };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Bestand is te groot (max 5MB)");
      return;
    }
    setFileName(file.name);
    try {
      const text = await file.text();
      const parsed = parseCsv(text);
      if (parsed.length === 0) {
        toast.error("Geen rijen gevonden");
        return;
      }
      setRows(parsed);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Onbekende fout";
      toast.error("Kon CSV niet lezen", { description: message });
    }
  };

  const validRows = rows.filter((r) => r.bedrijfsnaam);

  const handleImport = async () => {
    if (validRows.length === 0) {
      toast.error("Geen geldige rijen om te importeren");
      return;
    }
    setSubmitting(true);
    try {
      const payload = validRows.map((r) => ({
        bedrijfsnaam: r.bedrijfsnaam,
        contactpersoon: r.contactpersoon,
        email: r.email,
        telefoon: r.telefoon,
        bron: r.bron,
        notities: r.trial_startdatum ? `Trial start: ${r.trial_startdatum}` : null,
        status: "nieuw" as const,
      }));
      const { error } = await supabase.from("affiliate_leads").insert(payload);
      if (error) throw error;
      toast.success(`${payload.length} koude leads geïmporteerd`);
      queryClient.invalidateQueries({ queryKey: ["affiliate-leads-pool"] });
      queryClient.invalidateQueries({ queryKey: ["affiliate-leads"] });
      close();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Onbekende fout";
      toast.error("Import mislukt", { description: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) close(); else onOpenChange(v); }}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Koude leads importeren</DialogTitle>
          <DialogDescription>
            CSV met kolommen: bedrijfsnaam, contactpersoon, email, telefoon, bron, trial_startdatum.
            Bron mag zijn: platform_pool, eigen_import of referral_klik.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
              <Download className="h-4 w-4" /> Template downloaden
            </Button>
            <Label htmlFor="koude-leads-csv" className="ml-auto">
              <span className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-input bg-background hover:bg-accent text-sm cursor-pointer">
                <Upload className="h-4 w-4" /> CSV kiezen
              </span>
              <Input id="koude-leads-csv" type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
            </Label>
          </div>

          {fileName && (
            <p className="text-xs text-muted-foreground">Bestand: {fileName} — {rows.length} rijen, {validRows.length} geldig</p>
          )}

          {rows.length > 0 && (
            <div className="border rounded-xl overflow-x-auto max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bedrijfsnaam</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Telefoon</TableHead>
                    <TableHead>Bron</TableHead>
                    <TableHead>Trial start</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, i) => (
                    <TableRow key={i} className={r.warnings.length ? "bg-amber-50/40" : ""}>
                      <TableCell className="font-medium">{r.bedrijfsnaam || <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell>{r.contactpersoon || "—"}</TableCell>
                      <TableCell>{r.email || "—"}</TableCell>
                      <TableCell>{r.telefoon || "—"}</TableCell>
                      <TableCell><Badge variant="outline">{r.bron}</Badge></TableCell>
                      <TableCell>{r.trial_startdatum || "—"}</TableCell>
                      <TableCell>
                        {r.warnings.length === 0 ? (
                          <Badge variant="outline" className="text-emerald-700 border-emerald-300"><CheckCircle className="h-3 w-3 mr-1" /> OK</Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-800 border-amber-300" title={r.warnings.join(", ")}>
                            <AlertTriangle className="h-3 w-3 mr-1" /> {r.warnings.length}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={close} disabled={submitting}>Annuleren</Button>
          <Button onClick={handleImport} disabled={submitting || validRows.length === 0} className="gap-2">
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Importeren…</> : `${validRows.length} leads importeren`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}