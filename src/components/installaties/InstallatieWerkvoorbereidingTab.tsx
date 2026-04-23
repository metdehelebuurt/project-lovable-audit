import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, FileDown } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import type { Installatie } from "./api/installatieApi";

interface ChecklistItem {
  id: string;
  installatie_id: string;
  partner_id: string;
  item_key: string;
  label: string;
  blokkerend: boolean;
  voltooid_op: string | null;
  voltooid_door: string | null;
  notitie: string | null;
}

export default function InstallatieWerkvoorbereidingTab({ installatie }: { installatie: Installatie }) {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [nieuw, setNieuw] = useState({ label: "", blokkerend: false });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["installatie_checklist", installatie.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("installatie_checklist_items")
        .select("*")
        .eq("installatie_id", installatie.id)
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as ChecklistItem[];
    },
  });

  const toggle = useMutation({
    mutationFn: async (item: ChecklistItem) => {
      const { error } = await supabase
        .from("installatie_checklist_items")
        .update({
          voltooid_op: item.voltooid_op ? null : new Date().toISOString(),
          voltooid_door: item.voltooid_op ? null : profile?.id ?? null,
        })
        .eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["installatie_checklist", installatie.id] }),
  });

  const verwijder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("installatie_checklist_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["installatie_checklist", installatie.id] }),
  });

  const voegToe = useMutation({
    mutationFn: async () => {
      if (!nieuw.label.trim()) return;
      const { error } = await supabase.from("installatie_checklist_items").insert({
        installatie_id: installatie.id,
        partner_id: installatie.partner_id,
        label: nieuw.label.trim(),
        item_key: nieuw.label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 60),
        blokkerend: nieuw.blokkerend,
      });
      if (error) throw error;
      setNieuw({ label: "", blokkerend: false });
    },
    onSuccess: () => {
      toast.success("Item toegevoegd");
      qc.invalidateQueries({ queryKey: ["installatie_checklist", installatie.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pasTemplate = useMutation({
    mutationFn: async () => {
      const { data: tmpl } = await supabase
        .from("installatie_checklist_templates")
        .select("*")
        .eq("partner_id", installatie.partner_id)
        .eq("actief", true)
        .order("volgorde");
      const bestaande = new Set(items.map(i => i.item_key));
      const nieuweRecords = (tmpl ?? [])
        .filter(t => !bestaande.has(t.item_key))
        .map(t => ({
          installatie_id: installatie.id,
          partner_id: installatie.partner_id,
          item_key: t.item_key,
          label: t.label,
          blokkerend: t.blokkerend,
        }));
      if (nieuweRecords.length === 0) return 0;
      const { error } = await supabase.from("installatie_checklist_items").insert(nieuweRecords);
      if (error) throw error;
      return nieuweRecords.length;
    },
    onSuccess: (n) => {
      toast.success(n ? `${n} item(s) toegevoegd uit template` : "Alle template-items waren al aanwezig");
      qc.invalidateQueries({ queryKey: ["installatie_checklist", installatie.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Werkvoorbereiding</CardTitle>
        <Button size="sm" variant="outline" onClick={() => pasTemplate.mutate()} disabled={pasTemplate.isPending}>
          <FileDown className="h-3.5 w-3.5 mr-1.5" /> Template toepassen
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Laden…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Geen checklist-items. Voeg toe of pas een template toe.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((it) => (
              <li key={it.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30">
                <Checkbox checked={!!it.voltooid_op} onCheckedChange={() => toggle.mutate(it)} className="mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${it.voltooid_op ? "line-through text-muted-foreground" : ""}`}>
                    {it.label}
                    {it.blokkerend && !it.voltooid_op && (
                      <span className="ml-2 text-[10px] uppercase tracking-wide text-destructive font-semibold">Blokkerend</span>
                    )}
                  </p>
                  {it.voltooid_op && (
                    <p className="text-xs text-muted-foreground">
                      Voltooid {new Date(it.voltooid_op).toLocaleString("nl-NL")}
                    </p>
                  )}
                </div>
                <Button size="icon" variant="ghost" onClick={() => verwijder.mutate(it.id)} aria-label="Verwijderen">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <div className="border-t pt-4 space-y-2">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Nieuw item</Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Bijv. 'Steiger besteld' of 'Net-aanvraag ingediend'"
              value={nieuw.label}
              onChange={(e) => setNieuw({ ...nieuw, label: e.target.value })}
            />
            <div className="flex items-center gap-2">
              <Switch checked={nieuw.blokkerend} onCheckedChange={(v) => setNieuw({ ...nieuw, blokkerend: v })} id="blok" />
              <Label htmlFor="blok" className="text-xs">Blokkerend</Label>
            </div>
            <Button onClick={() => voegToe.mutate()} disabled={!nieuw.label.trim() || voegToe.isPending}>
              <Plus className="h-4 w-4 mr-1" /> Toevoegen
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}