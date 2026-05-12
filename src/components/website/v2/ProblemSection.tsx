import { FileWarning, Clock, Users } from "lucide-react";

const problems = [
  {
    n: "01",
    icon: FileWarning,
    title: "Versnipperde tools",
    body: "Excel, WhatsApp, losse offertesoftware en een agenda — niets praat met elkaar. Fouten en dubbel werk worden onvermijdelijk.",
  },
  {
    n: "02",
    icon: Clock,
    title: "Te weinig tijd voor sales",
    body: "Verkopers verliezen uren aan administratie en napellen. Offertes worden te laat verstuurd, deals lopen weg.",
  },
  {
    n: "03",
    icon: Users,
    title: "Geen grip op de klantreis",
    body: "Van eerste contact tot oplevering: niemand weet waar een dossier staat. Klanten ervaren dat. Reviews ook.",
  },
];

const ProblemSection = () => (
  <section className="py-24 lg:py-32 bg-clay">
    <div className="max-w-7xl mx-auto px-6 lg:px-10">
      <div className="grid lg:grid-cols-12 gap-10 mb-16">
        <div className="lg:col-span-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-soft">§ 02</p>
        </div>
        <div className="lg:col-span-11">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ochre mb-4">— Diagnose</p>
          <h2 className="font-display text-[clamp(2rem,5vw,4.5rem)] text-ink leading-[1.02] tracking-[-0.025em] max-w-4xl">
            Groei wordt geremd door <span className="italic font-light text-sage">losse onderdelen</span>.
          </h2>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 lg:gap-10">
        {problems.map((p) => (
          <div key={p.title} className="border-t border-ink/20 pt-6">
            <div className="flex items-start justify-between mb-8">
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-soft">{p.n}</span>
              <p.icon className="h-5 w-5 text-ink stroke-[1.25]" />
            </div>
            <h3 className="font-display text-2xl lg:text-3xl text-ink leading-tight">{p.title}</h3>
            <p className="mt-4 text-sm text-ink-soft leading-relaxed">{p.body}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default ProblemSection;
