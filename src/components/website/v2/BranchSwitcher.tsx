import { useState } from "react";
import { Sun, Flame, BatteryCharging, Home, Plug } from "lucide-react";

const branches = [
  { id: "zon", label: "Zonnepanelen", icon: Sun, claim: "Van schouw tot oplevering — inclusief Solar API dakanalyse en ISDE-administratie." },
  { id: "warmte", label: "Warmtepompen", icon: Flame, claim: "Bereken capaciteit, koppel datasheets en lever NEN 1010-conform op." },
  { id: "batterij", label: "Thuisbatterijen", icon: BatteryCharging, claim: "Capaciteitscalculator als webtool op je site, leads direct in je CRM." },
  { id: "isolatie", label: "Isolatie", icon: Home, claim: "Schouwformulieren met foto's per ruimte, automatische subsidie-checks." },
  { id: "laad", label: "Laadpalen", icon: Plug, claim: "Locatiecheck, offerte en planning monteur — in één doorlopend dossier." },
];

const BranchSwitcher = () => {
  const [active, setActive] = useState(branches[0].id);
  const current = branches.find((b) => b.id === active)!;

  return (
    <section className="py-20 lg:py-28 bg-secondary">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-[11px] uppercase tracking-[0.22em] text-ink-soft">Voor jouw branche</span>
          <h2 className="font-display text-4xl lg:text-5xl text-ink mt-4 leading-[1.05]">
            Vakkennis ingebouwd.
          </h2>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {branches.map((b) => {
            const Icon = b.icon;
            const isActive = b.id === active;
            return (
              <button
                key={b.id}
                onClick={() => setActive(b.id)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-ink text-background"
                    : "bg-surface text-ink-soft hover:text-ink border border-border"
                }`}
              >
                <Icon className="h-4 w-4 stroke-[1.5]" />
                {b.label}
              </button>
            );
          })}
        </div>

        <div className="bg-ink text-background rounded-2xl p-8 lg:p-12 shadow-[var(--shadow-frame)]">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="text-[11px] uppercase tracking-[0.22em] text-ochre font-medium">{current.label}</span>
              <h3 className="font-display text-2xl lg:text-4xl mt-4 leading-tight">
                {current.claim}
              </h3>
            </div>
            <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-background/[0.04] via-background/[0.02] to-primary/10 border border-background/10 flex items-center justify-center">
              <current.icon className="h-28 w-28 text-background/30 stroke-[1]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BranchSwitcher;
