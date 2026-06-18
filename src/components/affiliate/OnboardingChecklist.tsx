import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2 } from "lucide-react";
import { useOnboardingTaken, useVinkTaakAf } from "@/hooks/affiliate/useOnboardingTaken";

export function OnboardingChecklist() {
  const { data: taken = [], isLoading } = useOnboardingTaken();
  const vink = useVinkTaakAf();

  if (isLoading || taken.length === 0) return null;
  const voltooid = taken.filter((t) => t.voltooid_op).length;

  if (voltooid === taken.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Onboarding ({voltooid}/{taken.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {taken.map((t) => (
          <label key={t.id} className="flex items-center gap-3 text-sm cursor-pointer">
            <Checkbox
              checked={!!t.voltooid_op}
              onCheckedChange={(c) => vink.mutate({ id: t.id, voltooid: !!c })}
            />
            <span className={t.voltooid_op ? "line-through text-muted-foreground" : ""}>{t.label}</span>
          </label>
        ))}
      </CardContent>
    </Card>
  );
}
