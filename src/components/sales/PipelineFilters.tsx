import { useMemo } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLeadBronnen } from "@/hooks/sales/useLeadBronnen";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export type PeriodeKey = "alle" | "vandaag" | "week" | "maand" | "30d" | "kwartaal";

export const PERIODE_LABEL: Record<PeriodeKey, string> = {
  alle: "Alle periodes",
  vandaag: "Vandaag",
  week: "Deze week",
  maand: "Deze maand",
  "30d": "Laatste 30 dagen",
  kwartaal: "Dit kwartaal",
};

export interface PipelineFilterState {
  periode: PeriodeKey;
  bronId: string; // "" = alle
  eigenaarId: string; // "" = alle, "geen" = zonder eigenaar
  zoek: string;
}

export const LEGE_FILTERS: PipelineFilterState = {
  periode: "alle",
  bronId: "",
  eigenaarId: "",
  zoek: "",
};

export function periodeGrensISO(p: PeriodeKey): string | null {
  const nu = new Date();
  const d = new Date(nu);
  d.setHours(0, 0, 0, 0);
  if (p === "vandaag") return d.toISOString();
  if (p === "week") {
    const dag = d.getDay() === 0 ? 6 : d.getDay() - 1; // maandag als start
    d.setDate(d.getDate() - dag);
    return d.toISOString();
  }
  if (p === "maand") {
    d.setDate(1);
    return d.toISOString();
  }
  if (p === "30d") {
    d.setDate(d.getDate() - 30);
    return d.toISOString();
  }
  if (p === "kwartaal") {
    const q = Math.floor(d.getMonth() / 3) * 3;
    d.setMonth(q, 1);
    return d.toISOString();
  }
  return null;
}

interface Props {
  waarde: PipelineFilterState;
  onWijzig: (patch: Partial<PipelineFilterState>) => void;
  eigenaarIds: string[];
}

/** Compacte filterbalk boven de sales-pipeline. */
export default function PipelineFilters({ waarde, onWijzig, eigenaarIds }: Props) {
  const { data: bronnen } = useLeadBronnen();
  const { data: eigenaren } = useQuery({
    queryKey: ["sales-pipeline-eigenaren", eigenaarIds.sort().join(",")],
    enabled: eigenaarIds.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, voornaam, achternaam, email")
        .in("id", eigenaarIds);
      if (error) throw error;
      return data ?? [];
    },
  });

  const heeftFilters = useMemo(
    () =>
      waarde.periode !== "alle" ||
      waarde.bronId !== "" ||
      waarde.eigenaarId !== "" ||
      waarde.zoek.trim() !== "",
    [waarde],
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={waarde.zoek}
          onChange={(e) => onWijzig({ zoek: e.target.value })}
          placeholder="Zoek bedrijf, contact, e-mail…"
          className="h-8 pl-8 w-52"
        />
      </div>

      <Select value={waarde.periode} onValueChange={(v) => onWijzig({ periode: v as PeriodeKey })}>
        <SelectTrigger className="h-8 w-40">
          <SelectValue placeholder="Periode" />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(PERIODE_LABEL) as PeriodeKey[]).map((k) => (
            <SelectItem key={k} value={k}>
              {PERIODE_LABEL[k]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={waarde.bronId === "" ? "__alle" : waarde.bronId}
        onValueChange={(v) => onWijzig({ bronId: v === "__alle" ? "" : v })}
      >
        <SelectTrigger className="h-8 w-40">
          <SelectValue placeholder="Bron" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__alle">Alle bronnen</SelectItem>
          {(bronnen ?? []).map((b) => (
            <SelectItem key={b.id} value={b.id}>
              {b.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={waarde.eigenaarId === "" ? "__alle" : waarde.eigenaarId}
        onValueChange={(v) => onWijzig({ eigenaarId: v === "__alle" ? "" : v })}
      >
        <SelectTrigger className="h-8 w-44">
          <SelectValue placeholder="Eigenaar" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__alle">Alle eigenaren</SelectItem>
          <SelectItem value="geen">Nog niet toegewezen</SelectItem>
          {(eigenaren ?? []).map((u) => (
            <SelectItem key={u.id} value={u.id}>
              {[u.voornaam, u.achternaam].filter(Boolean).join(" ") || u.email}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {heeftFilters && (
        <Button
          size="sm"
          variant="ghost"
          className="h-8 gap-1 text-muted-foreground"
          onClick={() =>
            onWijzig({ periode: "alle", bronId: "", eigenaarId: "", zoek: "" })
          }
        >
          <X className="h-3.5 w-3.5" /> Wissen
        </Button>
      )}
    </div>
  );
}