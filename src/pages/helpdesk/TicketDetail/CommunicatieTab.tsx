import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lock, Send, MessageSquare, Mail } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTicketBerichten, useAddBericht } from "@/hooks/helpdesk/useTicketDetail";
import type { HelpdeskTicket } from "@/hooks/helpdesk/useTickets";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export default function CommunicatieTab({ ticket }: { ticket: HelpdeskTicket }) {
  const { user } = useAuth();
  const { data: berichten = [] } = useTicketBerichten(ticket.id);
  const add = useAddBericht();
  const [inhoud, setInhoud] = useState("");
  const [richting, setRichting] = useState("intern");
  const [aanEmail, setAanEmail] = useState("");
  const [onderwerp, setOnderwerp] = useState("");
  const [versturen, setVersturen] = useState(false);
  const [sjabloonId, setSjabloonId] = useState<string>("");

  const { data: klantInfo } = useQuery({
    queryKey: ["ticket-klant-email", ticket.klant_id],
    enabled: !!ticket.klant_id,
    queryFn: async () => {
      const { data } = await supabase.from("klanten").select("voornaam, achternaam, email, extra_emails").eq("id", ticket.klant_id!).maybeSingle();
      return data as { voornaam: string | null; achternaam: string | null; email: string | null; extra_emails: string[] | null } | null;
    },
  });

  const { data: sjablonen = [] } = useQuery({
    queryKey: ["helpdesk-email-sjablonen", ticket.partner_id],
    queryFn: async () => {
      const { data } = await supabase.from("helpdesk_email_sjablonen" as never).select("*").eq("partner_id", ticket.partner_id).order("naam");
      return (data ?? []) as Array<{ id: string; naam: string; onderwerp: string; inhoud: string }>;
    },
  });

  const klantEmails = [klantInfo?.email, ...(klantInfo?.extra_emails ?? [])].filter((e): e is string => !!e);

  const applySjabloon = (id: string) => {
    setSjabloonId(id);
    const s = sjablonen.find((x) => x.id === id);
    if (!s) return;
    const subst = (txt: string) =>
      txt
        .split("{klant.voornaam}").join(klantInfo?.voornaam ?? "")
        .split("{klant.achternaam}").join(klantInfo?.achternaam ?? "")
        .split("{ticket.nummer}").join(ticket.ticketnummer)
        .split("{ticket.titel}").join(ticket.titel);
    setOnderwerp(subst(s.onderwerp));
    setInhoud(subst(s.inhoud));
  };

  const send = async () => {
    if (!user || !inhoud.trim()) return;

    // Bij uitgaande klantmail: ook daadwerkelijk e-mail versturen via email-api-send
    if (richting === "uitgaand" && aanEmail.trim()) {
      setVersturen(true);
      try {
        const subject = `[${ticket.ticketnummer}] ${onderwerp || ticket.titel}`;
        const html = `<div style="font-family:system-ui,sans-serif;line-height:1.5">${inhoud.replace(/\n/g, "<br/>")}<hr/><p style="color:#666;font-size:12px">Ticketreferentie: ${ticket.ticketnummer} — antwoord onder dit onderwerp blijft aan dit ticket gekoppeld.</p></div>`;
        const { error } = await supabase.functions.invoke("email-api-send", {
          body: { to: aanEmail.trim(), subject, html },
        });
        if (error) throw error;
        toast.success("E-mail verzonden");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Onbekende fout";
        toast.error(`E-mail versturen mislukt: ${msg}`);
        setVersturen(false);
        return;
      }
      setVersturen(false);
    }

    await add.mutateAsync({
      ticket_id: ticket.id,
      partner_id: ticket.partner_id,
      auteur_id: user.id,
      richting,
      inhoud: richting === "uitgaand" && aanEmail ? `📧 Naar ${aanEmail}\nOnderwerp: ${onderwerp}\n\n${inhoud.trim()}` : inhoud.trim(),
    });
    setInhoud("");
    setOnderwerp("");
    setSjabloonId("");
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <ul className="space-y-3 max-h-[480px] overflow-y-auto">
          {berichten.length === 0 && <p className="text-sm text-muted-foreground">Nog geen berichten.</p>}
          {berichten.map((b) => {
            const isIntern = b.richting === "intern";
            const isInkomend = b.richting === "inkomend";
            const wrapCls = isIntern
              ? "border-l-4 border-amber-500 bg-amber-500/5 pl-3 py-2 rounded-r"
              : isInkomend
                ? "border-l-4 border-blue-500 bg-blue-500/5 pl-3 py-2 rounded-r"
                : "border-l-4 border-primary bg-primary/5 pl-3 py-2 rounded-r";
            return (
              <li key={b.id} className={wrapCls}>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {isIntern ? (
                      <Badge variant="outline" className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 gap-1"><Lock className="h-3 w-3" />Intern</Badge>
                    ) : isInkomend ? (
                      <Badge variant="outline" className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 gap-1"><MessageSquare className="h-3 w-3" />Van klant</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-primary/15 text-primary border-primary/30 gap-1"><Mail className="h-3 w-3" />Naar klant</Badge>
                    )}
                  </div>
                  <span className="text-muted-foreground">{new Date(b.created_at).toLocaleString("nl-NL")}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap mt-2">{b.inhoud}</p>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={richting} onValueChange={setRichting}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="intern">Interne notitie</SelectItem>
              <SelectItem value="uitgaand">Naar klant</SelectItem>
              <SelectItem value="inkomend">Van klant</SelectItem>
            </SelectContent>
          </Select>
          {richting === "uitgaand" && sjablonen.length > 0 && (
            <Select value={sjabloonId} onValueChange={applySjabloon}>
              <SelectTrigger className="w-56"><SelectValue placeholder="Sjabloon kiezen…" /></SelectTrigger>
              <SelectContent>
                {sjablonen.map((s) => <SelectItem key={s.id} value={s.id}>{s.naam}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
        {richting === "uitgaand" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {klantEmails.length > 0 ? (
              <Select value={aanEmail} onValueChange={setAanEmail}>
                <SelectTrigger><SelectValue placeholder="Aan e-mailadres…" /></SelectTrigger>
                <SelectContent>{klantEmails.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
              </Select>
            ) : (
              <Input placeholder="Aan e-mailadres" value={aanEmail} onChange={(e) => setAanEmail(e.target.value)} />
            )}
            <Input placeholder="Onderwerp (optioneel)" value={onderwerp} onChange={(e) => setOnderwerp(e.target.value)} />
          </div>
        )}
        <Textarea rows={4} placeholder="Typ je bericht…" value={inhoud} onChange={(e) => setInhoud(e.target.value)} />
        <div className="flex justify-end">
          <Button onClick={send} disabled={!inhoud.trim() || add.isPending || versturen || (richting === "uitgaand" && !aanEmail.trim())}>
            <Send className="h-4 w-4 mr-2" />
            {add.isPending || versturen ? "Versturen…" : richting === "uitgaand" ? "E-mail versturen" : "Notitie plaatsen"}
          </Button>
        </div>
      </Card>
    </div>
  );
}