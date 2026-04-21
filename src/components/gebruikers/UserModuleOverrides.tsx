import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CheckCircle2, XCircle } from "lucide-react";
import { CONFIGURABLE_MODULES, heeftRolDefaultToegang } from "@/lib/modules";
import type { AppRole } from "@/lib/permissions";

interface UserModuleOverridesProps {
  userId: string;
  partnerId: string;
  rol: AppRole;
  canEdit: boolean;
}

interface OverrideRow {
  module_key: string;
  toegestaan: boolean;
  reden: string | null;
}

interface MatrixRow {
  module_key: string;
  rol: AppRole;
  toegestaan: boolean;
}

type OverrideKeuze = "default" | "allow" | "deny";

const UserModuleOverrides = ({ userId, partnerId, rol, canEdit }: UserModuleOverridesProps) => {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["user-module-overrides", userId, partnerId],
    queryFn: async () => {
      const [overrides, matrix] = await Promise.all([
        supabase.from("module_user_override").select("module_key, toegestaan, reden").eq("user_id", userId),
        supabase.from("module_rol_toegang").select("module_key, rol, toegestaan").eq("partner_id", partnerId),
      ]);
      return {
        overrides: (overrides.data ?? []) as OverrideRow[],
        matrix: (matrix.data ?? []) as MatrixRow[],
      };
    },
  });

  const overrideMap = useMemo(() => {
    const m = new Map<string, OverrideRow>();
    (data?.overrides ?? []).forEach(o => m.set(o.module_key, o));
    return m;
  }, [data]);

  const matrixMap = useMemo(() => {
    const m = new Map<string, boolean>();
    (data?.matrix ?? []).filter(r => r.rol === rol).forEach(r => m.set(r.module_key, r.toegestaan));
    return m;
  }, [data, rol]);

  const setOverride = useMutation({
    mutationFn: async ({ moduleKey, keuze, reden }: { moduleKey: string; keuze: OverrideKeuze; reden?: string }) => {
      if (keuze === "default") {
        const { error } = await supabase.from("module_user_override").delete()
          .eq("user_id", userId).eq("module_key", moduleKey);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from("module_user_override").upsert({
        user_id: userId, partner_id: partnerId, module_key: moduleKey,
        toegestaan: keuze === "allow", reden: reden || null,
      }, { onConflict: "user_id,module_key" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-module-overrides", userId] });
      qc.invalidateQueries({ queryKey: ["effectieve-modules"] });
      toast.success("Module-toegang opgeslagen");
    },
    onError: (err: Error) => toast.error("Opslaan mislukt", { description: err.message }),
  });

  const groepen = useMemo(() => {
    const map = new Map<string, typeof CONFIGURABLE_MODULES>();
    for (const m of CONFIGURABLE_MODULES) {
      const arr = map.get(m.groep) ?? [];
      arr.push(m);
      map.set(m.groep, arr);
    }
    return Array.from(map.entries());
  }, []);

  if (isLoading) return <p className="text-sm text-muted-foreground">Laden...</p>;

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Module-toegang</CardTitle>
        <p className="text-xs text-muted-foreground">
          Volg standaard de organisatie-instellingen, of stel per module expliciet "toestaan" of "ontzeggen" in voor deze gebruiker.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {groepen.map(([groep, modules]) => (
          <div key={groep} className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{groep}</h4>
            <div className="space-y-2">
              {modules.map(mod => {
                const ov = overrideMap.get(mod.key);
                const matrixWaarde = matrixMap.get(mod.key);
                const sysDefault = heeftRolDefaultToegang(rol, mod.key);
                const effectiefDefault = matrixWaarde ?? sysDefault;
                const huidigeKeuze: OverrideKeuze = ov ? (ov.toegestaan ? "allow" : "deny") : "default";

                return (
                  <div key={mod.key} className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3">
                    <div className="flex-1 min-w-[160px]">
                      <p className="text-sm font-medium text-foreground">{mod.label}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {effectiefDefault ? (
                          <Badge variant="outline" className="gap-1 text-[10px]">
                            <CheckCircle2 className="h-3 w-3 text-success" /> Standaard toegang voor rol
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 text-[10px]">
                            <XCircle className="h-3 w-3 text-muted-foreground" /> Geen standaard toegang
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Select
                      value={huidigeKeuze}
                      disabled={!canEdit || setOverride.isPending}
                      onValueChange={(v) => setOverride.mutate({ moduleKey: mod.key, keuze: v as OverrideKeuze, reden: ov?.reden ?? "" })}
                    >
                      <SelectTrigger className="w-[180px] rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Volg rol-instelling</SelectItem>
                        <SelectItem value="allow">Expliciet toestaan</SelectItem>
                        <SelectItem value="deny">Expliciet ontzeggen</SelectItem>
                      </SelectContent>
                    </Select>
                    {ov && (
                      <Input
                        defaultValue={ov.reden ?? ""}
                        placeholder="Reden (optioneel)"
                        disabled={!canEdit}
                        onBlur={(e) => {
                          if ((e.target.value || "") !== (ov.reden ?? "")) {
                            setOverride.mutate({ moduleKey: mod.key, keuze: huidigeKeuze, reden: e.target.value });
                          }
                        }}
                        className="w-[200px] rounded-xl text-sm"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default UserModuleOverrides;
