import { useMemo, useState, type ReactNode } from "react";
import { BillingContext } from "./billingContext";
import type { Facturatie } from "./planPrijzen";

export const BillingProvider = ({ children }: { children: ReactNode }) => {
  const [facturatie, setFacturatie] = useState<Facturatie>("jaarlijks");
  const waarde = useMemo(() => ({ facturatie, setFacturatie }), [facturatie]);
  return <BillingContext.Provider value={waarde}>{children}</BillingContext.Provider>;
};
