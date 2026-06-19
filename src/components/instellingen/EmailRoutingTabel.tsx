import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Mail, Info } from "lucide-react";
import { useEmailRouting, type DocumentType, type Bron } from "@/hooks/instellingen/useEmailRouting";

interface Props {
  partnerId: string;
}

const LABELS: Record<DocumentType, { titel: string; uitleg: string }> = {
  offerte:          { titel: "Offertes",                uitleg: "Versturen van nieuwe offertes" },
  orderbevestiging: { titel: "Orderbevestigingen",      uitleg: "Bevestigingen na akkoord van een offerte" },
  factuur:          { titel: "Facturen",                uitleg: "Verzending van facturen en credit-nota's" },
  herinnering:      { titel: "Herinneringen",           uitleg: "Automatische offerte- en betaalherinneringen" },
  chat_klant:       { titel: "Klant-communicatie",      uitleg: "Berichten via klantkaart en portal-chat" },
  chat_lead:        { titel: "Lead-communicatie",       uitleg: "Berichten via leadkaart en opvolging" },
  notificatie:      { titel: "Systeem-notificaties",    uitleg: "Notificatiemails over taken en updates" },
  algemeen:         { titel: "Overige e-mails",         uitleg: "Alles wat niet in een andere categorie valt" },
};

const BRON_LABEL: Record<Bron, string> = {
  partner_default: "Vast algemeen adres",
  gebruiker_persoonlijk: "Mailbox van verzendende gebruiker",
  specifiek_account: "Specifiek gekoppeld account",
};

const EmailRoutingTabel = ({ partnerId }: Props) => {
  const { data: routing, isLoading, update } = useEmailRouting(partnerId);

  const { data: accounts } = useQuery({
    queryKey: ["partner-email-accounts", partnerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_accounts")
        .select("id, email_adres, provider, user_id")
        .eq("partner_id", partnerId)
        .eq("actief", true);
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading || !routing) return null;

  const handleChange = (docType: DocumentType, value: string) => {
    if (value.startsWith("account:")) {
      update.mutate({ documentType: docType, bron: "specifiek_account", emailAccountId: value.slice(8) });
    } else {
      update.mutate({ documentType: docType, bron: value as Bron, emailAccountId: null });
    }
  };

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Mail className="h-5 w-5 text-primary" />
        </div>
        <div>
          <CardTitle className="text-lg">Verzendroutering per type bericht</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Bepaal voor elk type bericht vanaf welke mailbox het verstuurd wordt
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg p-3">
          <Info className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
          <p>
            <span className="font-medium text-foreground">Vast algemeen adres</span> gebruikt het centrale partner-postvak.
            <span className="font-medium text-foreground"> Mailbox van verzender</span> gebruikt de persoonlijke Gmail/Outlook van de medewerker die op dat moment de actie uitvoert.
            Berichten worden altijd gelogd op de klant- of leadkaart, ongeacht de keuze.
          </p>
        </div>

        <div className="divide-y rounded-xl border">
          {Object.entries(LABELS).map(([dt, meta]) => {
            const row = routing[dt as DocumentType];
            const currentValue =
              row.bron === "specifiek_account" && row.email_account_id
                ? `account:${row.email_account_id}`
                : row.bron;
            return (
              <div key={dt} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{meta.titel}</p>
                  <p className="text-xs text-muted-foreground">{meta.uitleg}</p>
                  <Badge variant="outline" className="text-[10px] mt-1">{BRON_LABEL[row.bron]}</Badge>
                </div>
                <Select value={currentValue} onValueChange={(v) => handleChange(dt as DocumentType, v)}>
                  <SelectTrigger className="sm:w-72">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="partner_default">Vast algemeen adres</SelectItem>
                    <SelectItem value="gebruiker_persoonlijk">Mailbox van verzender</SelectItem>
                    {(accounts || []).map((a) => (
                      <SelectItem key={a.id} value={`account:${a.id}`}>
                        Specifiek: {a.email_adres}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailRoutingTabel;