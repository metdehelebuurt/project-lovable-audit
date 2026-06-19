import { useState } from "react";
import DOMPurify from "dompurify";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mail, MailOpen, Send, Plus, Inbox } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import EmailCompose from "@/components/email/EmailCompose";

interface Props {
  leadId?: string;
  klantId?: string;
  affiliateLeadId?: string;
  email?: string;
  emails?: string[];
}

const EmailTab = ({ leadId, klantId, affiliateLeadId, email, emails }: Props) => {
  const [composeOpen, setComposeOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<any>(null);

  // Verzamel alle e-mailadressen voor lookup
  const allEmails = (emails && emails.length > 0 ? emails : (email ? [email] : []))
    .map(e => (e || "").trim().toLowerCase())
    .filter(Boolean);

  const { data: berichten = [], refetch } = useQuery({
    queryKey: ["email-berichten", leadId, klantId, affiliateLeadId, allEmails.join(",")],
    queryFn: async () => {
      let query = supabase
        .from("email_berichten" as any)
        .select("*")
        .order("datum", { ascending: false })
        .limit(50);

      if (leadId) {
        query = query.eq("lead_id", leadId);
      } else if (affiliateLeadId && allEmails.length > 0) {
        const quoted = allEmails.map(e => `"${e}"`).join(",");
        query = query.or(`affiliate_lead_id.eq.${affiliateLeadId},van.in.(${quoted}),aan.in.(${quoted})`);
      } else if (affiliateLeadId) {
        query = query.eq("affiliate_lead_id", affiliateLeadId);
      } else if (klantId && allEmails.length > 0) {
        const quoted = allEmails.map(e => `"${e}"`).join(",");
        query = query.or(`klant_id.eq.${klantId},van.in.(${quoted}),aan.in.(${quoted})`);
      } else if (klantId) {
        query = query.eq("klant_id", klantId);
      }

      const { data } = await query;
      return (data || []) as any[];
    },
    enabled: !!(leadId || klantId || affiliateLeadId),
  });

  if (berichten.length === 0 && !selectedEmail) {
    return (
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="py-12 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Inbox className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Geen e-mails</h3>
            <p className="text-sm text-muted-foreground">Er zijn nog geen e-mails gekoppeld aan dit contact.</p>
          </div>
          {email && (
            <Button size="sm" onClick={() => setComposeOpen(true)} className="gap-2">
              <Plus className="h-3.5 w-3.5" /> E-mail sturen
            </Button>
          )}
          <EmailCompose
            open={composeOpen}
            onOpenChange={setComposeOpen}
            defaultTo={email || ""}
            availableTo={allEmails}
            leadId={leadId}
            klantId={klantId}
            affiliateLeadId={affiliateLeadId}
            onSent={() => refetch()}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">{berichten.length} e-mail{berichten.length !== 1 ? "s" : ""}</h3>
        {email && (
          <Button size="sm" onClick={() => setComposeOpen(true)} className="gap-2">
            <Plus className="h-3.5 w-3.5" /> E-mail sturen
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="rounded-2xl border-0 shadow-sm">
          <ScrollArea className="h-[400px]">
            <div className="divide-y divide-border">
              {berichten.map((msg: any) => (
                <button
                  key={msg.id}
                  onClick={() => setSelectedEmail(msg)}
                  className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${
                    selectedEmail?.id === msg.id ? "bg-primary/5 border-l-2 border-l-primary" : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {msg.richting === "uitgaand" ? (
                      <Send className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                    ) : msg.is_gelezen ? (
                      <MailOpen className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    ) : (
                      <Mail className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-2">
                        <span className="text-sm truncate font-medium">
                          {msg.richting === "uitgaand" ? `Aan: ${msg.aan}` : msg.van}
                        </span>
                        <span className="text-[11px] text-muted-foreground shrink-0">
                          {format(new Date(msg.datum), "d MMM HH:mm", { locale: nl })}
                        </span>
                      </div>
                      <p className="text-sm truncate">{msg.onderwerp}</p>
                      {msg.richting === "uitgaand" && (msg.document_type || msg.van) && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          via {msg.van}
                          {msg.document_type ? ` · ${msg.document_type}` : ""}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          {selectedEmail ? (
            <div className="p-4 space-y-3">
              <h3 className="font-semibold">{selectedEmail.onderwerp}</h3>
              <div className="text-sm text-muted-foreground space-y-0.5">
                <p><span className="font-medium text-foreground">Van:</span> {selectedEmail.van}</p>
                <p><span className="font-medium text-foreground">Aan:</span> {selectedEmail.aan}</p>
                <p><span className="font-medium text-foreground">Datum:</span> {new Date(selectedEmail.datum).toLocaleString("nl-NL")}</p>
              </div>
              <div className="border-t pt-3">
                {selectedEmail.body_html ? (
                  <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedEmail.body_html, { ALLOWED_TAGS: ['b','i','u','p','br','a','ul','ol','li','div','span','strong','em','h1','h2','h3','h4','table','tr','td','th','thead','tbody','img'], ALLOWED_ATTR: ['href','src','alt','style','class','target'] }) }} className="prose prose-sm max-w-none" />
                ) : (
                  <pre className="text-sm whitespace-pre-wrap font-sans">{selectedEmail.body_text || "Geen inhoud"}</pre>
                )}
              </div>
            </div>
          ) : (
            <CardContent className="flex items-center justify-center h-[400px] text-sm text-muted-foreground">
              Selecteer een e-mail
            </CardContent>
          )}
        </Card>
      </div>

      <EmailCompose
        open={composeOpen}
        onOpenChange={setComposeOpen}
        defaultTo={email || ""}
        availableTo={allEmails}
        leadId={leadId}
        klantId={klantId}
        affiliateLeadId={affiliateLeadId}
        onSent={() => refetch()}
      />
    </div>
  );
};

export default EmailTab;
