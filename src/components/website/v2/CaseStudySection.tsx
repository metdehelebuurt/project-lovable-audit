const CaseStudySection = () => (
  <section
    className="relative py-24 lg:py-32 text-background"
    style={{
      backgroundImage:
        "linear-gradient(180deg, hsl(242 67% 18% / 0.94) 0%, hsl(242 67% 14% / 0.98) 100%), url('https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=2400&q=80')",
      backgroundAttachment: "fixed",
      backgroundSize: "cover",
      backgroundPosition: "center",
    }}
  >
    <div className="relative max-w-7xl mx-auto px-6 lg:px-10">
      <div className="grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5">
          <span className="text-[11px] uppercase tracking-[0.22em] text-background/50">Klantverhaal</span>
          <h2 className="font-display text-4xl lg:text-5xl mt-4 leading-[1.05]">
            "Van 4 naar 11 offertes per week."
          </h2>
          <p className="mt-8 text-base text-background/70 leading-relaxed">
            Mark, eigenaar van een zonnepanelenbedrijf met 6 monteurs, stapte
            over van Excel + Hellosales naar mijnhuis.nu. Resultaat: minder
            administratie, snellere doorlooptijd en een professioneler beeld
            richting de klant.
          </p>
          <div className="mt-10 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-ochre/20 border border-ochre/30 flex items-center justify-center font-display text-lg text-ochre">
              M
            </div>
            <div>
              <p className="text-sm font-medium text-background">Mark de Vries</p>
              <p className="text-xs text-background/60 uppercase tracking-wider mt-0.5">Eigenaar Zonnewerk Nederland</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 lg:col-start-7 grid grid-cols-2 gap-3">
          {[
            { k: "+175%", v: "Offertes per week" },
            { k: "−60%", v: "Tijd aan administratie" },
            { k: "2 dgn", v: "Doorlooptijd offerte" },
            { k: "4.9★", v: "Klantbeoordeling" },
          ].map((s) => (
            <div key={s.v} className="rounded-xl bg-background/[0.04] border border-background/10 backdrop-blur-sm p-7">
              <p className="font-display text-4xl text-background">{s.k}</p>
              <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-background/60">{s.v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default CaseStudySection;
