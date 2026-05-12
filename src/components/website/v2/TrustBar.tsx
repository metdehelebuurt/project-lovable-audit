const logos = ["Zonnewerk", "WarmteCo", "EcoBouw", "InstallNL", "GroenWonen", "Voltis"];

const TrustBar = () => (
  <section className="bg-ink text-background border-t border-background/10">
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
      <p className="text-center text-[11px] uppercase tracking-[0.22em] text-background/50 mb-6">
        Vertrouwd door vakbedrijven door heel Nederland
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-8 gap-y-4 items-center">
        {logos.map((l) => (
          <div key={l} className="text-center font-display text-xl text-background/40 hover:text-background/70 transition-colors">
            {l}
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default TrustBar;
