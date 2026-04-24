import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface KlantTab {
  key: string;
  label: string;
  count?: number;
}

interface Props {
  tabs: KlantTab[];
  active: string;
  onChange: (key: string) => void;
}

/**
 * Responsieve tab-navigatie:
 * - Mobiel (< md): dropdown-selector
 * - Desktop (md+): horizontale tabs met onderstreping
 */
export default function KlantTabsNav({ tabs, active, onChange }: Props) {
  const activeTab = tabs.find((t) => t.key === active);

  return (
    <>
      {/* Mobiel: dropdown */}
      <div className="md:hidden">
        <Select value={active} onValueChange={onChange}>
          <SelectTrigger className="rounded-xl h-11">
            <SelectValue>
              <span className="font-medium">{activeTab?.label}</span>
              {activeTab?.count !== undefined && (
                <span className="ml-2 text-muted-foreground text-sm">({activeTab.count})</span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {tabs.map((t) => (
              <SelectItem key={t.key} value={t.key}>
                <span className="flex items-center gap-2">
                  {t.label}
                  {t.count !== undefined && (
                    <span className="text-muted-foreground text-xs">({t.count})</span>
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop: horizontale tabs */}
      <div className="hidden md:block border-b border-border overflow-x-auto">
        <div className="flex gap-0 min-w-max">
          {tabs.map((tab) => {
            const isActive = tab.key === active;
            return (
              <button
                key={tab.key}
                onClick={() => onChange(tab.key)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`ml-1.5 text-xs ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                    ({tab.count})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}