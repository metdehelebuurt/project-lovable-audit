import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  UserPlus,
  ClipboardList,
  FileText,
  Briefcase,
  Wrench,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { useWerkstroomKeten, type WerkstroomStap, type WerkstroomKeten } from "./useWerkstroomKeten";

interface Props {
  vanaf: WerkstroomStap;
  id: string;
  huidig: WerkstroomStap;
}

const STAP_VOLGORDE: WerkstroomStap[] = [
  "lead",
  "schouw",
  "offerte",
  "opdracht",
  "installatie",
  "oplevering",
];

const STAP_LABELS: Record<WerkstroomStap, string> = {
  lead: "Lead",
  schouw: "Schouw",
  offerte: "Offerte",
  opdracht: "Opdracht",
  installatie: "Installatie",
  oplevering: "Oplevering",
};

const STAP_ICONS: Record<WerkstroomStap, typeof UserPlus> = {
  lead: UserPlus,
  schouw: ClipboardList,
  offerte: FileText,
  opdracht: Briefcase,
  installatie: Wrench,
  oplevering: CheckCircle2,
};

const STAP_ROUTES: Record<WerkstroomStap, (id: string) => string> = {
  lead: (id) => `/leads/${id}`,
  schouw: (id) => `/schouwen/${id}`,
  offerte: (id) => `/offertes/${id}`,
  opdracht: (id) => `/opdrachten/${id}`,
  installatie: (id) => `/installaties/${id}`,
  oplevering: (id) => `/opleveringen/${id}`,
};

function getItem(keten: WerkstroomKeten, stap: WerkstroomStap) {
  return keten[stap];
}

export default function WerkstroomStepper({ vanaf, id, huidig }: Props) {
  const navigate = useNavigate();
  const { data: keten, isLoading } = useWerkstroomKeten({ vanaf, id });

  if (isLoading) {
    return (
      <Card className="rounded-2xl border-0 shadow-sm p-3">
        <Skeleton className="h-12 w-full" />
      </Card>
    );
  }

  const huidigIndex = STAP_VOLGORDE.indexOf(huidig);

  return (
    <Card className="rounded-2xl border-0 shadow-sm p-3 overflow-x-auto">
      <ol className="flex items-stretch gap-1 min-w-fit">
        {STAP_VOLGORDE.map((stap, i) => {
          const item = keten ? getItem(keten, stap) : undefined;
          const isHuidig = stap === huidig;
          const isVoltooid = i < huidigIndex || (item && !isHuidig);
          const isBeschikbaar = Boolean(item);
          const Icon = STAP_ICONS[stap];

          const handleKlik = () => {
            if (item && !isHuidig) navigate(STAP_ROUTES[stap](item.id));
          };

          return (
            <li key={stap} className="flex items-center gap-1 min-w-0">
              <button
                type="button"
                onClick={handleKlik}
                disabled={!isBeschikbaar || isHuidig}
                aria-current={isHuidig ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors min-w-0",
                  isHuidig && "bg-primary text-primary-foreground font-medium",
                  !isHuidig && isBeschikbaar && "bg-muted hover:bg-accent text-foreground cursor-pointer",
                  !isBeschikbaar && "bg-muted/40 text-muted-foreground/60 cursor-not-allowed",
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", isVoltooid && !isHuidig && "text-success")} />
                <span className="flex flex-col items-start min-w-0">
                  <span className="text-xs uppercase tracking-wide opacity-70">{STAP_LABELS[stap]}</span>
                  <span className="text-xs truncate max-w-[120px]">
                    {item?.label ?? "—"}
                  </span>
                </span>
              </button>
              {i < STAP_VOLGORDE.length - 1 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
              )}
            </li>
          );
        })}
      </ol>
    </Card>
  );
}