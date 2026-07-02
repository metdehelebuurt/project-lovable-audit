/** Deel- en formatteer helpers voor demo-afspraken. */

export function toLocalInput(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function nextWorkday(from: Date = new Date()): Date {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  do {
    d.setDate(d.getDate() + 1);
  } while (d.getDay() === 0 || d.getDay() === 6);
  return d;
}

export interface QuickReschedulePreset {
  label: string;
  compute: (huidigGeplandOp: Date) => Date;
}

function atTime(d: Date, uur: number, minuut = 0): Date {
  const out = new Date(d);
  out.setHours(uur, minuut, 0, 0);
  return out;
}

export function quickReschedulePresets(): QuickReschedulePreset[] {
  return [
    { label: "+1 uur", compute: (h) => new Date(h.getTime() + 60 * 60_000) },
    { label: "+1 dag", compute: (h) => new Date(h.getTime() + 24 * 60 * 60_000) },
    { label: "+1 week", compute: (h) => new Date(h.getTime() + 7 * 24 * 60 * 60_000) },
    { label: "Morgen 10:00", compute: () => atTime(new Date(Date.now() + 86_400_000), 10) },
    { label: "Morgen 14:00", compute: () => atTime(new Date(Date.now() + 86_400_000), 14) },
    { label: "Volgende werkdag 10:00", compute: () => atTime(nextWorkday(), 10) },
  ];
}