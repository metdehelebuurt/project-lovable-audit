import { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSalesLeads, type SalesLead } from "@/hooks/sales/useSalesLeads";
import { useMyPipeline } from "@/hooks/sales/usePipelineConfig";
import { useAffiliateGebruikers, useSalesManagerGebruikers } from "@/hooks/sales/useDoorzetten";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Send, CheckCircle2, Users, Building2, UserCircle2, Briefcase, ArrowUpDown, Sparkles, Search, Tag as TagIcon, X } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { kleurClasses } from "@/lib/sales/pipeline";
import TemperatuurBadge from "@/components/sales/TemperatuurBadge";
import TemperatuurFilter from "@/components/sales/TemperatuurFilter";
import type { Temperatuur } from "@/lib/sales/temperatuur";
import DoorzetDialog from "../DoorzetDialog";
import BulkActieBalk from "../BulkActieBalk";
import TagChips from "@/components/sales/TagChips";
import { normaliseerTag } from "@/components/sales/TagsInput";
import { AffiliateDuplicatenBanner } from "@/components/affiliate/duplicaten/AffiliateDuplicatenBanner";
import NieuweSalesLeadDialog from "./NieuweSalesLeadDialog";

type EigenaarFilter = "alle" | "platform" | "pool" | "toegewezen";
type SorteerVeld = "updated" | "doorgezet" | "naam" | "eigenaar" | "aangemaakt";
type SorteerRichting = "asc" | "desc";

