import { Card, CardContent } from "@/components/ui/card";
import type { EmailRow } from "./useEmailLogs";

export function StatCards({ rows }: { rows: EmailRow[] | undefined }) {
  const data = rows ?? [];
  const totaal = data.length;
  const verzonden = data.filter((r) => ["verzonden", "sent", "ontvangen"].includes(r.status.toLowerCase())).length;
  const mislukt = data.filter((r) => ["mislukt", "fout", "failed", "dlq", "bounced"].includes(r.status.toLowerCase())).length;
  const suppressed = data.filter((r) => ["suppressed", "complained"].includes(r.status.toLowerCase())).length;

  const items = [
    { label: "Totaal", waarde: totaal, kleur: "text-foreground" },
    { label: "Verzonden", waarde: verzonden, kleur: "text-emerald-600" },
    { label: "Mislukt", waarde: mislukt, kleur: "text-destructive" },
    { label: "Geblokkeerd", waarde: suppressed, kleur: "text-amber-600" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((i) => (
        <Card key={i.label}>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">{i.label}</div>
            <div className={`text-2xl font-semibold ${i.kleur}`}>{i.waarde}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}