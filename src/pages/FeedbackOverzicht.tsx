import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Settings2, MessageSquareText } from "lucide-react";
import FeedbackOverzichtKaart, {
  type OverzichtKaartItem,
} from "@/components/feedback/FeedbackOverzichtKaart";
import { STATUS_OPTIONS, type FeedbackStatus } from "@/lib/feedback/constants";

type SortKey = "nieuwste" | "meeste_stemmen";

const STATUS_CHIPS: Array<{ value: "alle" | FeedbackStatus; label: string }> = [
  { value: "alle", label: "Alles" },
  ...STATUS_OPTIONS.filter((s) => s.value !== "in_review").map((s) => ({
    value: s.value,
    label: s.label,
  })),
];

function SkeletonKaart() {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex gap-3">
        <div className="h-12 w-10 shrink-0 animate-pulse rounded-lg bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-3 w-full animate-pulse rounded bg-muted" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

export default function FeedbackOverzicht() {
  const { user, profile } = useAuth();
  const isSuperadmin = profile?.rol === "superadmin";
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [filterType, setFilterType] = useState<string>("alle");
  const [filterStatus, setFilterStatus] = useState<"alle" | FeedbackStatus>("alle");
  const [zoek, setZoek] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("nieuwste");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["feedback_verzoeken"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedback_verzoeken")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  const { data: reactieCounts = {} } = useQuery({
    queryKey: ["feedback_reactie_counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedback_reacties")
        .select("feedback_id")
        .eq("intern", false);
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach((r: any) => {
        counts[r.feedback_id] = (counts[r.feedback_id] || 0) + 1;
      });
      return counts;
    },
  });

  const { data: eigenStemmen = new Set<string>() } = useQuery({
    queryKey: ["feedback_eigen_stemmen", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedback_stemmen")
        .select("feedback_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return new Set((data || []).map((r: any) => r.feedback_id as string));
    },
  });

  const voteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error("Niet ingelogd");
      const item = items.find((i: any) => i.id === id);
      if (!item) return;
      const { error: insertErr } = await supabase
        .from("feedback_stemmen")
        .insert({ feedback_id: id, user_id: user.id });
      if (insertErr) throw insertErr;
      const { error } = await supabase
        .from("feedback_verzoeken")
        .update({ stemmen: (item.stemmen || 0) + 1 } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback_verzoeken"] });
      queryClient.invalidateQueries({ queryKey: ["feedback_eigen_stemmen"] });
      toast.success("Stem uitgebracht!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Kon stem niet opslaan");
    },
  });

  const statusTellingen = useMemo(() => {
    const t: Record<string, number> = { alle: items.length };
    items.forEach((i: any) => {
      t[i.status] = (t[i.status] || 0) + 1;
    });
    return t;
  }, [items]);

  const gefilterd = useMemo(() => {
    const zoekL = zoek.trim().toLowerCase();
    let lijst = items.filter((i: any) => {
      if (filterType !== "alle" && i.type !== filterType) return false;
      if (filterStatus !== "alle" && i.status !== filterStatus) return false;
      if (zoekL) {
        const hay = `${i.titel || ""} ${i.ai_samenvatting || ""} ${(i.ai_tags || []).join(" ")}`.toLowerCase();
        if (!hay.includes(zoekL)) return false;
      }
      return true;
    });
    if (sortKey === "meeste_stemmen") {
      lijst = [...lijst].sort((a, b) => (b.stemmen || 0) - (a.stemmen || 0));
    }
    return lijst;
  }, [items, filterType, filterStatus, zoek, sortKey]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Feedback & Verzoeken</h1>
          <p className="text-sm text-muted-foreground">
            Bekijk en stem op feedback en functieverzoeken
          </p>
        </div>
        <div className="flex gap-2">
          {isSuperadmin && (
            <Button variant="outline" onClick={() => navigate("/feedback/admin")}>
              <Settings2 className="mr-2 h-4 w-4" /> Beheer
            </Button>
          )}
          <Button onClick={() => navigate("/feedback/nieuw")}>
            <Plus className="mr-2 h-4 w-4" /> Nieuw verzoek
          </Button>
        </div>
      </div>

      {/* Filterbalk */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={zoek}
            onChange={(e) => setZoek(e.target.value)}
            placeholder="Zoek in titel, samenvatting of tags…"
            className="pl-8"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle types</SelectItem>
            <SelectItem value="feedback">Feedback</SelectItem>
            <SelectItem value="functieverzoek">Functieverzoeken</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nieuwste">Nieuwste eerst</SelectItem>
            <SelectItem value="meeste_stemmen">Meeste stemmen</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Status-chips met tellingen */}
      <div className="flex flex-wrap gap-1.5">
        {STATUS_CHIPS.map((chip) => {
          const actief = filterStatus === chip.value;
          const aantal = statusTellingen[chip.value] || 0;
          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => setFilterStatus(chip.value)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition ${
                actief
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-primary/40"
              }`}
            >
              <span>{chip.label}</span>
              <span
                className={`rounded-full px-1.5 text-[10px] font-semibold ${
                  actief
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {aantal}
              </span>
            </button>
          );
        })}
      </div>

      {/* Lijst */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonKaart key={i} />
          ))}
        </div>
      ) : gefilterd.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card/50 py-16 text-center">
          <MessageSquareText className="mb-3 h-10 w-10 text-muted-foreground/40" />
          {items.length === 0 ? (
            <>
              <p className="text-sm font-medium">Nog geen feedback</p>
              <p className="mb-4 text-xs text-muted-foreground">
                Laat ons weten wat beter kan of welke functie je mist.
              </p>
              <Button onClick={() => navigate("/feedback/nieuw")}>
                <Plus className="mr-2 h-4 w-4" /> Nieuw verzoek
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm font-medium">Geen resultaten</p>
              <p className="mb-4 text-xs text-muted-foreground">
                Geen items voldoen aan de huidige filters.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setFilterType("alle");
                  setFilterStatus("alle");
                  setZoek("");
                }}
              >
                Filters wissen
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {gefilterd.map((item: any) => {
            const kaartItem: OverzichtKaartItem = {
              id: item.id,
              titel: item.titel,
              type: item.type,
              status: item.status,
              categorie: item.categorie,
              stemmen: item.stemmen,
              ai_samenvatting: item.ai_samenvatting,
              ai_tags: item.ai_tags,
              beschrijving: item.beschrijving,
              bijlagen: item.bijlagen,
              bevestiging_status: item.bevestiging_status,
              verwacht_klaar_op: item.verwacht_klaar_op,
              verwerkt_in_versie: item.verwerkt_in_versie,
              csat_score: item.csat_score,
              created_at: item.created_at,
              user_id: item.user_id,
            };
            return (
              <FeedbackOverzichtKaart
                key={item.id}
                item={kaartItem}
                isOwn={item.user_id === user?.id}
                hasVoted={eigenStemmen.has(item.id)}
                reactieCount={reactieCounts[item.id] || 0}
                onVote={(id) => voteMutation.mutate(id)}
                onClick={() => navigate(`/feedback/${item.id}`)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
