import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, Download, Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { useEffect } from "react";
import type { Database } from "@/integrations/supabase/types";

type Bron = Database["public"]["Enums"]["affiliate_lead_bron"];
type TargetField = "bedrijfsnaam" | "contactpersoon" | "email" | "telefoon" | "bron" | "trial_startdatum";

const TARGET_FIELDS: { key: TargetField; label: string; required?: boolean }[] = [
  { key: "bedrijfsnaam", label: "Bedrijfsnaam", required: true },
  { key: "contactpersoon", label: "Contactpersoon" },
  { key: "email", label: "E-mail" },
  { key: "telefoon", label: "Telefoon" },
  { key: "bron", label: "Bron" },
  { key: "trial_startdatum", label: "Trial startdatum" },
];

const SYNONYMS: Record<TargetField, string[]> = {
  bedrijfsnaam: ["bedrijfsnaam", "bedrijf", "company", "organisatie", "naam_bedrijf"],
  contactpersoon: ["contactpersoon", "contact", "naam", "name", "fullname", "persoon"],
  email: ["email", "e_mail", "e-mail", "mail", "emailadres"],
  telefoon: ["telefoon", "telefoonnummer", "phone", "mobiel", "gsm", "tel"],
  bron: ["bron", "source", "herkomst"],
  trial_startdatum: ["trial_startdatum", "trial_start", "trial", "startdatum", "trialdatum", "start_datum"],
};

interface ParsedRow {
  bedrijfsnaam: string;
  contactpersoon: string | null;
  email: string | null;
  telefoon: string | null;
  bron: Bron;
  trial_startdatum: string | null;
  warnings: string[];
  duplicaat?: boolean;
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

interface CsvData {
  headers: string[];
  rawHeaders: string[];
  rows: string[][];
}

function parseCsv(text: string): CsvData {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rawHeaders: [], rows: [] };
  const delim = detectDelimiter(lines[0]);
  const rawHeaders = splitCsvLine(lines[0], delim);
  const headers = rawHeaders.map(normaliseHeader);
  const rows = lines.slice(1).map((line) => splitCsvLine(line, delim));
  return { headers, rawHeaders, rows };
}

function autoMap(headers: string[]): Record<TargetField, number> {
  const mapping = {} as Record<TargetField, number>;
  for (const { key } of TARGET_FIELDS) {
    const idx = headers.findIndex((h) => SYNONYMS[key].includes(h));
    mapping[key] = idx;
  }
  return mapping;
}

