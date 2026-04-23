import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lock, Send, MessageSquare, Mail, Factory, Truck, Wrench, User } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useTicketBerichten, useAddBericht } from "@/hooks/helpdesk/useTicketDetail";
import type { HelpdeskTicket } from "@/hooks/helpdesk/useTickets";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

type KanaalType = "klant" | "fabrikant" | "leverancier" | "monteur" | "intern";
const KANAAL_LABEL: Record<KanaalType, string> = {
  klant: "Klant", fabrikant: "Fabrikant", leverancier: "Leverancier", monteur: "Monteur", intern: "Intern",
};
const KANAAL_BADGE_CLS: Record<KanaalType, string> = {
  klant: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
  fabrikant: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",
  leverancier: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30",
  monteur: "bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/30",
  intern: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
};
const KANAAL_ICON: Record<KanaalType, typeof Mail> = {
  klant: User, fabrikant: Factory, leverancier: Truck, monteur: Wrench, intern: Lock,
};

export default function CommunicatieTab({ ticket }: { ticket: HelpdeskTicket }) {
  const { user, profile } = useAuth();
  const { data: berichten = [] } = useTicketBerichten(ticket.id);
  const add = useAddBericht();
  const [inhoud, setInhoud] = useState("");
  const [kanaal, setKanaal] = useState<KanaalType>("intern");
  const [aanEmail, setAanEmail] = useState("");
  const [onderwerp, setOnderwerp] = useState("");
  const [versturen, setVersturen] = useState(false);
  const [sjabloonId, setSjabloonId] = useState<string>("");
  const [externNaam, setExternNaam] = useState("");
  const [externOrganisatie, setExternOrganisatie] = useState("");
  const [externTelefoon, setExternTelefoon] = useState("");
  const [filter, setFilter] = useState<KanaalType | "alle">("alle");

  const isInstallateur = profile?.rol === "installateur";
  const beschikbareKanalen: KanaalType[] = isInstallateur
    ? ["intern", "monteur"]
    : ["intern", "klant", "fabrikant", "leverancier", "monteur"];

  // Bepaal richting op basis van kanaal — klant + extern = uitgaand, intern/monteur = intern
  const richting = kanaal === "klant" || kanaal === "fabrikant" || kanaal === "leverancier" ? "uitgaand" : "intern";
  const isExtern = kanaal === "fabrikant" || kanaal === "leverancier";

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

  const gefilterdeBerichten = useMemo(
    () => berichten.filter((b) => filter === "alle" ? true : ((b as { kanaal_type?: string }).kanaal_type ?? "intern") === filter),
    [berichten, filter],
  );

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

    const targetEmail = kanaal === "klant" ? aanEmail.trim() : isExtern ? aanEmail.trim() : "";

    // Bij uitgaande mail (klant/fabrikant/leverancier): ook daadwerkelijk e-mail versturen
    if (richting === "uitgaand" && targetEmail) {
      setVersturen(true);
      try {
        const subject = `[${ticket.ticketnummer}] ${onderwerp || ticket.titel}`;
        const html = `<div style="font-family:system-ui,sans-serif;line-height:1.5">${inhoud.replace(/\n/g, "<br/>")}<hr/><p style="color:#666;font-size:12px">Ticketreferentie: ${ticket.ticketnummer} — antwoord onder dit onderwerp blijft aan dit ticket gekoppeld.</p></div>`;
        const { error } = await supabase.functions.invoke("email-api-send", {
          body: { to: targetEmail, subject, html },
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

    const prefix = isExtern && (externNaam || externOrganisatie)
      ? `📧 ${KANAAL_LABEL[kanaal]}: ${[externNaam, externOrganisatie].filter(Boolean).join(" / ")}${targetEmail ? ` <${targetEmail}>` : ""}\n${onderwerp ? `Onderwerp: ${onderwerp}\n\n` : "\n"}`
      : kanaal === "klant" && aanEmail
        ? `📧 Naar ${aanEmail}\nOnderwerp: ${onderwerp}\n\n`
        : "";

    await add.mutateAsync({
      ticket_id: ticket.id,
      partner_id: ticket.partner_id,
      auteur_id: user.id,
      richting,
      inhoud: `${prefix}${inhoud.trim()}`,
      kanaal_type: kanaal,
      extern_naam: isExtern ? externNaam || null : null,
      extern_email: isExtern ? aanEmail || null : null,
      extern_organisatie: isExtern ? externOrganisatie || null : null,
      extern_telefoon: isExtern ? externTelefoon || null : null,
    });
    setInhoud("");
    setOnderwerp("");
    setSjabloonId("");
    setExternNaam("");
    setExternOrganisatie("");
    setExternTelefoon("");
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as KanaalType | "alle")}>
          <TabsList className="grid grid-cols-6 h-8">
            <TabsTrigger value="alle" className="text-[11px]">Alle</TabsTrigger>
            <TabsTrigger value="klant" className="text-[11px]">Klant</TabsTrigger>
            <TabsTrigger value="fabrikant" className="text-[11px]">Fabrikant</TabsTrigger>
            <TabsTrigger value="leverancier" className="text-[11px]">Leverancier</TabsTrigger>
            <TabsTrigger value="monteur" className="text-[11px]">Monteur</TabsTrigger>
            <TabsTrigger value="intern" className="text-[11px]">Intern</TabsTrigger>
          </TabsList>
        </Tabs>
        <ul className="space-y-3 max-h-[480px] overflow-y-auto">
          {gefilterdeBerichten.length === 0 && <p className="text-sm text-muted-foreground">Geen berichten in deze categorie.</p>}
          {gefilterdeBerichten.map((b) => {
            const kt = ((b as { kanaal_type?: string }).kanaal_type ?? "intern") as KanaalType;
            const Icon = KANAAL_ICON[kt] ?? MessageSquare;
            const wrapCls = `border-l-4 pl-3 py-2 rounded-r ${
              kt === "klant" ? "border-blue-500 bg-blue-500/5" :
              kt === "fabrikant" ? "border-purple-500 bg-purple-500/5" :
              kt === "leverancier" ? "border-orange-500 bg-orange-500/5" :
              kt === "monteur" ? "border-green-500 bg-green-500/5" :
              "border-amber-500 bg-amber-500/5"
            }`;
            return (
              <li key={b.id} className={wrapCls}>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`${KANAAL_BADGE_CLS[kt]} gap-1`}>
                      <Icon className="h-3 w-3" />{KANAAL_LABEL[kt]}
                      {b.richting === "inkomend" && " · in"}
                      {b.richting === "uitgaand" && " · uit"}
                    </Badge>
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
          <Select value={kanaal} onValueChange={(v) => setKanaal(v as KanaalType)}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              {beschikbareKanalen.map((k) => (
                <SelectItem key={k} value={k}>{KANAAL_LABEL[k]}{k === "intern" ? " (notitie)" : ""}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {kanaal === "klant" && sjablonen.length > 0 && (
            <Select value={sjabloonId} onValueChange={applySjabloon}>
              <SelectTrigger className="w-56"><SelectValue placeholder="Sjabloon kiezen…" /></SelectTrigger>
              <SelectContent>
                {sjablonen.map((s) => <SelectItem key={s.id} value={s.id}>{s.naam}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {isInstallateur && (
            <span className="text-xs text-muted-foreground">Als monteur kun je alleen intern of met collega-monteurs communiceren.</span>
          )}
        </div>
        {kanaal === "klant" && (
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
        {isExtern && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input placeholder={`${KANAAL_LABEL[kanaal]} – organisatie (bv. Enphase)`} value={externOrganisatie} onChange={(e) => setExternOrganisatie(e.target.value)} />
            <Input placeholder="Contactpersoon naam" value={externNaam} onChange={(e) => setExternNaam(e.target.value)} />
            <Input placeholder="E-mailadres" type="email" value={aanEmail} onChange={(e) => setAanEmail(e.target.value)} />
            <Input placeholder="Telefoon (optioneel)" value={externTelefoon} onChange={(e) => setExternTelefoon(e.target.value)} />
            <Input className="sm:col-span-2" placeholder="Onderwerp (optioneel)" value={onderwerp} onChange={(e) => setOnderwerp(e.target.value)} />
          </div>
        )}
        <Textarea rows={4} placeholder="Typ je bericht…" value={inhoud} onChange={(e) => setInhoud(e.target.value)} />
        <div className="flex justify-end">
          <Button onClick={send} disabled={!inhoud.trim() || add.isPending || versturen || (richting === "uitgaand" && !aanEmail.trim())}>
            <Send className="h-4 w-4 mr-2" />
            {add.isPending || versturen ? "Versturen…" : richting === "uitgaand" ? "E-mail versturen" : kanaal === "monteur" ? "Bericht aan monteur" : "Notitie plaatsen"}
          </Button>
        </div>
      </Card>
    </div>
  );
}