import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Bell, Save } from "lucide-react";

interface Props { partnerId: string }

const parseDays = (s: string): number[] =>
  s.split(",").map(p => parseInt(p.trim(), 10)).filter(n => Number.isInteger(n) && n >= 0 && n <= 365);

export default function OfferteAutoHerinneringConfig({ partnerId }: Props) {
  const qc = useQueryClient();
  const [actief, setActief] = useState(false);
  const [voorStr, setVoorStr] = useState("2");
  const [naStr, setNaStr] = useState("1,7");
  const [templateId, setTemplateId] = useState<string>("");
  const [werkdagen, setWerkdagen] = useState(true);

  const { data: config, isLoading } = useQuery({
    queryKey: ["offerte-auto-herinnering-config", partnerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offerte_auto_herinnering_config" as any)
        .select("*")
        .eq("partner_id", partnerId)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["email-templates-offerte", partnerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_templates")
        .select("id, naam, type")
        .eq("partner_id", partnerId)
        .order("naam");
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    if (!config) return;
    setActief(!!config.actief);
    setVoorStr((config.dagen_voor_verloop || []).join(","));
    setNaStr((config.dagen_na_verloop || []).join(","));
    setTemplateId(config.email_template_id || "");
    setWerkdagen(config.alleen_werkdagen ?? true);
  }, [config]);

  const opslaan = useMutation({
    mutationFn: async () => {
      const voor = parseDays(voorStr);
      const na = parseDays(naStr);
      if (actief && voor.length === 0 && na.length === 0) {
        throw new Error("Vul ten minste één moment in (voor of na verloop)");
      }
      const payload = {
        partner_id: partnerId,
        actief,
        dagen_voor_verloop: voor,
        dagen_na_verloop: na,
        email_template_id: templateId || null,
        alleen_werkdagen: werkdagen,
      };
      const { error } = await supabase
        .from("offerte_auto_herinnering_config" as any)
        .upsert(payload, { onConflict: "partner_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["offerte-auto-herinnering-config", partnerId] });
      toast.success("Instellingen opgeslagen");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Automatische offerte-herinneringen
        </CardTitle>
        <CardDescription>
          Verstuur automatisch een herinnering naar de klant vóór of na het verlopen van een offerte.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between rounded-xl border p-3">
          <div>
            <Label className="font-medium">Automatische herinneringen inschakelen</Label>
            <p className="text-xs text-muted-foreground">Alleen openstaande, verzonden offertes met een e-mailadres worden meegenomen.</p>
          </div>
          <Switch checked={actief} onCheckedChange={setActief} disabled={isLoading} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Dagen vóór verloop</Label>
            <Input
              value={voorStr}
              onChange={e => setVoorStr(e.target.value)}
              placeholder="bv. 2,5"
            />
            <p className="text-xs text-muted-foreground">Komma-gescheiden, bv. <code>2,5</code> stuurt 5 en 2 dagen vooraf.</p>
          </div>
          <div className="space-y-1">
            <Label>Dagen ná verloop</Label>
            <Input
              value={naStr}
              onChange={e => setNaStr(e.target.value)}
              placeholder="bv. 1,7"
            />
            <p className="text-xs text-muted-foreground">Komma-gescheiden, bv. <code>1,7</code>.</p>
          </div>
        </div>

        <div className="space-y-1">
          <Label>E-mailsjabloon (optioneel)</Label>
          <Select value={templateId || "__none"} onValueChange={v => setTemplateId(v === "__none" ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Gebruik standaardtekst" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">Standaardtekst gebruiken</SelectItem>
              {templates.map((t: any) => (
                <SelectItem key={t.id} value={t.id}>{t.naam}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Beschikbare placeholders: <code>{"{{klant_naam}}"}</code>, <code>{"{{offertenummer}}"}</code>,
            <code>{"{{totaal}}"}</code>, <code>{"{{geldig_tot}}"}</code>, <code>{"{{partner_naam}}"}</code>, <code>{"{{link}}"}</code>.
          </p>
        </div>

        <div className="flex items-center justify-between rounded-xl border p-3">
          <div>
            <Label className="font-medium">Alleen op werkdagen versturen</Label>
            <p className="text-xs text-muted-foreground">In het weekend wordt er niets verzonden.</p>
          </div>
          <Switch checked={werkdagen} onCheckedChange={setWerkdagen} />
        </div>

        <div className="flex justify-end">
          <Button onClick={() => opslaan.mutate()} disabled={opslaan.isPending} className="gap-2">
            <Save className="h-4 w-4" /> Opslaan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}