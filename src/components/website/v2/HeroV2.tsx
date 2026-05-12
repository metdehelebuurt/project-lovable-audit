import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const HeroV2 = () => (
  <section
    className="relative overflow-hidden bg-bone pt-32 pb-20 lg:pt-40 lg:pb-24"
  >
    {/* editorial grid lines */}
    <div className="absolute inset-0 pointer-events-none opacity-[0.07]">
      <div className="max-w-7xl mx-auto h-full px-6 lg:px-10 grid grid-cols-12 gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="border-l border-ink h-full" />
        ))}
      </div>
    </div>

    <div className="relative max-w-7xl mx-auto px-6 lg:px-10">
      {/* top meta row */}
      <div className="flex items-center justify-between mb-16 text-[10px] font-mono uppercase tracking-[0.25em] text-ink-soft">
        <span>N°.01 — Platform</span>
        <span className="hidden md:inline">Editie 2026 / Nederland</span>
        <span>↓ Begin onder</span>
      </div>

      <div className="grid lg:grid-cols-12 gap-10 items-end">
        <div className="lg:col-span-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ochre mb-6">
            — Software voor de verduurzamingsbranche
          </p>

          <h1 className="font-display text-[clamp(2.75rem,7vw,7rem)] text-ink leading-[0.92] tracking-[-0.03em]">
            Vakmanschap,<br />
            <span className="italic font-light text-sage">digitaal</span>{" "}
            georganiseerd.
          </h1>
        </div>

        <div className="lg:col-span-4 lg:pb-4">
          <div className="border-l-2 border-ink pl-6">
            <p className="text-sm text-ink-soft leading-relaxed">
              Eén Nederlands platform voor leads, schouwen, offertes,
              planning en klantportaal. Gemaakt voor installateurs van
              zonnepanelen, warmtepompen, thuisbatterijen en isolatie.
            </p>

            <div className="mt-8 flex flex-col gap-2">
              <Button size="lg" className="rounded-none px-7 h-12 text-sm font-medium justify-between" asChild>
                <Link to="/signup">
                  30 dagen gratis proberen
                  <ArrowRight size={16} />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="rounded-none px-0 h-10 text-sm text-ink hover:bg-transparent hover:text-ochre justify-start font-mono uppercase tracking-[0.18em] text-[11px]"
                asChild
              >
                <Link to="/features">→ Bekijk het platform</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* bottom strip */}
      <div className="mt-20 pt-8 border-t border-ink/15 grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { k: "500+", v: "Vakbedrijven" },
          { k: "4.8 / 5", v: "Klantbeoordeling" },
          { k: "30 dgn", v: "Gratis proberen" },
          { k: "06", v: "Modules" },
        ].map((s, i) => (
          <div key={s.v} className="flex items-baseline gap-3">
            <span className="font-mono text-[10px] text-ink-soft">0{i + 1}</span>
            <div>
              <p className="font-display text-3xl text-ink leading-none">{s.k}</p>
              <p className="text-[10px] uppercase tracking-[0.22em] text-ink-soft mt-2">{s.v}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default HeroV2;
