import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { PhoneCall, Plus, Loader2, Clock } from "lucide-react";

const TYPE_OPTIONS = [
  { value: "call", label: "Telefoongesprek" },
  { value: "voicemail", label: "Voicemail" },
  { value: "email", label: "E-mail" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "bezoek", label: "Bezoek" },
  { value: "overig", label: "Overig" },
];

const RESULTAAT_OPTIONS = [
  { value: "bereikt", label: "Bereikt" },
  { value: "geen_gehoor", label: "Geen gehoor" },
  { value: "voicemail", label: "Voicemail" },
  { value: "terugbelverzoek", label: "Terugbelverzoek" },
];

interface Props {
  leadId?: string | null;
  klantId?: string | null;
  /** Toon ook de lijst met recente contactmomenten in dezelfde card */
  showRecent?: boolean;
}

function nowLocalDateTime(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function LogContactmomentCard({ leadId, klantId, showRecent = false }: Props) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    type: "call",
    richting: "uitgaand",
    resultaat: "",
    notitie: "",
    gebeurd_op: nowLocalDateTime(),
  });

  const queryKey = ["contactmomenten", leadId ?? null, klantId ?? null];

  const { data: recent = [] } = useQuery({
    queryKey,
    enabled: showRecent && (!!leadId || !!klantId),
    queryFn: async () => {
      let q = supabase
        .from("lead_contactmomenten" as any)
        .select("id, type, richting, resultaat, notitie, gebeurd_op, created_at, user:users(voornaam, achternaam)")
        .order("gebeurd_op", { ascending: false })
        .limit(10);
      if (leadId) q = q.eq("lead_id", leadId);
      else if (klantId) q = q.eq("klant_id", klantId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id || !profile?.partner_id) {
        throw new Error("Geen gebruiker actief");
      }
      if (!leadId && !klantId) {
        throw new Error("Geen lead of klant gekoppeld");
      }
      const payload: Record<string, unknown> = {
        user_id: profile.id,
        partner_id: profile.partner_id,
        type: form.type,
        richting: form.richting,
        resultaat: form.resultaat || null,
        notitie: form.notitie?.trim() || null,
        gebeurd_op: new Date(form.gebeurd_op).toISOString(),
      };
      if (leadId) payload.lead_id = leadId;
      if (klantId) payload.klant_id = klantId;
      const { error } = await supabase
        .from("lead_contactmomenten" as any)
        .insert(payload as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Contactmoment gelogd");
      setForm({
        type: "call",
        richting: "uitgaand",
        resultaat: "",
        notitie: "",
        gebeurd_op: nowLocalDateTime(),
      });
      // Invalideer alle relevante queries
      queryClient.invalidateQueries({ queryKey });
      if (leadId) queryClient.invalidateQueries({ queryKey: ["lead-contactmomenten", leadId] });
      if (klantId) queryClient.invalidateQueries({ queryKey: ["klant-contactmomenten", klantId] });
      queryClient.invalidateQueries({ queryKey: ["entiteit-historie"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <PhoneCall className="h-4 w-4 text-primary" /> Log contactmoment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px]">Type</Label>
            <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v }))}>
              <SelectTrigger className="h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[10px]">Richting</Label>
            <Select value={form.richting} onValueChange={(v) => setForm((p) => ({ ...p, richting: v }))}>
              <SelectTrigger className="h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="uitgaand">Uitgaand</SelectItem>
                <SelectItem value="inkomend">Inkomend</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label className="text-[10px] flex items-center gap-1">
            <Clock className="h-3 w-3" /> Datum & tijd (mag in het verleden)
          </Label>
          <Input
            type="datetime-local"
            value={form.gebeurd_op}
            max={nowLocalDateTime()}
            onChange={(e) => setForm((p) => ({ ...p, gebeurd_op: e.target.value }))}
            className="h-8 text-xs rounded-lg"
          />
        </div>

        <div>
          <Label className="text-[10px]">Resultaat</Label>
          <Select
            value={form.resultaat || "none"}
            onValueChange={(v) => setForm((p) => ({ ...p, resultaat: v === "none" ? "" : v }))}
          >
            <SelectTrigger className="h-8 text-xs rounded-lg"><SelectValue placeholder="Optioneel" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {RESULTAAT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-[10px]">Notitie</Label>
          <Textarea
            value={form.notitie}
            onChange={(e) => setForm((p) => ({ ...p, notitie: e.target.value }))}
            rows={2}
            className="text-xs rounded-lg"
            placeholder="Korte notitie..."
          />
        </div>

        <Button
          size="sm"
          className="w-full rounded-xl text-xs"
          onClick={() => addMutation.mutate()}
          disabled={addMutation.isPending || !form.gebeurd_op}
        >
          {addMutation.isPending
            ? <Loader2 className="h-3 w-3 animate-spin mr-1" />
            : <Plus className="h-3 w-3 mr-1" />}
          Loggen
        </Button>

        {showRecent && recent.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Recent</p>
            {recent.map((c: any) => (
              <div key={c.id} className="text-xs border rounded-lg p-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">
                    {TYPE_OPTIONS.find((t) => t.value === c.type)?.label || c.type}
                    {" · "}
                    <span className="text-muted-foreground">{c.richting}</span>
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(c.gebeurd_op || c.created_at).toLocaleString("nl-NL", {
                      dateStyle: "short", timeStyle: "short",
                    })}
                  </span>
                </div>
                {c.resultaat && (
                  <p className="text-[11px] text-muted-foreground">
                    {c.resultaat.replace(/_/g, " ")}
                  </p>
                )}
                {c.notitie && <p className="text-[11px] mt-0.5">{c.notitie}</p>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}