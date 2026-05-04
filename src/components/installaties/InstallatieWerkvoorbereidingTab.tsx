import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, FileDown, Sparkles, Hash, Save, Settings2, CheckCircle2, AlertTriangle, XCircle, Info, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { Installatie } from "./api/installatieApi";
import { generateInstallatienummer, updateInstallatie } from "./api/installatieApi";
import AiWerkomschrijvingDialog from "./AiWerkomschrijvingDialog";
import { useInstallatieGereedheid, type CheckStatus, type GereedheidsItem } from "@/hooks/installaties/useInstallatieGereedheid";
import { useGereedheidOverride } from "@/hooks/installaties/useGereedheidOverride";
import { Badge } from "@/components/ui/badge";

interface ChecklistItem {
  id: string;
  installatie_id: string;
  partner_id: string;
  item_key: string;
  label: string;
  blokkerend: boolean;
  voltooid_op: string | null;
  voltooid_door: string | null;
  notitie: string | null;
}

const iconFor = (status: CheckStatus) => {
  switch (status) {
    case "ok": return <CheckCircle2 className="h-4 w-4 text-success" />;
    case "warn": return <AlertTriangle className="h-4 w-4 text-warning-foreground" />;
    case "fail": return <XCircle className="h-4 w-4 text-destructive" />;
    default: return <Info className="h-4 w-4 text-muted-foreground" />;
  }
};

