import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const CTAV2 = () => (
  <section className="bg-ink text-background py-24 lg:py-36 relative overflow-hidden">
    {/* mark */}
    <div className="absolute top-10 left-10 font-mono text-[10px] uppercase tracking-[0.3em] text-background/40">
      § 06 / Begin vandaag
    </div>
    <div className="absolute top-10 right-10 font-mono text-[10px] uppercase tracking-[0.3em] text-background/40">
      mijnhuis.nu — 2026
    </div>

    <div className="relative max-w-7xl mx-auto px-6 lg:px-10">
      <div className="grid lg:grid-cols-12 gap-10 items-end">
        <div className="lg:col-span-9">
          <h2 className="font-display text-[clamp(3rem,9vw,9rem)] leading-[0.9] tracking-[-0.035em]">
            Eén platform.<br />
            <span className="italic font-light text-ochre">Eindelijk</span> overzicht.
          </h2>
        </div>
        <div className="lg:col-span-3">
          <p className="text-sm text-background/65 leading-relaxed border-l-2 border-ochre pl-5 mb-8">
            30 dagen gratis, geen creditcard nodig. Inclusief demo-data zodat
            je direct kunt ervaren hoe je bedrijf eruit kan zien.
          </p>
          <div className="flex flex-col gap-2">
            <Button size="lg" className="rounded-none px-7 h-12 text-sm font-medium bg-bone text-ink hover:bg-bone/90 justify-between" asChild>
              <Link to="/signup">
                Start proefperiode
                <ArrowRight size={16} />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="rounded-none px-0 h-10 text-sm text-background hover:bg-transparent hover:text-ochre justify-start font-mono uppercase tracking-[0.18em] text-[11px]"
              asChild
            >
              <Link to="/prijzen">→ Bekijk prijzen</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* bottom rule */}
      <div className="mt-24 pt-6 border-t border-background/15 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.25em] text-background/50">
        <span>— Editorial / NL</span>
        <span>Vakmanschap, digitaal</span>
        <span className="hidden md:inline">No. 06 / 06</span>
      </div>
    </div>
  </section>
);

export default CTAV2;
