import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const HeroV2 = () => (
  <section className="relative overflow-hidden bg-background pt-32 pb-24 lg:pt-40 lg:pb-32">
    <div className="absolute inset-0 -z-10">
      <div className="absolute top-0 right-0 h-[520px] w-[520px] rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-0 left-1/4 h-[360px] w-[360px] rounded-full bg-ochre/15 blur-3xl" />
    </div>

    <div className="max-w-7xl mx-auto px-6 lg:px-10">
      <div className="grid lg:grid-cols-12 gap-12 items-end">
        <div className="lg:col-span-7">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-ink-soft mb-8">
            <span className="h-px w-10 bg-ink/40" />
            Software voor de verduurzamingsbranche
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl text-ink leading-[0.95] tracking-tight">
            Vakmanschap,<br />
            <span className="italic text-primary">digitaal</span> georganiseerd.
          </h1>

          <p className="mt-8 text-lg lg:text-xl text-ink-soft max-w-xl leading-relaxed">
            Eén Nederlands platform voor leads, schouwen, offertes, planning en
            klantportaal. Gemaakt voor installateurs van zonnepanelen,
            warmtepompen, thuisbatterijen en isolatie.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="rounded-full px-8 h-12 text-base shadow-[var(--shadow-soft)]" asChild>
              <Link to="/signup">
                30 dagen gratis proberen
                <ArrowRight size={18} />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="rounded-full px-6 h-12 text-base text-ink hover:bg-ink/5"
              asChild
            >
              <Link to="/features">Bekijk het platform →</Link>
            </Button>
          </div>

          <dl className="mt-14 grid grid-cols-3 gap-8 max-w-lg">
            {[
              { k: "500+", v: "Vakbedrijven" },
              { k: "4.8★", v: "Klantbeoordeling" },
              { k: "30 dgn", v: "Gratis proberen" },
            ].map((s) => (
              <div key={s.v}>
                <dt className="font-display text-3xl text-ink">{s.k}</dt>
                <dd className="text-xs uppercase tracking-wider text-ink-soft mt-1">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="lg:col-span-5">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 to-ochre/20 rounded-[2rem] blur-2xl opacity-60" />
            <div className="relative bg-surface rounded-3xl p-2 shadow-[var(--shadow-frame)] border border-border">
              <div className="aspect-[4/5] rounded-2xl bg-gradient-to-br from-surface-muted to-background overflow-hidden flex flex-col">
                <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border">
                  <span className="w-2.5 h-2.5 rounded-full bg-ink/15" />
                  <span className="w-2.5 h-2.5 rounded-full bg-ink/15" />
                  <span className="w-2.5 h-2.5 rounded-full bg-ink/15" />
                  <span className="ml-3 text-[10px] uppercase tracking-widest text-ink-soft">mijnhuis.nu / offerte</span>
                </div>
                <div className="flex-1 p-6 space-y-4">
                  <div className="h-3 w-2/3 rounded-full bg-ink/10" />
                  <div className="h-3 w-1/2 rounded-full bg-ink/10" />
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="h-20 rounded-xl bg-primary/10 border border-primary/20" />
                    <div className="h-20 rounded-xl bg-ochre/15 border border-ochre/30" />
                    <div className="h-20 rounded-xl bg-ink/5 border border-border" />
                    <div className="h-20 rounded-xl bg-ink/5 border border-border" />
                  </div>
                  <div className="mt-6 flex items-center justify-between pt-4 border-t border-border">
                    <div className="h-2 w-20 rounded-full bg-ink/10" />
                    <div className="h-7 w-24 rounded-full bg-primary" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default HeroV2;