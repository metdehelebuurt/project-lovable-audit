import { TrendingUp, Settings2, Heart } from "lucide-react";

const pillars = [
  {
    n: "I",
    icon: TrendingUp,
    label: "Verkoop",
    title: "Verkoop sneller",
    body: "Schouw, offerte en handtekening op één tablet. Van bezoek naar getekende offerte in dezelfde middag.",
    items: ["Mobiele schouw-app", "Offertes met digitale handtekening", "AI-werkomschrijvingen"],
  },
  {
    n: "II",
    icon: Settings2,
    label: "Operatie",
    title: "Werk efficiënter",
    body: "Planning, monteurs, voorraad en oplevering — gekoppeld in één workflow zonder dubbele invoer.",
    items: ["Planning & monteurs", "Voorraad & inkoop", "Digitale oplevering NEN 1010"],
  },
  {
    n: "III",
    icon: Heart,
    label: "Klant",
    title: "Maak klanten enthousiast",
    body: "Eigen klantportaal, automatische updates en webtools die op je site leads opvangen — 24/7.",
    items: ["Klantportaal met chat", "Embeddable webtools", "Automatische e-mails"],
  },
];

const PillarsSection = () => (
  <section className="relative py-24 lg:py-32 bg-ink text-background overflow-hidden">
    {/* corner ornament */}
    <div className="absolute top-10 right-10 font-mono text-[10px] uppercase tracking-[0.3em] text-background/30">
      § 03 / Het platform
    </div>

    <div className="relative max-w-7xl mx-auto px-6 lg:px-10">
      <div className="grid lg:grid-cols-12 gap-10 mb-20 items-end">
        <div className="lg:col-span-7">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ochre mb-4">— Architectuur</p>
          <h2 className="font-display text-[clamp(2rem,5vw,4.5rem)] leading-[1.02] tracking-[-0.025em]">
            Drie pijlers,<br />
            <span className="italic font-light text-bone/80">één systeem</span>.
          </h2>
        </div>
        <div className="lg:col-span-5 lg:pb-3">
          <p className="text-sm text-background/65 leading-relaxed border-l-2 border-ochre pl-5">
            mijnhuis.nu vervangt versnipperde software door één samenhangend
            platform. Van eerste lead tot opgeleverd project — alles in
            dezelfde taal, dezelfde stijl, dezelfde data.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-px bg-background/15">
        {pillars.map((p) => (
          <article key={p.title} className="bg-ink p-8 lg:p-10 group">
            <div className="flex items-baseline justify-between mb-12">
              <span className="font-display text-5xl text-ochre italic font-light">{p.n}</span>
              <p.icon className="h-5 w-5 text-background/60 stroke-[1.25] group-hover:text-ochre transition-colors" />
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-background/50">{p.label}</p>
            <h3 className="font-display text-2xl lg:text-3xl mt-2 leading-tight">{p.title}</h3>
            <p className="mt-4 text-sm text-background/65 leading-relaxed">{p.body}</p>
            <ul className="mt-8 pt-6 border-t border-background/15 space-y-2.5 text-sm text-background/85">
              {p.items.map((i) => (
                <li key={i} className="flex items-baseline gap-3">
                  <span className="font-mono text-[10px] text-ochre">+</span>
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
