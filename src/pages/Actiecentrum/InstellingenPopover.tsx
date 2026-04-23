import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Settings2, ChevronUp, ChevronDown, RotateCcw } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { KAART_LABELS, type ActiecentrumInstellingen, type KaartKey, type ViewMode } from "./useActiecentrumInstellingen";

interface Props {
  instellingen: ActiecentrumInstellingen;
  setView: (v: ViewMode) => void;
  toggleKaart: (k: KaartKey) => void;
  verplaats: (k: KaartKey, r: -1 | 1) => void;
  reset: () => void;
}

const VIEW_LABELS: Record<ViewMode, string> = {
  grid: "Grid",
  compact: "Compact",
  focus: "Focus",
};

export default function InstellingenPopover({ instellingen, setView, toggleKaart, verplaats, reset }: Props) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="h-4 w-4 mr-1.5" /> Aanpassen
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Weergave</p>
            <div className="grid grid-cols-3 gap-1">
              {(Object.keys(VIEW_LABELS) as ViewMode[]).map((v) => (
                <Button
                  key={v}
                  size="sm"
                  variant={instellingen.view === v ? "default" : "outline"}
                  onClick={() => setView(v)}
                  className="h-8 text-xs"
                >
                  {VIEW_LABELS[v]}
                </Button>
              ))}
            </div>
            {instellingen.view === "focus" && (
              <p className="text-[10px] text-muted-foreground mt-1.5">Focus toont alleen taken en aandacht.</p>
            )}
          </div>

          <Separator />

          <div>
            <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Kaarten & volgorde</p>
            <div className="space-y-1.5">
              {instellingen.volgorde.map((key, idx) => (
                <div key={key} className="flex items-center gap-2">
                  <div className="flex flex-col">
                    <button
                      onClick={() => verplaats(key, -1)}
                      disabled={idx === 0}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                      aria-label="Omhoog"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => verplaats(key, 1)}
                      disabled={idx === instellingen.volgorde.length - 1}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                      aria-label="Omlaag"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </div>
                  <span className="text-sm flex-1">{KAART_LABELS[key]}</span>
                  <Switch
                    checked={instellingen.zichtbaar[key]}
                    onCheckedChange={() => toggleKaart(key)}
                    aria-label={`${KAART_LABELS[key]} tonen`}
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <Button variant="ghost" size="sm" onClick={reset} className="w-full text-xs">
            <RotateCcw className="h-3 w-3 mr-1.5" /> Standaard herstellen
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}