export default function SalesLeads() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { data: leads, isLoading } = useSalesLeads();
  const { data: pipeline } = useMyPipeline();
  const { data: affiliates } = useAffiliateGebruikers();
  const { data: salesManagers } = useSalesManagerGebruikers();
  const [nieuwOpen, setNieuwOpen] = useState(false);
  const [zoek, setZoek] = useState("");
  const [fase, setFase] = useState<string>("alle");
  const [eigenaar, setEigenaar] = useState<EigenaarFilter>("alle");
  const [temp, setTemp] = useState<Temperatuur | "alle">("alle");
  const [postcodeFilter, setPostcodeFilter] = useState("");
  const [plaatsFilter, setPlaatsFilter] = useState("");
  const [doorgezetAan, setDoorgezetAan] = useState<string>("alle");
  const [selectie, setSelectie] = useState<Set<string>>(new Set());
  const [bulkDoorzet, setBulkDoorzet] = useState<SalesLead | null>(null);
  const [sorteer, setSorteer] = useState<SorteerVeld>("updated");
  const [richting, setRichting] = useState<SorteerRichting>("desc");
  const [recentDoorgezet, setRecentDoorgezet] = useState<Set<string>>(new Set());
  const [tagFilters, setTagFilters] = useState<string[]>(() => {
    const raw = params.get("tag");
    if (!raw) return [];
    return raw
      .split(",")
      .map((t) => normaliseerTag(t))
      .filter((t): t is string => t !== null);
  });

  // Synchroniseer tag-filter met URL zodat delen en detail-links werken.
  useEffect(() => {
    const huidig = new URLSearchParams(params);
    if (tagFilters.length === 0) huidig.delete("tag");
    else huidig.set("tag", tagFilters.join(","));
    if ((huidig.get("tag") ?? "") !== (params.get("tag") ?? "")) {
      setParams(huidig, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagFilters]);

  const voegTagFilterToe = (tag: string) => {
    const genormaliseerd = normaliseerTag(tag);
    if (!genormaliseerd) return;
    setTagFilters((prev) => (prev.includes(genormaliseerd) ? prev : [...prev, genormaliseerd]));
  };
  const verwijderTagFilter = (tag: string) => {
    setTagFilters((prev) => prev.filter((t) => t !== tag));
  };

  // Alle tags die in de dataset voorkomen — voor tellingen en (later) suggesties.
  const alleTags = useMemo(() => {
    const c = new Map<string, number>();
    for (const l of leads ?? []) {
      for (const t of l.tags ?? []) {
        const n = normaliseerTag(t);
        if (!n) continue;
        c.set(n, (c.get(n) ?? 0) + 1);
      }
    }
    return Array.from(c.entries()).sort((a, b) => b[1] - a[1]);
  }, [leads]);

  /** Vlag leads als 'net doorgezet' voor ~6s zodat er een duidelijke inline chip verschijnt. */
  const markeerDoorgezet = (ids: string[] | string) => {
    const arr = Array.isArray(ids) ? ids : [ids];
    setRecentDoorgezet((prev) => {
      const n = new Set(prev);
      arr.forEach((id) => n.add(id));
      return n;
    });
  };
  useEffect(() => {
    if (recentDoorgezet.size === 0) return;
    const t = setTimeout(() => setRecentDoorgezet(new Set()), 6000);
    return () => clearTimeout(t);
  }, [recentDoorgezet]);

  const fases = useMemo(() => (pipeline ?? []).filter((f) => f.zichtbaar !== false), [pipeline]);
  const faseLookup = useMemo(() => {
    const m = new Map(fases.map((f) => [f.fase_key, f]));
    return m;
  }, [fases]);
  /** Lookup van alle mogelijke eigenaren — affiliate of sales manager — met hun rol. */
  const eigenaarLookup = useMemo(() => {
    const m = new Map<string, { naam: string; rol: "affiliate" | "sales_manager" }>();
    for (const a of affiliates ?? []) m.set(a.id, { naam: a.naam, rol: "affiliate" });
    for (const s of salesManagers ?? []) m.set(s.id, { naam: s.naam, rol: "sales_manager" });
    return m;
  }, [affiliates, salesManagers]);

  const gefilterd = useMemo(() => {
    const z = zoek.toLowerCase().trim();
    const pc = postcodeFilter.toLowerCase().replace(/\s+/g, "").trim();
    const pl = plaatsFilter.toLowerCase().trim();
    const lijst = (leads ?? []).filter((l) => {
      if (fase !== "alle" && (l.fase_slug ?? "nieuw") !== fase) return false;
      if (temp !== "alle" && (l.temperatuur ?? "koud") !== temp) return false;
      if (eigenaar === "pool" && (l.eigenaar_id !== null || l.bron !== "platform_pool")) return false;
      if (eigenaar === "toegewezen" && !l.eigenaar_id) return false;
      if (eigenaar === "platform" && (l.eigenaar_id !== null || l.bron === "platform_pool")) return false;
      if (doorgezetAan !== "alle" && l.eigenaar_id !== doorgezetAan) return false;
      if (tagFilters.length > 0) {
        const leadTags = new Set((l.tags ?? []).map((t) => normaliseerTag(t)).filter(Boolean) as string[]);
        for (const t of tagFilters) if (!leadTags.has(t)) return false;
      }
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
    const richtingFactor = richting === "asc" ? 1 : -1;
    const naamVan = (l: SalesLead) => (l.bedrijfsnaam ?? "").toLowerCase();
    const eigenaarVan = (l: SalesLead) =>
      (l.eigenaar_id ? eigenaarLookup.get(l.eigenaar_id)?.naam ?? "zzz" : "zzz_onbekend").toLowerCase();
    const tijdVan = (v: string | null | undefined) => (v ? new Date(v).getTime() : 0);
    const sorted = [...lijst].sort((a, b) => {
      switch (sorteer) {
        case "naam":
          return naamVan(a).localeCompare(naamVan(b)) * richtingFactor;
        case "eigenaar":
          return eigenaarVan(a).localeCompare(eigenaarVan(b)) * richtingFactor;
        case "aangemaakt":
          return (tijdVan(a.created_at) - tijdVan(b.created_at)) * richtingFactor;
        case "doorgezet":
          return (tijdVan(a.doorgezet_op as string | null) - tijdVan(b.doorgezet_op as string | null)) * richtingFactor;
        case "updated":
        default:
          return (tijdVan(a.updated_at) - tijdVan(b.updated_at)) * richtingFactor;
      }
    });
    return sorted;
  }, [leads, zoek, fase, temp, eigenaar, postcodeFilter, plaatsFilter, doorgezetAan, sorteer, richting, eigenaarLookup, tagFilters]);

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

  /** Tellingen per eigenaar voor de "Doorgezet aan"-filter. */
  const perEigenaarCounts = useMemo(() => {
    const c = new Map<string, number>();
    for (const l of leads ?? []) {
      if (!l.eigenaar_id) continue;
      c.set(l.eigenaar_id, (c.get(l.eigenaar_id) ?? 0) + 1);
    }
    return c;
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
      <AffiliateDuplicatenBanner />
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative max-w-sm flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Zoek op bedrijf, contact, e-mail, adres…"
            value={zoek}
            onChange={(e) => setZoek(e.target.value)}
            className="pl-8"
          />
        </div>
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
        <Select value={doorgezetAan} onValueChange={setDoorgezetAan}>
          <SelectTrigger className="w-52"><SelectValue placeholder="Doorgezet aan" /></SelectTrigger>
          <SelectContent className="max-h-80">
            <SelectItem value="alle">Doorgezet aan: iedereen</SelectItem>
            {(affiliates ?? []).length > 0 && (
              <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Affiliates</div>
            )}
            {(affiliates ?? []).map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.naam} {perEigenaarCounts.get(a.id) ? `(${perEigenaarCounts.get(a.id)})` : ""}
              </SelectItem>
            ))}
            {(salesManagers ?? []).length > 0 && (
              <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Sales managers</div>
            )}
            {(salesManagers ?? []).map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.naam} {perEigenaarCounts.get(s.id) ? `(${perEigenaarCounts.get(s.id)})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sorteer} onValueChange={(v) => setSorteer(v as SorteerVeld)}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Sorteer op" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="updated">Sorteer: laatst gewijzigd</SelectItem>
            <SelectItem value="aangemaakt">Sorteer: aangemaakt</SelectItem>
            <SelectItem value="doorgezet">Sorteer: doorgezet op</SelectItem>
            <SelectItem value="naam">Sorteer: bedrijfsnaam</SelectItem>
            <SelectItem value="eigenaar">Sorteer: eigenaar</SelectItem>
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant="outline"
          className="gap-1"
          onClick={() => setRichting((r) => (r === "asc" ? "desc" : "asc"))}
          title={richting === "asc" ? "Oplopend" : "Aflopend"}
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
          {richting === "asc" ? "A→Z / oud→nieuw" : "Z→A / nieuw→oud"}
        </Button>
        <span className="text-sm text-muted-foreground ml-auto">{gefilterd.length} leads</span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setNieuwOpen(true)}
          className="gap-1"
        >
          <Plus className="h-4 w-4" /> Nieuwe lead
        </Button>
      </div>

      <NieuweSalesLeadDialog open={nieuwOpen} onOpenChange={setNieuwOpen} />

      <TemperatuurFilter waarde={temp} onWijzig={setTemp} counts={tempCounts as never} />

      {(tagFilters.length > 0 || alleTags.length > 0) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <TagIcon className="h-3.5 w-3.5" /> Tags:
          </span>
          {tagFilters.map((t) => (
            <Badge
              key={`sel-${t}`}
              className="gap-1 bg-purple-600 hover:bg-purple-600 text-white cursor-pointer"
              onClick={() => verwijderTagFilter(t)}
              title="Klik om filter te verwijderen"
            >
              #{t} <X className="h-3 w-3" />
            </Badge>
          ))}
          {alleTags
            .filter(([t]) => !tagFilters.includes(t))
            .slice(0, 12)
            .map(([t, n]) => (
              <Badge
                key={t}
                variant="outline"
                className="cursor-pointer hover:bg-purple-50 border-purple-200 text-purple-800"
                onClick={() => voegTagFilterToe(t)}
              >
                #{t} <span className="ml-1 text-[10px] text-muted-foreground">{n}</span>
              </Badge>
            ))}
          {tagFilters.length > 0 && (
            <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setTagFilters([])}>
              Wis tag-filter
            </Button>
          )}
        </div>
      )}

      <BulkActieBalk
        geselecteerd={Array.from(selectie)}
        onClear={() => setSelectie(new Set())}
        onDoorgezet={markeerDoorgezet}
      />

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
              const eigenaarInfo = l.eigenaar_id ? eigenaarLookup.get(l.eigenaar_id) : null;
              const eigenaarNaam = eigenaarInfo?.naam ?? (isDoorgezet ? "Onbekende gebruiker" : null);
              const eigenaarRol = eigenaarInfo?.rol;
              const netDoorgezet = recentDoorgezet.has(l.id);
              return (
                <TableRow
                  key={l.id}
                  className={`cursor-pointer transition-colors ${
                    netDoorgezet
                      ? "bg-emerald-100/70 hover:bg-emerald-100 ring-1 ring-inset ring-emerald-300"
                      : isDoorgezet
                        ? "bg-emerald-50/40 hover:bg-emerald-50/70"
                        : ""
                  }`}
                  onClick={() => navigate(`/sales/leads/${l.id}`)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={selectie.has(l.id)} onCheckedChange={() => toggle(l.id)} />
                  </TableCell>
                  <TableCell className="font-medium">{l.bedrijfsnaam}</TableCell>
                  <TableCell className="text-sm">
                    <div>{l.contactpersoon}</div>
                    {l.email && (
                      <div className="text-xs text-muted-foreground truncate">{l.email}</div>
                    )}
                    {l.telefoon && (
                      <div className="text-xs text-muted-foreground">{l.telefoon}</div>
                    )}
                    {(l.tags ?? []).length > 0 && (
                      <TagChips tags={l.tags} onKlik={voegTagFilterToe} max={4} className="pt-1" />
                    )}
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
                    {netDoorgezet && (
                      <Badge className="mb-1 w-fit gap-1 bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-600 animate-pulse">
                        <Sparkles className="h-3 w-3" /> Net doorgezet
                      </Badge>
                    )}
                    {isDoorgezet ? (
                      <div className="flex flex-col gap-0.5">
                        <Badge className="w-fit gap-1 bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100">
                          <CheckCircle2 className="h-3 w-3" />
                          Doorgezet
                        </Badge>
                        <span className="text-sm font-semibold leading-tight">{eigenaarNaam}</span>
                        {eigenaarRol && (
                          <Badge
                            variant="outline"
                            className={`w-fit gap-1 text-[10px] py-0 h-4 ${
                              eigenaarRol === "sales_manager"
                                ? "border-violet-300 text-violet-800 bg-violet-50"
                                : "border-sky-300 text-sky-800 bg-sky-50"
                            }`}
                          >
                            {eigenaarRol === "sales_manager" ? (
                              <><Briefcase className="h-2.5 w-2.5" /> Sales manager</>
                            ) : (
                              <><UserCircle2 className="h-2.5 w-2.5" /> Affiliate</>
                            )}
                          </Badge>
                        )}
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
                      variant={isDoorgezet ? "outline" : "default"}
                      className="gap-1"
                      onClick={() => setBulkDoorzet(l)}
                    >
                      <Send className="h-3.5 w-3.5" />
                      {isDoorgezet ? "Wijzig toewijzing" : "Doorzetten"}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <DoorzetDialog
        lead={bulkDoorzet}
        open={!!bulkDoorzet}
        onOpenChange={(o) => !o && setBulkDoorzet(null)}
        onDoorgezet={(id) => markeerDoorgezet(id)}
      />
    </div>
  );
}