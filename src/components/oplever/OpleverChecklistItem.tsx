import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Minus } from "lucide-react";
import type { ChecklistItem, ChecklistStatus } from "./types";

interface Props {
  item: ChecklistItem;
  onChange: (item: ChecklistItem) => void;
}

const STATUSES: { value: ChecklistStatus; label: string; icon: typeof Check; tone: string }[] = [
  { value: "pass", label: "OK", icon: Check, tone: "bg-green-500/10 text-green-700 border-green-500/40" },
  { value: "fail", label: "Niet OK", icon: X, tone: "bg-destructive/10 text-destructive border-destructive/40" },
  { value: "nvt", label: "N.v.t.", icon: Minus, tone: "bg-muted text-muted-foreground border-border" },
];

export default function OpleverChecklistItem({ item, onChange }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <span className="text-sm font-medium flex-1">{item.label}</span>
        <div className="flex flex-wrap gap-1">
          {STATUSES.map((s) => {
            const active = item.status === s.value;
            const Icon = s.icon;
            return (
              <Button
                key={s.value}
                type="button"
                size="sm"
                variant="outline"
                className={`${active ? s.tone : ""} min-h-[44px]`}
                onClick={() => onChange({ ...item, status: s.value })}
              >
                <Icon className="h-4 w-4" />
                <span className="ml-1 hidden sm:inline">{s.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
      {item.status === "fail" && (
        <Textarea
          placeholder="Toelichting (verplicht bij Niet OK)"
          value={item.opmerking ?? ""}
          onChange={(e) => onChange({ ...item, opmerking: e.target.value })}
          rows={2}
        />
      )}
    </div>
  );
}