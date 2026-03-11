import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";

export function NotificatieCenter() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: notificaties = [] } = useQuery({
    queryKey: ["notificaties", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("notificaties")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const ongelezen = notificaties.filter(n => !n.gelezen).length;

  const markeerGelezen = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notificaties").update({ gelezen: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notificaties"] }),
  });

  const markeerAlleGelezen = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const ids = notificaties.filter(n => !n.gelezen).map(n => n.id);
      if (ids.length === 0) return;
      const { error } = await supabase.from("notificaties").update({ gelezen: true }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notificaties"] }),
  });

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("notificaties-realtime")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notificaties",
        filter: `user_id=eq.${user.id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["notificaties"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {ongelezen > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {ongelezen > 9 ? "9+" : ongelezen}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Notificaties</h3>
          {ongelezen > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => markeerAlleGelezen.mutate()}>
              Alles gelezen
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notificaties.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">Geen notificaties</p>
          ) : (
            <div className="divide-y">
              {notificaties.map(n => (
                <button
                  key={n.id}
                  className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${!n.gelezen ? "bg-primary/5" : ""}`}
                  onClick={() => { if (!n.gelezen) markeerGelezen.mutate(n.id); }}
                >
                  <div className="flex items-start gap-2">
                    {!n.gelezen && <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />}
                    <div className={!n.gelezen ? "" : "ml-4"}>
                      <p className="text-sm font-medium leading-tight">{n.titel}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.bericht}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: nl })}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
