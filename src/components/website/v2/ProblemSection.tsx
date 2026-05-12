import { FileWarning, Clock, Users } from "lucide-react";

const problems = [
  {
    icon: FileWarning,
    title: "Versnipperde tools",
    body: "Excel, WhatsApp, losse offertesoftware en een agenda — niets praat met elkaar. Fouten en dubbel werk worden onvermijdelijk.",
  },
  {
    icon: Clock,
    title: "Te weinig tijd voor sales",
    body: "Verkopers verliezen uren aan administratie en napellen. Offertes worden te laat verstuurd, deals lopen weg.",
  },
  {
    icon: Users,
    title: "Geen grip op de klantreis",
    body: "Van eerste contact tot oplevering: niemand weet waar een dossier staat. Klanten ervaren dat. Reviews ook.",
  },
];

const ProblemSection = () => (
  <section className="py-20 lg:py-28 bg-surface-muted">
    <div className="max-w-7xl mx-auto px-6 lg:px-10">
      <div className="max-w-3xl mb-12">
        <span className="text-[11px] uppercase tracking-[0.22em] text-ink-soft">Herken je dit?</span>
        <h2 className="font-display text-4xl lg:text-5xl text-ink mt-4 leading-[1.05]">
          Groei wordt geremd door losse onderdelen.
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-px bg-border rounded-2xl overflow-hidden border border-border">
        {problems.map((p) => (
          <div key={p.title} className="bg-surface p-8 lg:p-10">
            <p.icon className="h-7 w-7 text-primary stroke-[1.5]" />
            <h3 className="font-display text-2xl text-ink mt-6">{p.title}</h3>
            <p className="mt-3 text-sm text-ink-soft leading-relaxed">{p.body}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default ProblemSection;
