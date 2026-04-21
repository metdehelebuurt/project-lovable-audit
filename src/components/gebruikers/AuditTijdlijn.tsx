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

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" /> Activiteit & audit
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Laden...</p>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-40" />
            Nog geen activiteit geregistreerd
          </div>
        ) : (
          <ol className="space-y-3 relative">
            {items.map((item: any) => {
              const Icon = ICONS[item.actie] ?? ICONS.default;
              const label = LABELS[item.actie] ?? item.actie;
              return (
                <li key={item.id} className="flex gap-3 items-start">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground">{label}</p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.created_at).toLocaleString("nl-NL", { dateStyle: "short", timeStyle: "short" })}
                      </span>
                    </div>
                    {item.nieuwe_waarde && Object.keys(item.nieuwe_waarde).length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {Object.entries(item.nieuwe_waarde).slice(0, 3).map(([k, v]: any) => (
                          <Badge key={k} variant="outline" className="text-xs font-normal">
                            {k}: {typeof v === "object" ? JSON.stringify(v) : String(v)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
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