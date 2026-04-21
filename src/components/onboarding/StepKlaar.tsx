import { Button } from "@/components/ui/button";
import { CheckCircle2, PartyPopper } from "lucide-react";

interface Props {
  items: { label: string; done: boolean }[];
  onFinish: () => void;
  finishing: boolean;
}

export const StepKlaar = ({ items, onFinish, finishing }: Props) => (
  <div className="space-y-6 text-center py-4">
    <div className="mx-auto h-16 w-16 rounded-2xl bg-success/10 flex items-center justify-center">
      <PartyPopper className="h-8 w-8 text-success" />
    </div>
    <div>
      <h2 className="text-2xl font-semibold">Je bent klaar!</h2>
      <p className="text-muted-foreground mt-2">Hier is een samenvatting van wat je hebt ingesteld.</p>
    </div>
    <ul className="text-left max-w-md mx-auto space-y-2">
      {items.map((it, i) => (
        <li key={i} className="flex items-center gap-2 text-sm">
          <CheckCircle2 className={`h-4 w-4 ${it.done ? "text-success" : "text-muted-foreground"}`} />
          <span className={it.done ? "" : "text-muted-foreground"}>{it.label}</span>
        </li>
      ))}
    </ul>
    <Button onClick={onFinish} disabled={finishing} size="lg" className="rounded-pill">
      {finishing ? "Even geduld…" : "Naar dashboard"}
    </Button>
  </div>
);

export default StepKlaar;