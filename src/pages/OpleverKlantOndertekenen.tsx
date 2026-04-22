import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SignaturePad from "@/components/oplever/SignaturePad";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface PublicData {
  rapportnummer: string;
  pdf_url: string | null;
  status: string;
  klant_naam?: string;
  partner_naam?: string;
}

export default function OpleverKlantOndertekenen() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PublicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [naam, setNaam] = useState("");
  const [sig, setSig] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [klaar, setKlaar] = useState(false);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("oplever-public-view", { body: { token } });
        if (error) throw error;
        setData(data as PublicData);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Niet beschikbaar";
        toast({ title: "Niet beschikbaar", description: msg, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const submit = async () => {
    if (!naam.trim() || !sig) {
      toast({ title: "Naam en handtekening verplicht", variant: "destructive" });
      return;
    }
    try {
      setBusy(true);
      const { error } = await supabase.functions.invoke("oplever-klant-ondertekenen", {
        body: { token, naam, signature_image: sig },
      });
      if (error) throw error;
      setKlaar(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Mislukt";
      toast({ title: "Mislukt", description: msg, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Laden…</div>;
  if (!data) return <div className="p-8 text-center text-destructive">Link is verlopen of ongeldig.</div>;
  if (klaar)
    return (
      <div className="max-w-2xl mx-auto p-8 text-center space-y-4">
        <h1 className="text-2xl font-semibold">Bedankt voor uw ondertekening</h1>
        <p className="text-muted-foreground">U ontvangt het ondertekende rapport per e-mail.</p>
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Opleverrapport {data.rapportnummer}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.pdf_url ? (
            <iframe src={data.pdf_url} title="rapport" className="w-full h-[600px] rounded border" />
          ) : (
            <div className="text-sm text-muted-foreground">PDF-preview niet beschikbaar.</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Akkoord en ondertekenen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Uw naam</Label>
            <Input value={naam} onChange={(e) => setNaam(e.target.value)} />
          </div>
          <div>
            <Label>Handtekening</Label>
            <SignaturePad value={sig} onChange={setSig} />
          </div>
          <Button onClick={submit} disabled={busy} className="w-full md:w-auto">
            {busy ? "Bezig…" : "Akkoord en ondertekenen"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
