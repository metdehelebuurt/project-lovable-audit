export type Facturatie = "maandelijks" | "jaarlijks";

export type PlanSlug = "starter" | "professional" | "enterprise";

export interface PlanPrijsData {
  maandBedrag: number;
  jaarBedrag: number;
}

export const PLAN_PRIJZEN: Record<PlanSlug, PlanPrijsData> = {
  starter: { maandBedrag: 95, jaarBedrag: 899 },
  professional: { maandBedrag: 180, jaarBedrag: 1699 },
  enterprise: { maandBedrag: 250, jaarBedrag: 2399 },
};

const euro = (bedrag: number) =>
  `\u20ac ${bedrag.toLocaleString("nl-NL", { maximumFractionDigits: 0 })}`;

export const maandPrijs = (slug: PlanSlug, facturatie: Facturatie) => {
  const { maandBedrag, jaarBedrag } = PLAN_PRIJZEN[slug];
  if (facturatie === "maandelijks") return euro(maandBedrag);
  return euro(Math.round(jaarBedrag / 12));
};

export const prijsToelichting = (slug: PlanSlug, facturatie: Facturatie) => {
  const { maandBedrag, jaarBedrag } = PLAN_PRIJZEN[slug];
  if (facturatie === "maandelijks") {
    return {
      regel: "per maand, maandelijks gefactureerd",
      extra: "Maandelijks opzegbaar, geen contractduur",
    };
  }
  const korting = Math.round((1 - jaarBedrag / (maandBedrag * 12)) * 100);
  return {
    regel: "per maand, jaarlijks gefactureerd",
    extra: `${euro(jaarBedrag)} per jaar, je bespaart ${korting}%`,
  };
};
