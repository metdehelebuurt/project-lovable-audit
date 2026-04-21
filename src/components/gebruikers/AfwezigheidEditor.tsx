import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarOff, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface AfwezigheidEditorProps {
  userId: string;
  partnerId: string;
  canEdit: boolean;
}

export const AfwezigheidEditor = ({ userId, partnerId, canEdit }: AfwezigheidEditorProps) => {
  const qc = useQueryClient();
  const [van, setVan] = useState("");
  const [tot, setTot] = useState("");
  const [reden, setReden] = useState("");
  const [vervangerId, setVervangerId] = useState<string>("");

  const { data: items = [] } = useQuery({
    queryKey: ["afwezigheid", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gebruiker_afwezigheid")
        .select("*")
        .eq("user_id", userId)
        .order("van", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: collegas = [] } = useQuery({
    queryKey: ["collegas", partnerId, userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, voornaam, achternaam")
        .eq("partner_id", partnerId)
        .neq("id", userId)
        .eq("status", "actief");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!partnerId,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("gebruiker_afwezigheid").insert({
        user_id: userId,
        partner_id: partnerId,
        van,
        tot,
        reden: reden.trim() || null,
        vervanger_id: vervangerId || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["afwezigheid", userId] });
      toast.success("Afwezigheid toegevoegd");
      setVan(""); setTot(""); setReden(""); setVervangerId("");
    },
    onError: (err: Error) => toast.error("Toevoegen mislukt", { description: err.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gebruiker_afwezigheid").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["afwezigheid", userId] });
      toast.success("Verwijderd");
    },
  });

  const handleAdd = () => {
    if (!van || !tot) {
      toast.error("Vul start- en einddatum in");
      return;
    }
    addMutation.mutate();
  };

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarOff className="h-4 w-4 text-primary" /> Verlof & afwezigheid
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {canEdit && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end p-3 bg-muted/30 rounded-xl">
            <div>
              <Label className="text-xs">Van</Label>
              <Input type="date" value={van} onChange={e => setVan(e.target.value)} className="rounded-lg" />
            </div>
            <div>
              <Label className="text-xs">Tot</Label>
              <Input type="date" value={tot} onChange={e => setTot(e.target.value)} className="rounded-lg" />
            </div>
            <div>
              <Label className="text-xs">Reden</Label>
              <Input value={reden} onChange={e => setReden(e.target.value)} placeholder="Vakantie" className="rounded-lg" />
            </div>
            <div>
              <Label className="text-xs">Vervanger</Label>
              <Select value={vervangerId} onValueChange={setVervangerId}>
                <SelectTrigger className="rounded-lg"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {collegas.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.voornaam} {c.achternaam}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAdd} disabled={addMutation.isPending} className="rounded-lg gap-2">
              <Plus className="h-4 w-4" /> Toevoegen
            </Button>
          </div>
        )}

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Geen geplande afwezigheid</p>
        ) : (
          <div className="space-y-2">
            {items.map((item: any) => {
              const isActief = new Date(item.van) <= new Date() && new Date(item.tot) >= new Date();
              const vervanger = collegas.find((c: any) => c.id === item.vervanger_id);
              return (
                <div key={item.id} className={`flex items-center justify-between p-3 rounded-xl border ${isActief ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800" : ""}`}>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {new Date(item.van).toLocaleDateString("nl-NL")} – {new Date(item.tot).toLocaleDateString("nl-NL")}
                      {isActief && <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">• Nu afwezig</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.reden || "Geen reden opgegeven"}
                      {vervanger && ` · Vervanger: ${vervanger.voornaam} ${vervanger.achternaam}`}
                    </p>
                  </div>
                  {canEdit && (
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(item.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AfwezigheidEditor;