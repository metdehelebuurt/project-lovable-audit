import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Check, X, MinusCircle, AlertTriangle } from "lucide-react";
import type { ChecklistAntwoord, ChecklistItem } from "./types";
import { cn } from "@/lib/utils";

interface Props {
  items: ChecklistItem[];
  disabled?: boolean;
  onUpdate: (id: string, patch: Partial<ChecklistItem>) => void;
}

export default function KeuringChecklist({ items, disabled, onUpdate }: Props) {
  const grouped = useMemo(() => {
    const map = new Map<string, ChecklistItem[]>();
    for (const it of items) {
      const arr = map.get(it.categorie) ?? [];
      arr.push(it);
      map.set(it.categorie, arr);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.volgorde - b.volgorde);
    return Array.from(map.entries());
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-6 text-center border rounded-xl">
        Geen checklist-items beschikbaar.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {grouped.map(([cat, list]) => (
        <Card key={cat} className="rounded-2xl border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{cat}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {list.map((item) => (
              <ChecklistRow key={item.id} item={item} disabled={disabled} onUpdate={onUpdate} />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ChecklistRow({
  item, disabled, onUpdate,
}: { item: ChecklistItem; disabled?: boolean; onUpdate: (id: string, patch: Partial<ChecklistItem>) => void }) {
  const setAntwoord = (a: ChecklistAntwoord) => {
    onUpdate(item.id, { antwoord: a, beoordeeld_op: new Date().toISOString() });
  };
  return (
    <div className="border rounded-xl p-3 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">{item.label}</span>
            {item.blokkerend && (
              <Badge variant="outline" className="text-xs gap-1 border-error/40 text-error">
                <AlertTriangle className="h-3 w-3" /> Blokkerend
              </Badge>
            )}
            {item.norm_referentie && (
              <Badge variant="outline" className="text-xs">{item.norm_referentie}</Badge>
            )}
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <AnswerBtn active={item.antwoord === "ok"} disabled={disabled} onClick={() => setAntwoord("ok")} tone="success" icon={Check} label="OK" />
          <AnswerBtn active={item.antwoord === "nok"} disabled={disabled} onClick={() => setAntwoord("nok")} tone="error" icon={X} label="Niet OK" />
          <AnswerBtn active={item.antwoord === "nvt"} disabled={disabled} onClick={() => setAntwoord("nvt")} tone="muted" icon={MinusCircle} label="N.v.t." />
        </div>
      </div>
      {(item.antwoord === "nok" || item.meetwaarde !== null) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Input
            placeholder="Meetwaarde (optioneel)"
            value={item.meetwaarde ?? ""}
            disabled={disabled}
            onChange={(e) => onUpdate(item.id, { meetwaarde: e.target.value || null })}
          />
          <Textarea
            placeholder="Opmerking"
            rows={1}
            value={item.opmerking ?? ""}
            disabled={disabled}
            onChange={(e) => onUpdate(item.id, { opmerking: e.target.value || null })}
          />
        </div>
      )}
    </div>
  );
}

function AnswerBtn({
  active, disabled, onClick, tone, icon: Icon, label,
}: {
  active: boolean; disabled?: boolean; onClick: () => void;
  tone: "success" | "error" | "muted"; icon: typeof Check; label: string;
}) {
  const toneClasses = active ? {
    success: "bg-success text-white border-success",
    error: "bg-error text-white border-error",
    muted: "bg-muted text-foreground border-border",
  }[tone] : "bg-background text-muted-foreground border-border hover:text-foreground";
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={disabled}
      onClick={onClick}
      className={cn("h-8 px-2.5 gap-1.5", toneClasses)}
      aria-pressed={active}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </Button>
  );
}