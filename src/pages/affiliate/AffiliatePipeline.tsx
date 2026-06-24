import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Download, Search, LayoutGrid, List, Rows3, SlidersHorizontal, Euro, TrendingUp, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AffiliateSubnav } from "@/components/affiliate/AffiliateSubnav";
import { NieuweLeadDialog } from "@/components/affiliate/NieuweLeadDialog";
import { PipelineKaart } from "@/components/affiliate/PipelineKaart";
import { STATUS_VOLGORDE, STATUS_LABEL, STATUS_KLEUR, type AffiliateLeadStatus } from "@/lib/affiliate/leadStatus";
import { useAffiliateLeads, useUpdateAffiliateLead, type AffiliateLead } from "@/hooks/affiliate/useAffiliateLeads";
import { useRealtimeAffiliateLeads } from "@/hooks/affiliate/useRealtimeAffiliateLeads";
import TemperatuurBadge from "@/components/sales/TemperatuurBadge";
import type { Temperatuur } from "@/lib/sales/temperatuur";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";

const ZICHTBARE_STATUSSEN: AffiliateLeadStatus[] = STATUS_VOLGORDE;
const LS_VIEW = "affiliate-pipeline-view";
const LS_HIDDEN = "affiliate-pipeline-hidden-cols";

type Weergave = "kanban" | "lijst" | "compact";

