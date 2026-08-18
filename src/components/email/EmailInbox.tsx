import { useState, useEffect } from "react";
import DOMPurify from "dompurify";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Inbox, RefreshCw, Mail, MailOpen, Search, Send, Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import EmailCompose from "./EmailCompose";
import { useBerichtenZichtbaarheid, fetchToegewezenEntiteiten, buildToegewezenFilter } from "@/hooks/useBerichtenZichtbaarheid";

interface EmailBericht {
  id: string;
  richting: string;
  van: string;
  aan: string;
  onderwerp: string;
  body_html: string | null;
  body_text: string | null;
  datum: string;
  is_gelezen: boolean;
  lead_id: string | null;
  klant_id: string | null;
  offerte_id: string | null;
}

const EmailInbox = () => {
  const { profile } = useAuth();
  const zichtbaarheid = useBerichtenZichtbaarheid();
  const [emails, setEmails] = useState<EmailBericht[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [hasAccount, setHasAccount] = useState<boolean | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<EmailBericht | null>(null);
  const [filter, setFilter] = useState<"alle" | "inkomend" | "uitgaand">("alle");
  const [search, setSearch] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);

  useEffect(() => {
    if (!profile?.id) return;
    checkAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, profile?.partner_id, zichtbaarheid]);

  const checkAndLoad = async () => {
    if (!profile?.id) return;
    if (zichtbaarheid === "geen") {
      setHasAccount(true);
      setLoading(false);
      return;
    }
    // Eerst eigen accounts; anders partner-accounts (meerdere mogelijk).
    const { data: eigen } = await supabase
      .from("email_accounts" as any)
      .select("id")
      .eq("user_id", profile.id)
      .eq("actief", true)
      .limit(1);

    let gevonden = (eigen ?? []).length > 0;
    if (!gevonden && profile.partner_id) {
      const { data: partnerAccounts } = await supabase
        .from("email_accounts" as any)
        .select("id")
        .eq("partner_id", profile.partner_id)
        .eq("actief", true)
        .limit(1);
      gevonden = (partnerAccounts ?? []).length > 0;
    }

    setHasAccount(gevonden);
    if (gevonden) loadEmails();
    else setLoading(false);
  };

  const loadEmails = async () => {
    setLoading(true);
    let query = supabase
      .from("email_berichten" as any)
      .select("id, richting, van, aan, onderwerp, body_html, body_text, datum, is_gelezen, lead_id, klant_id, offerte_id")
      .order("datum", { ascending: false })
      .limit(100);

    if (zichtbaarheid === "toegewezen" && profile?.partner_id && profile?.id) {
      const ids = await fetchToegewezenEntiteiten(supabase, profile.id, profile.partner_id);
      const orFilter = buildToegewezenFilter(ids);
      if (!orFilter) {
        setEmails([]);
        setLoading(false);
        return;
      }
      query = query.or(orFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error(error);
      toast.error("Kan berichten niet laden");
    }
    setEmails((data as unknown as EmailBericht[]) || []);
    setLoading(false);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("email-api-sync", {});
      if (error || data?.error) {
        toast.error("Sync mislukt", { description: data?.error || error?.message });
      } else {
        toast.success(`${data?.synced || 0} nieuwe berichten`);
        loadEmails();
      }
    } catch { toast.error("Sync mislukt"); }
    setSyncing(false);
  };

  const parseFrom = (from: string) => {
    const match = from.match(/^"?(.+?)"?\s*<(.+?)>$/);
    return match ? { name: match[1], email: match[2] } : { name: from, email: from };
  };

  const formatDate = (d: string) => {
    try {
      const date = new Date(d);
      const now = new Date();
      if (date.toDateString() === now.toDateString()) {
        return format(date, "HH:mm");
      }
      return format(date, "d MMM", { locale: nl });
    } catch { return d; }
  };

  const filtered = emails.filter(e => {
    if (filter !== "alle" && e.richting !== filter) return false;
    if (search) {
      const s = search.toLowerCase();
      return e.onderwerp.toLowerCase().includes(s) || e.van.toLowerCase().includes(s) || e.aan.toLowerCase().includes(s);
    }
    return true;
  });

  if (zichtbaarheid === "geen") {
    return (
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="py-16 text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Inbox className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Inbox is uitgeschakeld</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            De inbox-toegang is voor jou uitgeschakeld door je organisatiebeheerder.
            Neem contact op met je beheerder als je toegang nodig hebt.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (hasAccount === false) {
    return (
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="py-16 text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Inbox className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Geen e-mailaccount gekoppeld</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Koppel je Gmail of Outlook account bij Instellingen → E-mail om je inbox hier te bekijken.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Zoeken..." className="pl-10" />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle</SelectItem>
            <SelectItem value="inkomend">Ontvangen</SelectItem>
            <SelectItem value="uitgaand">Verzonden</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing} className="gap-2">
          <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
          Synchroniseren
        </Button>
        <Button size="sm" onClick={() => setComposeOpen(true)} className="gap-2 ml-auto">
          <Plus className="h-3.5 w-3.5" /> Nieuwe e-mail
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ height: "calc(100vh - 320px)" }}>
        <Card className="rounded-2xl border-0 shadow-sm lg:col-span-1">
          <ScrollArea className="h-full">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm">
                {search ? "Geen resultaten" : "Geen e-mails"}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filtered.map(email => {
                  const sender = parseFrom(email.van);
                  const isSelected = selectedEmail?.id === email.id;
                  return (
                    <button
                      key={email.id}
                      onClick={() => setSelectedEmail(email)}
                      className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${
                        isSelected ? "bg-primary/5 border-l-2 border-l-primary" : ""
                      } ${!email.is_gelezen ? "font-semibold" : ""}`}
                    >
                      <div className="flex items-start gap-2">
                        {email.richting === "uitgaand" ? (
                          <Send className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                        ) : email.is_gelezen ? (
                          <MailOpen className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        ) : (
                          <Mail className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm truncate">
                              {email.richting === "uitgaand" ? `Aan: ${email.aan}` : sender.name}
                            </span>
                            <span className="text-[11px] text-muted-foreground shrink-0">{formatDate(email.datum)}</span>
                          </div>
                          <p className="text-sm truncate text-foreground">{email.onderwerp}</p>
                          {(email.lead_id || email.klant_id) && (
                            <div className="flex gap-1 mt-1">
                              {email.lead_id && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Lead</Badge>}
                              {email.klant_id && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Klant</Badge>}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm lg:col-span-2">
          {selectedEmail ? (
            <div className="p-6 space-y-4 h-full flex flex-col">
              <div>
                <h2 className="text-xl font-semibold text-foreground">{selectedEmail.onderwerp}</h2>
                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <p><span className="font-medium text-foreground">Van:</span> {selectedEmail.van}</p>
                  <p><span className="font-medium text-foreground">Aan:</span> {selectedEmail.aan}</p>
                  <p><span className="font-medium text-foreground">Datum:</span> {new Date(selectedEmail.datum).toLocaleString("nl-NL")}</p>
                </div>
              </div>
              <div className="border-t pt-4 flex-1 overflow-auto">
                {selectedEmail.body_html ? (
                  <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedEmail.body_html, { ALLOWED_TAGS: ['b','i','u','p','br','a','ul','ol','li','div','span','strong','em','h1','h2','h3','h4','table','tr','td','th','thead','tbody','img'], ALLOWED_ATTR: ['href','src','alt','style','class','target'] }) }} className="prose prose-sm max-w-none" />
                ) : selectedEmail.body_text ? (
                  <pre className="text-sm whitespace-pre-wrap font-sans">{selectedEmail.body_text}</pre>
                ) : (
                  <p className="text-sm text-muted-foreground">Geen inhoud beschikbaar</p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm py-32">
              Selecteer een e-mail om details te bekijken
            </div>
          )}
        </Card>
      </div>

      <EmailCompose open={composeOpen} onOpenChange={setComposeOpen} onSent={loadEmails} />
    </div>
  );
};

export default EmailInbox;
