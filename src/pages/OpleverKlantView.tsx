import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ViewData {
  rapportnummer: string;
  pdf_url: string | null;
  status: string;
  klant_naam?: string | null;
  partner_naam?: string | null;
  mode?: "view" | "sign";
  handtekening_url?: string | null;
  handtekening_naam?: string | null;
  ondertekend_op?: string | null;
}

export default function OpleverKlantView() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<ViewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("oplever-public-view", { body: { token } });
        if (error) throw error;
        setData(data as ViewData);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Niet beschikbaar";
        toast({ title: "Niet beschikbaar", description: msg, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Laden…</div>;
  if (!data) return <div className="p-8 text-center text-destructive">Link is verlopen of ongeldig.</div>;

  const ondertekendOp = data.ondertekend_op ? new Date(data.ondertekend_op).toLocaleString("nl-NL") : null;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Opleverrapport {data.rapportnummer}</CardTitle>
          {data.partner_naam ? (
            <p className="text-sm text-muted-foreground">Uitgevoerd door {data.partner_naam}</p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          {data.status === "ondertekend" ? (
            <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800">
              Dit rapport is digitaal ondertekend
              {data.handtekening_naam ? ` door ${data.handtekening_naam}` : ""}
              {ondertekendOp ? ` op ${ondertekendOp}` : ""}.
            </div>
          ) : (
            <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
              Dit rapport is nog niet ondertekend.
            </div>
          )}

          {data.pdf_url ? (
            <>
              <iframe src={data.pdf_url} title="rapport" className="w-full h-[600px] rounded border" />
              <Button asChild variant="outline">
                <a href={data.pdf_url} target="_blank" rel="noopener noreferrer">Download PDF</a>
              </Button>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">
              De definitieve PDF wordt door uw installateur bijgewerkt met beide handtekeningen. U ontvangt hierover automatisch een update.
            </div>
          )}

          {data.handtekening_url ? (
            <div>
              <p className="text-sm font-medium mb-2">Uw handtekening</p>
              <img
                src={data.handtekening_url}
                alt="Handtekening klant"
                className="max-h-32 rounded border bg-white p-2"
              />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}