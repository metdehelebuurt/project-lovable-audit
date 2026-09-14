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
import { ArrowLeft, Download, FileText, ExternalLink, Lock, Ban, ArrowRight, History } from "lucide-react";
import type { Opleverrapport } from "@/components/oplever/types";
import { User, Cpu, BookCheck, Eye, Cable, ShieldCheck, Gauge, BatteryCharging, ClipboardCheck, PenLine } from "lucide-react";
import StepNormenScope from "@/components/oplever/StepNormenScope";
import StepBekabelingMeterkast from "@/components/oplever/StepBekabelingMeterkast";
import StepAardingBeveiliging from "@/components/oplever/StepAardingBeveiliging";
import StepBackup from "@/components/oplever/StepBackup";
import { fetchHandleidingenVoorRapport, type Handleiding } from "@/lib/productHandleidingen";
import { Card as UICard, CardContent as UICardContent, CardHeader as UICardHeader, CardTitle as UICardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { BookOpen } from "lucide-react";
import OpleverPdfVersies from "@/components/oplever/OpleverPdfVersies";
import { useAuth } from "@/contexts/AuthContext";
import { resolveSignatureToDataUrl, resolvePartnerLogoToDataUrl } from "@/lib/opleverPdfAssets";
import VervallenDialog from "@/components/oplever/VervallenDialog";
import { useQueryClient } from "@tanstack/react-query";

export default function OpleverDetail() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { profile } = useAuth();
  const { data: rapport, isLoading } = useOpleverRapport(id);
  const patch = usePatchRapport(id ?? "");
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<Partial<Opleverrapport>>({});
  const pdfRef = useRef<HTMLDivElement>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [uitgeslotenDocs, setUitgeslotenDocs] = useState<Set<string>>(new Set());
  const [vervallenOpen, setVervallenOpen] = useState(false);
  const queryClient = useQueryClient();

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

  // Naam / nummer van gekoppelde rapporten voor traceability banners
  const { data: vervangenDoor } = useQuery({
    queryKey: ["oplever-vervangen-door", merged?.vervangen_door_id],
    queryFn: async () => {
      if (!merged?.vervangen_door_id) return null;
      const { data } = await supabase
        .from("opleverrapporten")
        .select("id, rapportnummer, status")
        .eq("id", merged.vervangen_door_id)
        .maybeSingle();
      return data;
    },
    enabled: !!merged?.vervangen_door_id,
  });
  const { data: vervangt } = useQuery({
    queryKey: ["oplever-vervangt", merged?.vervangt_id],
    queryFn: async () => {
      if (!merged?.vervangt_id) return null;
      const { data } = await supabase
        .from("opleverrapporten")
        .select("id, rapportnummer, status")
        .eq("id", merged.vervangt_id)
        .maybeSingle();
      return data;
    },
    enabled: !!merged?.vervangt_id,
  });

  const { data: klantData } = useQuery({
    queryKey: ["klant-for-oplever", merged?.klant_id],
    queryFn: async () => {
      const klantId = merged?.klant_id ?? undefined;
      if (!klantId) return null;
      const { data } = await supabase
        .from("klanten")
        .select("voornaam, achternaam, bedrijfsnaam, email, telefoon, adres, postcode, plaats")
        .eq("id", klantId)
        .single();
      return data;
    },
    enabled: !!merged?.klant_id,
  });

  const { data: opdrachtData } = useQuery({
    queryKey: ["opdracht-for-oplever", merged?.opdracht_id],
    queryFn: async () => {
      if (!merged?.opdracht_id) return null;
      const { data } = await supabase
        .from("opdrachten")
        .select("id, created_at, klant_naam")
        .eq("id", merged.opdracht_id)
        .maybeSingle();
      return data;
    },
    enabled: !!merged?.opdracht_id,
  });

  const { data: handleidingen = [] } = useQuery({
    queryKey: ["oplever-handleidingen", merged?.installatie_id, merged?.opdracht_id],
    queryFn: () => fetchHandleidingenVoorRapport({
      installatieId: merged?.installatie_id ?? null,
      opdrachtId: merged?.opdracht_id ?? null,
    }),
    enabled: !!merged && (!!merged.installatie_id || !!merged.opdracht_id),
  });
  const gebruikerDocs: Handleiding[] = handleidingen.filter((h) => h.type === "gebruiker");
  const meegestuurdeDocs = gebruikerDocs.filter((d) => !uitgeslotenDocs.has(`${d.product_id}-${d.type}`));
  const meegeleverdePdfDocs = meegestuurdeDocs.map((d) => ({ naam: d.product_naam, bestandsnaam: d.bestandsnaam, url: d.url }));

  const installateurSigPath = merged?.installateur_handtekening?.image_url ?? null;
  const klantSigPath = merged?.klant_handtekening?.image_url ?? null;
  const partnerLogoRaw = partnerData?.logo_url ?? null;

  const { data: installateurSigDataUrl } = useQuery({
    queryKey: ["oplever-sig-inst", merged?.id, installateurSigPath],
    queryFn: () => resolveSignatureToDataUrl(installateurSigPath),
    enabled: !!installateurSigPath,
    staleTime: 4 * 60 * 1000,
  });
  const { data: klantSigDataUrl } = useQuery({
    queryKey: ["oplever-sig-klant", merged?.id, klantSigPath],
    queryFn: () => resolveSignatureToDataUrl(klantSigPath),
    enabled: !!klantSigPath,
    staleTime: 4 * 60 * 1000,
  });
  const { data: partnerLogoDataUrl } = useQuery({
    queryKey: ["oplever-logo", partnerLogoRaw],
    queryFn: () => resolvePartnerLogoToDataUrl(partnerLogoRaw),
    enabled: !!partnerLogoRaw,
    staleTime: 60 * 60 * 1000,
  });

  if (isLoading || !merged) return <div className="p-8 text-muted-foreground">Laden…</div>;

  const rollen = [profile?.rol, ...(profile?.extra_rollen ?? [])].filter(Boolean) as string[];
  const kanVervallen = rollen.some((r) =>
    ["superadmin", "partner_admin", "partner_staff", "backoffice"].includes(r),
  );
  const isVervallen = merged.status === "vervallen" || merged.vervallen === true;

  const update = (p: Partial<Opleverrapport>) => setDraft((d) => ({ ...d, ...p }));

  const klantNaam = klantData
    ? klantData.bedrijfsnaam || `${klantData.voornaam ?? ""} ${klantData.achternaam ?? ""}`.trim()
    : undefined;
  const klantContact = klantData
    ? [klantData.email, klantData.telefoon].filter(Boolean).join(" • ") || undefined
    : undefined;
  const partnerContact = partnerData
    ? [partnerData.email, partnerData.telefoonnummer, partnerData.kvk ? `KvK ${partnerData.kvk}` : null]
        .filter(Boolean)
        .join(" • ")
    : undefined;

  const ordernummer = opdrachtData
    ? `OPD-${opdrachtData.id.slice(0, 8).toUpperCase()} — ${new Date(opdrachtData.created_at).toLocaleDateString("nl-NL")}`
    : undefined;

  const downloadPdf = async () => {
    if (!pdfRef.current || !id || !merged.partner_id) return;
    try {
      setPdfBusy(true);
      const filename = `${merged.rapportnummer ?? "opleverrapport"}.pdf`;
      const { path, hash } = await downloadOpleverPdf(pdfRef.current, filename, merged.partner_id, id, {
        reden: "handmatige_download",
        gegenereerdDoor: profile?.id ?? null,
        statusOpMoment: merged.status,
      });
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

  const isIsolatie = merged.rapport_type === "isolatie";

  const isolatieSteps = [
    { key: "vlakken", label: "Geïsoleerde vlakken", icon: LayoutGrid, content: <StepIsolatieVlakken rapportId={merged.id} partnerId={merged.partner_id} draft={merged} onChange={update} /> },
    { key: "controle", label: "Controle & metingen", icon: Thermometer, content: <StepIsolatieControle draft={merged} onChange={update} /> },
    { key: "isodoc", label: "Documenten & overdracht", icon: FileText, content: <StepIsolatieDocumenten rapportId={merged.id} partnerId={merged.partner_id} draft={merged} onChange={update} /> },
  ];

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
          klantId={merged.klant_id ?? null}
          onKlantChange={(klantId) => update({ klant_id: klantId })}
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
    { key: "doc", label: "Documenten & labels", icon: FileText, content: <StepDocumentatie rapportId={merged.id} partnerId={merged.partner_id} draft={merged} onChange={update} /> },
    { key: "bevind", label: "Bevindingen & verklaring", icon: ClipboardCheck, content: <StepBevindingen draft={merged} onChange={update} /> },
    { key: "onder", label: "Ondertekening", icon: PenLine, content: <StepOndertekening rapport={merged} onSent={() => setDraft({})} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => nav("/opleveringen")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Terug
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold truncate">{merged.rapportnummer}</h1>
            <div className="text-xs text-muted-foreground">Templateversie {merged.template_versie}</div>
          </div>
          <OpleverStatusBadge status={merged.status} />
        </div>
        <div className="flex flex-wrap gap-2">
          {merged.pdf_url ? (
            <Button variant="ghost" size="sm" onClick={openArchive}>
              <ExternalLink className="h-4 w-4 mr-1" /> Archief openen
            </Button>
          ) : null}
          <Button variant="outline" size="sm" onClick={downloadPdf} disabled={pdfBusy}>
            <Download className="h-4 w-4 mr-1" /> {pdfBusy ? "Bezig…" : "PDF downloaden"}
          </Button>
          {kanVervallen && !isVervallen && merged.status === "ondertekend" ? (
            <Button variant="outline" size="sm" onClick={() => setVervallenOpen(true)} className="text-destructive hover:text-destructive">
              <Ban className="h-4 w-4 mr-1" /> Laten vervallen
            </Button>
          ) : null}
        </div>
      </div>

      {isVervallen ? (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm">
          <Ban className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <div className="flex-1 space-y-1">
            <p className="font-medium text-destructive">Dit rapport is vervallen</p>
            {merged.vervallen_reden ? (
              <p className="text-muted-foreground text-xs">
                Reden: <span className="text-foreground">{merged.vervallen_reden}</span>
                {merged.vervallen_op ? <> — {new Date(merged.vervallen_op).toLocaleString("nl-NL")}</> : null}
              </p>
            ) : null}
            {vervangenDoor ? (
              <Button variant="link" size="sm" className="h-auto p-0 text-destructive" onClick={() => nav(`/opleveringen/${vervangenDoor.id}`)}>
                Vervangen door {vervangenDoor.rapportnummer} <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {vervangt ? (
        <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
          <History className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-primary">Dit rapport vervangt een eerder rapport</p>
            <Button variant="link" size="sm" className="h-auto p-0" onClick={() => nav(`/opleveringen/${vervangt.id}`)}>
              Origineel bekijken: {vervangt.rapportnummer} <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      ) : null}

      {merged.status === "ondertekend" ? (
        <div className="flex items-start gap-3 rounded-xl border border-success/30 bg-success-light/40 p-3 text-sm">
          <Lock className="h-4 w-4 text-success mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-success">Rapport definitief ondertekend</p>
            <p className="text-muted-foreground text-xs">Wijzigingen zijn vergrendeld. Download een PDF-kopie indien nodig.</p>
          </div>
        </div>
      ) : null}

      <WizardShell
        steps={steps}
        currentIndex={Math.min(stepIndex, steps.length - 1)}
        onChange={setStepIndex}
        disabled={merged.status === "ondertekend" || isVervallen}
      />

      <OpleverPdfVersies rapportId={merged.id} />

      {gebruikerDocs.length > 0 ? (
        <UICard>
          <UICardHeader className="pb-3">
            <UICardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" /> Bijlagen voor klant
            </UICardTitle>
          </UICardHeader>
          <UICardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">
              De volgende gebruikershandleidingen worden automatisch meegestuurd met het opleverrapport. Vink uit wat u niet wilt meesturen.
            </p>
            <ul className="space-y-1.5">
              {gebruikerDocs.map((d) => {
                const key = `${d.product_id}-${d.type}`;
                const checked = !uitgeslotenDocs.has(key);
                return (
                  <li key={key} className="flex items-center gap-2 rounded-lg border p-2">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => {
                        setUitgeslotenDocs((prev) => {
                          const next = new Set(prev);
                          if (v) next.delete(key); else next.add(key);
                          return next;
                        });
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{d.product_naam}</p>
                      <p className="text-xs text-muted-foreground truncate">{d.bestandsnaam}</p>
                    </div>
                    <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline shrink-0">
                      bekijk
                    </a>
                  </li>
                );
              })}
            </ul>
          </UICardContent>
        </UICard>
      ) : null}

      <Card className="hidden md:block">
        <CardContent className="pt-4">
          <div className="text-sm font-medium mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4" /> PDF-preview
          </div>
          <div className="overflow-auto max-h-[600px] border rounded">
            <div style={{ minWidth: 794 }}>
              <OpleverRapportPDF
                rapport={merged}
                partnerNaam={partnerData?.naam}
                partnerLogoUrl={partnerData?.logo_url ?? undefined}
                partnerContact={partnerContact}
                klantNaam={klantNaam}
                klantContact={klantContact}
                ordernummer={ordernummer}
                meegeleverdeDocumenten={meegeleverdePdfDocs}
                installateurSigDataUrl={installateurSigDataUrl ?? null}
                klantSigDataUrl={klantSigDataUrl ?? null}
                partnerLogoDataUrl={partnerLogoDataUrl ?? null}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verborgen full-A4 render-container voor html2canvas */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          left: "-10000px",
          top: 0,
          width: "210mm",
          opacity: 1,
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
          klantContact={klantContact}
          ordernummer={ordernummer}
          meegeleverdeDocumenten={meegeleverdePdfDocs}
          installateurSigDataUrl={installateurSigDataUrl ?? null}
          klantSigDataUrl={klantSigDataUrl ?? null}
          partnerLogoDataUrl={partnerLogoDataUrl ?? null}
        />
      </div>

      <VervallenDialog
        open={vervallenOpen}
        onOpenChange={setVervallenOpen}
        rapport={merged}
        onDone={() => {
          queryClient.invalidateQueries({ queryKey: ["opleverrapport", id] });
        }}
      />
    </div>
  );
}
