import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

type Status = "checking" | "valid" | "already" | "invalid" | "submitting" | "done" | "error";

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let cancelled = false;
    if (!token) { setStatus("invalid"); return; }
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON } },
        );
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) { setStatus("invalid"); return; }
        if (data.valid === false && data.reason === "already_unsubscribed") setStatus("already");
        else if (data.valid) setStatus("valid");
        else setStatus("invalid");
      } catch {
        if (!cancelled) setStatus("invalid");
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const bevestig = async () => {
    if (!token) return;
    setStatus("submitting");
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", { body: { token } });
      if (error) throw error;
      if ((data as any)?.success) setStatus("done");
      else if ((data as any)?.reason === "already_unsubscribed") setStatus("already");
      else setStatus("error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Uitschrijven van Mijnhuis-mails</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {status === "checking" && <p>Even checken…</p>}
          {status === "invalid" && <p className="text-destructive">Deze uitschrijflink is ongeldig of verlopen.</p>}
          {status === "already" && <p>Je bent al uitgeschreven. We sturen je geen platformmails meer.</p>}
          {status === "valid" && (
            <>
              <p>Klik op de knop om je definitief uit te schrijven van platformmails (zoals welkomstmails en notificaties).</p>
              <Button onClick={bevestig} className="w-full">Uitschrijven bevestigen</Button>
            </>
          )}
          {status === "submitting" && <p>Bezig met uitschrijven…</p>}
          {status === "done" && <p className="text-emerald-600">Je bent uitgeschreven. Je ontvangt geen platformmails meer van ons.</p>}
          {status === "error" && <p className="text-destructive">Er ging iets mis. Probeer de link opnieuw of neem contact op.</p>}
        </CardContent>
      </Card>
    </div>
  );
}