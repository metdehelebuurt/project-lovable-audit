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
  const Icon = current.icon;

  return (
    <section className="py-24 lg:py-32 bg-bone">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-12 gap-10 mb-16 items-end">
          <div className="lg:col-span-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ochre mb-4">— § 04 / Branches</p>
            <h2 className="font-display text-[clamp(2rem,5vw,4.5rem)] text-ink leading-[1.02] tracking-[-0.025em]">
              Vakkennis <span className="italic font-light text-sage">ingebouwd</span>.
            </h2>
          </div>
          <div className="lg:col-span-4">
            <p className="text-sm text-ink-soft leading-relaxed">
              Selecteer een branche en zie wat het platform specifiek voor jouw vakgebied klaarzet.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6 lg:gap-10">
          {/* Index */}
          <div className="lg:col-span-4 border-t border-ink/20">
            {branches.map((b, i) => {
              const isActive = b.id === active;
              return (
                <button
                  key={b.id}
                  onClick={() => setActive(b.id)}
                  className={`w-full flex items-center justify-between py-5 border-b border-ink/15 text-left transition-colors ${
                    isActive ? "text-ink" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  <span className="flex items-baseline gap-4">
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em]">0{i + 1}</span>
                    <span className="font-display text-2xl">{b.label}</span>
                  </span>
                  <span className={`font-mono text-xs ${isActive ? "text-ochre" : "opacity-30"}`}>
                    {isActive ? "●" : "○"}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Detail */}
          <div className="lg:col-span-8 bg-sage text-sage-foreground p-10 lg:p-14 relative overflow-hidden">
            <div className="absolute top-6 right-8 font-mono text-[10px] uppercase tracking-[0.25em] text-sage-foreground/50">
              {current.id.toUpperCase()} / 2026
            </div>
            <Icon className="h-10 w-10 stroke-[1.25] text-bone mb-12" />
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone/70 mb-4">{current.label}</p>
            <h3 className="font-display text-3xl lg:text-5xl leading-[1.05] tracking-[-0.02em] max-w-2xl">
              {current.claim}
            </h3>
            <div className="absolute -bottom-20 -right-20 opacity-10">
              <Icon className="h-72 w-72 stroke-[0.5]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BranchSwitcher;
