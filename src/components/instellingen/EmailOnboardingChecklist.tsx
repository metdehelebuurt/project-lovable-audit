import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Loader2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Props {
  partnerId: string;
}

interface ChecklistStatus {
  hasDefaultAccount: boolean;
  hasGoogleAccount: boolean;
  hasPersonalAccounts: number;
  routingConfigured: boolean;
  recentSent: boolean;
  recentRead: boolean;
  loading: boolean;
}

const initial: ChecklistStatus = {
  hasDefaultAccount: false,
  hasGoogleAccount: false,
  hasPersonalAccounts: 0,
  routingConfigured: false,
  recentSent: false,
  recentRead: false,
  loading: true,
};

const EmailOnboardingChecklist = ({ partnerId }: Props) => {
  const [status, setStatus] = useState<ChecklistStatus>(initial);

  const laad = async () => {
    setStatus((s) => ({ ...s, loading: true }));
    const [accountsRes, routingRes, berichtenSentRes, berichtenInRes] = await Promise.all([
      supabase
        .from("email_accounts" as any)
        .select("id, provider, is_default_voor_partner, user_id, actief")
        .eq("partner_id", partnerId)
        .eq("actief", true),
      supabase
        .from("email_routing_config" as any)
        .select("id, document_type, bron")
        .eq("partner_id", partnerId),
      supabase
        .from("email_berichten" as any)
        .select("id")
        .eq("partner_id", partnerId)
        .eq("richting", "uitgaand")
        .gte("created_at", new Date(Date.now() - 30 * 24 * 3600_000).toISOString())
        .limit(1),
      supabase
        .from("email_berichten" as any)
        .select("id")
        .eq("partner_id", partnerId)
        .eq("richting", "inkomend")
        .gte("created_at", new Date(Date.now() - 30 * 24 * 3600_000).toISOString())
        .limit(1),
    ]);

    const accounts = (accountsRes.data as any[]) || [];
    const routing = (routingRes.data as any[]) || [];
    setStatus({
      hasDefaultAccount: accounts.some((a) => a.is_default_voor_partner),
      hasGoogleAccount: accounts.some((a) => a.provider === "google"),
      hasPersonalAccounts: accounts.filter((a) => a.user_id).length,
      routingConfigured: routing.length >= 3,
      recentSent: ((berichtenSentRes.data as any[]) || []).length > 0,
      recentRead: ((berichtenInRes.data as any[]) || []).length > 0,
      loading: false,
    });
  };

  useEffect(() => {
    if (partnerId) laad();
  }, [partnerId]);

  const stappen = [
    {
      titel: "1. Google Mail koppelen",
      gereed: status.hasGoogleAccount,
      beschrijving:
        "Koppel het centrale bedrijfs-Gmail-account (bv. info@bedrijf.nl) via 'Algemeen partner-postvak'. Log in met Google, sta de gevraagde rechten toe (lezen, verzenden) en bevestig de koppeling.",
      hulp: [
        "Zorg dat je bent ingelogd in de juiste Google-account in je browser.",
        "Klik op 'Verbind met Google' in de kaart 'E-mail configuratie' hieronder.",
        "Sta alle gevraagde scopes toe — anders kunnen we geen mails versturen of lezen.",
        "Na succes verschijnt het adres in 'Gekoppelde mailboxen'.",
      ],
    },
    {
      titel: "2. Algemeen afzenderadres instellen",
      gereed: status.hasDefaultAccount,
      beschrijving:
        "Markeer één gekoppeld account als 'Partner-standaard'. Offertes, orderbevestigingen en facturen worden vanaf dit adres verstuurd.",
      hulp: [
        "Open 'Gekoppelde mailboxen' hieronder.",
        "Klik bij het juiste account op 'Maak partner-standaard'.",
        "Er kan maar één standaard zijn — een nieuwe keuze vervangt automatisch de vorige.",
      ],
    },
    {
      titel: "3. Persoonlijke mailbox per gebruiker",
      gereed: status.hasPersonalAccounts > 0,
      beschrijving:
        "Laat elke medewerker zijn eigen Gmail koppelen via 'Mijn e-mailkoppeling' in zijn profielinstellingen. Zo komen chat- en klantmails binnen in de juiste persoonlijke inbox en worden ze automatisch gelogd op de lead/klant.",
      hulp: [
        "Elke gebruiker logt in en gaat naar Profiel → Mijn e-mailkoppeling.",
        "Voor pure 'send-only' organisaties is deze stap optioneel.",
      ],
    },
    {
      titel: "4. Routing per documenttype controleren",
      gereed: status.routingConfigured,
      beschrijving:
        "Bepaal per documenttype (offerte, orderbevestiging, factuur, chat, notificatie) vanaf welk postvak verstuurd wordt. Standaard: documenten via partner-standaard, chat via persoonlijke mailbox.",
      hulp: [
        "Open 'Routing per documenttype' hieronder.",
        "Pas per rij de bron aan: partner-standaard, persoonlijk of een specifiek account.",
        "Test door een testofferte te sturen en het afzenderadres in de inbox van de ontvanger te controleren.",
      ],
    },
    {
      titel: "5. Verzenden testen",
      gereed: status.recentSent,
      beschrijving:
        "Verstuur een testbericht (offerte of chat) vanuit een lead/klant. Controleer dat het bericht aankomt én dat het zichtbaar wordt in de tab 'E-mail' op de lead-/klantkaart met het juiste afzender-badge.",
      hulp: [
        "Open een lead → tab E-mail → 'Nieuw bericht'.",
        "Controleer in de inbox van de ontvanger het afzenderadres.",
        "Controleer de badge 'via … · documenttype' op het verstuurde bericht.",
      ],
    },
    {
      titel: "6. Inkomende mail & logging verifiëren",
      gereed: status.recentRead,
      beschrijving:
        "Laat de ontvanger antwoorden. Het antwoord moet automatisch verschijnen onder de juiste lead/klant in de tab 'E-mail'. Zo weet je dat de tweerichtingslogging werkt.",
      hulp: [
        "Antwoord op de testmail vanaf het ontvangeradres.",
        "Wacht ~1 minuut (sync-interval).",
        "Open de lead/klant → tab E-mail; het antwoord moet als 'inkomend' verschijnen.",
        "Als het ontbreekt: controleer of de mailbox van de medewerker gekoppeld is en de scopes 'lezen' toegestaan zijn.",
      ],
    },
  ];

  const gereed = stappen.filter((s) => s.gereed).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Onboarding e-mail koppeling</CardTitle>
            <CardDescription>
              Stap-voor-stap controle. Werk de lijst van boven naar beneden af.
            </CardDescription>
          </div>
          <Badge variant={gereed === stappen.length ? "default" : "secondary"}>
            {gereed}/{stappen.length} gereed
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {status.loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Status laden…
          </div>
        ) : (
          <ol className="space-y-4">
            {stappen.map((stap) => (
              <li
                key={stap.titel}
                className="rounded-lg border p-4 flex gap-3 items-start"
              >
                {stap.gereed ? (
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                )}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">{stap.titel}</p>
                    {stap.gereed && (
                      <Badge variant="secondary" className="text-xs">
                        Gereed
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{stap.beschrijving}</p>
                  <ul className="text-sm list-disc pl-5 space-y-1 text-muted-foreground">
                    {stap.hulp.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        )}
        <div className="flex justify-between items-center pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Tip: ververs na elke stap om de status opnieuw te laten checken.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={laad} disabled={status.loading}>
              Status verversen
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
            >
              <a
                href="https://support.google.com/accounts/answer/3466521"
                target="_blank"
                rel="noreferrer"
              >
                Google-hulp <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailOnboardingChecklist;