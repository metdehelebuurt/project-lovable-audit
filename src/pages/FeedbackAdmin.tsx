import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Archive, KanbanSquare, List, Settings, Search } from "lucide-react";
import FeedbackKaart, { type FeedbackKaartItem } from "@/components/feedback/FeedbackKaart";
import FeedbackKanban from "@/components/feedback/FeedbackKanban";
import {
  CATEGORIE_OPTIES,
  STATUS_OPTIONS,
  type FeedbackStatus,
} from "@/lib/feedback/constants";

type Sortering = "nieuwste" | "oudste" | "stemmen" | "prioriteit";
const PRIO_RANG: Record<string, number> = { kritiek: 0, hoog: 1, normaal: 2, laag: 3 };

export default function FeedbackAdmin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"kanban" | "lijst">("kanban");
  const [filterCat, setFilterCat] = useState("alle");
  const [filterStatus, setFilterStatus] = useState("alle");
  const [zoek, setZoek] = useState("");
  const [sortering, setSortering] = useState<Sortering>("nieuwste");
  const [toonGearchiveerd, setToonGearchiveerd] = useState(false);
  const [geselecteerd, setGeselecteerd] = useState<Set<string>>(new Set());

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["feedback_admin_v2", toonGearchiveerd],
    queryFn: async () => {
      let q = supabase
        .from("feedback_verzoeken")
        .select(
          "id, titel, type, status, categorie, prioriteit, stemmen, ai_samenvatting, bevestiging_status, gearchiveerd, created_at, user_id, csat_score",
        )
        .order("created_at", { ascending: false });
      if (!toonGearchiveerd) q = q.eq("gearchiveerd", false);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const userIds = useMemo(
    () => Array.from(new Set(rows.map((r) => r.user_id).filter(Boolean))) as string[],
    [rows],
  );
  const { data: usersMap = {} } = useQuery({
    queryKey: ["feedback_admin_indieners", userIds.sort().join(",")],
    enabled: userIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("users")
        .select("id, voornaam, achternaam, email")
        .in("id", userIds);
      const map: Record<string, { naam: string }> = {};
      (data ?? []).forEach((u: any) => {
        map[u.id] = {
          naam:
            [u.voornaam, u.achternaam].filter(Boolean).join(" ").trim() ||
            u.email ||
            "Onbekend",
        };
      });
      return map;
    },
  });

  const items: FeedbackKaartItem[] = useMemo(() => {
    const enriched = rows.map((r: any) => ({
      ...r,
      indienerNaam: usersMap[r.user_id]?.naam,
    }));
    let f = enriched;
    if (filterCat !== "alle") f = f.filter((i) => i.categorie === filterCat);
    if (filterStatus !== "alle") f = f.filter((i) => i.status === filterStatus);
    if (zoek.trim()) {
      const z = zoek.toLowerCase();
      f = f.filter(
        (i) =>
          i.titel?.toLowerCase().includes(z) ||
          i.ai_samenvatting?.toLowerCase().includes(z) ||
          i.indienerNaam?.toLowerCase().includes(z),
      );
    }
    f = [...f].sort((a, b) => {
      switch (sortering) {
        case "oudste":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "stemmen":
          return (b.stemmen ?? 0) - (a.stemmen ?? 0);
        case "prioriteit":
          return (PRIO_RANG[a.prioriteit ?? "normaal"] ?? 4) - (PRIO_RANG[b.prioriteit ?? "normaal"] ?? 4);
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
    return f;
  }, [rows, usersMap, filterCat, filterStatus, zoek, sortering]);

  const stats = useMemo(() => {
    const open = rows.filter((r: any) => !r.gearchiveerd);
    return {
      wachtOpMij: open.filter((r: any) => r.status === "nieuw" || r.status === "in_behandeling").length,
      wachtOpIndiener: open.filter((r: any) => r.status === "in_review").length,
      gepland: open.filter((r: any) => r.status === "gepland").length,
      openBugs: open.filter((r: any) => r.categorie === "bug" && r.status !== "afgerond" && r.status !== "afgewezen").length,
    };
  }, [rows]);

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: FeedbackStatus }) => {
      const oude = rows.find((r) => r.id === id)?.status ?? "";
      const update: Record<string, unknown> = { status };
      if (status === "afgerond" || status === "in_review") {
        update.bevestiging_status = "wachten_op_indiener";
      }
      const { error } = await supabase.from("feedback_verzoeken").update(update as never).eq("id", id);
      if (error) throw error;
      supabase.functions.invoke("feedback-notify", {
        body: { event: "status_wijziging", feedback_id: id, oude_status: oude, nieuwe_status: status },
      }).catch(console.error);
      if (status === "afgerond" || status === "in_review") {
        supabase.functions.invoke("feedback-notify", {
          body: { event: "bevestiging_gevraagd", feedback_id: id },
        }).catch(console.error);
      }
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ["feedback_admin_v2"] });
      toast.success(`Verplaatst naar "${STATUS_OPTIONS.find((s) => s.value === vars.status)?.label}"`);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Mislukt"),
  });

  const bulkArchief = async (gearchiveerd: boolean) => {
    const ids = Array.from(geselecteerd);
    if (ids.length === 0) return;
    const { error } = await supabase
      .from("feedback_verzoeken")
      .update({ gearchiveerd })
      .in("id", ids);
    if (error) return toast.error(error.message);
    setGeselecteerd(new Set());
    queryClient.invalidateQueries({ queryKey: ["feedback_admin_v2"] });
    toast.success(gearchiveerd ? `${ids.length} gearchiveerd` : `${ids.length} hersteld`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Feedback Beheer</h1>
          <p className="text-muted-foreground">
            Pipeline voor alle feedback en functieverzoeken
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/feedback/notificatie-instellingen">
            <Settings className="h-4 w-4 mr-2" /> Meldinginstellingen
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiKaart label="Wacht op mij" value={stats.wachtOpMij} accent="text-primary" />
        <KpiKaart label="Wacht op indiener" value={stats.wachtOpIndiener} accent="text-violet-600" />
        <KpiKaart label="Gepland" value={stats.gepland} accent="text-blue-600" />
        <KpiKaart label="Open bugs" value={stats.openBugs} accent="text-destructive" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={zoek}
            onChange={(e) => setZoek(e.target.value)}
            placeholder="Zoek op titel, samenvatting of indiener…"
            className="pl-8"
          />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle categorieën</SelectItem>
            {CATEGORIE_OPTIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle statussen</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortering} onValueChange={(v) => setSortering(v as Sortering)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="nieuwste">Nieuwste eerst</SelectItem>
            <SelectItem value="oudste">Oudste eerst</SelectItem>
            <SelectItem value="stemmen">Meeste stemmen</SelectItem>
            <SelectItem value="prioriteit">Prioriteit</SelectItem>
          </SelectContent>
        </Select>
        <label className="flex items-center gap-2 text-xs">
          <Switch checked={toonGearchiveerd} onCheckedChange={setToonGearchiveerd} />
          Toon gearchiveerd
        </label>
      </div>

      {geselecteerd.size > 0 && (
        <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-md px-3 py-2 text-sm">
          <span>{geselecteerd.size} geselecteerd</span>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setGeselecteerd(new Set())}>
              Wis selectie
            </Button>
            {toonGearchiveerd ? (
              <Button size="sm" variant="outline" onClick={() => bulkArchief(false)}>
                <Archive className="h-4 w-4 mr-1" /> Herstel
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => bulkArchief(true)}>
                <Archive className="h-4 w-4 mr-1" /> Archiveer
              </Button>
            )}
          </div>
        </div>
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as "kanban" | "lijst")}>
        <TabsList>
          <TabsTrigger value="kanban"><KanbanSquare className="h-4 w-4 mr-1" /> Pipeline</TabsTrigger>
          <TabsTrigger value="lijst"><List className="h-4 w-4 mr-1" /> Lijst</TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="mt-4">
          {isLoading ? (
            <p className="text-center text-muted-foreground py-12">Laden…</p>
          ) : (
            <FeedbackKanban
              items={items}
              onCardClick={(id) => navigate(`/feedback/admin/${id}`)}
              onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
            />
          )}
        </TabsContent>

        <TabsContent value="lijst" className="mt-4">
          {isLoading ? (
            <p className="text-center text-muted-foreground py-12">Laden…</p>
          ) : items.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              Geen feedback gevonden met de huidige filters.
            </CardContent></Card>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {items.map((i) => (
                <FeedbackKaart
                  key={i.id}
                  item={i}
                  selected={geselecteerd.has(i.id)}
                  onSelect={(id, sel) => {
                    setGeselecteerd((prev) => {
                      const next = new Set(prev);
                      if (sel) next.add(id); else next.delete(id);
                      return next;
                    });
                  }}
                  onClick={() => navigate(`/feedback/admin/${i.id}`)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KpiKaart({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <Card>
      <CardContent className="pt-4 text-center">
        <p className={`text-2xl font-bold ${accent}`}>{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
