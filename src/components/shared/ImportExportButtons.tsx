import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Upload } from "lucide-react";
import ImportDialog from "./ImportDialog";

interface ExportColumn {
  key: string;
  label: string;
}

interface ImportExportButtonsProps {
  entityType: "producten" | "leads" | "offertes";
  exportData: Record<string, any>[];
  exportColumns: ExportColumn[];
  exportFilename: string;
  showImport?: boolean;
  queryKey: string[];
}

function downloadCSV(data: Record<string, any>[], columns: ExportColumn[], filename: string) {
  const header = columns.map(c => `"${c.label}"`).join(";");
  const rows = data.map(row =>
    columns.map(c => {
      const val = row[c.key];
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    }).join(";")
  );
  const csv = [header, ...rows].join("\n");
  const bom = "\uFEFF";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ImportExportButtons({
  entityType,
  exportData,
  exportColumns,
  exportFilename,
  showImport = true,
  queryKey,
}: ImportExportButtonsProps) {
  const [importOpen, setImportOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="rounded-pill gap-2"
        onClick={() => downloadCSV(exportData, exportColumns, exportFilename)}
      >
        <Download className="h-4 w-4" /> Export
      </Button>
      {showImport && (
        <Button
          variant="outline"
          size="sm"
          className="rounded-pill gap-2"
          onClick={() => setImportOpen(true)}
        >
          <Upload className="h-4 w-4" /> Import
        </Button>
      )}
      {showImport && (
        <ImportDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          entityType={entityType}
          queryKey={queryKey}
        />
      )}
    </>
  );
}
