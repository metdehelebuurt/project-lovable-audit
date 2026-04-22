import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import MollieBetaalmethode from "@/components/abonnementen/MollieBetaalmethode";

interface Props {
  partnerId: string;
  onNext: () => void;
  onPrev: () => void;
}

export default function StepBetaalmethode({ partnerId, onNext, onPrev }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Betaalmethode</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Koppel een betaalmethode zodat uw abonnement na de proefperiode automatisch doorloopt. U kunt dit later wijzigen of opzeggen.
        </p>
      </div>

      <MollieBetaalmethode
        partnerId={partnerId}
        redirectAfter={`${window.location.origin}/onboarding`}
      />

      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onPrev}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Vorige
        </Button>
        <Button onClick={onNext}>
          Verder
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}