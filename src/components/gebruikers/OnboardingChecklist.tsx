import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface OnboardingChecklistProps {
  user: {
    id: string;
    avatar_url?: string | null;
    telefoon?: string | null;
    mfa_enabled?: boolean | null;
    handtekening_html?: string | null;
  };
  hasEmailAccount: boolean;
}

export const OnboardingChecklist = ({ user, hasEmailAccount }: OnboardingChecklistProps) => {
  const stappen = useMemo(() => [
    { id: "avatar", label: "Profielfoto toegevoegd", done: !!user.avatar_url },
    { id: "telefoon", label: "Telefoonnummer ingevuld", done: !!user.telefoon },
    { id: "email", label: "E-mailaccount gekoppeld", done: hasEmailAccount },
    { id: "handtekening", label: "E-mailhandtekening ingesteld", done: !!user.handtekening_html },
    { id: "mfa", label: "Tweestapsverificatie aan", done: !!user.mfa_enabled },
  ], [user, hasEmailAccount]);

  const klaar = stappen.filter(s => s.done).length;
  const totaal = stappen.length;
  const pct = Math.round((klaar / totaal) * 100);

  if (klaar === totaal) return null;

  return (
    <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" /> Maak je profiel compleet
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-muted-foreground">{klaar} van {totaal} stappen klaar</span>
            <span className="text-xs font-medium">{pct}%</span>
          </div>
          <Progress value={pct} className="h-2" />
        </div>
        <ul className="space-y-1.5">
          {stappen.map((s) => (
            <li key={s.id} className={`flex items-center gap-2 text-sm ${s.done ? "text-muted-foreground" : "text-foreground"}`}>
              {s.done ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
              <span className={s.done ? "line-through" : ""}>{s.label}</span>
            </li>
          ))}
        </ul>
        <Button asChild size="sm" variant="outline" className="rounded-pill w-full">
          <Link to="/profiel">Naar mijn profiel →</Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default OnboardingChecklist;