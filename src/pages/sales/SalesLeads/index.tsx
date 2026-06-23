import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSalesLeads, useCreateSalesLead, type SalesLead } from "@/hooks/sales/useSalesLeads";
import { useMyPipeline } from "@/hooks/sales/usePipelineConfig";
import { useAffiliateGebruikers } from "@/hooks/sales/useDoorzetten";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Send, CheckCircle2, Users, Building2 } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { kleurClasses } from "@/lib/sales/pipeline";
import TemperatuurBadge from "@/components/sales/TemperatuurBadge";
import TemperatuurFilter from "@/components/sales/TemperatuurFilter";
import type { Temperatuur } from "@/lib/sales/temperatuur";
import DoorzetDialog from "../DoorzetDialog";
import BulkActieBalk from "../BulkActieBalk";

type EigenaarFilter = "alle" | "platform" | "pool" | "toegewezen";

export default function SalesLeads() {
  const navigate = useNavigate();
  const { data: leads, isLoading } = useSalesLeads();
  const { data: pipeline } = useMyPipeline();
  const { data: affiliates } = useAffiliateGebruikers();
  const create = useCreateSalesLead();
  const [zoek, setZoek] = useState("");
  const [fase, setFase] = useState<string>("alle");
  const [eigenaar, setEigenaar] = useState<EigenaarFilter>("alle");
  const [temp, setTemp] = useState<Temperatuur | "alle">("alle");
  const [postcodeFilter, setPostcodeFilter] = useState("");
  const [plaatsFilter, setPlaatsFilter] = useState("");
  const [selectie, setSelectie] = useState<Set<string>>(new Set());
  const [bulkDoorzet, setBulkDoorzet] = useState<SalesLead | null>(null);

  const fases = useMemo(() => (pipeline ?? []).filter((f) => f.zichtbaar !== false), [pipeline]);
  const faseLookup = useMemo(() => {
    const m = new Map(fases.map((f) => [f.fase_key, f]));
    return m;
  }, [fases]);
  const affiliateLookup = useMemo(() => {
    const m = new Map<string, string>();
    for (const a of affiliates ?? []) m.set(a.id, a.naam);
    return m;
  }, [affiliates]);

  const gefilterd = useMemo(() => {
    const z = zoek.toLowerCase().trim();
    const pc = postcodeFilter.toLowerCase().replace(/\s+/g, "").trim();
    const pl = plaatsFilter.toLowerCase().trim();
    return (leads ?? []).filter((l) => {
      if (fase !== "alle" && (l.fase_slug ?? "nieuw") !== fase) return false;
      if (temp !== "alle" && (l.temperatuur ?? "koud") !== temp) return false;
      if (eigenaar === "pool" && (l.eigenaar_id !== null || l.bron !== "platform_pool")) return false;
      if (eigenaar === "toegewezen" && !l.eigenaar_id) return false;
      if (eigenaar === "platform" && (l.eigenaar_id !== null || l.bron === "platform_pool")) return false;
      if (pc) {
        const leadPc = (l.postcode ?? "").toLowerCase().replace(/\s+/g, "");
        if (!leadPc.startsWith(pc)) return false;
      }
      if (pl) {
        const leadPl = (l.plaats ?? "").toLowerCase();
        if (!leadPl.includes(pl)) return false;
      }
      if (z) {
        const hay = [l.bedrijfsnaam, l.contactpersoon, l.email, l.telefoon, l.adres, l.postcode, l.plaats]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(z)) return false;
      }
      return true;
    });
  }, [leads, zoek, fase, temp, eigenaar, postcodeFilter, plaatsFilter]);

  const tempCounts = useMemo(() => {
    const c: Record<string, number> = { alle: (leads ?? []).length };
    for (const l of leads ?? []) {
      const k = (l.temperatuur ?? "koud") as string;
      c[k] = (c[k] ?? 0) + 1;
    }
    return c;
  }, [leads]);

  const counts = useMemo(() => {
    const all = leads ?? [];
    return {
      toegewezen: all.filter((l) => !!l.eigenaar_id).length,
      pool: all.filter((l) => !l.eigenaar_id && l.bron === "platform_pool").length,
      platform: all.filter((l) => !l.eigenaar_id && l.bron !== "platform_pool").length,
    };
  }, [leads]);

  const toggle = (id: string) => {
    const nieuw = new Set(selectie);
    if (nieuw.has(id)) nieuw.delete(id); else nieuw.add(id);
    setSelectie(nieuw);
  };
  const toggleAlles = () => {
    if (selectie.size === gefilterd.length) setSelectie(new Set());
    else setSelectie(new Set(gefilterd.map((l) => l.id)));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <Input
          placeholder="Zoek op bedrijf, contact, e-mail…"
          value={zoek}
          onChange={(e) => setZoek(e.target.value)}
          className="max-w-sm"
        />
        <Input
          placeholder="Postcode (bv. 1011 of 10)"
          value={postcodeFilter}
          onChange={(e) => setPostcodeFilter(e.target.value)}
          className="w-44"
        />
        <Input
          placeholder="Plaats"
          value={plaatsFilter}
          onChange={(e) => setPlaatsFilter(e.target.value)}
          className="w-40"
        />
        <Select value={fase} onValueChange={setFase}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle fases</SelectItem>
            {fases.map((f) => <SelectItem key={f.fase_key} value={f.fase_key}>{f.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={eigenaar} onValueChange={(v) => setEigenaar(v as EigenaarFilter)}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle eigenaren ({(leads ?? []).length})</SelectItem>
            <SelectItem value="toegewezen">Toegewezen aan affiliate ({counts.toegewezen})</SelectItem>
            <SelectItem value="pool">In pool ({counts.pool})</SelectItem>
            <SelectItem value="platform">Bij platform ({counts.platform})</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground ml-auto">{gefilterd.length} leads</span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => create.mutate({ bedrijfsnaam: "Nieuwe lead", sales_fase: "koud" })}
          className="gap-1"
        >
          <Plus className="h-4 w-4" /> Nieuwe lead
        </Button>
      </div>

      <TemperatuurFilter waarde={temp} onWijzig={setTemp} counts={tempCounts as never} />

      <BulkActieBalk geselecteerd={Array.from(selectie)} onClear={() => setSelectie(new Set())} />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">
                <Checkbox
                  checked={selectie.size > 0 && selectie.size === gefilterd.length}
                  onCheckedChange={toggleAlles}
                />
              </TableHead>
              <TableHead>Bedrijf</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Locatie</TableHead>
              <TableHead>Temperatuur</TableHead>
              <TableHead>Fase</TableHead>
              <TableHead>Status / eigenaar</TableHead>
              <TableHead className="text-right">Acties</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Laden…</TableCell></TableRow>
            )}
            {!isLoading && gefilterd.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Geen leads gevonden</TableCell></TableRow>
            )}
            {gefilterd.map((l) => {
              const f = faseLookup.get(l.fase_slug ?? "nieuw");
              const isDoorgezet = !!l.eigenaar_id;
              const isPool = !l.eigenaar_id && l.bron === "platform_pool";
              const affiliateNaam = l.eigenaar_id ? (affiliateLookup.get(l.eigenaar_id) ?? "Affiliate") : null;
              return (
                <TableRow
                  key={l.id}
                  className={`cursor-pointer ${isDoorgezet ? "bg-emerald-50/40 hover:bg-emerald-50/70" : ""}`}
                  onClick={() => navigate(`/sales/leads/${l.id}`)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={selectie.has(l.id)} onCheckedChange={() => toggle(l.id)} />
                  </TableCell>
                  <TableCell className="font-medium">{l.bedrijfsnaam}</TableCell>
                  <TableCell className="text-sm">
                    <div>{l.contactpersoon}</div>
                    <div className="text-xs text-muted-foreground">{l.email || l.telefoon}</div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div>{l.plaats || l.regio || "—"}</div>
                    {(l.adres || l.postcode) && (
                      <div className="text-xs text-muted-foreground">
                        {[l.adres, l.postcode].filter(Boolean).join(" · ")}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <TemperatuurBadge temperatuur={(l.temperatuur ?? "koud") as Temperatuur} />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={kleurClasses(f?.kleur ?? "slate")}>
                      {f?.label ?? (l.fase_slug ?? "Nieuw")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {isDoorgezet ? (
                      <div className="flex flex-col gap-0.5">
                        <Badge className="w-fit gap-1 bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100">
                          <CheckCircle2 className="h-3 w-3" />
                          Doorgezet
                        </Badge>
                        <span className="text-xs font-medium">{affiliateNaam}</span>
                        {l.doorgezet_op && (
                          <span className="text-[11px] text-muted-foreground">
                            {format(new Date(l.doorgezet_op as string), "d MMM yyyy", { locale: nl })}
                          </span>
                        )}
                      </div>
                    ) : isPool ? (
                      <Badge variant="outline" className="gap-1 border-amber-300 text-amber-800 bg-amber-50">
                        <Users className="h-3 w-3" /> In pool
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-muted-foreground">
                        <Building2 className="h-3 w-3" /> Platform
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant={isDoorgezet ? "ghost" : "outline"}
                      className="gap-1"
                      onClick={() => setBulkDoorzet(l)}
                    >
                      <Send className="h-3.5 w-3.5" />
                      {isDoorgezet ? "Heropnieuw" : "Doorzet"}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <DoorzetDialog lead={bulkDoorzet} open={!!bulkDoorzet} onOpenChange={(o) => !o && setBulkDoorzet(null)} />
    </div>
  );
}