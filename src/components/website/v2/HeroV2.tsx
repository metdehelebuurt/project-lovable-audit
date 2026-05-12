import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const HeroV2 = () => (
  <section
    className="relative overflow-hidden bg-ink text-background pt-32 pb-20 lg:pt-44 lg:pb-28"
    style={{
      backgroundImage:
        "linear-gradient(180deg, hsl(var(--ink) / 0.92) 0%, hsl(var(--ink) / 0.96) 100%), url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=2400&q=80')",
      backgroundAttachment: "fixed",
      backgroundSize: "cover",
      backgroundPosition: "center",
    }}
  >
    <div className="absolute inset-0 -z-0 pointer-events-none">
      <div className="absolute top-0 right-0 h-[420px] w-[420px] rounded-full bg-primary/20 blur-[120px]" />
      <div className="absolute bottom-0 left-1/4 h-[320px] w-[320px] rounded-full bg-ochre/15 blur-[120px]" />
    </div>

    <div className="relative max-w-7xl mx-auto px-6 lg:px-10">
      <div className="grid lg:grid-cols-12 gap-10 items-end">
        <div className="lg:col-span-7">
          <div className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.22em] text-background/60 mb-8">
            <span className="h-px w-10 bg-background/40" />
            Software voor de verduurzamingsbranche
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl text-background leading-[0.98] tracking-tight">
            Vakmanschap, digitaal georganiseerd.
          </h1>

          <p className="mt-8 text-base lg:text-lg text-background/70 max-w-xl leading-relaxed">
            Eén Nederlands platform voor leads, schouwen, offertes, planning en
            klantportaal. Gemaakt voor installateurs van zonnepanelen,
            warmtepompen, thuisbatterijen en isolatie.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <Button size="lg" className="rounded-full px-7 h-12 text-sm font-medium" asChild>
              <Link to="/signup">
                30 dagen gratis proberen
                <ArrowRight size={16} />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="rounded-full px-6 h-12 text-sm text-background hover:bg-background/10 hover:text-background"
              asChild
            >
              <Link to="/features">Bekijk het platform →</Link>
            </Button>
          </div>

          <dl className="mt-16 grid grid-cols-3 gap-8 max-w-lg border-t border-background/15 pt-8">
            {[
              { k: "500+", v: "Vakbedrijven" },
              { k: "4.8★", v: "Klantbeoordeling" },
              { k: "30 dgn", v: "Gratis proberen" },
            ].map((s) => (
              <div key={s.v}>
                <dt className="font-display text-3xl text-background">{s.k}</dt>
                <dd className="text-[11px] uppercase tracking-[0.18em] text-background/50 mt-1">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="lg:col-span-5">
          <div className="relative">
            <div className="absolute -inset-3 bg-gradient-to-br from-primary/25 to-ochre/15 rounded-[2rem] blur-2xl opacity-60" />
            <div className="relative bg-background/[0.04] backdrop-blur-sm rounded-2xl p-2 border border-background/10">
              <div className="aspect-[4/5] rounded-xl bg-gradient-to-br from-background/[0.06] to-background/[0.02] overflow-hidden flex flex-col border border-background/5">
                <div className="flex items-center gap-1.5 px-4 py-3 border-b border-background/10">
                  <span className="w-2 h-2 rounded-full bg-background/20" />
                  <span className="w-2 h-2 rounded-full bg-background/20" />
                  <span className="w-2 h-2 rounded-full bg-background/20" />
                  <span className="ml-3 text-[10px] uppercase tracking-[0.18em] text-background/50">mijnhuis.nu / offerte</span>
                </div>
                <div className="flex-1 p-6 space-y-4">
                  <div className="h-2.5 w-2/3 rounded-full bg-background/10" />
                  <div className="h-2.5 w-1/2 rounded-full bg-background/10" />
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="h-20 rounded-lg bg-primary/15 border border-primary/25" />
                    <div className="h-20 rounded-lg bg-ochre/15 border border-ochre/25" />
                    <div className="h-20 rounded-lg bg-background/[0.04] border border-background/10" />
                    <div className="h-20 rounded-lg bg-background/[0.04] border border-background/10" />
                  </div>
                  <div className="mt-6 flex items-center justify-between pt-4 border-t border-background/10">
                    <div className="h-2 w-20 rounded-full bg-background/10" />
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
