import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface Template {
  id: string;
  partner_id: string;
  item_key: string;
  label: string;
  beschrijving: string | null;
  blokkerend: boolean;
  vereist_voor_status: string;
  volgorde: number;
  actief: boolean;
}

const STATUSSEN = [
  { value: "concept", label: "Concept" },
  { value: "gepland", label: "Gepland" },
  { value: "bevestigd", label: "Bevestigd" },
  { value: "in_uitvoering", label: "In uitvoering" },
];

export default function ChecklistTemplates() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [nieuw, setNieuw] = useState({ label: "", blokkerend: true, vereist_voor_status: "bevestigd" });

  const { data: rows = [] } = useQuery({
    queryKey: ["checklist_templates", profile?.partner_id],
    enabled: !!profile?.partner_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("installatie_checklist_templates")
        .select("*")
        .eq("partner_id", profile!.partner_id!)
        .order("volgorde");
      if (error) throw error;
      return (data ?? []) as Template[];
    },
  });

  const toevoegen = useMutation({
    mutationFn: async () => {
      if (!profile?.partner_id || !nieuw.label.trim()) return;
      const { error } = await supabase.from("installatie_checklist_templates").insert({
        partner_id: profile.partner_id,
        item_key: nieuw.label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 60),
        label: nieuw.label.trim(),
        blokkerend: nieuw.blokkerend,
        vereist_voor_status: nieuw.vereist_voor_status,
        volgorde: rows.length + 1,
      });
      if (error) throw error;
      setNieuw({ label: "", blokkerend: true, vereist_voor_status: "bevestigd" });
    },
    onSuccess: () => {
      toast.success("Template-item toegevoegd");
      qc.invalidateQueries({ queryKey: ["checklist_templates", profile?.partner_id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const wijzig = useMutation({
    mutationFn: async (patch: Partial<Template> & { id: string }) => {
      const { id, ...rest } = patch;
      const { error } = await supabase.from("installatie_checklist_templates").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["checklist_templates", profile?.partner_id] }),
  });

  const verwijder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("installatie_checklist_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["checklist_templates", profile?.partner_id] }),
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <Button asChild variant="ghost" size="sm">
        <Link to="/instellingen"><ArrowLeft className="h-4 w-4 mr-1" /> Terug naar instellingen</Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold">Werkvoorbereiding-checklist</h1>
        <p className="text-muted-foreground mt-1">
          Beheer standaard checklist-items voor installaties. Blokkerende items moeten voltooid zijn vóór statusovergang.
        </p>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nog geen template-items.</p>
          ) : (
            <ul className="space-y-2">
              {rows.map((r) => (
                <li key={r.id} className="flex items-center gap-3 p-2 rounded-lg border">
                  <Input
                    className="flex-1"
                    defaultValue={r.label}
                    onBlur={(e) => e.target.value !== r.label && wijzig.mutate({ id: r.id, label: e.target.value })}
                  />
                  <Select value={r.vereist_voor_status} onValueChange={(v) => wijzig.mutate({ id: r.id, vereist_voor_status: v })}>
                    <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSSEN.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2">
                    <Switch checked={r.blokkerend} onCheckedChange={(v) => wijzig.mutate({ id: r.id, blokkerend: v })} />
                    <Label className="text-xs">Blokkerend</Label>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => verwijder.mutate(r.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-2 items-end">
            <div>
              <Label htmlFor="lbl" className="text-xs">Nieuw item</Label>
              <Input id="lbl" value={nieuw.label} onChange={(e) => setNieuw({ ...nieuw, label: e.target.value })} placeholder="Bijv. Net-aanvraag ingediend" />
            </div>
            <Select value={nieuw.vereist_voor_status} onValueChange={(v) => setNieuw({ ...nieuw, vereist_voor_status: v })}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSSEN.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Switch checked={nieuw.blokkerend} onCheckedChange={(v) => setNieuw({ ...nieuw, blokkerend: v })} />
              <Label className="text-xs">Blokkerend</Label>
            </div>
            <Button onClick={() => toevoegen.mutate()} disabled={!nieuw.label.trim()}>
              <Plus className="h-4 w-4 mr-1" /> Toevoegen
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}