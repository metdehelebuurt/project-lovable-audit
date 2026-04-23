import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Lock, Globe } from "lucide-react";

interface Props {
  intern: boolean;
  onChange: (intern: boolean) => void;
  id?: string;
  disabled?: boolean;
}

/**
 * Uniforme toggle voor notitie-zichtbaarheid.
 * - intern=true  → alleen team
 * - intern=false → ook zichtbaar voor klant in portaal
 */
const NotitieZichtbaarheidToggle = ({ intern, onChange, id = "notitie-intern", disabled }: Props) => {
  return (
    <div className="flex items-center gap-2 text-xs">
      {intern ? (
        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
      ) : (
        <Globe className="h-3.5 w-3.5 text-primary" />
      )}
      <Label htmlFor={id} className="cursor-pointer text-muted-foreground">
        {intern ? "Intern (alleen team)" : "Zichtbaar voor klant"}
      </Label>
      <Switch
        id={id}
        checked={!intern}
        onCheckedChange={(v) => onChange(!v)}
        disabled={disabled}
      />
    </div>
  );
};

export default NotitieZichtbaarheidToggle;

export function NotitieZichtbaarheidBadge({ intern }: { intern: boolean }) {
  if (intern) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
        <Lock className="h-3 w-3" /> Intern
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
      <Globe className="h-3 w-3" /> Klant zichtbaar
    </span>
  );
}