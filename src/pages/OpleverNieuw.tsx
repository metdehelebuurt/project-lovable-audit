import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { createRapport } from "@/components/oplever/api/opleverApi";
import { toast } from "@/hooks/use-toast";

export default function OpleverNieuw() {
  const { profile } = useAuth();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!profile?.id || !profile?.partner_id) return;
    (async () => {
      try {
        const id = await createRapport({
          partner_id: profile.partner_id as string,
          installateur_id: profile.id,
          installatie_id: params.get("installatie"),
          klant_id: params.get("klant"),
        });
        nav(`/opleveringen/${id}`, { replace: true });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Aanmaken mislukt";
        toast({ title: "Mislukt", description: msg, variant: "destructive" });
        nav("/opleveringen", { replace: true });
      } finally {
        setBusy(false);
      }
    })();
  }, [profile?.id, profile?.partner_id, params, nav]);

  return <div className="p-8 text-center text-muted-foreground">{busy ? "Nieuw rapport aanmaken…" : ""}</div>;
}
