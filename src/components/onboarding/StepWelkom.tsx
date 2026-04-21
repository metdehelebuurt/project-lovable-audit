import { Sparkles, Mail, ShieldCheck, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  voornaam?: string;
  onNext: () => void;
}

export const StepWelkom = ({ voornaam, onNext }: Props) => (
  <div className="text-center space-y-6 py-8">
    <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
      <Sparkles className="h-8 w-8 text-primary" />
    </div>
    <div>
      <h2 className="text-2xl font-semibold text-foreground">Welkom{voornaam ? `, ${voornaam}` : ""}!</h2>
      <p className="text-muted-foreground mt-2 max-w-md mx-auto">
        We helpen je in een paar minuten je account in te richten zodat je direct aan de slag kunt.
      </p>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto text-left">
      <div className="rounded-xl border bg-card p-4"><Mail className="h-5 w-5 text-primary mb-2" /><p className="text-sm font-medium">E-mail koppelen</p><p className="text-xs text-muted-foreground">Stuur en ontvang vanuit het platform.</p></div>
      <div className="rounded-xl border bg-card p-4"><Settings2 className="h-5 w-5 text-primary mb-2" /><p className="text-sm font-medium">Voorkeuren</p><p className="text-xs text-muted-foreground">Kies taal, thema en notificaties.</p></div>
      <div className="rounded-xl border bg-card p-4"><ShieldCheck className="h-5 w-5 text-primary mb-2" /><p className="text-sm font-medium">Beveiliging</p><p className="text-xs text-muted-foreground">Activeer 2FA voor je account.</p></div>
    </div>
    <Button onClick={onNext} size="lg" className="rounded-pill">Aan de slag</Button>
  </div>
);

export default StepWelkom;