import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { RotateCcw, Info } from "lucide-react";
import { CONFIGURABLE_MODULES, CONFIGURABLE_ROLES, heeftRolDefaultToegang } from "@/lib/modules";
import { ROL_LABEL } from "@/lib/permissions";
import type { AppRole } from "@/lib/permissions";

interface ModuleRolMatrixProps {
  partnerId: string;
}

interface MatrixRow {
  module_key: string;
  rol: AppRole;
  toegestaan: boolean;
}

const ModuleRolMatrix = ({ partnerId }: ModuleRolMatrixProps) => {
  const qc = useQueryClient();
  const [pending, setPending] = useState<Set<string>>(new Set());

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["module-rol-matrix", partnerId],
    queryFn: async () => {
      const { data, error } = await supabase.from("module_rol_toegang")
        .select("module_key, rol, toegestaan").eq("partner_id", partnerId);
      if (error) throw error;
      return (data ?? []) as MatrixRow[];
    },
  });

  const matrixMap = useMemo(() => {
    const m = new Map<string, boolean>();
    rows.forEach(r => m.set(`${r.module_key}::${r.rol}`, r.toegestaan));
    return m;
  }, [rows]);

  const upsert = useMutation({
    mutationFn: async ({ moduleKey, rol, toegestaan }: { moduleKey: string; rol: AppRole; toegestaan: boolean }) => {
      const { error } = await supabase.from("module_rol_toegang").upsert({
        partner_id: partnerId, module_key: moduleKey, rol, toegestaan,
      }, { onConflict: "partner_id,module_key,rol" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["module-rol-matrix", partnerId] });
      qc.invalidateQueries({ queryKey: ["effectieve-modules"] });
    },
    onError: (err: Error) => toast.error("Opslaan mislukt", { description: err.message }),
  });

  const reset = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("module_rol_toegang").delete().eq("partner_id", partnerId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["module-rol-matrix", partnerId] });
      qc.invalidateQueries({ queryKey: ["effectieve-modules"] });
      toast.success("Matrix teruggezet naar standaard");
    },
    onError: (err: Error) => toast.error("Reset mislukt", { description: err.message }),
  });

  const handleToggle = async (moduleKey: string, rol: AppRole, sysDefault: boolean) => {
    const key = `${moduleKey}::${rol}`;
    const huidig = matrixMap.get(key) ?? sysDefault;
    const nieuw = !huidig;
    setPending(prev => new Set(prev).add(key));
    try {
      await upsert.mutateAsync({ moduleKey, rol, toegestaan: nieuw });
    } finally {
      setPending(prev => { const n = new Set(prev); n.delete(key); return n; });
    }
  };

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
    <TooltipProvider>
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Modules & rollen</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Bepaal per rol welke modules zichtbaar zijn voor uw medewerkers.
              Per individuele gebruiker kunt u dit op de detailpagina nog verfijnen.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 rounded-pill"><RotateCcw className="h-4 w-4" /> Standaard</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Matrix terugzetten?</AlertDialogTitle>
                <AlertDialogDescription>
                  Hiermee verwijdert u alle aanpassingen aan de rolmatrix. De systeemstandaarden worden weer gebruikt.
                  Per-gebruiker overrides blijven behouden.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuleren</AlertDialogCancel>
                <AlertDialogAction onClick={() => reset.mutate()}>Terugzetten</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Module</th>
                  {CONFIGURABLE_ROLES.map(r => (
                    <th key={r} className="text-center py-2 px-2 font-medium text-muted-foreground min-w-[100px]">{ROL_LABEL[r]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groepen.map(([groep, modules]) => (
                  <>
                    <tr key={`groep-${groep}`}>
                      <td colSpan={CONFIGURABLE_ROLES.length + 1} className="pt-4 pb-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{groep}</span>
                      </td>
                    </tr>
                    {modules.map(mod => (
                      <tr key={mod.key} className="border-b last:border-b-0 hover:bg-muted/30">
                        <td className="py-2 pr-4">
                          <div className="flex items-center gap-1.5">
                            <span className="text-foreground">{mod.label}</span>
                            <Tooltip>
                              <TooltipTrigger asChild><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">Standaard toegang: {mod.defaultRoles.map(r => ROL_LABEL[r]).join(", ")}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </td>
                        {CONFIGURABLE_ROLES.map(rol => {
                          const key = `${mod.key}::${rol}`;
                          const sysDefault = heeftRolDefaultToegang(rol, mod.key);
                          const huidig = matrixMap.get(key) ?? sysDefault;
                          const isCustom = matrixMap.has(key);
                          return (
                            <td key={rol} className="text-center py-2 px-2">
                              <div className="flex flex-col items-center gap-0.5">
                                <Checkbox
                                  checked={huidig}
                                  disabled={pending.has(key)}
                                  onCheckedChange={() => handleToggle(mod.key, rol, sysDefault)}
                                  aria-label={`${mod.label} voor ${ROL_LABEL[rol]}`}
                                />
                                {isCustom && <Badge variant="outline" className="text-[9px] px-1 py-0">aangepast</Badge>}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default ModuleRolMatrix;
