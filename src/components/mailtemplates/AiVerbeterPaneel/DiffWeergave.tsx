import { diffBlokken } from "@/lib/mailtemplates/diffHtml";
import { cn } from "@/lib/utils";

interface Props {
  oudOnderwerp: string;
  nieuwOnderwerp: string;
  oudBody: string;
  nieuwBody: string;
}

function regel(blok: { type: "same" | "removed" | "added"; tekst: string }, idx: number) {
  return (
    <div
      key={idx}
      className={cn(
        "px-2 py-1 text-xs rounded",
        blok.type === "added" && "bg-green-50 border-l-2 border-green-500 text-green-900",
        blok.type === "removed" && "bg-red-50 border-l-2 border-red-400 text-red-900 line-through opacity-70",
        blok.type === "same" && "text-muted-foreground",
      )}
    >
      {blok.tekst}
    </div>
  );
}

export function DiffWeergave({ oudOnderwerp, nieuwOnderwerp, oudBody, nieuwBody }: Props) {
  const onderwerpVeranderd = oudOnderwerp.trim() !== nieuwOnderwerp.trim();
  const bodyDiff = diffBlokken(oudBody, nieuwBody);

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">Onderwerp</div>
        {onderwerpVeranderd ? (
          <div className="space-y-1">
            <div className="px-2 py-1 text-xs rounded bg-red-50 border-l-2 border-red-400 line-through opacity-70">
              {oudOnderwerp || "(leeg)"}
            </div>
            <div className="px-2 py-1 text-xs rounded bg-green-50 border-l-2 border-green-500 font-medium">
              {nieuwOnderwerp}
            </div>
          </div>
        ) : (
          <div className="px-2 py-1 text-xs rounded text-muted-foreground">{nieuwOnderwerp} (ongewijzigd)</div>
        )}
      </div>
      <div className="space-y-1">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">Body</div>
        <div className="space-y-0.5 max-h-72 overflow-y-auto">{bodyDiff.map(regel)}</div>
      </div>
    </div>
  );
}