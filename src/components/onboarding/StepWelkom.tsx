import { Sparkles, Mail, ShieldCheck, Settings2, Clock, Target, Calendar, Users, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  voornaam?: string;
  onNext: () => void;
}

export const StepWelkom = ({ voornaam, onNext }: Props) => (
  <div className="text-center space-y-6 py-4">
    <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
      <Sparkles className="h-8 w-8 text-primary" />
    </div>
    <div>
      <h2 className="text-2xl font-semibold text-foreground">Welkom{voornaam ? `, ${voornaam}` : ""}!</h2>
      <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
        In ongeveer 8 minuten richten we samen je account én je organisatie in. Je kunt op elk moment stoppen en later verder gaan — alles wordt automatisch opgeslagen.
      </p>
      <div className="inline-flex items-center gap-1.5 mt-3 text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-pill">
        <Clock className="h-3 w-3" /> ± 8 minuten · 14 korte stappen
      </div>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-3xl mx-auto text-left">
      <div className="rounded-xl border bg-card p-4"><Settings2 className="h-5 w-5 text-primary mb-2" /><p className="text-sm font-medium">Profiel & voorkeuren</p><p className="text-xs text-muted-foreground">Jouw gegevens, taal en notificaties.</p></div>
      <div className="rounded-xl border bg-card p-4"><Palette className="h-5 w-5 text-primary mb-2" /><p className="text-sm font-medium">Huisstijl</p><p className="text-xs text-muted-foreground">Logo en kleur op alle documenten.</p></div>
      <div className="rounded-xl border bg-card p-4"><Target className="h-5 w-5 text-primary mb-2" /><p className="text-sm font-medium">Doelen</p><p className="text-xs text-muted-foreground">Modules afgestemd op jouw werk.</p></div>
      <div className="rounded-xl border bg-card p-4"><Mail className="h-5 w-5 text-primary mb-2" /><p className="text-sm font-medium">E-mail koppelen</p><p className="text-xs text-muted-foreground">Verstuur onder je eigen adres.</p></div>
      <div className="rounded-xl border bg-card p-4"><Calendar className="h-5 w-5 text-primary mb-2" /><p className="text-sm font-medium">Agenda</p><p className="text-xs text-muted-foreground">Synchroniseer met Google Agenda.</p></div>
      <div className="rounded-xl border bg-card p-4"><Users className="h-5 w-5 text-primary mb-2" /><p className="text-sm font-medium">Team & beveiliging</p><p className="text-xs text-muted-foreground">Nodig collega's uit, activeer 2FA.</p></div>
    </div>
    <div className="pt-2">
      <Button onClick={onNext} size="lg" className="rounded-pill px-8">Aan de slag</Button>
      <p className="text-xs text-muted-foreground mt-3">Je kunt elke stap overslaan en later afronden vanuit je profiel.</p>
    </div>
  </div>
);

export default StepWelkom;