import { useBilling } from "./billingContext";
import type { Facturatie } from "./planPrijzen";

const knopStijl = (actief: boolean) => ({
  padding: "9px 18px",
  borderRadius: "999px",
  border: "none",
  cursor: "pointer",
  fontFamily: "var(--font-body)",
  fontSize: "14px",
  fontWeight: "600",
  background: actief ? "rgb(255, 255, 255)" : "transparent",
  color: actief ? "var(--color-primary)" : "var(--neutral-600)",
  boxShadow: actief ? "var(--shadow-sm)" : "none",
  transition: "all var(--dur-fast) var(--ease-standard)",
  whiteSpace: "nowrap" as const,
});

const OPTIES: Array<{ waarde: Facturatie; label: string }> = [
  { waarde: "maandelijks", label: "Maandelijks" },
  { waarde: "jaarlijks", label: "Jaarlijks \u00b7 bespaar 21%" },
];

export const PrijsToggle = () => {
  const { facturatie, setFacturatie } = useBilling();
  return (
    <div
      style={{ display: "inline-flex", padding: "5px", background: "var(--indigo-50)", borderRadius: "999px", gap: "4px" }}
    >
      {OPTIES.map((optie) => (
        <button
          key={optie.waarde}
          type="button"
          aria-pressed={facturatie === optie.waarde}
          onClick={() => setFacturatie(optie.waarde)}
          style={knopStijl(facturatie === optie.waarde)}
        >
          {optie.label}
        </button>
      ))}
    </div>
  );
};
