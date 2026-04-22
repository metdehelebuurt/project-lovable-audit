import { useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { downloadOpleverPdf } from "@/lib/renderOpleverPdf";
import { patchRapport } from "@/components/oplever/api/opleverApi";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Download, FileText, ExternalLink } from "lucide-react";
import type { Opleverrapport } from "@/components/oplever/types";
import { User, Cpu, BookCheck, Eye, Cable, ShieldCheck, Gauge, BatteryCharging, FileText as FileTextIcon, ClipboardCheck, PenLine } from "lucide-react";
import StepNormenScope from "@/components/oplever/StepNormenScope";
import StepBekabelingMeterkast from "@/components/oplever/StepBekabelingMeterkast";
import StepAardingBeveiliging from "@/components/oplever/StepAardingBeveiliging";
import StepBackup from "@/components/oplever/StepBackup";

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

  const { data: partnerData } = useQuery({
    queryKey: ["partner-branding-oplever", merged?.partner_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("partners")
        .select("naam, logo_url, email, telefoonnummer, kvk")
        .eq("id", merged!.partner_id)
        .single();
      return data;
    },
    enabled: !!merged?.partner_id,
  });

  const { data: klantData } = useQuery({
    queryKey: ["klant-for-oplever", (merged as any)?.klant_id],
    queryFn: async () => {
      const klantId = (merged as any)?.klant_id as string | undefined;
      if (!klantId) return null;
      const { data } = await supabase
        .from("klanten")
        .select("voornaam, achternaam, bedrijfsnaam, adres, postcode, plaats")
        .eq("id", klantId)
        .single();
      return data;
    },
    enabled: !!(merged as any)?.klant_id,
  });

  if (isLoading || !merged) return <div className="p-8 text-muted-foreground">Laden…</div>;

  const update = (p: Partial<Opleverrapport>) => setDraft((d) => ({ ...d, ...p }));

  const klantNaam = klantData
    ? klantData.bedrijfsnaam || `${klantData.voornaam ?? ""} ${klantData.achternaam ?? ""}`.trim()
    : (merged as any).klant_naam_snapshot ?? undefined;
  const partnerContact = partnerData
    ? [partnerData.email, partnerData.telefoonnummer, partnerData.kvk ? `KvK ${partnerData.kvk}` : null]
        .filter(Boolean)
        .join(" • ")
    : undefined;

  const downloadPdf = async () => {
    if (!pdfRef.current || !id || !merged.partner_id) return;
    try {
      setPdfBusy(true);
      const filename = `${merged.rapportnummer ?? "opleverrapport"}.pdf`;
      const { path, hash } = await downloadOpleverPdf(pdfRef.current, filename, merged.partner_id, id);
      if (path) await patchRapport(id, { pdf_url: path, pdf_hash: hash });
      toast({ title: "PDF gedownload", description: path ? "Tevens gearchiveerd in dossier." : "Archivering overgeslagen." });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "PDF mislukt";
      toast({ title: "Mislukt", description: msg, variant: "destructive" });
    } finally {
      setPdfBusy(false);
    }
  };

  const openArchive = async () => {
    if (!merged.pdf_url) return;
    const { data } = await supabase.storage.from("oplever-media").createSignedUrl(merged.pdf_url, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    else toast({ title: "Archief niet beschikbaar", variant: "destructive" });
  };

  const steps = [
    {
      key: "id",
      label: "Klant & project",
      icon: User,
      content: (
        <StepIdentificatie
          draft={merged}
          onChange={update}
          klantNaam={klantNaam}
          partnerId={merged.partner_id}
          klantId={((merged as unknown) as { klant_id: string | null }).klant_id ?? null}
          onKlantChange={(id) => update({ klant_id: id } as Partial<Opleverrapport>)}
        />
      ),
    },
    { key: "install", label: "Installatie & specs", icon: Cpu, content: <StepInstallatie rapportId={merged.id} partnerId={merged.partner_id} draft={merged} onChange={update} /> },
    { key: "normen", label: "Normen & scope", icon: BookCheck, content: <StepNormenScope draft={merged} onChange={update} /> },
    { key: "visueel", label: "Visuele inspectie", icon: Eye, content: <StepVisueleInspectie draft={merged} onChange={update} /> },
    { key: "bekabeling", label: "Bekabeling & meterkast", icon: Cable, content: <StepBekabelingMeterkast draft={merged} onChange={update} /> },
    { key: "aarding", label: "Aarding & beveiligingen", icon: ShieldCheck, content: <StepAardingBeveiliging draft={merged} onChange={update} /> },
    { key: "meting", label: "Metingen", icon: Gauge, content: <StepMetingen draft={merged} onChange={update} /> },
    ...(merged.extra_velden?.heeft_backup
      ? [{ key: "backup", label: "Backup / noodstroom", icon: BatteryCharging, content: <StepBackup draft={merged} onChange={update} /> }]
      : []),
    { key: "doc", label: "Documenten & labels", icon: FileTextIcon, content: <StepDocumentatie rapportId={merged.id} partnerId={merged.partner_id} draft={merged} onChange={update} /> },
    { key: "bevind", label: "Bevindingen & verklaring", icon: ClipboardCheck, content: <StepBevindingen draft={merged} onChange={update} /> },
    { key: "onder", label: "Ondertekening", icon: PenLine, content: <StepOndertekening rapport={merged} onSent={() => setDraft({})} /> },
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
          {merged.pdf_url ? (
            <Button variant="ghost" onClick={openArchive}>
              <ExternalLink className="h-4 w-4 mr-1" /> Archief openen
            </Button>
          ) : null}
          <Button variant="outline" onClick={downloadPdf} disabled={pdfBusy}>
            <Download className="h-4 w-4 mr-1" /> {pdfBusy ? "Bezig…" : "PDF downloaden"}
          </Button>
        </div>
      </div>

      <WizardShell
        steps={steps}
        currentIndex={Math.min(stepIndex, steps.length - 1)}
        onChange={setStepIndex}
      />

      <Card>
        <CardContent className="pt-4">
          <div className="text-sm font-medium mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4" /> PDF-preview
          </div>
          <div className="overflow-auto max-h-[600px] border rounded">
            <OpleverRapportPDF
              rapport={merged}
              partnerNaam={partnerData?.naam}
              partnerLogoUrl={partnerData?.logo_url ?? undefined}
              partnerContact={partnerContact}
              klantNaam={klantNaam}
            />
          </div>
        </CardContent>
      </Card>

      {/* Verborgen full-A4 render-container voor html2canvas */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: "210mm",
          opacity: 0,
          pointerEvents: "none",
          zIndex: -1,
        }}
      >
        <OpleverRapportPDF
          ref={pdfRef}
          rapport={merged}
          partnerNaam={partnerData?.naam}
          partnerLogoUrl={partnerData?.logo_url ?? undefined}
          partnerContact={partnerContact}
          klantNaam={klantNaam}
        />
      </div>
    </div>
  );
}
