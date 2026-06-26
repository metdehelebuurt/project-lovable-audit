import { useState, useEffect, useMemo } from "react";
import { Bell, Settings } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";
import { useBrowserNotifications } from "@/hooks/useBrowserNotifications";

type NotifFilter = "alle" | "tickets" | "installaties" | "leads" | "financieel";

function entityTypeMatchesFilter(entityType: string | null, filter: NotifFilter): boolean {
  if (filter === "alle") return true;
  if (!entityType) return false;
  switch (filter) {
    case "tickets": return entityType === "helpdesk_tickets" || entityType === "helpdesk_service_bezoeken";
    case "installaties": return entityType === "installaties";
    case "leads": return entityType === "leads";
    case "financieel": return entityType === "financiele_documenten";
  }
}

function routeForEntity(entityType: string | null, entityId: string | null): string | null {
  if (!entityType || !entityId) return null;
  switch (entityType) {
    case "helpdesk_tickets": return `/helpdesk/tickets/${entityId}`;
    case "helpdesk_service_bezoeken": return `/helpdesk/planning`;
    case "installaties": return `/installaties/${entityId}`;
    case "leads": return `/leads/${entityId}`;
    case "offertes": return `/offertes/${entityId}`;
    case "schouwen": return `/schouwen/${entityId}`;
    case "opdrachten": return `/opdrachten/${entityId}`;
    case "financiele_documenten": return `/financieel/${entityId}`;
    case "email_berichten": return `/berichten`;
    default: return null;
  }
}

export function NotificatieCenter() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<NotifFilter>("alle");
  const { show: showBrowserNotif } = useBrowserNotifications();

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
  const gefilterd = useMemo(
    () => notificaties.filter(n => entityTypeMatchesFilter((n as { entity_type: string | null }).entity_type, filter)),
    [notificaties, filter],
  );

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
    const channelName = `notificaties-realtime:${user.id}:${Math.random().toString(36).slice(2, 8)}`;
    const channel = supabase
      .channel(channelName)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notificaties",
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ["notificaties"] });
        const n = payload.new as { titel?: string; bericht?: string; entity_type?: string | null; entity_id?: string | null };
        if (n?.titel) {
          showBrowserNotif(n.titel, {
            body: n.bericht ?? "",
            tag: `notif-${n.entity_type ?? ""}-${n.entity_id ?? ""}`,
            onClick: () => {
              const route = routeForEntity(n.entity_type ?? null, n.entity_id ?? null);
              if (route) navigate(route);
            },
          });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient, showBrowserNotif, navigate]);

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
          <div className="flex items-center gap-1">
            {ongelezen > 0 && (
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => markeerAlleGelezen.mutate()}>
                Alles gelezen
              </Button>
            )}
            <Button asChild variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
              <Link to="/instellingen/notificaties" aria-label="Voorkeuren"><Settings className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
        <div className="px-2 pt-2">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as NotifFilter)}>
            <TabsList className="grid grid-cols-5 h-8">
              <TabsTrigger value="alle" className="text-[11px]">Alle</TabsTrigger>
              <TabsTrigger value="tickets" className="text-[11px]">Tickets</TabsTrigger>
              <TabsTrigger value="installaties" className="text-[11px]">Inst.</TabsTrigger>
              <TabsTrigger value="leads" className="text-[11px]">Leads</TabsTrigger>
              <TabsTrigger value="financieel" className="text-[11px]">Fin.</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <ScrollArea className="max-h-80">
          {gefilterd.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">Geen notificaties</p>
          ) : (
            <div className="divide-y">
              {gefilterd.map(n => (
                <button
                  key={n.id}
                  className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${!n.gelezen ? "bg-primary/5" : ""}`}
                  onClick={() => {
                    if (!n.gelezen) markeerGelezen.mutate(n.id);
                    const route = routeForEntity(
                      (n as { entity_type: string | null }).entity_type,
                      (n as { entity_id: string | null }).entity_id,
                    );
                    if (route) {
                      setOpen(false);
                      navigate(route);
                    }
                  }}
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
