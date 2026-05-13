import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bell, Mail } from "lucide-react";
import { useBrowserNotifications } from "@/hooks/useBrowserNotifications";

type Voorkeur = { type: string; in_app: boolean; email: boolean };

const TYPES: Array<{ key: string; label: string; beschrijving: string }> = [
  { key: "ticket_toegewezen", label: "Ticket toegewezen", beschrijving: "Wanneer een ticket aan jou wordt toegewezen" },
  { key: "ticket_bericht", label: "Nieuw bericht op ticket", beschrijving: "Inkomend bericht op een ticket dat aan jou is toegewezen" },
  { key: "ticket_escalatie", label: "Ticket geëscaleerd", beschrijving: "SLA-overschrijding van een ticket" },
  { key: "service_bezoek", label: "Service-bezoek ingepland", beschrijving: "Wanneer er een service-bezoek voor jou is gepland" },
  { key: "factuur_betaald", label: "Factuur betaald", beschrijving: "Wanneer een door jou aangemaakte factuur betaald is" },
  { key: "status_wijziging", label: "Status wijzigingen", beschrijving: "Status updates op leads, offertes, installaties en schouwen" },
];

export default function NotificatieVoorkeuren() {
  const { user } = useAuth();
  const [voorkeuren, setVoorkeuren] = useState<Record<string, Voorkeur>>({});
  const [laden, setLaden] = useState(true);
  const [opslaan, setOpslaan] = useState(false);
  const browser = useBrowserNotifications();

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("notificatie_voorkeuren" as never)
        .select("type, in_app, email")
        .eq("user_id", user.id);
      const map: Record<string, Voorkeur> = {};
      for (const t of TYPES) {
        const bestaand = (data as Voorkeur[] | null)?.find((d) => d.type === t.key);
        map[t.key] = bestaand ?? { type: t.key, in_app: true, email: true };
      }
      setVoorkeuren(map);
      setLaden(false);
    })();
  }, [user]);

  const toggle = (type: string, veld: "in_app" | "email", waarde: boolean) => {
    setVoorkeuren((prev) => ({ ...prev, [type]: { ...prev[type], [veld]: waarde } }));
  };

  const sla = async () => {
    if (!user) return;
    setOpslaan(true);
    try {
      const rows = Object.values(voorkeuren).map((v) => ({ ...v, user_id: user.id }));
      const { error } = await supabase
        .from("notificatie_voorkeuren" as never)
        .upsert(rows as never, { onConflict: "user_id,type" });
      if (error) throw error;
      toast.success("Voorkeuren opgeslagen");
    } catch (e) {
      toast.error(`Opslaan mislukt: ${e instanceof Error ? e.message : "Onbekende fout"}`);
    } finally {
      setOpslaan(false);
    }
  };

  if (laden) return <p className="text-sm text-muted-foreground">Laden…</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Browser-meldingen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Ontvang notificaties als systeemmelding in Chrome, Edge of Safari, ook wanneer je het tabblad niet actief hebt.
          </p>
          {!browser.supported ? (
            <p className="text-sm text-destructive">Deze browser ondersteunt geen meldingen.</p>
          ) : browser.permission === "denied" ? (
            <p className="text-sm text-destructive">
              Meldingen zijn geblokkeerd. Sta meldingen toe in de site-instellingen van je browser om dit in te schakelen.
            </p>
          ) : browser.permission !== "granted" ? (
            <Button onClick={() => browser.request()}>Browser-meldingen toestaan</Button>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-sm font-medium">Browser-meldingen actief</Label>
                <p className="text-xs text-muted-foreground">
                  Schakel uit als je geen systeemmeldingen meer wilt ontvangen op dit apparaat.
                </p>
              </div>
              <Switch checked={browser.enabled} onCheckedChange={browser.setEnabled} />
            </div>
          )}
        </CardContent>
      </Card>

    <Card>
      <CardHeader>
        <CardTitle>Notificatievoorkeuren</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-[1fr_auto_auto] gap-4 items-center text-xs font-medium text-muted-foreground border-b pb-2">
          <span>Type</span>
          <span className="flex items-center gap-1.5"><Bell className="h-3.5 w-3.5" /> In-app</span>
          <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> E-mail</span>
        </div>
        {TYPES.map((t) => (
          <div key={t.key} className="grid grid-cols-[1fr_auto_auto] gap-4 items-center">
            <div>
              <Label className="text-sm font-medium">{t.label}</Label>
              <p className="text-xs text-muted-foreground">{t.beschrijving}</p>
            </div>
            <Switch
              checked={voorkeuren[t.key]?.in_app ?? true}
              onCheckedChange={(v) => toggle(t.key, "in_app", v)}
            />
            <Switch
              checked={voorkeuren[t.key]?.email ?? true}
              onCheckedChange={(v) => toggle(t.key, "email", v)}
            />
          </div>
        ))}
        <div className="pt-4 flex justify-end">
          <Button onClick={sla} disabled={opslaan}>
            {opslaan ? "Opslaan…" : "Voorkeuren opslaan"}
          </Button>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}