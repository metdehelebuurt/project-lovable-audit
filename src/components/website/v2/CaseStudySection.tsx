const CaseStudySection = () => (
  <section className="py-24 lg:py-32 bg-background">
    <div className="max-w-7xl mx-auto px-6 lg:px-10">
      <div className="grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5">
          <span className="text-xs uppercase tracking-[0.2em] text-ink-soft">Klantverhaal</span>
          <h2 className="font-display text-4xl lg:text-6xl text-ink mt-4 leading-[1.05]">
            "Van 4 naar 11 offertes <span className="italic text-primary">per week</span>."
          </h2>
          <p className="mt-8 text-lg text-ink-soft leading-relaxed">
            Mark, eigenaar van een zonnepanelenbedrijf met 6 monteurs, stapte
            over van Excel + Hellosales naar mijnhuis.nu. Resultaat: minder
            administratie, snellere doorlooptijd en een professioneler beeld
            richting de klant.
          </p>
          <div className="mt-10 flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/15 flex items-center justify-center font-display text-xl text-primary">
              M
            </div>
            <div>
              <p className="font-medium text-ink">Mark de Vries</p>
              <p className="text-sm text-ink-soft">Eigenaar Zonnewerk Nederland</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 lg:col-start-7 grid grid-cols-2 gap-4">
          {[
            { k: "+175%", v: "Offertes per week" },
            { k: "−60%", v: "Tijd aan administratie" },
            { k: "2 dgn", v: "Doorlooptijd offerte" },
            { k: "4.9★", v: "Klantbeoordeling" },
          ].map((s) => (
            <div key={s.v} className="rounded-2xl bg-surface border border-border p-8">
              <p className="font-display text-5xl text-ink">{s.k}</p>
              <p className="mt-2 text-sm text-ink-soft">{s.v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default CaseStudySection;