import { useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import WizardShell from "@/components/oplever/WizardShell";
import StepIdentificatie from "@/components/oplever/StepIdentificatie";
import StepInstallatie from "@/components/oplever/StepInstallatie";
import StepVisueleInspectie from "@/components/oplever/StepVisueleInspectie";
import StepMetingen from "@/components/oplever/StepMetingen";
import StepDocumentatie from "@/components/oplever/StepDocumentatie";
import StepBevindingen from "@/components/oplever/StepBevindingen";
import StepOndertekening from "@/components/oplever/StepOndertekening";
import OpleverRapportPDF from "@/components/oplever/OpleverRapportPDF";
import OpleverStatusBadge from "@/components/oplever/StatusBadge";
import { useOpleverRapport, usePatchRapport } from "@/components/oplever/useOpleverRapport";
import { useOpleverAutosave } from "@/components/oplever/useOpleverAutosave";
import { renderAndArchiveOpleverPdf } from "@/lib/renderOpleverPdf";
import { patchRapport } from "@/components/oplever/api/opleverApi";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Download, FileText } from "lucide-react";
import type { Opleverrapport } from "@/components/oplever/types";

export default function OpleverDetail() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { data: rapport, isLoading } = useOpleverRapport(id);
  const patch = usePatchRapport(id ?? "");
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<Partial<Opleverrapport>>({});
  const pdfRef = useRef<HTMLDivElement>(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  useOpleverAutosave(id, draft);

  const merged: Opleverrapport | undefined = useMemo(() => {
    if (!rapport) return undefined;
    return { ...rapport, ...draft } as Opleverrapport;
  }, [rapport, draft]);

  if (isLoading || !merged) return <div className="p-8 text-muted-foreground">Laden…</div>;

  const update = (p: Partial<Opleverrapport>) => setDraft((d) => ({ ...d, ...p }));

  const downloadPdf = async () => {
    if (!pdfRef.current || !id || !merged.partner_id) return;
    try {
      setPdfBusy(true);
      const { path, hash } = await renderAndArchiveOpleverPdf(pdfRef.current, merged.partner_id, id);
      await patchRapport(id, { pdf_url: path, pdf_hash: hash });
      toast({ title: "PDF opgeslagen" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "PDF mislukt";
      toast({ title: "Mislukt", description: msg, variant: "destructive" });
    } finally {
      setPdfBusy(false);
    }
  };

  const steps = [
    { key: "id", label: "Identificatie", content: <StepIdentificatie draft={merged} onChange={update} /> },
    { key: "install", label: "Installatie", content: <StepInstallatie rapportId={merged.id} partnerId={merged.partner_id} draft={merged} onChange={update} /> },
    { key: "visueel", label: "Visuele inspectie", content: <StepVisueleInspectie draft={merged} onChange={update} /> },
    { key: "meting", label: "Metingen", content: <StepMetingen draft={merged} onChange={update} /> },
    { key: "doc", label: "Documentatie", content: <StepDocumentatie rapportId={merged.id} partnerId={merged.partner_id} draft={merged} onChange={update} /> },
    { key: "bevind", label: "Bevindingen", content: <StepBevindingen draft={merged} onChange={update} /> },
    { key: "onder", label: "Ondertekening", content: <StepOndertekening rapport={merged} onSent={() => setDraft({})} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => nav("/opleveringen")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Terug
          </Button>
          <div>
            <h1 className="text-xl font-semibold">{merged.rapportnummer}</h1>
            <div className="text-xs text-muted-foreground">Templateversie {merged.template_versie}</div>
          </div>
          <OpleverStatusBadge status={merged.status} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadPdf} disabled={pdfBusy}>
            <Download className="h-4 w-4 mr-1" /> {pdfBusy ? "Bezig…" : "PDF opslaan"}
          </Button>
        </div>
      </div>

      <WizardShell steps={steps} currentIndex={stepIndex} onChange={setStepIndex} />

      <Card>
        <CardContent className="pt-4">
          <div className="text-sm font-medium mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4" /> PDF-preview
          </div>
          <div className="overflow-auto max-h-[600px] border rounded">
            <OpleverRapportPDF ref={pdfRef} rapport={merged} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
