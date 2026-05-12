const CaseStudySection = () => (
  <section className="py-24 lg:py-32 bg-clay">
    <div className="max-w-7xl mx-auto px-6 lg:px-10">
      <div className="grid lg:grid-cols-12 gap-10 mb-16">
        <div className="lg:col-span-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-soft">§ 05</p>
        </div>
        <div className="lg:col-span-11">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ochre mb-4">— Klantverhaal</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-10 lg:gap-16">
        <div className="lg:col-span-7">
          <h2 className="font-display text-[clamp(2.25rem,5vw,5rem)] text-ink leading-[1.02] tracking-[-0.025em]">
            <span className="text-ink-soft">"</span>Van 4 naar 11 offertes{" "}
            <span className="italic font-light text-sage">per week</span>.<span className="text-ink-soft">"</span>
          </h2>
          <p className="mt-10 text-base text-ink-soft leading-relaxed max-w-xl">
            Mark, eigenaar van een zonnepanelenbedrijf met 6 monteurs, stapte
            over van Excel + Hellosales naar mijnhuis.nu. Resultaat: minder
            administratie, snellere doorlooptijd en een professioneler beeld
            richting de klant.
          </p>
          <div className="mt-12 flex items-center gap-4 pt-6 border-t border-ink/15 max-w-md">
            <div className="h-12 w-12 rounded-full bg-ink text-bone flex items-center justify-center font-display text-lg">
              M
            </div>
            <div>
              <p className="text-sm font-medium text-ink">Mark de Vries</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft mt-1">
                Eigenaar / Zonnewerk Nederland
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 grid grid-cols-2 gap-px bg-ink/15">
          {[
            { k: "+175%", v: "Offertes per week" },
            { k: "−60%", v: "Tijd aan administratie" },
            { k: "2 dgn", v: "Doorlooptijd offerte" },
            { k: "4.9 / 5", v: "Klantbeoordeling" },
          ].map((s, i) => (
            <div key={s.v} className="bg-clay p-7 lg:p-9">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">0{i + 1}</p>
              <p className="font-display text-4xl lg:text-5xl text-ink mt-4 leading-none">{s.k}</p>
              <p className="mt-3 text-xs text-ink-soft">{s.v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default CaseStudySection;
