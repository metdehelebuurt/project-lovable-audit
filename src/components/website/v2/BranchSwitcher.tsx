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
    <section className="py-24 lg:py-32 bg-surface-muted">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs uppercase tracking-[0.2em] text-ink-soft">Voor jouw branche</span>
          <h2 className="font-display text-4xl lg:text-6xl text-ink mt-4 leading-[1.05]">
            Vakkennis <span className="italic text-primary">ingebouwd</span>.
          </h2>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {branches.map((b) => {
            const Icon = b.icon;
            const isActive = b.id === active;
            return (
              <button
                key={b.id}
                onClick={() => setActive(b.id)}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
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

        <div className="bg-surface rounded-3xl border border-border p-10 lg:p-16 shadow-[var(--shadow-soft)]">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs uppercase tracking-widest text-primary font-medium">{current.label}</span>
              <h3 className="font-display text-3xl lg:text-5xl text-ink mt-4 leading-tight">
                {current.claim}
              </h3>
            </div>
            <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-surface-muted via-background to-primary/5 border border-border flex items-center justify-center">
              <current.icon className="h-32 w-32 text-primary/30 stroke-[1]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BranchSwitcher;