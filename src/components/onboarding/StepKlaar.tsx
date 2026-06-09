import { Button } from "@/components/ui/button";
import { CheckCircle2, PartyPopper, Users, FileText, LayoutDashboard, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
  items: { label: string; done: boolean }[];
  onFinish: () => void;
  finishing: boolean;
}

const CTAS = [
  { to: "/leads", label: "Eerste lead aanmaken", icon: Users },
  { to: "/offertes/nieuw", label: "Offerte maken", icon: FileText },
  { to: "/dashboard", label: "Naar dashboard", icon: LayoutDashboard },
  { to: "/helpdesk/kennisbank", label: "Kennisbank", icon: BookOpen },
];

export const StepKlaar = ({ items, onFinish, finishing }: Props) => {
  const klaar = items.filter(i => i.done).length;
  return (
    <div className="space-y-6 py-2">
      <div className="text-center">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-success/10 flex items-center justify-center">
          <PartyPopper className="h-8 w-8 text-success" />
        </div>
        <h2 className="text-2xl font-semibold mt-4">Je bent klaar!</h2>
        <p className="text-muted-foreground mt-2">{klaar} van de {items.length} stappen voltooid. De rest kun je altijd later afronden vanuit je profiel.</p>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <p className="text-sm font-medium mb-3">Samenvatting</p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {items.map((it, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <CheckCircle2 className={`h-4 w-4 ${it.done ? "text-success" : "text-muted-foreground/40"}`} />
              <span className={it.done ? "" : "text-muted-foreground"}>{it.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-sm font-medium mb-2">Direct aan de slag</p>
        <div className="grid grid-cols-2 gap-2">
          {CTAS.map(c => {
            const Icon = c.icon;
            return (
              <Link key={c.to} to={c.to} onClick={onFinish} className="rounded-xl border bg-card p-3 hover:bg-muted/50 transition flex items-center gap-2 text-sm">
                <Icon className="h-4 w-4 text-primary" /> {c.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex justify-center pt-2">
        <Button onClick={onFinish} disabled={finishing} size="lg" className="rounded-pill px-8">
          {finishing ? "Even geduld…" : "Onboarding afronden"}
        </Button>
      </div>
    </div>
  );
};

export default StepKlaar;