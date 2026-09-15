import { createContext, useContext } from "react";
import type { Facturatie } from "./planPrijzen";

interface BillingContextWaarde {
  facturatie: Facturatie;
  setFacturatie: (waarde: Facturatie) => void;
}

export const BillingContext = createContext<BillingContextWaarde>({
  facturatie: "jaarlijks",
  setFacturatie: () => undefined,
});

export const useBilling = () => useContext(BillingContext);
