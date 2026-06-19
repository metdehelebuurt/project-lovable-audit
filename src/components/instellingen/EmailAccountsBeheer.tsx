import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Mail, Star, Unlink, User } from "lucide-react";
import { toast } from "sonner";

interface Props {
  partnerId: string;
}

const EmailAccountsBeheer = ({ partnerId }: Props) => {
  const qc = useQueryClient();
  const { data: accounts, isLoading } = useQuery({
    queryKey: ["partner-email-accounts-beheer", partnerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_accounts")
        .select("id, email_adres, provider, user_id, is_default_voor_partner, last_sync_at, actief, needs_reauth, last_sync_error")
        .eq("partner_id", partnerId)
        .eq("actief", true)
        .order("is_default_voor_partner", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const markeerAlsDefault = async (id: string) => {
    // Reset alle defaults, zet daarna deze
    await supabase.from("email_accounts")
      .update({ is_default_voor_partner: false })
      .eq("partner_id", partnerId);
    const { error } = await supabase.from("email_accounts")
      .update({ is_default_voor_partner: true })
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Standaard partner-account ingesteld");
    qc.invalidateQueries({ queryKey: ["partner-email-accounts-beheer", partnerId] });
    qc.invalidateQueries({ queryKey: ["partner-email-accounts", partnerId] });
  };

  const ontkoppel = async (id: string) => {
    const { error } = await supabase.from("email_accounts")
      .update({ actief: false, is_default_voor_partner: false })
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Account ontkoppeld");
    qc.invalidateQueries({ queryKey: ["partner-email-accounts-beheer", partnerId] });
  };

  if (isLoading) return null;

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Mail className="h-5 w-5 text-primary" />
        </div>
        <div>
          <CardTitle className="text-lg">Gekoppelde mailboxen</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Overzicht van alle mailboxen binnen deze organisatie en welk account het standaard adres is
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {!accounts || accounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nog geen mailboxen gekoppeld. Koppel hieronder een persoonlijke Gmail/Outlook of stel SMTP in.
          </p>
        ) : (
          <div className="divide-y rounded-xl border">
            {accounts.map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-4">
                <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                  {a.user_id ? <User className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{a.email_adres}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="outline" className="text-[10px]">
                      {a.provider === "google" ? "Gmail" : "Outlook"}
                    </Badge>
                    {a.is_default_voor_partner && (
                      <Badge className="text-[10px] gap-1">
                        <Star className="h-2.5 w-2.5" />Standaard partner-adres
                      </Badge>
                    )}
                    {!a.user_id && (
                      <Badge variant="secondary" className="text-[10px]">Organisatie-account</Badge>
                    )}
                    {a.user_id && (
                      <Badge variant="secondary" className="text-[10px]">Persoonlijk</Badge>
                    )}
                    {(a as any).needs_reauth && (
                      <Badge
                        variant="destructive"
                        className="text-[10px]"
                        title={(a as any).last_sync_error || "Refresh-token verlopen"}
                      >
                        Opnieuw koppelen
                      </Badge>
                    )}
                    {!(a as any).needs_reauth && (a as any).last_sync_error && (
                      <Badge
                        variant="outline"
                        className="text-[10px] text-destructive border-destructive/30"
                        title={(a as any).last_sync_error}
                      >
                        Syncfout
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {!a.is_default_voor_partner && (
                    <Button size="sm" variant="outline" onClick={() => markeerAlsDefault(a.id)} className="gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" />Maak standaard
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => ontkoppel(a.id)} className="text-destructive">
                    <Unlink className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmailAccountsBeheer;