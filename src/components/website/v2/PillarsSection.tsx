import { TrendingUp, Settings2, Heart } from "lucide-react";

const pillars = [
  {
    icon: TrendingUp,
    label: "01 — Verkoop",
    title: "Verkoop sneller",
    body: "Schouw, offerte en handtekening op één tablet. Van bezoek naar getekende offerte in dezelfde middag.",
    items: ["Mobiele schouw-app", "Offertes met digitale handtekening", "AI-werkomschrijvingen"],
  },
  {
    icon: Settings2,
    label: "02 — Operatie",
    title: "Werk efficiënter",
    body: "Planning, monteurs, voorraad en oplevering — gekoppeld in één workflow zonder dubbele invoer.",
    items: ["Planning & monteurs", "Voorraad & inkoop", "Digitale oplevering NEN 1010"],
  },
  {
    icon: Heart,
    label: "03 — Klant",
    title: "Maak klanten enthousiast",
    body: "Eigen klantportaal, automatische updates en webtools die op je site leads opvangen — 24/7.",
    items: ["Klantportaal met chat", "Embeddable webtools", "Automatische e-mails"],
  },
];

const PillarsSection = () => (
  <section className="py-24 lg:py-32 bg-ink text-background">
    <div className="max-w-7xl mx-auto px-6 lg:px-10">
      <div className="grid lg:grid-cols-12 gap-12 mb-20">
        <div className="lg:col-span-5">
          <span className="text-xs uppercase tracking-[0.2em] text-background/50">Het platform</span>
          <h2 className="font-display text-4xl lg:text-6xl mt-4 leading-[1.05]">
            Drie pijlers,<br />
            <span className="italic text-ochre">één systeem</span>.
          </h2>
        </div>
        <div className="lg:col-span-6 lg:col-start-7 flex items-end">
          <p className="text-lg text-background/70 leading-relaxed">
            mijnhuis.nu vervangt versnipperde software door één samenhangend
            platform. Van eerste lead tot opgeleverd project — alles in
            dezelfde taal, dezelfde stijl, dezelfde data.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {pillars.map((p) => (
          <article
            key={p.title}
            className="rounded-3xl border border-background/10 bg-background/[0.03] p-8 hover:bg-background/[0.06] transition-colors"
          >
            <div className="flex items-center justify-between mb-10">
              <p.icon className="h-7 w-7 text-ochre stroke-[1.25]" />
              <span className="text-xs uppercase tracking-widest text-background/40">{p.label}</span>
            </div>
            <h3 className="font-display text-3xl">{p.title}</h3>
            <p className="mt-4 text-background/70 leading-relaxed">{p.body}</p>
            <ul className="mt-6 pt-6 border-t border-background/10 space-y-2 text-sm text-background/80">
              {p.items.map((i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-ochre" />
                  {i}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default PillarsSection;