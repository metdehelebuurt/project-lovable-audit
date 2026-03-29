import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Inbox, RefreshCw, Mail, MailOpen, FolderOpen } from "lucide-react";
import { toast } from "sonner";

interface ImapEmail {
  uid: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  seen: boolean;
  snippet: string;
}

const EmailInbox = () => {
  const [emails, setEmails] = useState<ImapEmail[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState("INBOX");
  const [loading, setLoading] = useState(false);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<ImapEmail | null>(null);

  useEffect(() => {
    checkConfig();
  }, []);

  const checkConfig = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("partners")
      .select("imap_host, imap_user")
      .single();
    setConfigured(!!(data as any)?.imap_host && !!(data as any)?.imap_user);
    if ((data as any)?.imap_host && (data as any)?.imap_user) {
      loadFolders();
      loadEmails("INBOX");
    }
  };

  const loadFolders = async () => {
    setLoadingFolders(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-offerte-email", {
        body: { action: "list_folders" },
      });
      if (error || data?.error) {
        console.error("Folders error:", data?.error || error);
      } else {
        setFolders(data?.folders || []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoadingFolders(false);
  };

  const loadEmails = async (folder: string) => {
    setLoading(true);
    setSelectedEmail(null);
    try {
      const { data, error } = await supabase.functions.invoke("send-offerte-email", {
        body: { action: "read_inbox", folder, limit: 30 },
      });
      if (error || data?.error) {
        toast.error("Kan inbox niet laden", { description: data?.error || error?.message });
        setEmails([]);
      } else {
        setEmails(data?.emails || []);
      }
    } catch {
      toast.error("Kan inbox niet laden");
    }
    setLoading(false);
  };

  const handleFolderChange = (folder: string) => {
    setSelectedFolder(folder);
    loadEmails(folder);
  };

  const parseFromField = (from: string) => {
    const match = from.match(/^"?(.+?)"?\s*<(.+?)>$/);
    if (match) return { name: match[1], email: match[2] };
    return { name: from, email: from };
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      if (d.toDateString() === now.toDateString()) {
        return d.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
      }
      return d.toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
    } catch {
      return dateStr;
    }
  };

  if (configured === false) {
    return (
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="py-16 text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Inbox className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">IMAP niet geconfigureerd</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Configureer uw IMAP-instellingen bij Instellingen → E-mail om uw inbox hier te bekijken.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {folders.length > 0 && (
          <Select value={selectedFolder} onValueChange={handleFolderChange}>
            <SelectTrigger className="w-[200px]">
              <FolderOpen className="h-3.5 w-3.5 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {folders.map((f) => (
                <SelectItem key={f} value={f}>{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button variant="outline" size="sm" onClick={() => loadEmails(selectedFolder)} disabled={loading} className="gap-2">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Vernieuwen
        </Button>
        <span className="text-sm text-muted-foreground ml-auto">
          {emails.length} e-mail{emails.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ height: "calc(100vh - 320px)" }}>
        {/* Email list */}
        <Card className="rounded-2xl border-0 shadow-sm lg:col-span-1">
          <ScrollArea className="h-full">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : emails.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm">
                Geen e-mails in deze map
              </div>
            ) : (
              <div className="divide-y divide-border">
                {emails.map((email) => {
                  const sender = parseFromField(email.from);
                  const isSelected = selectedEmail?.uid === email.uid;
                  return (
                    <button
                      key={email.uid}
                      onClick={() => setSelectedEmail(email)}
                      className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${
                        isSelected ? "bg-primary/5 border-l-2 border-l-primary" : ""
                      } ${!email.seen ? "font-semibold" : ""}`}
                    >
                      <div className="flex items-start gap-2">
                        {email.seen ? (
                          <MailOpen className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        ) : (
                          <Mail className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm truncate">{sender.name}</span>
                            <span className="text-[11px] text-muted-foreground shrink-0">{formatDate(email.date)}</span>
                          </div>
                          <p className="text-sm truncate text-foreground">{email.subject}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Email detail */}
        <Card className="rounded-2xl border-0 shadow-sm lg:col-span-2">
          {selectedEmail ? (
            <div className="p-6 space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground">{selectedEmail.subject}</h2>
                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <p><span className="font-medium text-foreground">Van:</span> {selectedEmail.from}</p>
                  <p><span className="font-medium text-foreground">Aan:</span> {selectedEmail.to}</p>
                  <p><span className="font-medium text-foreground">Datum:</span> {selectedEmail.date}</p>
                </div>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground">
                  De volledige e-mailinhoud is beschikbaar in uw e-mailclient. Vanuit het platform ziet u alleen de headers.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm py-32">
              Selecteer een e-mail om details te bekijken
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default EmailInbox;
