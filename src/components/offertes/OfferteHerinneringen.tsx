import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { Bell, Plus, Trash2, ChevronDown, Calendar } from "lucide-react";

interface Props {
  offerteId: string;
  partnerId: string;
  compact?: boolean;
}

export default function OfferteHerinneringen({ offerteId, partnerId, compact = false }: Props) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(!compact);
  const [datum, setDatum] = useState("");
  const [notitie, setNotitie] = useState("");

  const { data: herinneringen = [] } = useQuery({
    queryKey: ["offerte-herinneringen", offerteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offerte_herinneringen" as any)
        .select("*")
        .eq("offerte_id", offerteId)
        .order("herinnering_datum", { ascending: true });
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("offerte_herinneringen" as any).insert({
        offerte_id: offerteId,
        partner_id: partnerId,
        user_id: profile!.id,
        herinnering_datum: new Date(datum).toISOString(),
        notitie: notitie || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offerte-herinneringen", offerteId] });
      setDatum("");
      setNotitie("");
      toast.success("Herinnering toegevoegd");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("offerte_herinneringen" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offerte-herinneringen", offerteId] });
      toast.success("Herinnering verwijderd");
    },
  });

  const statusColor = (status: string) => {
    if (status === "verstuurd") return "bg-green-100 text-green-700";
    if (status === "geannuleerd") return "bg-muted text-muted-foreground";
    return "bg-primary/10 text-primary";
  };

  const isPast = (d: string) => new Date(d) < new Date();

  const content = (
    <div className="space-y-3">
      {herinneringen.length > 0 ? (
        <div className="space-y-2">
          {herinneringen.map((h: any) => (
            <div key={h.id} className={`flex items-start gap-2 text-sm rounded-lg p-2 ${isPast(h.herinnering_datum) && h.status === "gepland" ? "bg-warning/10" : "bg-muted/30"}`}>
              <Calendar className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-xs">
                    {new Date(h.herinnering_datum).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  <Badge className={`text-[10px] px-1.5 py-0 ${statusColor(h.status)}`}>{h.status}</Badge>
                </div>
                {h.notitie && <p className="text-xs text-muted-foreground mt-0.5 truncate">{h.notitie}</p>}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={() => deleteMutation.mutate(h.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Nog geen herinneringen ingesteld.</p>
      )}

      <div className="space-y-2 pt-1">
        <div className="flex gap-2">
          <div className="flex-1">
            <Label className="text-xs">Datum</Label>
            <Input
              type="date"
              value={datum}
              onChange={e => setDatum(e.target.value)}
              className="h-8 text-xs rounded-lg"
              min={new Date().toISOString().split("T")[0]}
            />
          </div>
        </div>
        <Input
          value={notitie}
          onChange={e => setNotitie(e.target.value)}
          placeholder="Optionele notitie..."
          className="h-8 text-xs rounded-lg"
        />
        <Button
          size="sm"
          className="w-full h-8 text-xs rounded-lg gap-1"
          disabled={!datum || addMutation.isPending}
          onClick={() => addMutation.mutate()}
        >
          <Plus className="h-3 w-3" /> Herinnering toevoegen
        </Button>
      </div>
    </div>
  );

  if (compact) {
    return (
      <Collapsible open={open} onOpenChange={setOpen} className="rounded-xl border border-border overflow-hidden">
        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Opvolging</span>
            {herinneringen.length > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{herinneringen.length}</Badge>
            )}
          </div>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-3 pb-3">
          {content}
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return content;
}
