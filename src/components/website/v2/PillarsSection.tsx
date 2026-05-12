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
  <section
    className="relative py-24 lg:py-32 text-background"
    style={{
      backgroundImage:
        "linear-gradient(180deg, hsl(var(--ink) / 0.94) 0%, hsl(var(--ink) / 0.98) 100%), url('https://images.unsplash.com/photo-1581094271901-8022df4466f9?auto=format&fit=crop&w=2400&q=80')",
      backgroundAttachment: "fixed",
      backgroundSize: "cover",
      backgroundPosition: "center",
    }}
  >
    <div className="relative max-w-7xl mx-auto px-6 lg:px-10">
      <div className="grid lg:grid-cols-12 gap-10 mb-16">
        <div className="lg:col-span-5">
          <span className="text-[11px] uppercase tracking-[0.22em] text-background/50">Het platform</span>
          <h2 className="font-display text-4xl lg:text-5xl mt-4 leading-[1.05]">
            Drie pijlers, één systeem.
          </h2>
        </div>
        <div className="lg:col-span-6 lg:col-start-7 flex items-end">
          <p className="text-base text-background/70 leading-relaxed">
            mijnhuis.nu vervangt versnipperde software door één samenhangend
            platform. Van eerste lead tot opgeleverd project — alles in
            dezelfde taal, dezelfde stijl, dezelfde data.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {pillars.map((p) => (
          <article
            key={p.title}
            className="rounded-2xl border border-background/10 bg-background/[0.04] backdrop-blur-sm p-7 hover:bg-background/[0.07] transition-colors"
          >
            <div className="flex items-center justify-between mb-8">
              <p.icon className="h-6 w-6 text-ochre stroke-[1.5]" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-background/40">{p.label}</span>
            </div>
            <h3 className="font-display text-2xl">{p.title}</h3>
            <p className="mt-3 text-sm text-background/70 leading-relaxed">{p.body}</p>
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
