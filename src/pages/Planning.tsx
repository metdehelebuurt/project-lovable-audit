import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Switch } from "@/components/ui/switch";
import {
  ChevronLeft, ChevronRight, ClipboardList, Wrench, Download, Link2, Calendar as CalendarIcon, Video, MapPin, Phone, Plus, User, CheckSquare,
} from "lucide-react";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths,
  isSameDay, parseISO, isToday, addDays, subDays, addWeeks, subWeeks, startOfWeek,
  endOfWeek, addYears, subYears, startOfYear, endOfYear, isSameMonth, getMonth,
} from "date-fns";
import { nl } from "date-fns/locale";
import { toast } from "sonner";

type ViewMode = "dag" | "week" | "maand" | "jaar";

interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  type: "schouw" | "installatie" | "afspraak" | "taak";
  status: string;
  adviseur_naam?: string;
  adviseur_id?: string;
  extra?: Record<string, string | null>;
}

interface TeamUser {
  id: string;
  voornaam: string;
  achternaam: string;
  rol: string;
}

const schouwStatuses = ["gepland", "uitgevoerd", "geannuleerd"];
const installatieStatuses = ["gepland", "in_uitvoering", "afgerond", "geannuleerd"];
const afspraakStatuses = ["gepland", "afgerond", "geannuleerd"];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8);

