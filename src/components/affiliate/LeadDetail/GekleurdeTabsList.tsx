import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, MailOpen, StickyNote, Sparkles, History } from "lucide-react";
import { cn } from "@/lib/utils";

type TabKey = "tijdlijn" | "email" | "notities" | "opvolging" | "historie";

interface TabDef {
  value: TabKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** actieve achtergrond + tekst + border klassen */
  actief: string;
}

const TABS: TabDef[] = [
  {
    value: "tijdlijn",
    label: "Tijdlijn",
    icon: Activity,
    actief: "data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:border-indigo-500",
  },
  {
    value: "email",
    label: "E-mail",
    icon: MailOpen,
    actief: "data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary",
  },
  {
    value: "notities",
    label: "Notities",
    icon: StickyNote,
    actief: "data-[state=active]:bg-amber-50 data-[state=active]:text-amber-800 data-[state=active]:border-amber-500",
  },
  {
    value: "opvolging",
    label: "AI-opvolging",
    icon: Sparkles,
    actief: "data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:border-emerald-500",
  },
  {
    value: "historie",
    label: "Historie",
    icon: History,
    actief: "data-[state=active]:bg-slate-100 data-[state=active]:text-slate-800 data-[state=active]:border-slate-500",
  },
];

/** Gekleurde tabs voor de affiliate leaddetail. */
export function GekleurdeTabsList() {
  return (
    <TabsList className="w-full h-auto bg-transparent p-0 gap-1 flex flex-wrap justify-start border-b rounded-none">
      {TABS.map((t) => (
        <TabsTrigger
          key={t.value}
          value={t.value}
          className={cn(
            "gap-1.5 px-3 py-2 rounded-t-md rounded-b-none border-b-2 border-transparent",
            "text-muted-foreground hover:text-foreground hover:bg-muted/60",
            "data-[state=active]:shadow-none data-[state=active]:font-semibold",
            "text-xs sm:text-sm transition-colors",
            t.actief,
          )}
        >
          <t.icon className="h-3.5 w-3.5" />
          <span>{t.label}</span>
        </TabsTrigger>
      ))}
    </TabsList>
  );
}