const AffiliatePipeline = () => {
  useRealtimeAffiliateLeads();
  const { data: leads = [] } = useAffiliateLeads("pipeline");
  const update = useUpdateAffiliateLead();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [actief, setActief] = useState<AffiliateLead | null>(null);
  const [zoek, setZoek] = useState("");
  const [tempFilter, setTempFilter] = useState<Temperatuur | "alle">("alle");
  const [weergave, setWeergave] = useState<Weergave>(() => {
    if (typeof window === "undefined") return "kanban";
    return (localStorage.getItem(LS_VIEW) as Weergave) || "kanban";
  });
  const [verborgen, setVerborgen] = useState<Set<AffiliateLeadStatus>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = localStorage.getItem(LS_HIDDEN);
      return new Set(raw ? (JSON.parse(raw) as AffiliateLeadStatus[]) : []);
    } catch { return new Set(); }
  });

  useEffect(() => { localStorage.setItem(LS_VIEW, weergave); }, [weergave]);
  useEffect(() => { localStorage.setItem(LS_HIDDEN, JSON.stringify([...verborgen])); }, [verborgen]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const gefilterd = useMemo(() => {
    const q = zoek.trim().toLowerCase();
    return leads.filter((l) => {
      if (tempFilter !== "alle" && (l.temperatuur ?? "koud") !== tempFilter) return false;
      if (!q) return true;
      const hay = [l.bedrijfsnaam, l.contactpersoon, l.email, l.telefoon, l.plaats, l.branche]
        .filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [leads, zoek, tempFilter]);

  const grouped = useMemo(() => {
    const m = new Map<AffiliateLeadStatus, AffiliateLead[]>();
    ZICHTBARE_STATUSSEN.forEach((s) => m.set(s, []));
    gefilterd.forEach((l) => m.get(l.status as AffiliateLeadStatus)?.push(l));
    return m;
  }, [gefilterd]);

  const zichtbareKolommen = useMemo(
    () => ZICHTBARE_STATUSSEN.filter((s) => !verborgen.has(s)),
    [verborgen],
  );

  const stats = useMemo(() => {
    const totaal = leads.length;
    const gewonnen = leads.filter((l) => l.status === "gewonnen").length;
    const verloren = leads.filter((l) => l.status === "verloren").length;
    const open = leads.filter((l) => l.status !== "gewonnen" && l.status !== "verloren").length;
    const waarde = leads
      .filter((l) => l.status !== "verloren")
      .reduce((s, l) => s + Number(l.geschatte_waarde ?? 0), 0);
    const conversie = gewonnen + verloren > 0 ? Math.round((gewonnen / (gewonnen + verloren)) * 100) : 0;
    return { totaal, gewonnen, open, waarde, conversie };
  }, [leads]);

  const advance = (lead: AffiliateLead) => {
    const idx = ZICHTBARE_STATUSSEN.indexOf(lead.status as AffiliateLeadStatus);
    const next = ZICHTBARE_STATUSSEN[Math.min(idx + 1, ZICHTBARE_STATUSSEN.length - 3)];
    if (next) update.mutate({ id: lead.id, patch: { status: next } });
  };

  const exportCsv = () => {
    const headers = ["bedrijfsnaam", "contactpersoon", "email", "telefoon", "status", "geschatte_waarde", "volgende_actie_datum"];
    const rows = gefilterd.map((l) => headers.map((h) => {
      const v = (l as Record<string, unknown>)[h];
      const s = v == null ? "" : String(v);
      return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(";"));
    const csv = "\uFEFF" + [headers.join(";"), ...rows].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url; a.download = `pipeline-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const onDragStart = (e: DragStartEvent) => {
    const lead = leads.find((l) => l.id === e.active.id);
    if (lead) setActief(lead);
  };

  const onDragEnd = (e: DragEndEvent) => {
    setActief(null);
    const overStatus = e.over?.id as AffiliateLeadStatus | undefined;
    const lead = leads.find((l) => l.id === e.active.id);
    if (!overStatus || !lead) return;
    if (lead.status === overStatus) return;
    update.mutate({ id: lead.id, patch: { status: overStatus } });
  };

  const toggleKolom = (s: AffiliateLeadStatus) => {
    setVerborgen((prev) => {
      const n = new Set(prev);
      n.has(s) ? n.delete(s) : n.add(s);
      return n;
    });
  };

  const euro = (n: number) =>
    n.toLocaleString("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

  return (
    <div className="p-6 space-y-4">
      <AffiliateSubnav />
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <LayoutGrid className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold leading-tight">Pipeline overzicht</h1>
            <p className="text-sm text-muted-foreground">
              Strategisch overzicht · {gefilterd.length} van {leads.length} leads · sleep kaarten om fase te wijzigen
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={exportCsv} disabled={gefilterd.length === 0}>
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Nieuwe lead
          </Button>
        </div>
      </div>

      {/* Stat-kaarten */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatKaart icon={Users} label="Open leads" waarde={stats.open.toString()} />
        <StatKaart icon={TrendingUp} label="Gewonnen" waarde={stats.gewonnen.toString()} />
        <StatKaart icon={Euro} label="Pijplijnwaarde" waarde={euro(stats.waarde)} />
        <StatKaart icon={TrendingUp} label="Conversie" waarde={`${stats.conversie}%`} />
      </div>

      {/* Filterbalk */}
      <Card className="p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Zoek op bedrijf, contact, e-mail, plaats..."
            value={zoek}
            onChange={(e) => setZoek(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        <ToggleGroup
          type="single"
          value={tempFilter}
          onValueChange={(v) => v && setTempFilter(v as Temperatuur | "alle")}
          className="border rounded-md"
        >
          <ToggleGroupItem value="alle" className="h-9 px-3 text-xs">Alle</ToggleGroupItem>
          <ToggleGroupItem value="heet" className="h-9 px-3 text-xs">🔥 Heet</ToggleGroupItem>
          <ToggleGroupItem value="warm" className="h-9 px-3 text-xs">Warm</ToggleGroupItem>
          <ToggleGroupItem value="koud" className="h-9 px-3 text-xs">Koud</ToggleGroupItem>
        </ToggleGroup>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <SlidersHorizontal className="h-4 w-4 mr-1" /> Kolommen
              {verborgen.size > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px]">{verborgen.size}</Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Zichtbare kolommen</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {ZICHTBARE_STATUSSEN.map((s) => (
              <DropdownMenuCheckboxItem
                key={s}
                checked={!verborgen.has(s)}
                onCheckedChange={() => toggleKolom(s)}
              >
                {STATUS_LABEL[s]}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <ToggleGroup
          type="single"
          value={weergave}
          onValueChange={(v) => v && setWeergave(v as Weergave)}
          className="border rounded-md"
        >
          <ToggleGroupItem value="kanban" className="h-9 px-3" aria-label="Kanban">
            <LayoutGrid className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="compact" className="h-9 px-3" aria-label="Compact">
            <Rows3 className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="lijst" className="h-9 px-3" aria-label="Lijst">
            <List className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </Card>

      {weergave === "lijst" ? (
        <LijstWeergave
          leads={gefilterd}
          onOpen={(l) => navigate(`/affiliates/leads/${l.id}`)}
        />
      ) : (
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActief(null)}>
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 snap-x">
            {zichtbareKolommen.map((status) => (
              <KanbanKolom
                key={status}
                status={status}
                leads={grouped.get(status) ?? []}
                onOpen={(l) => navigate(`/affiliates/leads/${l.id}`)}
                onAdvance={advance}
                compact={weergave === "compact"}
              />
            ))}
          </div>
          <DragOverlay>
            {actief ? (
              <div className="opacity-90 rotate-2">
                <PipelineKaart lead={actief} onOpen={() => {}} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <NieuweLeadDialog open={open} onOpenChange={setOpen} />
    </div>
  );
};

function StatKaart({ icon: Icon, label, waarde }: { icon: typeof Users; label: string; waarde: string }) {
  return (
    <Card className="p-3 flex items-center gap-3">
      <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="text-lg font-semibold tabular-nums truncate">{waarde}</p>
      </div>
    </Card>
  );
}

function KanbanKolom({
  status,
  leads,
  onOpen,
  onAdvance,
  compact,
}: {
  status: AffiliateLeadStatus;
  leads: AffiliateLead[];
  onOpen: (l: AffiliateLead) => void;
  onAdvance: (l: AffiliateLead) => void;
  compact?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const totaal = leads.reduce((s, l) => s + Number(l.geschatte_waarde ?? 0), 0);
  return (
    <div
      ref={setNodeRef}
      className={`${compact ? "w-[240px]" : "w-[300px]"} shrink-0 snap-start rounded-xl border bg-muted/30 transition-colors ${isOver ? "bg-primary/10 ring-2 ring-primary/40 border-primary/40" : "border-border"}`}
    >
      <div className={`px-3 py-2.5 border-b bg-background/60 rounded-t-xl`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`h-2 w-2 rounded-full ${STATUS_KLEUR[status].split(" ")[0]}`} />
            <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground/80 truncate">
              {STATUS_LABEL[status]}
            </h3>
          </div>
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">
            {leads.length}
          </span>
        </div>
        {totaal > 0 && (
          <p className="text-[10px] text-muted-foreground mt-1 tabular-nums">
            {totaal.toLocaleString("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}
          </p>
        )}
      </div>
      <div className="p-2 space-y-2 min-h-[120px] max-h-[70vh] overflow-y-auto">
        {leads.length === 0 && (
          <p className="text-xs text-muted-foreground/70 px-1 py-6 text-center italic">Sleep hierheen</p>
        )}
        {compact
          ? leads.map((lead) => (
              <CompactKaart key={lead.id} lead={lead} onOpen={() => onOpen(lead)} />
            ))
          : leads.map((lead) => (
              <PipelineKaart
                key={lead.id}
                lead={lead}
                draggable
                onOpen={() => onOpen(lead)}
                onAdvance={() => onAdvance(lead)}
              />
            ))}
      </div>
    </div>
  );
}

function CompactKaart({ lead, onOpen }: { lead: AffiliateLead; onOpen: () => void }) {
  const drag = useDraggable({ id: lead.id });
  const style = drag.transform
    ? { transform: `translate3d(${drag.transform.x}px, ${drag.transform.y}px, 0)`, opacity: drag.isDragging ? 0.4 : 1 }
    : undefined;
  return (
    <button
      ref={drag.setNodeRef}
      style={style}
      {...drag.listeners}
      {...drag.attributes}
      onClick={onOpen}
      className="w-full text-left rounded-md border bg-card p-2 hover:bg-accent/40 cursor-grab active:cursor-grabbing touch-none"
    >
      <p className="text-sm font-medium truncate">{lead.bedrijfsnaam}</p>
      <div className="flex items-center justify-between mt-0.5 gap-2">
        <span className="text-[11px] text-muted-foreground truncate">
          {lead.contactpersoon ?? lead.plaats ?? "—"}
        </span>
        {lead.geschatte_waarde ? (
          <span className="text-[11px] tabular-nums text-muted-foreground shrink-0">
            {Number(lead.geschatte_waarde).toLocaleString("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}
          </span>
        ) : null}
      </div>
    </button>
  );
}

function LijstWeergave({ leads, onOpen }: { leads: AffiliateLead[]; onOpen: (l: AffiliateLead) => void }) {
  if (leads.length === 0) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        Geen leads gevonden. Pas filters aan of voeg een nieuwe lead toe.
      </Card>
    );
  }
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="text-left px-3 py-2 font-medium">Bedrijf</th>
              <th className="text-left px-3 py-2 font-medium">Status</th>
              <th className="text-left px-3 py-2 font-medium">Temp</th>
              <th className="text-left px-3 py-2 font-medium">Contact</th>
              <th className="text-left px-3 py-2 font-medium">Plaats</th>
              <th className="text-right px-3 py-2 font-medium">Waarde</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr
                key={l.id}
                onClick={() => onOpen(l)}
                className="border-t hover:bg-muted/40 cursor-pointer"
              >
                <td className="px-3 py-2 font-medium">{l.bedrijfsnaam}</td>
                <td className="px-3 py-2">
                  <Badge variant="secondary" className={`${STATUS_KLEUR[l.status as AffiliateLeadStatus]} text-[10px]`}>
                    {STATUS_LABEL[l.status as AffiliateLeadStatus]}
                  </Badge>
                </td>
                <td className="px-3 py-2">
                  <TemperatuurBadge temperatuur={(l.temperatuur ?? "koud") as Temperatuur} showLabel={false} />
                </td>
                <td className="px-3 py-2 text-muted-foreground">{l.contactpersoon ?? l.email ?? l.telefoon ?? "—"}</td>
                <td className="px-3 py-2 text-muted-foreground">{l.plaats ?? "—"}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {l.geschatte_waarde
                    ? Number(l.geschatte_waarde).toLocaleString("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default AffiliatePipeline;