function generateICS(events: CalendarEvent[]): string {
  const now = new Date();
  const stamp = format(now, "yyyyMMdd'T'HHmmss'Z'");
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Lovable//Planning//NL", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
  ];
  for (const ev of events) {
    const dt = ev.date.replace(/-/g, "");
    lines.push(
      "BEGIN:VEVENT", `UID:${ev.id}@planning`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${dt}`,
      `SUMMARY:${ev.type === "schouw" ? "Schouw" : ev.type === "installatie" ? "Installatie" : "Afspraak"} - ${ev.title}`,
      `DESCRIPTION:Status: ${ev.status}${ev.extra?.type ? "\\nType: " + ev.extra.type : ""}`,
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

function downloadICS(events: CalendarEvent[]) {
  const ics = generateICS(events);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "planning.ics"; a.click();
  URL.revokeObjectURL(url);
}

const Planning = () => {
  const { profile } = useAuth();
  const planningNavigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("maand");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [feedUrl, setFeedUrl] = useState<string | null>(null);
  const isAdmin = profile?.rol === "partner_admin" || profile?.rol === "partner_staff";
  const isInstallateur = profile?.rol === "installateur";
  const [mijnAgenda, setMijnAgenda] = useState(!isAdmin);
  const [selectedAdviseur, setSelectedAdviseur] = useState<string>("alle");
  const [teamUsers, setTeamUsers] = useState<TeamUser[]>([]);

  // Fetch team users
  useEffect(() => {
    if (!profile?.partner_id) return;
    const fetchTeam = async () => {
      const { data } = await supabase
        .from("users")
        .select("id, voornaam, achternaam, rol")
        .eq("partner_id", profile.partner_id!)
        .in("rol", ["adviseur", "partner_staff", "partner_admin", "backoffice"])
        .eq("status", "actief");
      if (data) setTeamUsers(data as TeamUser[]);
    };
    fetchTeam();
  }, [profile?.partner_id]);



  const dateRange = useMemo(() => {
    switch (viewMode) {
      case "dag": return { start: currentDate, end: currentDate };
      case "week": {
        const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
        return { start: ws, end: endOfWeek(currentDate, { weekStartsOn: 1 }) };
      }
      case "maand": return { start: startOfMonth(currentDate), end: endOfMonth(currentDate) };
      case "jaar": return { start: startOfYear(currentDate), end: endOfYear(currentDate) };
    }
  }, [viewMode, currentDate]);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      const rangeStart = format(dateRange.start, "yyyy-MM-dd");
      const rangeEnd = format(dateRange.end, "yyyy-MM-dd");

      const [schouwen, installaties, afsprakenRes] = await Promise.all([
        supabase.from("schouwen").select("id, geplande_datum, consument_naam, schouw_nummer, status, categorie, adviseur_id")
          .gte("geplande_datum", rangeStart).lte("geplande_datum", rangeEnd),
        supabase.from("installaties").select("id, geplande_startdatum, geplande_einddatum, consument_naam, status, installateur_id")
          .gte("geplande_startdatum", rangeStart).lte("geplande_startdatum", rangeEnd),
        supabase.from("afspraken" as any).select("id, datum, titel, type, status, start_tijd, eind_tijd, locatie, notities, adviseur_id")
          .gte("datum", rangeStart).lte("datum", rangeEnd),
      ]);

      const takenRes = await supabase
        .from("helpdesk_ticket_taken")
        .select("id, titel, geplande_datum, geplande_starttijd, geplande_eindtijd, agenda_user_id, status, ticket_id")
        .eq("inplannen_in_agenda", true)
        .gte("geplande_datum", rangeStart)
        .lte("geplande_datum", rangeEnd);

      // Build user name map from teamUsers
      const userMap = new Map(teamUsers.map(u => [u.id, `${u.voornaam} ${u.achternaam}`]));

      const mapped: CalendarEvent[] = [
        ...(schouwen.data ?? []).map((s) => ({
          id: s.id, date: s.geplande_datum,
          title: s.consument_naam ?? s.schouw_nummer, type: "schouw" as const, status: s.status,
          adviseur_id: s.adviseur_id, adviseur_naam: userMap.get(s.adviseur_id),
          extra: { schouw_nummer: s.schouw_nummer, categorie: s.categorie },
        })),
        ...(installaties.data ?? []).map((i) => ({
          id: i.id, date: i.geplande_startdatum!,
          title: i.consument_naam ?? "Installatie", type: "installatie" as const, status: i.status,
          adviseur_id: i.installateur_id ?? undefined,
          extra: { einddatum: i.geplande_einddatum },
        })),
        ...((afsprakenRes.data as any[]) ?? []).map((a: any) => ({
          id: a.id, date: a.datum,
          title: a.titel, type: "afspraak" as const, status: a.status,
          adviseur_id: a.adviseur_id, adviseur_naam: userMap.get(a.adviseur_id),
          extra: { type: a.type, start_tijd: a.start_tijd, eind_tijd: a.eind_tijd, locatie: a.locatie },
        })),
        ...((takenRes.data as any[]) ?? []).map((t: any) => ({
          id: t.id, date: t.geplande_datum,
          title: t.titel, type: "taak" as const, status: t.status,
          adviseur_id: t.agenda_user_id ?? undefined,
          adviseur_naam: t.agenda_user_id ? userMap.get(t.agenda_user_id) : undefined,
          extra: { start_tijd: t.geplande_starttijd, eind_tijd: t.geplande_eindtijd, ticket_id: t.ticket_id },
        })),
      ];
      setEvents(mapped);
      setLoading(false);
    };
    fetchEvents();
  }, [dateRange, teamUsers]);

  // Filter events for "mijn agenda"
  const filteredEvents = useMemo(() => {
    if (mijnAgenda && profile?.id) {
      return events.filter(e => {
        if (e.type === "installatie") {
          if (isInstallateur) return e.adviseur_id === profile.id;
          return true;
        }
        return e.adviseur_id === profile.id;
      });
    }
    if (selectedAdviseur !== "alle") {
      return events.filter(e => {
        if (e.type === "installatie") return true;
        return e.adviseur_id === selectedAdviseur;
      });
    }
    return events;
  }, [events, mijnAgenda, selectedAdviseur, profile?.id, isInstallateur]);

  const getEventsForDay = useCallback(
    (day: Date) => filteredEvents.filter((e) => isSameDay(parseISO(e.date), day)),
    [filteredEvents],
  );

  const navigate = (dir: -1 | 1) => {
    switch (viewMode) {
      case "dag": setCurrentDate(dir === 1 ? addDays(currentDate, 1) : subDays(currentDate, 1)); break;
      case "week": setCurrentDate(dir === 1 ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1)); break;
      case "maand": setCurrentDate(dir === 1 ? addMonths(currentDate, 1) : subMonths(currentDate, 1)); break;
      case "jaar": setCurrentDate(dir === 1 ? addYears(currentDate, 1) : subYears(currentDate, 1)); break;
    }
  };

  const headerLabel = useMemo(() => {
    switch (viewMode) {
      case "dag": return format(currentDate, "EEEE d MMMM yyyy", { locale: nl });
      case "week": {
        const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
        const we = endOfWeek(currentDate, { weekStartsOn: 1 });
        return `${format(ws, "d MMM", { locale: nl })} – ${format(we, "d MMM yyyy", { locale: nl })}`;
      }
      case "maand": return format(currentDate, "MMMM yyyy", { locale: nl });
      case "jaar": return format(currentDate, "yyyy");
    }
  }, [viewMode, currentDate]);

  const handleStatusUpdate = async (event: CalendarEvent, newStatus: string) => {
    if (event.type === "afspraak") {
      const { error } = await supabase.from("afspraken" as any).update({ status: newStatus } as any).eq("id", event.id);
      if (error) { toast.error(error.message); return; }
    } else {
      const table = event.type === "schouw" ? "schouwen" : "installaties";
      const { error } = await supabase.from(table).update({ status: newStatus as any }).eq("id", event.id);
      if (error) { toast.error(error.message); return; }
    }
    toast.success("Status bijgewerkt");
    setEvents((prev) => prev.map((e) => e.id === event.id ? { ...e, status: newStatus } : e));
    setSelectedEvent((prev) => prev?.id === event.id ? { ...prev, status: newStatus } : prev);
  };

  const handleSubscribe = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Je moet ingelogd zijn"); return; }
    const { data } = await supabase.from("users").select("ical_token").eq("id", user.id).single();
    if (data?.ical_token) {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/planning-ical-feed?token=${data.ical_token}`;
      setFeedUrl(url);
      await navigator.clipboard.writeText(url);
      toast.success("Feed URL gekopieerd naar klembord!");
    } else {
      toast.error("Kon iCal token niet ophalen");
    }
  };

  const EventChip = ({ ev }: { ev: CalendarEvent }) => (
    <button
      onClick={() => setSelectedEvent(ev)}
      className={`w-full text-left text-[10px] leading-tight px-1.5 py-0.5 rounded truncate flex items-center gap-1 hover:opacity-80 transition-opacity ${
        ev.type === "schouw" ? "bg-primary/10 text-primary" :
        ev.type === "installatie" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" :
        ev.type === "taak" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" :
        ev.extra?.type === "belafspraak" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" :
        "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
      }`}
    >
      {ev.type === "schouw" ? <ClipboardList className="h-2.5 w-2.5 shrink-0" /> :
       ev.type === "installatie" ? <Wrench className="h-2.5 w-2.5 shrink-0" /> :
       ev.type === "taak" ? <CheckSquare className="h-2.5 w-2.5 shrink-0" /> :
       ev.extra?.type === "belafspraak" ? <Phone className="h-2.5 w-2.5 shrink-0" /> :
       ev.extra?.type === "op_afstand" ? <Video className="h-2.5 w-2.5 shrink-0" /> : <MapPin className="h-2.5 w-2.5 shrink-0" />}
      <span className="truncate">{ev.title}</span>
      {ev.adviseur_naam && !mijnAgenda && (
        <span className="text-[8px] opacity-70 ml-auto shrink-0">• {ev.adviseur_naam.split(" ")[0]}</span>
      )}
    </button>
  );

  const DayViewSimple = () => {
    const dayEvents = getEventsForDay(currentDate);
    return (
      <div className="space-y-1">
        <div className="grid grid-cols-[60px_1fr] divide-x divide-border">
          {HOURS.map((h) => {
            const showEvents = h === 9;
            return (
              <div key={h} className="contents">
                <div className="h-14 flex items-start justify-end pr-2 pt-1 text-xs text-muted-foreground">
                  {`${String(h).padStart(2, "0")}:00`}
                </div>
                <div className="h-14 border-b border-border p-1 space-y-0.5">
                  {showEvents && dayEvents.map((ev) => <EventChip key={ev.id} ev={ev} />)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const WeekView = () => {
    const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: ws, end: endOfWeek(currentDate, { weekStartsOn: 1 }) });
    return (
      <div className="overflow-x-auto">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] min-w-[700px]">
          <div className="bg-muted p-2" />
          {weekDays.map((d) => (
            <div key={d.toISOString()} className={`bg-muted p-2 text-center text-xs font-medium ${isToday(d) ? "text-primary font-bold" : "text-muted-foreground"}`}>
              {format(d, "EEE d", { locale: nl })}
            </div>
          ))}
          {HOURS.map((h) => (
            <div key={h} className="contents">
              <div className="h-14 flex items-start justify-end pr-2 pt-1 text-xs text-muted-foreground border-b border-border">
                {`${String(h).padStart(2, "0")}:00`}
              </div>
              {weekDays.map((d) => {
                const showEvents = h === 9;
                const dayEvs = showEvents ? getEventsForDay(d) : [];
                return (
                  <div key={d.toISOString()} className={`h-14 border-b border-l border-border p-0.5 space-y-0.5 ${isToday(d) ? "bg-primary/5" : ""}`}>
                    {dayEvs.map((ev) => <EventChip key={ev.id} ev={ev} />)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const MonthView = () => {
    const days = eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) });
    const startDayOfWeek = (getDay(startOfMonth(currentDate)) + 6) % 7;
    return (
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
            <div key={day.toISOString()} className={`bg-card p-2 min-h-[80px] ${isToday(day) ? "ring-2 ring-primary ring-inset" : ""}`}>
              <span className={`text-xs font-medium ${isToday(day) ? "text-primary" : "text-foreground"}`}>{format(day, "d")}</span>
              <div className="mt-1 space-y-1">
                {dayEvents.slice(0, 3).map((ev) => <EventChip key={ev.id} ev={ev} />)}
                {dayEvents.length > 3 && <span className="text-[10px] text-muted-foreground">+{dayEvents.length - 3} meer</span>}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const YearView = () => {
    const months = Array.from({ length: 12 }, (_, i) => new Date(currentDate.getFullYear(), i, 1));
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
        {months.map((monthDate) => {
          const mDays = eachDayOfInterval({ start: startOfMonth(monthDate), end: endOfMonth(monthDate) });
          const offset = (getDay(startOfMonth(monthDate)) + 6) % 7;
          return (
            <div key={monthDate.toISOString()} className="cursor-pointer hover:bg-muted/50 rounded-lg p-2 transition-colors" onClick={() => { setCurrentDate(monthDate); setViewMode("maand"); }}>
              <p className={`text-xs font-semibold mb-1 capitalize ${isSameMonth(monthDate, new Date()) ? "text-primary" : "text-foreground"}`}>
                {format(monthDate, "MMMM", { locale: nl })}
              </p>
              <div className="grid grid-cols-7 gap-px">
                {["M", "D", "W", "D", "V", "Z", "Z"].map((d, i) => (
                  <div key={i} className="text-[8px] text-muted-foreground text-center">{d}</div>
                ))}
                {Array.from({ length: offset }).map((_, i) => <div key={`o-${i}`} />)}
                {mDays.map((day) => {
                  const hasEvents = filteredEvents.some((e) => isSameDay(parseISO(e.date), day));
                  return (
                    <div key={day.toISOString()} className="flex items-center justify-center h-4">
                      <span className={`text-[9px] w-4 h-4 flex items-center justify-center rounded-full ${
                        isToday(day) ? "bg-primary text-primary-foreground font-bold" :
                        hasEvents ? "bg-primary/20 text-primary font-medium" : "text-muted-foreground"
                      }`}>
                        {format(day, "d")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Planning</h1>
          <p className="text-muted-foreground mt-1">Kalenderweergave van schouwen en installaties</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Mijn Agenda toggle */}
          <div className="flex items-center gap-2 mr-2">
            <Switch checked={mijnAgenda} onCheckedChange={(v) => { setMijnAgenda(v); if (v) setSelectedAdviseur("alle"); }} id="mijn-agenda" />
            <Label htmlFor="mijn-agenda" className="text-sm cursor-pointer whitespace-nowrap">
              {mijnAgenda ? "Mijn agenda" : "Alle afspraken"}
            </Label>
          </div>

          {/* Adviseur filter - only for admins when not in "mijn agenda" mode */}
          {isAdmin && !mijnAgenda && teamUsers.length > 0 && (
            <Select value={selectedAdviseur} onValueChange={setSelectedAdviseur}>
              <SelectTrigger className="w-[180px] h-9">
                <User className="h-4 w-4 mr-1 shrink-0" />
                <SelectValue placeholder="Filter adviseur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alle">Alle adviseurs</SelectItem>
                {teamUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.voornaam} {u.achternaam}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as ViewMode)} size="sm">
            <ToggleGroupItem value="dag">Dag</ToggleGroupItem>
            <ToggleGroupItem value="week">Week</ToggleGroupItem>
            <ToggleGroupItem value="maand">Maand</ToggleGroupItem>
            <ToggleGroupItem value="jaar">Jaar</ToggleGroupItem>
          </ToggleGroup>

          <Button size="sm" onClick={() => planningNavigate("/planning/nieuw")}>
            <Plus className="h-4 w-4 mr-1" /> Nieuwe afspraak
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" /> Exporteer
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => downloadICS(filteredEvents)}>
                <CalendarIcon className="h-4 w-4 mr-2" /> Download .ics bestand
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSubscribe}>
                <Link2 className="h-4 w-4 mr-2" /> Abonneer (Google/Outlook)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>



      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg capitalize">{headerLabel}</CardTitle>
            {!isToday(currentDate) && (
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Vandaag</Button>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={() => navigate(1)}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent>
          {viewMode === "dag" && <DayViewSimple />}
          {viewMode === "week" && <WeekView />}
          {viewMode === "maand" && <MonthView />}
          {viewMode === "jaar" && <YearView />}

          <div className="flex gap-4 mt-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><div className="w-3 h-3 rounded bg-primary/10" /> Schouw</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><div className="w-3 h-3 rounded bg-orange-100 dark:bg-orange-900/30" /> Installatie</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><div className="w-3 h-3 rounded bg-violet-100 dark:bg-violet-900/30" /> Afspraak</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><div className="w-3 h-3 rounded bg-emerald-100 dark:bg-emerald-900/30" /> Belafspraak</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><div className="w-3 h-3 rounded bg-purple-100 dark:bg-purple-900/30" /> Taak</div>
          </div>
        </CardContent>
      </Card>

      {/* Feed URL dialog */}
      <Dialog open={!!feedUrl} onOpenChange={(o) => !o && setFeedUrl(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Agenda abonnement</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Kopieer onderstaande URL en voeg deze toe in je agenda-app:</p>
            <div className="bg-muted rounded-lg p-3 text-xs font-mono break-all select-all">{feedUrl}</div>
            <div className="space-y-2 text-sm">
              <p className="font-medium">Instructies:</p>
              <p><strong>Google Calendar:</strong> Instellingen → Overige agenda's → Via URL abonneren → plak de URL</p>
              <p><strong>Outlook:</strong> Agenda → Agenda van internet toevoegen → plak de URL</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Event detail dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={(o) => !o && setSelectedEvent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedEvent?.type === "schouw" ? <ClipboardList className="h-5 w-5 text-primary" /> :
               selectedEvent?.type === "installatie" ? <Wrench className="h-5 w-5 text-orange-500" /> :
               selectedEvent?.type === "taak" ? <CheckSquare className="h-5 w-5 text-purple-500" /> :
               <CalendarIcon className="h-5 w-5 text-violet-500" />}
              {selectedEvent?.type === "schouw" ? "Schouw" : selectedEvent?.type === "installatie" ? "Installatie" : selectedEvent?.type === "taak" ? "Taak" : "Afspraak"} Details
            </DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Klant</p>
                  <p className="font-medium text-foreground">{selectedEvent.title}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Datum</p>
                  <p className="font-medium text-foreground">{format(parseISO(selectedEvent.date), "d MMMM yyyy", { locale: nl })}</p>
                </div>
                {selectedEvent.adviseur_naam && (
                  <div>
                    <p className="text-muted-foreground">Adviseur</p>
                    <p className="font-medium text-foreground">{selectedEvent.adviseur_naam}</p>
                  </div>
                )}
                {selectedEvent.extra?.schouw_nummer && (
                  <div>
                    <p className="text-muted-foreground">Schouw nr.</p>
                    <p className="font-medium text-foreground">{selectedEvent.extra.schouw_nummer}</p>
                  </div>
                )}
                {selectedEvent.extra?.categorie && (
                  <div>
                    <p className="text-muted-foreground">Categorie</p>
                    <p className="font-medium text-foreground capitalize">{selectedEvent.extra.categorie.replace(/_/g, " ")}</p>
                  </div>
                )}
                {selectedEvent.extra?.einddatum && (
                  <div>
                    <p className="text-muted-foreground">Einddatum</p>
                    <p className="font-medium text-foreground">{format(parseISO(selectedEvent.extra.einddatum), "d MMMM yyyy", { locale: nl })}</p>
                  </div>
                )}
                {selectedEvent.extra?.type && (
                  <div>
                    <p className="text-muted-foreground">Type</p>
                    <p className="font-medium text-foreground capitalize">{selectedEvent.extra.type.replace(/_/g, " ")}</p>
                  </div>
                )}
                {selectedEvent.extra?.start_tijd && (
                  <div>
                    <p className="text-muted-foreground">Tijd</p>
                    <p className="font-medium text-foreground">
                      {selectedEvent.extra.start_tijd.slice(0, 5)}
                      {selectedEvent.extra?.eind_tijd && ` - ${selectedEvent.extra.eind_tijd.slice(0, 5)}`}
                    </p>
                  </div>
                )}
                {selectedEvent.extra?.locatie && (
                  <div>
                    <p className="text-muted-foreground">Locatie</p>
                    <p className="font-medium text-foreground">{selectedEvent.extra.locatie}</p>
                  </div>
                )}
              </div>
              {selectedEvent.type === "taak" ? (
                <div className="text-sm">
                  <Badge variant="secondary" className="capitalize">{selectedEvent.status.replace(/_/g, " ")}</Badge>
                  {selectedEvent.extra?.ticket_id && (
                    <Button variant="link" size="sm" className="px-0 ml-2" onClick={() => planningNavigate(`/helpdesk/tickets/${selectedEvent.extra!.ticket_id}`)}>
                      Open ticket →
                    </Button>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Status</p>
                  <Select value={selectedEvent.status} onValueChange={(v) => handleStatusUpdate(selectedEvent, v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(selectedEvent.type === "schouw" ? schouwStatuses : selectedEvent.type === "installatie" ? installatieStatuses : afspraakStatuses).map((s) => (
                        <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Planning;
