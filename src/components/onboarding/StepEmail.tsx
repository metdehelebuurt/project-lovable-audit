import EmailKoppelingWizard from "@/components/gebruikers/EmailKoppelingWizard";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { EmailTestKnop } from "./EmailTestKnop";
import InfoCallout from "./InfoCallout";

interface Props {
  userId: string;
  partnerId: string;
  email: string;
  voornaam?: string;
  hasEmailAccount: boolean;
  onNext: () => void;
  onPrev: () => void;
}

export const StepEmail = ({ userId, partnerId, email, voornaam, hasEmailAccount, onNext, onPrev }: Props) => (
  <div className="space-y-5">
    <div>
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <Mail className="h-5 w-5 text-primary" /> E-mail koppelen
      </h2>
      <p className="text-sm text-muted-foreground mt-1">
        Koppel je Gmail- of Outlook-account zodat je vanuit het platform e-mails kunt sturen en ontvangen onder je eigen adres.
      </p>
    </div>

    <InfoCallout title="Waarom koppelen?">
      E-mails komen aan onder jouw eigen adres (geen 'via …'-melding), antwoorden landen direct bij het juiste dossier en je houdt volledige tracking van openen en klikken.
    </InfoCallout>

    <EmailKoppelingWizard userId={userId} partnerId={partnerId} />

    {hasEmailAccount && (
      <div className="rounded-xl border border-success/20 bg-success/5 p-4 space-y-3">
        <p className="text-sm flex items-center gap-2 text-success">
          <CheckCircle2 className="h-4 w-4" /> E-mail gekoppeld — verstuur een testbericht om de werking te bevestigen.
        </p>
        <EmailTestKnop email={email} voornaam={voornaam} />
      </div>
    )}

    <div className="flex justify-between pt-2">
      <Button variant="ghost" onClick={onPrev} className="rounded-pill gap-2"><ArrowLeft className="h-4 w-4" /> Terug</Button>
      <Button onClick={onNext} className="rounded-pill gap-2">
        {hasEmailAccount ? "Volgende" : "Overslaan"} <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  </div>
);

export default StepEmail;