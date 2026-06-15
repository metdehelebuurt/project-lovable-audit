import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { toast } from "sonner";

interface PermissieTogglesProps {
  userId: string;
  partnerId: string;
  canEdit: boolean;
}

const PERMS: Array<{ key: string; label: string; beschrijving: string }> = [
  { key: "kan_kortingen_groot_goedkeuren", label: "Mag kortingen >10% goedkeuren", beschrijving: "Override op standaard rol-limiet" },
  { key: "kan_offertes_van_collegas_bewerken", label: "Mag offertes van collega's bewerken", beschrijving: "Toegang tot offertes van anderen binnen partner" },
  { key: "kan_facturen_bewerken_na_versturen", label: "Mag verkoopfacturen wijzigen na verzending", beschrijving: "Naast partner-beheerder en superadmin. Wijzigingen worden in de factuurhistorie vastgelegd." },
  { key: "kan_klanten_verwijderen", label: "Mag klanten verwijderen", beschrijving: "Anders alleen archiveren" },
  { key: "kan_alle_planning_zien", label: "Ziet planning van alle collega's", beschrijving: "Alleen eigen planning is standaard" },
  { key: "kan_export_downloaden", label: "Mag CSV/Excel exports downloaden", beschrijving: "Voor gevoelige rapportages" },
];

export const PermissieToggles = ({ userId, partnerId, canEdit }: PermissieTogglesProps) => {
  const qc = useQueryClient();
  const [permissies, setPermissies] = useState<Record<string, boolean>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["permissies", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gebruiker_permissies")
        .select("permissies")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (data?.permissies && typeof data.permissies === "object") {
      setPermissies(data.permissies as Record<string, boolean>);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (next: Record<string, boolean>) => {
      const { error } = await supabase.from("gebruiker_permissies").upsert(
        { user_id: userId, partner_id: partnerId, permissies: next, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["permissies", userId] });
      toast.success("Permissies opgeslagen");
    },
    onError: (err: Error) => toast.error("Opslaan mislukt", { description: err.message }),
  });

  const handleToggle = (key: string, value: boolean) => {
    const next = { ...permissies, [key]: value };
    setPermissies(next);
    saveMutation.mutate(next);
  };

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" /> Aanvullende rechten
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Laden...</p>
        ) : (
          <div className="space-y-3">
            {PERMS.map((p) => (
              <div key={p.key} className="flex items-start justify-between gap-3 p-3 rounded-xl border">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{p.label}</p>
                  <p className="text-xs text-muted-foreground">{p.beschrijving}</p>
                </div>
                <Switch
                  checked={!!permissies[p.key]}
                  onCheckedChange={(v) => handleToggle(p.key, v)}
                  disabled={!canEdit}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PermissieToggles;