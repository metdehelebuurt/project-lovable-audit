import { useState } from "react";
import FeedbackKaart, { type FeedbackKaartItem } from "./FeedbackKaart";
import { STATUS_KOLOM_VOLGORDE, STATUS_OPTIONS, type FeedbackStatus } from "@/lib/feedback/constants";

interface Props {
  items: FeedbackKaartItem[];
  onCardClick: (id: string) => void;
  onStatusChange: (id: string, status: FeedbackStatus) => void;
}

export default function FeedbackKanban({ items, onCardClick, onStatusChange }: Props) {
  const [overKolom, setOverKolom] = useState<FeedbackStatus | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      {STATUS_KOLOM_VOLGORDE.map((status) => {
        const kolomItems = items.filter((i) => i.status === status);
        const label = STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status;
        return (
          <div
            key={status}
            onDragOver={(e) => {
              e.preventDefault();
              setOverKolom(status);
            }}
            onDragLeave={() => setOverKolom(null)}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData("text/plain");
              setOverKolom(null);
              if (id) onStatusChange(id, status);
            }}
            className={`flex flex-col gap-2 rounded-lg border bg-muted/30 p-2 min-h-[200px] transition ${
              overKolom === status ? "ring-2 ring-primary bg-primary/5" : ""
            }`}
          >
            <div className="flex items-center justify-between px-1 pb-1 border-b">
              <span className="text-xs font-semibold">{label}</span>
              <span className="text-[10px] text-muted-foreground">{kolomItems.length}</span>
            </div>
            <div className="space-y-2">
              {kolomItems.map((item) => (
                <FeedbackKaart
                  key={item.id}
                  item={item}
                  compact
                  draggable
                  onClick={() => onCardClick(item.id)}
                />
              ))}
              {kolomItems.length === 0 && (
                <p className="text-[10px] text-muted-foreground italic px-1">Leeg</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}