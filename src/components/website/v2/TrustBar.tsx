const logos = ["Zonnewerk", "WarmteCo", "EcoBouw", "InstallNL", "GroenWonen", "Voltis"];

const TrustBar = () => (
  <section className="border-y border-border bg-surface/50">
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
      <p className="text-center text-xs uppercase tracking-[0.2em] text-ink-soft mb-6">
        Vertrouwd door vakbedrijven door heel Nederland
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-8 gap-y-4 items-center">
        {logos.map((l) => (
          <div key={l} className="text-center font-display text-xl text-ink/40 hover:text-ink/70 transition-colors">
            {l}
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default TrustBar;