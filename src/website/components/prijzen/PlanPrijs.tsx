import { useBilling } from "./billingContext";
import { maandPrijs, prijsToelichting, type PlanSlug } from "./planPrijzen";

export const PlanPrijs = ({ slug }: { slug: PlanSlug }) => {
  const { facturatie } = useBilling();
  const { regel, extra } = prijsToelichting(slug, facturatie);
  return (
    <>
      <span
        style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "46px", lineHeight: "1", letterSpacing: "-0.02em", color: "var(--indigo-700)", marginBottom: "8px" }}
      >
        {maandPrijs(slug, facturatie)}
      </span>
      <div style={{ fontSize: "14.5px", color: "var(--text-body)", marginBottom: "3px" }}>
        {regel}
      </div>
      <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "22px" }}>
        {extra}
      </div>
    </>
  );
};
