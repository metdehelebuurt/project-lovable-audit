import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Download, Lock, ShieldCheck, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import SignaturePad from "@/components/schouwen/SignaturePad";
import KeuringChecklist from "@/components/keuringen/KeuringChecklist";
import KeuringRapportPDF from "@/components/keuringen/KeuringRapportPDF";
import { renderElementToPdfBlob } from "@/lib/pdfFromElement";
import { hashBlobSha256, triggerBlobDownload } from "@/lib/renderOpleverPdf";
import type { ChecklistItem, Keuring, KeuringResultaat, KeuringStatus } from "@/components/keuringen/types";
import { RESULTAAT_LABELS, STATUS_LABELS, TYPE_LABELS } from "@/components/keuringen/types";

const STATUS_COLORS: Record<KeuringStatus, string> = {
  gepland: "bg-primary/10 text-primary",
  in_uitvoering: "bg-warning-light text-warning-foreground",
  afgerond: "bg-success-light text-success",
  achterstallig: "bg-error-light text-error",
  geannuleerd: "bg-muted text-muted-foreground",
};

export default function KeuringDetail() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { profile } = useAuth();

  const [keuring, setKeuring] = useState<Keuring | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [partner, setPartner] = useState<{ naam: string; logo_url: string | null; email: string | null; telefoonnummer: string | null; kvk: string | null } | null>(null);
  const [klant, setKlant] = useState<{ voornaam: string | null; achternaam: string | null; bedrijfsnaam: string | null; email: string | null; telefoon: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfBusy, setPdfBusy] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  const locked = keuring?.status === "afgerond" || keuring?.status === "geannuleerd";

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await supabase.from("keuringen" as any).select("*").eq("id", id).single();
    if (error || !data) {
      toast.error(error?.message ?? "Keuring niet gevonden");
      nav("/keuringen");
      return;
    }
    const k = data as unknown as Keuring;
    setKeuring(k);

    const [{ data: cl }, { data: p }, { data: kl }] = await Promise.all([
      supabase.from("keuring_checklist_items" as any).select("*").eq("keuring_id", id).order("volgorde", { ascending: true }),
      supabase.from("partners").select("naam, logo_url, email, telefoonnummer, kvk").eq("id", k.partner_id).single(),
      k.klant_id
        ? supabase.from("klanten").select("voornaam, achternaam, bedrijfsnaam, email, telefoon").eq("id", k.klant_id).single()
        : Promise.resolve({ data: null } as any),
    ]);
    setChecklist((cl ?? []) as unknown as ChecklistItem[]);
    setPartner(p as any);
    setKlant(kl as any);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const stats = useMemo(() => ({
    ok: checklist.filter((i) => i.antwoord === "ok").length,
    nok: checklist.filter((i) => i.antwoord === "nok").length,
    nvt: checklist.filter((i) => i.antwoord === "nvt").length,
    blokkerendeFouten: checklist.filter((i) => i.blokkerend && i.antwoord === "nok").length,
    open: checklist.filter((i) => !i.antwoord).length,
    totaal: checklist.length,
  }), [checklist]);

  const score = useMemo(() => {
    const beoordeeld = stats.ok + stats.nok;
    if (beoordeeld === 0) return null;
    return Math.round((stats.ok / beoordeeld) * 1000) / 10;
  }, [stats]);

  const updateItem = async (itemId: string, patch: Partial<ChecklistItem>) => {
    setChecklist((prev) => prev.map((it) => (it.id === itemId ? { ...it, ...patch } : it)));
    const { error } = await supabase.from("keuring_checklist_items" as any).update(patch).eq("id", itemId);
    if (error) toast.error(error.message);
    // Auto status → in_uitvoering
    if (keuring?.status === "gepland") {
      void patchKeuring({ status: "in_uitvoering" });
    }
  };

  const patchKeuring = async (patch: Partial<Keuring>) => {
    if (!keuring) return;
    setKeuring((k) => (k ? { ...k, ...patch } : k));
    const { error } = await supabase.from("keuringen" as any).update(patch).eq("id", keuring.id);
    if (error) toast.error(error.message);
  };

  const klantNaam = useMemo(() => {
    if (!klant) return keuring?.object_omschrijving ?? undefined;
    return klant.bedrijfsnaam || `${klant.voornaam ?? ""} ${klant.achternaam ?? ""}`.trim() || undefined;
  }, [klant, keuring]);
  const klantContact = klant ? [klant.email, klant.telefoon].filter(Boolean).join(" • ") : undefined;
  const partnerContact = partner ? [partner.email, partner.telefoonnummer, partner.kvk ? `KvK ${partner.kvk}` : null].filter(Boolean).join(" • ") : undefined;

  const downloadPdf = async () => {
    if (!pdfRef.current || !keuring) return;
    setPdfBusy(true);
    try {
      const blob = await renderElementToPdfBlob(pdfRef.current);
      const hash = await hashBlobSha256(blob);
      const filename = `${keuring.keuringnummer ?? "keuring"}.pdf`;
      triggerBlobDownload(blob, filename);

      // Archiveren
      const path = `${keuring.partner_id}/${keuring.id}/rapport-${Date.now()}.pdf`;
      const { error: upErr } = await supabase.storage.from("keuring-bijlagen").upload(path, blob, {
        contentType: "application/pdf", upsert: true,
      });
      if (!upErr) {
        await supabase.from("keuring_pdf_versies" as any).insert({
          keuring_id: keuring.id,
          partner_id: keuring.partner_id,
          pdf_path: path,
          pdf_hash: hash,
          bestandsgrootte: blob.size,
          gegenereerd_door: profile?.id ?? null,
        });
        await patchKeuring({ pdf_url: path, pdf_hash: hash, pdf_gegenereerd_op: new Date().toISOString() });
      }
      toast.success("PDF gegenereerd");
    } catch (e: any) {
      toast.error(e?.message ?? "PDF mislukt");
    } finally {
      setPdfBusy(false);
    }
  };

  const openArchief = async () => {
    if (!keuring?.pdf_url) return;
    const { data } = await supabase.storage.from("keuring-bijlagen").createSignedUrl(keuring.pdf_url, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const afronden = async () => {
    if (!keuring) return;
    if (stats.open > 0 && !confirm(`Er zijn nog ${stats.open} onbeoordeelde items. Toch afronden?`)) return;
    if (!keuring.handtekening_monteur) { toast.error("Handtekening inspecteur ontbreekt"); return; }
    if (!keuring.resultaat) { toast.error("Kies eerst een eindresultaat"); return; }

    await patchKeuring({
      status: "afgerond",
      uitgevoerd_op: new Date().toISOString(),
      uitgevoerd_door_id: profile?.id ?? null,
      score_percentage: score,
    });
    toast.success("Keuring afgerond. De volgende keuring wordt automatisch ingepland.");
    void load();
  };

  if (loading || !keuring) return <div className="p-8 text-muted-foreground">Laden...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => nav("/keuringen")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Terug
          </Button>
          <ShieldCheck className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-xl font-semibold">{keuring.keuringnummer}</h1>
            <div className="text-xs text-muted-foreground">{TYPE_LABELS[keuring.type]} · {keuring.normenkader.join(" · ")}</div>
          </div>
          <Badge className={STATUS_COLORS[keuring.status]}>{STATUS_LABELS[keuring.status]}</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {keuring.pdf_url && (
            <Button size="sm" variant="ghost" onClick={openArchief}>
              <ExternalLink className="h-4 w-4 mr-1" /> Archief openen
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={downloadPdf} disabled={pdfBusy}>
            <Download className="h-4 w-4 mr-1" /> {pdfBusy ? "Bezig..." : "PDF downloaden"}
          </Button>
          {!locked && (
            <Button size="sm" onClick={afronden}>Keuring afronden</Button>
          )}
        </div>
      </div>

      {locked && (
        <div className="flex items-start gap-3 rounded-xl border border-success/30 bg-success-light/40 p-3 text-sm">
          <Lock className="h-4 w-4 text-success mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-success">Keuring afgerond</p>
            <p className="text-muted-foreground text-xs">Wijzigingen vergrendeld. Download een PDF-kopie indien nodig.</p>
          </div>
        </div>
      )}

      {/* KPI's */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiBox label="OK" value={stats.ok} tone="success" />
        <KpiBox label="Niet OK" value={stats.nok} tone="error" />
        <KpiBox label="N.v.t." value={stats.nvt} tone="muted" />
        <KpiBox label="Open" value={stats.open} tone="warning" />
        <KpiBox label="Score" value={score !== null ? `${score}%` : "—"} tone="primary" />
      </div>

      {stats.blokkerendeFouten > 0 && (
        <div className="rounded-xl border border-error/40 bg-error-light/40 p-3 text-sm text-error">
          <strong>{stats.blokkerendeFouten} blokkerende afkeur(en)</strong> — installatie moet worden afgekeurd of hersteld.
        </div>
      )}

      {/* Inspecteur */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-3"><CardTitle className="text-base">Inspecteur</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Naam inspecteur</Label>
            <Input
              value={keuring.uitgevoerd_door_naam ?? ""}
              disabled={locked}
              onChange={(e) => setKeuring((k) => k ? { ...k, uitgevoerd_door_naam: e.target.value } : k)}
              onBlur={(e) => patchKeuring({ uitgevoerd_door_naam: e.target.value || null })}
            />
          </div>
          <div>
            <Label>Certificering (NEN 3140 / Scope 12)</Label>
            <Input
              value={keuring.uitgevoerd_door_certificering ?? ""}
              disabled={locked}
              onChange={(e) => setKeuring((k) => k ? { ...k, uitgevoerd_door_certificering: e.target.value } : k)}
              onBlur={(e) => patchKeuring({ uitgevoerd_door_certificering: e.target.value || null })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Checklist */}
      <KeuringChecklist items={checklist} disabled={locked} onUpdate={updateItem} />

      {/* Conclusie + resultaat */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-3"><CardTitle className="text-base">Eindbeoordeling</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Eindresultaat</Label>
            <Select
              value={keuring.resultaat ?? "none"}
              disabled={locked}
              onValueChange={(v) => patchKeuring({ resultaat: v === "none" ? null : (v as KeuringResultaat) })}
            >
              <SelectTrigger><SelectValue placeholder="Selecteer..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Nog niet bepaald</SelectItem>
                {(Object.keys(RESULTAAT_LABELS) as KeuringResultaat[]).map((r) => (
                  <SelectItem key={r} value={r}>{RESULTAAT_LABELS[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Conclusie</Label>
            <Textarea
              rows={3}
              disabled={locked}
              value={keuring.conclusie ?? ""}
              onChange={(e) => setKeuring((k) => k ? { ...k, conclusie: e.target.value } : k)}
              onBlur={(e) => patchKeuring({ conclusie: e.target.value || null })}
            />
          </div>
          <div>
            <Label>Aanbevelingen</Label>
            <Textarea
              rows={3}
              disabled={locked}
              value={keuring.aanbevelingen ?? ""}
              onChange={(e) => setKeuring((k) => k ? { ...k, aanbevelingen: e.target.value } : k)}
              onBlur={(e) => patchKeuring({ aanbevelingen: e.target.value || null })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Handtekeningen */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-base">Handtekening inspecteur</CardTitle></CardHeader>
          <CardContent>
            <SignaturePad
              value={keuring.handtekening_monteur}
              onChange={(v) => patchKeuring({ handtekening_monteur: v })}
            />
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-base">Handtekening klant (optioneel)</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Naam klant</Label>
              <Input
                value={keuring.handtekening_klant_naam ?? ""}
                disabled={locked}
                onChange={(e) => setKeuring((k) => k ? { ...k, handtekening_klant_naam: e.target.value } : k)}
                onBlur={(e) => patchKeuring({ handtekening_klant_naam: e.target.value || null })}
              />
            </div>
            <SignaturePad
              value={keuring.handtekening_klant}
              onChange={(v) => patchKeuring({ handtekening_klant: v })}
            />
          </CardContent>
        </Card>
      </div>

      {/* Hidden A4 voor PDF-render */}
      <div aria-hidden style={{ position: "fixed", left: -10000, top: 0, width: "210mm", pointerEvents: "none", zIndex: -1 }}>
        <KeuringRapportPDF
          ref={pdfRef}
          keuring={keuring}
          checklist={checklist}
          partnerNaam={partner?.naam}
          partnerLogoUrl={partner?.logo_url ?? undefined}
          partnerContact={partnerContact}
          klantNaam={klantNaam ?? undefined}
          klantContact={klantContact}
        />
      </div>
    </div>
  );
}

function KpiBox({ label, value, tone }: { label: string; value: number | string; tone: "success" | "error" | "muted" | "warning" | "primary" }) {
  const cls = {
    success: "bg-success-light text-success",
    error: "bg-error-light text-error",
    muted: "bg-muted text-muted-foreground",
    warning: "bg-warning-light text-warning-foreground",
    primary: "bg-primary/10 text-primary",
  }[tone];
  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardContent className={`p-3 rounded-2xl ${cls}`}>
        <div className="text-xs">{label}</div>
        <div className="text-xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}