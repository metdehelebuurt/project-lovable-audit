import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Logo from "@/components/Logo";

type AuthorizationDetails = {
  client?: { name?: string } | null;
  redirect_url?: string;
  redirect_to?: string;
};

type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
};

const oauthApi = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

const OAuthConsent = () => {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<AuthorizationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      if (!authorizationId) {
        setError("Geen authorization_id in de URL.");
        return;
      }
      const { data: sessie } = await supabase.auth.getSession();
      if (!sessie.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = `/login?next=${encodeURIComponent(next)}`;
        return;
      }
      const { data, error: detailError } = await oauthApi().getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (detailError) {
        setError(detailError.message);
        return;
      }
      const direct = data?.redirect_url ?? data?.redirect_to;
      if (direct && !data?.client) {
        window.location.href = direct;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  const beslis = async (goedkeuren: boolean) => {
    setBusy(true);
    const api = oauthApi();
    const { data, error: beslisError } = goedkeuren
      ? await api.approveAuthorization(authorizationId)
      : await api.denyAuthorization(authorizationId);
    if (beslisError) {
      setBusy(false);
      setError(beslisError.message);
      return;
    }
    const doel = data?.redirect_url ?? data?.redirect_to;
    if (!doel) {
      setBusy(false);
      setError("De autorisatieserver gaf geen doorstuur-URL terug.");
      return;
    }
    window.location.href = doel;
  };

  const clientNaam = details?.client?.name ?? "deze toepassing";

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <Logo />
          </div>
          <CardTitle className="text-center text-xl">
            {error ? "Autorisatie mislukt" : `Toegang verlenen aan ${clientNaam}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!error && !details && <p className="text-sm text-muted-foreground">Bezig met laden…</p>}
          {!error && details && (
            <>
              <p className="text-sm text-muted-foreground">
                {clientNaam} krijgt toegang tot Mijnhuis.nu namens jou. De toepassing ziet alleen gegevens die
                jij zelf mag inzien en bewerken.
              </p>
              <div className="flex gap-3">
                <Button className="flex-1" disabled={busy} onClick={() => void beslis(true)}>
                  Toegang verlenen
                </Button>
                <Button className="flex-1" variant="outline" disabled={busy} onClick={() => void beslis(false)}>
                  Weigeren
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
};

export default OAuthConsent;