export default function InstallatieWerkvoorbereidingTab({ installatie }: { installatie: Installatie }) {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [nieuw, setNieuw] = useState({ label: "", blokkerend: false });
  const [aiOpen, setAiOpen] = useState(false);
  const [nummerBusy, setNummerBusy] = useState(false);
  const [werkomschrijving, setWerkomschrijving] = useState(installatie.werkomschrijving ?? "");
  const [werkBusy, setWerkBusy] = useState(false);
  const kanTemplatesBeheren = profile?.rol === "partner_admin" || profile?.rol === "superadmin";

  const { data: gereedheid } = useInstallatieGereedheid(installatie);
  const { markeer: markeerOverride, verwijder: verwijderOverride } = useGereedheidOverride(installatie.id, installatie.partner_id);

  const kenNummerToe = async () => {
    setNummerBusy(true);
    try {
      const nr = await generateInstallatienummer(installatie.partner_id);
      await updateInstallatie(installatie.id, { installatienummer: nr });
      toast.success(`Nummer ${nr} toegekend`);
      qc.invalidateQueries({ queryKey: ["installatie", installatie.id] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Toekennen mislukt");
    } finally {
      setNummerBusy(false);
    }
  };

  const slaWerkomschrijvingOp = async (tekst: string) => {
    try {
      await updateInstallatie(installatie.id, { werkomschrijving: tekst });
      setWerkomschrijving(tekst);
      toast.success("Werkomschrijving bijgewerkt");
      qc.invalidateQueries({ queryKey: ["installatie", installatie.id] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Opslaan mislukt");
    }
  };

  const slaWerkomschrijvingHandmatigOp = async () => {
    setWerkBusy(true);
    try {
      await updateInstallatie(installatie.id, { werkomschrijving: werkomschrijving || null });
      toast.success("Werkomschrijving opgeslagen");
      qc.invalidateQueries({ queryKey: ["installatie", installatie.id] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Opslaan mislukt");
    } finally {
      setWerkBusy(false);
    }
  };

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["installatie_checklist", installatie.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("installatie_checklist_items")
        .select("*")
        .eq("installatie_id", installatie.id)
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as ChecklistItem[];
    },
  });

  const toggle = useMutation({
    mutationFn: async (item: ChecklistItem) => {
      const { error } = await supabase
        .from("installatie_checklist_items")
        .update({
          voltooid_op: item.voltooid_op ? null : new Date().toISOString(),
          voltooid_door: item.voltooid_op ? null : profile?.id ?? null,
        })
        .eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["installatie_checklist", installatie.id] });
      qc.invalidateQueries({ queryKey: ["installatie-gereedheid", installatie.id] });
    },
  });

  const verwijder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("installatie_checklist_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["installatie_checklist", installatie.id] });
      qc.invalidateQueries({ queryKey: ["installatie-gereedheid", installatie.id] });
    },
  });

  const voegToe = useMutation({
    mutationFn: async () => {
      if (!nieuw.label.trim()) return;
      const { error } = await supabase.from("installatie_checklist_items").insert({
        installatie_id: installatie.id,
        partner_id: installatie.partner_id,
        label: nieuw.label.trim(),
        item_key: nieuw.label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 60),
        blokkerend: nieuw.blokkerend,
      });
      if (error) throw error;
      setNieuw({ label: "", blokkerend: false });
    },
    onSuccess: () => {
      toast.success("Item toegevoegd");
      qc.invalidateQueries({ queryKey: ["installatie_checklist", installatie.id] });
      qc.invalidateQueries({ queryKey: ["installatie-gereedheid", installatie.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pasTemplate = useMutation({
    mutationFn: async () => {
      const { data: tmpl, error: tmplError } = await supabase
        .from("installatie_checklist_templates")
        .select("*")
        .eq("partner_id", installatie.partner_id)
        .eq("actief", true)
        .order("volgorde");
      if (tmplError) throw tmplError;
      if (!tmpl || tmpl.length === 0) {
        return { added: 0, totalTemplate: 0 };
      }
      const bestaande = new Set(items.map(i => i.item_key));
      const nieuweRecords = tmpl
        .filter(t => !bestaande.has(t.item_key))
        .map(t => ({
          installatie_id: installatie.id,
          partner_id: installatie.partner_id,
          item_key: t.item_key,
          label: t.label,
          blokkerend: t.blokkerend,
        }));
      if (nieuweRecords.length === 0) return { added: 0, totalTemplate: tmpl.length };
      const { error } = await supabase.from("installatie_checklist_items").insert(nieuweRecords);
      if (error) throw error;
      return { added: nieuweRecords.length, totalTemplate: tmpl.length };
    },
    onSuccess: ({ added, totalTemplate }) => {
      if (totalTemplate === 0) {
        toast.info("Geen actieve standaard checklist gevonden. Maak eerst een template aan onder Instellingen.");
      } else if (added === 0) {
        toast.info(`Alle ${totalTemplate} standaard items zijn al aanwezig`);
      } else {
        toast.success(`${added} item(s) toegevoegd uit standaard checklist`);
      }
      qc.invalidateQueries({ queryKey: ["installatie_checklist", installatie.id] });
      qc.invalidateQueries({ queryKey: ["installatie-gereedheid", installatie.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const customItemById = new Map(items.map((i) => [i.id, i]));

  const renderRij = (g: GereedheidsItem) => {
    const isCustom = g.key.startsWith("cl_");
    const customItem = isCustom ? customItemById.get(g.key.slice(3)) : undefined;
    const checked = g.status === "ok";
    const handleToggle = (next: boolean) => {
      if (isCustom && customItem) {
        toggle.mutate(customItem);
        return;
      }
      // Systeemcheck
      if (g.manueel) {
        verwijderOverride.mutate(g.key);
      } else if (next) {
        markeerOverride.mutate({ itemKey: g.key });
      }
    };

    const badge = isCustom
      ? { label: "Custom", className: "bg-muted text-muted-foreground" }
      : g.manueel
        ? { label: "Handmatig", className: "bg-warning/15 text-warning-foreground" }
        : { label: "Auto", className: "bg-primary/10 text-primary" };

    return (
      <li key={g.key} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30">
        <Checkbox
          checked={checked}
          onCheckedChange={(v) => handleToggle(!!v)}
          className="mt-0.5"
          aria-label={g.label}
        />
        <span className="mt-0.5">{iconFor(g.status)}</span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className={`text-sm ${checked ? "line-through text-muted-foreground" : "font-medium"}`}>
              {g.label}
            </p>
            <Badge variant="outline" className={`text-[10px] uppercase tracking-wide border-0 ${badge.className}`}>
              {badge.label}
            </Badge>
            {g.blokkerend && !checked && (
              <span className="text-[10px] uppercase tracking-wide text-destructive font-semibold">Blokkerend</span>
            )}
          </div>
          {g.details && (
            <p className="text-xs text-muted-foreground">{g.details}</p>
          )}
        </div>
        {isCustom && customItem ? (
          <Button size="icon" variant="ghost" onClick={() => verwijder.mutate(customItem.id)} aria-label="Verwijderen">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        ) : g.manueel ? (
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5 text-xs"
            onClick={() => verwijderOverride.mutate(g.key)}
            disabled={verwijderOverride.isPending}
          >
            <RotateCcw className="h-3.5 w-3.5" /> Auto
          </Button>
        ) : null}
      </li>
    );
  };

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Werkvoorbereiding</CardTitle>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => pasTemplate.mutate()} disabled={pasTemplate.isPending}>
            <FileDown className="h-3.5 w-3.5 mr-1.5" /> Standaard checklist toevoegen
          </Button>
          {kanTemplatesBeheren && (
            <Button size="sm" variant="ghost" asChild>
              <Link to="/instellingen/checklist-templates">
                <Settings2 className="h-3.5 w-3.5 mr-1.5" /> Templates beheren
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!installatie.installatienummer && (
          <div className="flex items-center justify-between rounded-lg border border-dashed p-3 text-sm">
            <span className="text-muted-foreground">Geen installatienummer toegekend.</span>
            <Button size="sm" variant="outline" onClick={kenNummerToe} disabled={nummerBusy}>
              <Hash className="h-3.5 w-3.5 mr-1.5" /> {nummerBusy ? "Toekennen…" : "Nummer toekennen"}
            </Button>
          </div>
        )}

        <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Werkomschrijving voor monteur</Label>
            <Button size="sm" variant="ghost" className="h-7 gap-1.5 text-xs" onClick={() => setAiOpen(true)}>
              <Sparkles className="h-3.5 w-3.5 text-primary" /> AI genereren
            </Button>
          </div>
          <Textarea
            value={werkomschrijving}
            onChange={(e) => setWerkomschrijving(e.target.value)}
            rows={5}
            placeholder="Beschrijving van de werkzaamheden voor de monteur. Klik op 'AI genereren' voor een voorstel op basis van schouw, producten en checklist."
          />
          <div className="flex justify-end">
            <Button size="sm" onClick={slaWerkomschrijvingHandmatigOp} disabled={werkBusy} className="gap-1.5">
              <Save className="h-3.5 w-3.5" /> {werkBusy ? "Opslaan…" : "Opslaan"}
            </Button>
          </div>
        </div>

        {!gereedheid || isLoading ? (
          <p className="text-sm text-muted-foreground">Laden…</p>
        ) : gereedheid.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Geen items. Voeg een custom item toe of pas een template toe.</p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{gereedheid.ok} van {gereedheid.totaal} gereed</span>
              {gereedheid.open_blokkades.length > 0 && (
                <span className="text-destructive font-medium">
                  {gereedheid.open_blokkades.length} blokkerend(e) item(s)
                </span>
              )}
            </div>
            <ul className="space-y-1.5">
              {gereedheid.items.map(renderRij)}
            </ul>
          </div>
        )}

        <div className="border-t pt-4 space-y-2">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Nieuw item</Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Bijv. 'Steiger besteld' of 'Net-aanvraag ingediend'"
              value={nieuw.label}
              onChange={(e) => setNieuw({ ...nieuw, label: e.target.value })}
            />
            <div className="flex items-center gap-2">
              <Switch checked={nieuw.blokkerend} onCheckedChange={(v) => setNieuw({ ...nieuw, blokkerend: v })} id="blok" />
              <Label htmlFor="blok" className="text-xs">Blokkerend</Label>
            </div>
            <Button onClick={() => voegToe.mutate()} disabled={!nieuw.label.trim() || voegToe.isPending}>
              <Plus className="h-4 w-4 mr-1" /> Toevoegen
            </Button>
          </div>
        </div>
      </CardContent>
      <AiWerkomschrijvingDialog
        open={aiOpen}
        onOpenChange={setAiOpen}
        installatieId={installatie.id}
        huidigeTekst={installatie.werkomschrijving}
        onAccept={slaWerkomschrijvingOp}
      />
    </Card>
  );
}