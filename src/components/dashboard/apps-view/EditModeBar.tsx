import { Pencil, Check, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditModeBarProps {
  editMode: boolean;
  onToggle: () => void;
  onOpenAlleApps: () => void;
}

export function EditModeBar({ editMode, onToggle, onOpenAlleApps }: EditModeBarProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onOpenAlleApps}
        className="rounded-full"
      >
        <EyeOff className="h-3.5 w-3.5" />
        Alle apps
      </Button>
      <Button
        type="button"
        variant={editMode ? "default" : "outline"}
        size="sm"
        onClick={onToggle}
        aria-pressed={editMode}
        className="rounded-full"
      >
        {editMode ? <Check className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
        {editMode ? "Klaar" : "Aanpassen"}
      </Button>
    </div>
  );
}
