import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, ClipboardList, Wrench } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, parseISO, isToday } from "date-fns";
import { nl } from "date-fns/locale";

interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  type: "schouw" | "installatie";
  status: string;
}

const Planning = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      const monthStart = format(startOfMonth(currentMonth), "yyyy-MM-dd");
      const monthEnd = format(endOfMonth(currentMonth), "yyyy-MM-dd");

      const [schouwen, installaties] = await Promise.all([
        supabase.from("schouwen").select("id, geplande_datum, consument_naam, schouw_nummer, status")
          .gte("geplande_datum", monthStart).lte("geplande_datum", monthEnd),
        supabase.from("installaties").select("id, geplande_startdatum, consument_naam, status")
          .gte("geplande_startdatum", monthStart).lte("geplande_startdatum", monthEnd),
      ]);

      const mapped: CalendarEvent[] = [
        ...(schouwen.data ?? []).map((s) => ({
          id: s.id, date: s.geplande_datum,
          title: s.consument_naam ?? s.schouw_nummer, type: "schouw" as const, status: s.status,
        })),
        ...(installaties.data ?? []).map((i) => ({
          id: i.id, date: i.geplande_startdatum!,
          title: i.consument_naam ?? "Installatie", type: "installatie" as const, status: i.status,
        })),
      ];
      setEvents(mapped);
      setLoading(false);
    };
    fetchEvents();
  }, [currentMonth]);

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const startDayOfWeek = (getDay(startOfMonth(currentMonth)) + 6) % 7; // Monday = 0

  const getEventsForDay = (day: Date) =>
    events.filter((e) => isSameDay(parseISO(e.date), day));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Planning</h1>
        <p className="text-muted-foreground mt-1">Kalenderweergave van schouwen en installaties</p>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <CardTitle className="text-lg capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: nl })}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden">
            {["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"].map((d) => (
              <div key={d} className="bg-muted p-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
            ))}
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-card p-2 min-h-[80px]" />
            ))}
            {days.map((day) => {
              const dayEvents = getEventsForDay(day);
              return (
                <div
                  key={day.toISOString()}
                  className={`bg-card p-2 min-h-[80px] ${isToday(day) ? "ring-2 ring-primary ring-inset" : ""}`}
                >
                  <span className={`text-xs font-medium ${isToday(day) ? "text-primary" : "text-foreground"}`}>
                    {format(day, "d")}
                  </span>
                  <div className="mt-1 space-y-1">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <div
                        key={ev.id}
                        className={`text-[10px] leading-tight px-1.5 py-0.5 rounded truncate flex items-center gap-1 ${
                          ev.type === "schouw"
                            ? "bg-primary/10 text-primary"
                            : "bg-warning-light text-warning-foreground"
                        }`}
                      >
                        {ev.type === "schouw" ? <ClipboardList className="h-2.5 w-2.5 shrink-0" /> : <Wrench className="h-2.5 w-2.5 shrink-0" />}
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[10px] text-muted-foreground">+{dayEvents.length - 3} meer</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-4 mt-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-3 h-3 rounded bg-primary/10" /> Schouw
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-3 h-3 rounded bg-warning-light" /> Installatie
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Planning;
