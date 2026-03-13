import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, FileText, Loader2, AlertTriangle, CheckCircle } from "lucide-react";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: "producten" | "leads" | "offertes";
  queryKey: string[];
}

const ACCEPT = ".csv,.json,.txt,.xlsx,.xls";

const COLUMN_LABELS: Record<string, Record<string, string>> = {
  producten: {
    naam: "Naam", categorie: "Categorie", merk: "Merk", model: "Model",
    prijs_excl_btw: "Prijs", leverancier: "Leverancier", voorraad: "Voorraad",
  },
  leads: {
    voornaam: "Voornaam", achternaam: "Achternaam", email: "E-mail",
    telefoon: "Telefoon", bedrijfsnaam: "Bedrijf", plaats: "Plaats", bron: "Bron",
  },
  offertes: {
    klant_naam: "Klant", klant_email: "E-mail", totaal_bedrag: "Totaal",
    klant_plaats: "Plaats",
  },
};

export default function ImportDialog({ open, onOpenChange, entityType, queryKey }: ImportDialogProps) {
  const [step, setStep] = useState<"upload" | "preview">("upload");
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [records, setRecords] = useState<any[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [fileName, setFileName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const queryClient = useQueryClient();

  const reset = () => {
    setStep("upload");
    setRecords([]);
    setSelected(new Set());
    setFileName("");
    setLoading(false);
    setConfirming(false);
  };

  const close = () => {
    reset();
    onOpenChange(false);
  };

  const readFile = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "xlsx" || ext === "xls") {
      // @ts-ignore - read-excel-file has no type declarations
      const readXlsxFile = (await import("read-excel-file")).default;
      const rows = await readXlsxFile(file);
      // Convert to CSV-like text
      return rows.map(row => row.map(cell => cell ?? "").join("\t")).join("\n");
    }
    return await file.text();
  };

  const processFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Bestand is te groot (max 10MB)");
      return;
    }
    setFileName(file.name);
    setLoading(true);
    try {
      const rawData = await readFile(file);
      if (!rawData.trim()) {
        toast.error("Bestand is leeg");
        return;
      }

      const { data, error } = await supabase.functions.invoke("ai-data-import", {
        body: { entity_type: entityType, raw_data: rawData, action: "preview", file_name: file.name },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      const recs = data?.records || [];
      if (recs.length === 0) {
        toast.info("Geen records gevonden in het bestand");
        return;
      }

      setRecords(recs);
      // Pre-select records without warnings
      const preSelected = new Set<number>();
      recs.forEach((r: any, i: number) => {
        if (!r.warnings || r.warnings.length === 0) preSelected.add(i);
      });
      setSelected(preSelected);
      setStep("preview");
    } catch (err: any) {
      toast.error("Fout bij verwerken", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [entityType]);

  const handleConfirm = async () => {
    const selectedRecords = records.filter((_, i) => selected.has(i));
    if (selectedRecords.length === 0) {
      toast.error("Selecteer minimaal één record");
      return;
    }

    setConfirming(true);
    try {
      // Strip warnings before sending
      const cleanRecords = selectedRecords.map(({ warnings, ...rest }) => rest);
      const { data, error } = await supabase.functions.invoke("ai-data-import", {
        body: { entity_type: entityType, action: "confirm", records: cleanRecords },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      toast.success(`${data.count} records geïmporteerd`);
      queryClient.invalidateQueries({ queryKey });
      close();
    } catch (err: any) {
      toast.error("Fout bij importeren", { description: err.message });
    } finally {
      setConfirming(false);
    }
  };

  const toggleAll = () => {
    if (selected.size === records.length) setSelected(new Set());
    else setSelected(new Set(records.map((_, i) => i)));
  };

  const toggleSelect = (idx: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const columns = Object.entries(COLUMN_LABELS[entityType] || {});
  const warningCount = records.filter(r => r.warnings?.length > 0).length;

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) close(); else onOpenChange(v); }}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === "upload" ? "Data importeren" : `Preview — ${fileName}`}
          </DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload een bestand (.csv, .json, .txt, .xlsx) — elk formaat wordt automatisch herkend en correct verwerkt door AI.
            </p>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors cursor-pointer ${
                dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
              }`}
              onClick={() => document.getElementById("import-file-input")?.click()}
            >
              {loading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">AI verwerkt je bestand...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm font-medium">Sleep een bestand hierheen of klik om te uploaden</p>
                  <p className="text-xs text-muted-foreground">CSV, JSON, TXT, XLSX — max 10MB</p>
                </div>
              )}
            </div>
            <input
              id="import-file-input"
              type="file"
              accept={ACCEPT}
              onChange={handleFileInput}
              className="hidden"
            />
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>{records.length} records gevonden</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>{selected.size} geselecteerd</span>
              </div>
              {warningCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-warning-foreground" />
                  <span>{warningCount} met waarschuwingen</span>
                </div>
              )}
            </div>

            <div className="overflow-x-auto max-h-96 border rounded-xl">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selected.size === records.length && records.length > 0}
                        onCheckedChange={toggleAll}
                      />
                    </TableHead>
                    {columns.map(([key, label]) => (
                      <TableHead key={key}>{label}</TableHead>
                    ))}
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record, idx) => {
                    const hasWarnings = record.warnings?.length > 0;
                    return (
                      <TableRow key={idx} className={hasWarnings ? "bg-warning/5" : ""}>
                        <TableCell>
                          <Checkbox
                            checked={selected.has(idx)}
                            onCheckedChange={() => toggleSelect(idx)}
                          />
                        </TableCell>
                        {columns.map(([key]) => (
                          <TableCell key={key} className="max-w-40 truncate text-sm">
                            {record[key] ?? "—"}
                          </TableCell>
                        ))}
                        <TableCell>
                          {hasWarnings ? (
                            <Badge variant="outline" className="text-warning-foreground border-warning-foreground/30 text-xs" title={record.warnings.join(", ")}>
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {record.warnings.length}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-success border-success/30 text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" /> OK
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={reset} className="rounded-pill">
                Opnieuw
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={confirming || selected.size === 0}
                className="rounded-pill gap-2"
              >
                {confirming ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Importeren...</>
                ) : (
                  `${selected.size} records importeren`
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
