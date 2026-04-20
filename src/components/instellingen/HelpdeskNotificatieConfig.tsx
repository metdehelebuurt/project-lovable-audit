import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, X, Loader2 } from "lucide-react";

type Cfg = {
  id?: string;
  partner_id: string;
  email_bij_nieuw_ticket: boolean;
  email_bij_toewijzing: boolean;
  email_bij_klant_reactie: boolean;
  email_bij_escalatie: boolean;
  email_bij_oplossing: boolean;
  email_bij_storing: boolean;
  ontvangers: string[];
  sla_uren_urgent: number;
  sla_uren_hoog: number;
  sla_uren_normaal: number;
  sla_uren_laag: number;
};

const DEFAULTS: Omit<Cfg, "partner_id" | "id"> = {
  email_bij_nieuw_ticket: true,
  email_bij_toewijzing: true,
  email_bij_klant_reactie: true,
  email_bij_escalatie: true,
  email_bij_oplossing: false,
  email_bij_storing: true,
  ontvangers: [],
  sla_uren_urgent: 4,
  sla_uren_hoog: 24,
  sla_uren_normaal: 72,
  sla_uren_laag: 168,
};

export default function HelpdeskNotificatieConfig({ partnerId }: { partnerId: string }) {
  const [cfg, setCfg] = useState<Cfg>({ partner_id: partnerId, ...DEFAULTS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nieuw, setNieuw] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("helpdesk_notificatie_config")
        .select("*")
        .eq("partner_id", partnerId)
        .maybeSingle();
      if (!alive) return;
      if (data) {
        setCfg({
          ...data,
          ontvangers: Array.isArray(data.ontvangers) ? (data.ontvangers as string[]) : [],
        } as Cfg);
      }
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [partnerId]);

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...cfg, partner_id: partnerId, ontvangers: cfg.ontvangers };
      const { error } = await supabase
        .from("helpdesk_notificatie_config")
        .upsert(payload as never, { onConflict: "partner_id" });
      if (error) throw error;
      toast.success("Notificatie-instellingen opgeslagen");
    } catch (e) {
      toast.error(`Opslaan mislukt: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const addOntvanger = () => {
    const v = nieuw.trim().toLowerCase();
    if (!v || !v.includes("@")) { toast.error("Ongeldig e-mailadres"); return; }
    if (cfg.ontvangers.includes(v)) return;
    setCfg((p) => ({ ...p, ontvangers: [...p.ontvangers, v] }));
    setNieuw("");
  };

  if (loading) return <p className="text-sm text-muted-foreground">Laden…</p>;

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader><CardTitle className="text-lg">Helpdesk notificaties</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Bepaal wanneer er een e-mail wordt verstuurd en naar welke ontvangers. E-mails worden verzonden via je gekoppelde e-mailaccount.
          </p>

          <div className="space-y-3">
            <Label>Ontvangers</Label>
            <div className="flex flex-wrap gap-2">
              {cfg.ontvangers.length === 0 && <p className="text-xs text-muted-foreground">Nog geen ontvangers — voeg minimaal één e-mailadres toe.</p>}
              {cfg.ontvangers.map((e) => (
                <Badge key={e} variant="outline" className="gap-1.5">
                  {e}
                  <button type="button" onClick={() => setCfg((p) => ({ ...p, ontvangers: p.ontvangers.filter((x) => x !== e) }))}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input type="email" placeholder="naam@bedrijf.nl" value={nieuw} onChange={(e) => setNieuw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addOntvanger())} />
              <Button type="button" variant="outline" size="sm" onClick={addOntvanger}><Plus className="h-3 w-3 mr-1" />Toevoegen</Button>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Label>Verstuur e-mail bij…</Label>
            <Toggle label="Nieuw ticket" value={cfg.email_bij_nieuw_ticket} onChange={(v) => setCfg((p) => ({ ...p, email_bij_nieuw_ticket: v }))} />
            <Toggle label="Toewijzing aan medewerker" value={cfg.email_bij_toewijzing} onChange={(v) => setCfg((p) => ({ ...p, email_bij_toewijzing: v }))} />
            <Toggle label="Klant reactie" value={cfg.email_bij_klant_reactie} onChange={(v) => setCfg((p) => ({ ...p, email_bij_klant_reactie: v }))} />
            <Toggle label="Escalatie (SLA overschreden)" value={cfg.email_bij_escalatie} onChange={(v) => setCfg((p) => ({ ...p, email_bij_escalatie: v }))} />
            <Toggle label="Storing" value={cfg.email_bij_storing} onChange={(v) => setCfg((p) => ({ ...p, email_bij_storing: v }))} />
            <Toggle label="Ticket opgelost" value={cfg.email_bij_oplossing} onChange={(v) => setCfg((p) => ({ ...p, email_bij_oplossing: v }))} />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader><CardTitle className="text-lg">SLA-tijden (uren)</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(["urgent", "hoog", "normaal", "laag"] as const).map((p) => (
            <div key={p}>
              <Label className="text-xs capitalize">{p}</Label>
              <Input
                type="number" min={1}
                value={cfg[`sla_uren_${p}` as const]}
                onChange={(e) => setCfg((c) => ({ ...c, [`sla_uren_${p}`]: Number(e.target.value) || 0 }) as Cfg)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving}>
        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Opslaan
      </Button>
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm">{label}</span>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}
