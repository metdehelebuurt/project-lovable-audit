import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Shield, UserCog, FileText, Mail, ChevronDown, ChevronRight, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMemo, useState } from "react";
import { MODULES } from "@/lib/modules";

interface AuditTijdlijnProps {
  targetUserId: string;
}

const ICONS: Record<string, any> = {
  gebruiker_aangemaakt: UserCog,
  gebruiker_gewijzigd: UserCog,
  uitnodiging_verstuurd: Mail,
  permissies_gewijzigd: Shield,
  rol_gewijzigd: Shield,
  module_override_toegevoegd: Shield,
  module_override_gewijzigd: Shield,
  module_override_verwijderd: Shield,
  default: Activity,
};

const LABELS: Record<string, string> = {
  gebruiker_aangemaakt: "Account aangemaakt",
  gebruiker_gewijzigd: "Profiel gewijzigd",
  uitnodiging_verstuurd: "Uitnodiging verstuurd",
  uitnodiging_opnieuw: "Uitnodiging opnieuw verstuurd",
  permissies_gewijzigd: "Permissies gewijzigd",
  rol_gewijzigd: "Rol gewijzigd",
  status_gewijzigd: "Status gewijzigd",
  wachtwoord_gereset: "Wachtwoord gereset",
  sessie_uitgelogd: "Sessie geforceerd uitgelogd",
  afwezigheid_toegevoegd: "Afwezigheid toegevoegd",
  module_override_toegevoegd: "Module-override toegevoegd",
  module_override_gewijzigd: "Module-override gewijzigd",
  module_override_verwijderd: "Module-override verwijderd",
  module_rol_gewijzigd: "Module-rolmatrix gewijzigd",
};

const ENTITY_LABELS: Record<string, string> = {
  module_user_override: "Per gebruiker",
  module_rol_toegang: "Rolmatrix",
  users: "Gebruiker",
  gebruiker_permissies: "Permissies",
};

function extractModuleKey(item: any): string | null {
  return (
    item?.nieuwe_waarde?.module ??
    item?.nieuwe_waarde?.module_key ??
    item?.oude_waarde?.module ??
    item?.oude_waarde?.module_key ??
    null
  );
}

export const AuditTijdlijn = ({ targetUserId }: AuditTijdlijnProps) => {
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["audit-log", targetUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_log")
        .select("id, actie, entity_type, oude_waarde, nieuwe_waarde, created_at, actor_id")
        .eq("target_user_id", targetUserId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    return items.filter((item: any) => {
      if (moduleFilter !== "all" && extractModuleKey(item) !== moduleFilter) return false;
      if (entityFilter !== "all" && item.entity_type !== entityFilter) return false;
      return true;
    });
  }, [items, moduleFilter, entityFilter]);

  const beschikbareModules = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i: any) => {
      const k = extractModuleKey(i);
      if (k) set.add(k);
    });
    return Array.from(set);
  }, [items]);

  const beschikbareEntities = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i: any) => i.entity_type && set.add(i.entity_type));
    return Array.from(set);
  }, [items]);

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader>
        <div className="flex flex-col gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> Activiteit & audit
          </CardTitle>
          {items.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="h-8 w-[160px] text-xs">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle types</SelectItem>
                  {beschikbareEntities.map((e) => (
                    <SelectItem key={e} value={e}>{ENTITY_LABELS[e] ?? e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={moduleFilter} onValueChange={setModuleFilter}>
                <SelectTrigger className="h-8 w-[180px] text-xs">
                  <SelectValue placeholder="Module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle modules</SelectItem>
                  {beschikbareModules.map((m) => {
                    const def = MODULES.find((x) => x.key === m);
                    return <SelectItem key={m} value={m}>{def?.label ?? m}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
              {(moduleFilter !== "all" || entityFilter !== "all") && (
                <Button variant="ghost" size="sm" className="h-8 text-xs"
                  onClick={() => { setModuleFilter("all"); setEntityFilter("all"); }}>
                  Reset
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Laden...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-40" />
            {items.length === 0 ? "Nog geen activiteit geregistreerd" : "Geen items voor deze filter"}
          </div>
        ) : (
          <ol className="space-y-3 relative">
            {filtered.map((item: any) => {
              const Icon = ICONS[item.actie] ?? ICONS.default;
              const label = LABELS[item.actie] ?? item.actie;
              const isOpen = openId === item.id;
              const moduleKey = extractModuleKey(item);
              const moduleDef = moduleKey ? MODULES.find((m) => m.key === moduleKey) : null;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : item.id)}
                    className="w-full flex gap-3 items-start text-left rounded-lg hover:bg-muted/50 p-2 -m-2 transition-colors"
                    aria-expanded={isOpen}
                  >
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="text-sm font-medium text-foreground flex items-center gap-1">
                          {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                          {label}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.created_at).toLocaleString("nl-NL", { dateStyle: "short", timeStyle: "short" })}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.entity_type && (
                          <Badge variant="secondary" className="text-xs font-normal">
                            {ENTITY_LABELS[item.entity_type] ?? item.entity_type}
                          </Badge>
                        )}
                        {moduleDef && (
                          <Badge variant="outline" className="text-xs font-normal">
                            {moduleDef.label}
                          </Badge>
                        )}
                      </div>
                      {isOpen && (
                        <div className="mt-2 space-y-2 text-xs">
                          {item.oude_waarde && (
                            <div>
                              <p className="font-medium text-muted-foreground mb-1">Oud</p>
                              <pre className="bg-muted rounded p-2 overflow-x-auto whitespace-pre-wrap break-all">
                                {JSON.stringify(item.oude_waarde, null, 2)}
                              </pre>
                            </div>
                          )}
                          {item.nieuwe_waarde && (
                            <div>
                              <p className="font-medium text-muted-foreground mb-1">Nieuw</p>
                              <pre className="bg-muted rounded p-2 overflow-x-auto whitespace-pre-wrap break-all">
                                {JSON.stringify(item.nieuwe_waarde, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
};

export default AuditTijdlijn;