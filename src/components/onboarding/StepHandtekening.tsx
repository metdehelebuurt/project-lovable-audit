import HandtekeningEditor from "@/components/gebruikers/HandtekeningEditor";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, PenLine } from "lucide-react";
import type { OnboardingUserData } from "./useOnboardingState";

interface Props {
  userId: string;
  email: string;
  user: OnboardingUserData;
  onNext: () => void;
  onPrev: () => void;
  onRefresh: () => Promise<void>;
}

export const StepHandtekening = ({ userId, email, user, onNext, onPrev, onRefresh }: Props) => (
  <div className="space-y-5">
    <div>
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <PenLine className="h-5 w-5 text-primary" /> E-mailhandtekening
      </h2>
      <p className="text-sm text-muted-foreground mt-1">
        Wordt automatisch toegevoegd aan e-mails die je vanuit het platform stuurt.
      </p>
    </div>

    <HandtekeningEditor
      userId={userId}
      initialHtml={user.handtekening_html}
      voornaam={user.voornaam}
      achternaam={user.achternaam}
      functie={user.functie}
      telefoon={user.telefoon}
      email={email}
    />

    <div className="flex justify-between pt-2">
      <Button variant="ghost" onClick={onPrev} className="rounded-pill gap-2"><ArrowLeft className="h-4 w-4" /> Terug</Button>
      <Button onClick={async () => { await onRefresh(); onNext(); }} className="rounded-pill gap-2">Volgende <ArrowRight className="h-4 w-4" /></Button>
    </div>
  </div>
);

export default StepHandtekening;