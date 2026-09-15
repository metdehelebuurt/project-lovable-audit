import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Rocket, Mail, CalendarCheck, Phone, Lock, ArrowRight } from "lucide-react";
import { TRIAL_DUUR_DAGEN, useTrialStatus } from "./useTrialStatus";

/** Zet op true zodra de installatiewizard voor trial-klanten live mag. */
const TOON_INSTALLATIE_WIZARD = false;

const CONTACT_EMAIL = "info@mijnhuis.nu";
const CONTACT_TELEFOON = "085 - 060 6320";

interface TrialBeperking {
  titel: string;
  toelichting: string;
}

/** Functies die tijdens de proefperiode niet of beperkt werken. */
const TRIAL_BEPERKINGEN: TrialBeperking[] = [
  {
    titel: "E-mail versturen vanuit je eigen adres",
    toelichting: "Offertes en berichten worden verstuurd vanaf het mijnhuis.nu-adres. Koppelen van je eigen e-mailaccount kan na activering van een abonnement.",
  },
  {
    titel: "Website- en webshopmodule",
    toelichting: "Het koppelen van je eigen website en productcatalogus aan je klantomgeving is een betaalde module.",
  },
  {
    titel: "Automatische betalingen en incasso",
    toelichting: "Betalingen automatisch innen via Mollie is uitgeschakeld tijdens de proefperiode.",
  },
  {
    titel: "Teamleden en rollen",
    toelichting: "Het aantal adviseurs en monteurs dat je kunt uitnodigen is beperkt. Met een abonnement breid je dit uit.",
  },
];

const TrialWelkom = () => {
  const navigate = useNavigate();
  const { partnerNaam, einddatum, dagenResterend, isVerlopen } = useTrialStatus();

  const verstreken = Math.min(TRIAL_DUUR_DAGEN, TRIAL_DUUR_DAGEN - dagenResterend);
  const percentage = Math.round((verstreken / TRIAL_DUUR_DAGEN) * 100);
  const einddatumTekst = einddatum ? format(einddatum, "d MMMM yyyy", { locale: nl }) : null;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Welkom{partnerNaam ? `, ${partnerNaam}` : ""}
        </h1>
        <p className="text-muted-foreground mt-1">
          Je proefperiode is actief. Ontdek rustig alle onderdelen — we helpen je op weg.
        </p>
      </div>

      {/* Resterende trialduur */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Rocket className="h-4 w-4 text-primary" /> Je proefperiode
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isVerlopen ? (
            <p className="text-sm text-destructive">
              Je proefperiode is verlopen. Neem contact met ons op om je account te activeren.
            </p>
          ) : (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">{dagenResterend}</span>
                <span className="text-sm text-muted-foreground">
                  {dagenResterend === 1 ? "dag" : "dagen"} resterend
                  {einddatumTekst ? ` (tot ${einddatumTekst})` : ""}
                </span>
              </div>
              <Progress value={percentage} aria-label="Verstreken deel van de proefperiode" />
            </>
          )}

          {TOON_INSTALLATIE_WIZARD && (
            <Button onClick={() => navigate("/onboarding")} className="gap-2">
              Start de installatiewizard <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Contact */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Vragen of hulp nodig?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            We denken graag mee over je inrichting en beantwoorden vragen over de proefperiode.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild className="gap-2">
              <a href={`mailto:${CONTACT_EMAIL}`}>
                <Mail className="h-4 w-4" /> {CONTACT_EMAIL}
              </a>
            </Button>
            <Button variant="outline" asChild className="gap-2">
              <a href={`tel:${CONTACT_TELEFOON.replace(/[^+\d]/g, "")}`}>
                <Phone className="h-4 w-4" /> {CONTACT_TELEFOON}
              </a>
            </Button>
            <Button variant="outline" asChild className="gap-2">
              <a href="https://mijnhuis.nu/demo" target="_blank" rel="noopener noreferrer">
                <CalendarCheck className="h-4 w-4" /> Plan een demo
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Beperkingen in trial */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Dit werkt (nog) niet in de proefperiode</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {TRIAL_BEPERKINGEN.map((b) => (
              <li key={b.titel} className="flex items-start gap-3">
                <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{b.titel}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{b.toelichting}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground mt-4">
            Activeer een abonnement om deze functies vrij te spelen. Alle gegevens uit je proefperiode blijven behouden.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrialWelkom;