function applyMapping(csv: CsvData, mapping: Record<TargetField, number>): ParsedRow[] {
  return csv.rows.map((cells) => {
    const cell = (key: TargetField) => {
      const i = mapping[key];
      return i >= 0 ? (cells[i] ?? "").trim() : "";
    };
    const warnings: string[] = [];
    const bedrijfsnaam = cell("bedrijfsnaam");
    if (!bedrijfsnaam) warnings.push("Bedrijfsnaam ontbreekt");

    let bron: Bron = "platform_pool";
    const bronRaw = cell("bron");
    if (bronRaw) {
      const v = bronRaw.toLowerCase() as Bron;
      if (BRON_VALUES.includes(v)) bron = v;
      else warnings.push(`Onbekende bron '${bronRaw}', valt terug op platform_pool`);
    }

    let trial_startdatum: string | null = null;
    const trialRaw = cell("trial_startdatum");
    if (trialRaw) {
      trial_startdatum = normaliseDate(trialRaw);
      if (!trial_startdatum) warnings.push(`Ongeldige trial-startdatum '${trialRaw}'`);
    }

    const email = cell("email") || null;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) warnings.push("Ongeldig e-mailadres");

    return {
      bedrijfsnaam,
      contactpersoon: cell("contactpersoon") || null,
      email,
      telefoon: cell("telefoon") || null,
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
  const [step, setStep] = useState<"upload" | "map" | "preview">("upload");
  const [csv, setCsv] = useState<CsvData | null>(null);
  const [mapping, setMapping] = useState<Record<TargetField, number>>({} as Record<TargetField, number>);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const reset = () => {
    setStep("upload"); setCsv(null); setMapping({} as Record<TargetField, number>);
    setRows([]); setFileName(""); setSubmitting(false);
  };
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
      if (parsed.rows.length === 0) {
        toast.error("Geen rijen gevonden");
        return;
      }
      setCsv(parsed);
      setMapping(autoMap(parsed.headers));
      setStep("map");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Onbekende fout";
      toast.error("Kon CSV niet lezen", { description: message });
    }
  };

  const goPreview = () => {
    if (!csv) return;
    if (mapping.bedrijfsnaam === undefined || mapping.bedrijfsnaam < 0) {
      toast.error("Koppel een kolom aan 'Bedrijfsnaam' om door te gaan");
      return;
    }
    setRows(applyMapping(csv, mapping));
    setStep("preview");
  };

  const validRows = rows.filter((r) => r.bedrijfsnaam);
  const rejectedCount = rows.length - validRows.length;
  const duplicaten = rows.filter((r) => r.duplicaat).length;

  // Duplicate-check tegen bestaande affiliate_leads op email/telefoon
  useEffect(() => {
    if (step !== "preview" || rows.length === 0) return;
    let active = true;
    (async () => {
      const emails = rows.map((r) => r.email?.toLowerCase()).filter(Boolean) as string[];
      const telefoons = rows.map((r) => r.telefoon?.replace(/\D/g, "")).filter(Boolean) as string[];
      if (emails.length === 0 && telefoons.length === 0) return;

      const { data } = await supabase
        .from("affiliate_leads")
        .select("email, telefoon")
        .or([
          emails.length ? `email.in.(${emails.map((e) => `"${e}"`).join(",")})` : "",
          telefoons.length ? `telefoon.in.(${telefoons.map((t) => `"${t}"`).join(",")})` : "",
        ].filter(Boolean).join(","));

      if (!active || !data) return;
      const dupEmails = new Set(data.map((d) => d.email?.toLowerCase()).filter(Boolean));
      const dupTel = new Set(data.map((d) => d.telefoon?.replace(/\D/g, "")).filter(Boolean));
      setRows((rs) => rs.map((r) => {
        const hit = (r.email && dupEmails.has(r.email.toLowerCase()))
          || (r.telefoon && dupTel.has(r.telefoon.replace(/\D/g, "")));
        if (!hit || r.duplicaat) return r;
        return { ...r, duplicaat: true, warnings: [...r.warnings, "Bestaat al in de pool"] };
      }));
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const handleImport = async () => {
    const importeerbaar = validRows.filter((r) => !r.duplicaat);
    if (importeerbaar.length === 0) {
      toast.error("Geen geldige rijen om te importeren");
      return;
    }
    setSubmitting(true);
    try {
      const payload = importeerbaar.map((r) => ({
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

      // Log import history (best-effort)
      try {
        const { data: auth } = await supabase.auth.getUser();
        const mappingForLog: Record<string, string | null> = {};
        for (const { key } of TARGET_FIELDS) {
          const i = mapping[key];
          mappingForLog[key] = i >= 0 && csv ? csv.rawHeaders[i] ?? null : null;
        }
        const warningsSummary = rows
          .map((r, i) => r.warnings.length ? { rij: i + 2, warnings: r.warnings } : null)
          .filter(Boolean);
        await supabase.from("affiliate_lead_imports").insert({
          bestandsnaam: fileName,
          totaal_rijen: rows.length,
          geimporteerd: payload.length,
          afgekeurd: rejectedCount + duplicaten,
          kolom_mapping: mappingForLog,
          waarschuwingen: warningsSummary,
          created_by: auth.user?.id ?? null,
        });
        queryClient.invalidateQueries({ queryKey: ["affiliate-lead-imports"] });
      } catch {
        // Niet-blokkerend: import is gelukt, alleen log faalde
      }

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
            Upload een CSV (komma, puntkomma of tab). In stap 2 koppel je je kolommen aan de juiste velden — je hoeft de template niet exact te volgen.
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
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
            <p className="text-xs text-muted-foreground">
              Maximaal 5MB. Eerste regel moet kolomnamen bevatten.
            </p>
          </div>
        )}

        {step === "map" && csv && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Bestand: {fileName} — {csv.rows.length} datarijen, {csv.headers.length} kolommen.
              Kies welke CSV-kolom hoort bij elk veld. Bedrijfsnaam is verplicht.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {TARGET_FIELDS.map(({ key, label, required }) => (
                <div key={key} className="space-y-1">
                  <Label className="text-sm">
                    {label}{required && <span className="text-destructive"> *</span>}
                  </Label>
                  <Select
                    value={mapping[key] >= 0 ? String(mapping[key]) : "__none__"}
                    onValueChange={(v) => setMapping((m) => ({ ...m, [key]: v === "__none__" ? -1 : Number(v) }))}
                  >
                    <SelectTrigger><SelectValue placeholder="— niet importeren —" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— niet importeren —</SelectItem>
                      {csv.rawHeaders.map((h, i) => (
                        <SelectItem key={i} value={String(i)}>{h || `Kolom ${i + 1}`}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              {fileName} — {rows.length} rijen, {validRows.length - duplicaten} import-klaar, {rejectedCount} afgekeurd, {duplicaten} duplicaat.
            </p>
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
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={close} disabled={submitting}>Annuleren</Button>
          {step === "map" && (
            <>
              <Button variant="outline" onClick={() => setStep("upload")}>Terug</Button>
              <Button onClick={goPreview}>Voorbeeld bekijken</Button>
            </>
          )}
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={() => setStep("map")} disabled={submitting}>Terug naar mapping</Button>
              <Button onClick={handleImport} disabled={submitting || validRows.length === 0} className="gap-2">
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Importeren…</> : `${validRows.length} leads importeren`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}