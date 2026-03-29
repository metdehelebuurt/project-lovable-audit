import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, CheckCircle2, XCircle, Clock, Mail } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface EmailLogEntry {
  id: string;
  ontvanger_email: string;
  onderwerp: string;
  status: string;
  type: string;
  imap_saved: boolean;
  created_at: string;
  offerte_id: string | null;
  error_message: string | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  verzonden: { label: "Verzonden", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  mislukt: { label: "Mislukt", color: "bg-red-100 text-red-800", icon: XCircle },
  wachtend: { label: "Wachtend", color: "bg-yellow-100 text-yellow-800", icon: Clock },
};

const EmailLog = () => {
  const [logs, setLogs] = useState<EmailLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("email_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    setLogs((data as unknown as EmailLogEntry[]) || []);
    setLoading(false);
  };

  const filtered = logs.filter((l) =>
    l.ontvanger_email.toLowerCase().includes(search.toLowerCase()) ||
    l.onderwerp.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: logs.length,
    verzonden: logs.filter((l) => l.status === "verzonden").length,
    mislukt: logs.filter((l) => l.status === "mislukt").length,
    imapSynced: logs.filter((l) => l.imap_saved).length,
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="rounded-xl border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Totaal</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.verzonden}</p>
              <p className="text-xs text-muted-foreground">Verzonden</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.mislukt}</p>
              <p className="text-xs text-muted-foreground">Mislukt</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.imapSynced}</p>
              <p className="text-xs text-muted-foreground">IMAP gesynchroniseerd</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Zoek op ontvanger of onderwerp..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {/* Table */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ontvanger</TableHead>
                <TableHead>Onderwerp</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>IMAP</TableHead>
                <TableHead>Datum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Laden...</TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Geen e-mails gevonden</TableCell>
                </TableRow>
              ) : (
                filtered.map((log) => {
                  const sc = statusConfig[log.status] || statusConfig.verzonden;
                  const StatusIcon = sc.icon;
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.ontvanger_email}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{log.onderwerp}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">{log.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${sc.color} gap-1`}>
                          <StatusIcon className="h-3 w-3" />
                          {sc.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.imap_saved ? (
                          <Badge className="bg-blue-100 text-blue-800 text-xs">Ja</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(log.created_at), "d MMM HH:mm", { locale: nl })}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailLog;
