import { Children } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Mail, Bell, AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  feedbackId: string;
}

interface EmailRow {
  id: string;
  message_id: string;
  template_name: string;
  recipient_email: string;
  status: string;
  error_message: string | null;
  created_at: string;
}

interface NotifRow {
  id: string;
  user_id: string;
  type: string;
  titel: string;
  bericht: string | null;
  gelezen: boolean;
  created_at: string;
  ontvanger: { voornaam?: string; achternaam?: string; email?: string } | null;
}

const statusKleur: Record<string, string> = {
  sent: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  suppressed: "bg-amber-100 text-amber-700",
  dlq: "bg-destructive/15 text-destructive",
  failed: "bg-destructive/15 text-destructive",
  bounced: "bg-destructive/15 text-destructive",
  complained: "bg-destructive/15 text-destructive",
};

function dedupeByMessageId(rows: EmailRow[]): EmailRow[] {
  const map = new Map<string, EmailRow>();
  for (const r of rows) {
    const cur = map.get(r.message_id);
    if (!cur || new Date(r.created_at) > new Date(cur.created_at)) {
      map.set(r.message_id, r);
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

function formatDatum(iso: string) {
  return new Date(iso).toLocaleString("nl-NL", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function templateLabel(name: string) {
  if (name === "feedback-nieuw-platform") return "Melding aan platformadmin";
  if (name === "feedback-status-update") return "Statusupdate aan indiener";
  return name;
}

function ontvangerNaam(o: NotifRow["ontvanger"]) {
  if (!o) return "Onbekende gebruiker";
  const naam = [o.voornaam, o.achternaam].filter(Boolean).join(" ").trim();
  return naam || o.email || "Onbekend";
}

export default function FeedbackNotificatieLog({ feedbackId }: Props) {
  const query = useQuery({
    queryKey: ["feedback_notif_log", feedbackId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("feedback-notify", {
        body: { event: "log", feedback_id: feedbackId },
      });
      if (error) throw error;
      return data as { emails: EmailRow[]; notifs: NotifRow[] };
    },
  });

  const emails = dedupeByMessageId(query.data?.emails ?? []);
  const notifs = query.data?.notifs ?? [];

  return (
    <div className="space-y-3 border-t pt-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Notificatielogboek</h4>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => query.refetch()}
          disabled={query.isFetching}
        >
          <RefreshCcw className="h-3.5 w-3.5 mr-1" />
          Vernieuwen
        </Button>
      </div>

      {query.isLoading ? (
        <p className="text-xs text-muted-foreground">Laden…</p>
      ) : query.isError ? (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" /> Kon logboek niet laden
        </p>
      ) : (
        <div className="space-y-4">
          <LogSectie
            titel="E-mailmeldingen"
            icoon={<Mail className="h-3.5 w-3.5" />}
            leeg="Nog geen e-mails verstuurd voor dit verzoek."
          >
            {emails.map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-2 text-xs border-b last:border-0 py-1.5"
              >
                <Badge
                  variant="outline"
                  className={`${statusKleur[e.status] ?? ""} border-transparent`}
                >
                  {e.status}
                </Badge>
                <span className="font-medium truncate">{e.recipient_email}</span>
                <span className="text-muted-foreground hidden sm:inline">
                  · {templateLabel(e.template_name)}
                </span>
                <span className="ml-auto text-muted-foreground shrink-0">
                  {formatDatum(e.created_at)}
                </span>
                {e.error_message ? (
                  <span
                    title={e.error_message}
                    className="text-destructive truncate max-w-[14rem]"
                  >
                    {e.error_message}
                  </span>
                ) : null}
              </div>
            ))}
          </LogSectie>

          <LogSectie
            titel="In-app meldingen"
            icoon={<Bell className="h-3.5 w-3.5" />}
            leeg="Nog geen in-app meldingen aangemaakt."
          >
            {notifs.map((n) => (
              <div
                key={n.id}
                className="flex items-center gap-2 text-xs border-b last:border-0 py-1.5"
              >
                <Badge
                  variant="outline"
                  className={
                    n.gelezen
                      ? "bg-muted text-muted-foreground border-transparent"
                      : "bg-primary/10 text-primary border-transparent"
                  }
                >
                  {n.gelezen ? "gelezen" : "ongelezen"}
                </Badge>
                <span className="font-medium truncate">{ontvangerNaam(n.ontvanger)}</span>
                <span className="text-muted-foreground hidden sm:inline truncate">
                  · {n.titel}
                </span>
                <span className="ml-auto text-muted-foreground shrink-0">
                  {formatDatum(n.created_at)}
                </span>
              </div>
            ))}
          </LogSectie>
        </div>
      )}
    </div>
  );
}

function LogSectie({
  titel,
  icoon,
  leeg,
  children,
}: {
  titel: string;
  icoon: React.ReactNode;
  leeg: string;
  children: React.ReactNode;
}) {
  const heeftItems = Children.count(children) > 0;
  return (
    <div>
      <p className="text-xs font-medium flex items-center gap-1 mb-1">
        {icoon} {titel}
      </p>
      {heeftItems ? (
        <div className="rounded-md border bg-muted/30 px-2">{children}</div>
      ) : (
        <p className="text-xs text-muted-foreground italic">{leeg}</p>
      )}
    </div>
  );
}