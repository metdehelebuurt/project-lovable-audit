const logos = ["Zonnewerk", "WarmteCo", "EcoBouw", "InstallNL", "GroenWonen", "Voltis"];

const TrustBar = () => (
  <section className="bg-ink text-background py-8 overflow-hidden">
    <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center gap-10">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-background/50 whitespace-nowrap shrink-0">
        Vertrouwd door
      </p>
      <div className="flex-1 grid grid-cols-3 lg:grid-cols-6 gap-6 items-center">
        {logos.map((l) => (
          <div key={l} className="font-display text-xl text-background/45 hover:text-background transition-colors text-center">
            {l}
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default TrustBar;
