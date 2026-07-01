import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";

export default function OAuthReturn() {
  const [params] = useSearchParams();
  const status = params.get("status") ?? "success";
  const message = params.get("message") ?? "";
  const provider = params.get("provider") ?? "";
  const email = params.get("email") ?? "";
  const fallback = params.get("fallback") || "/instellingen";

  const success = status === "success";
  const title = useMemo(() => {
    if (success) return "E-mail gekoppeld";
    if (status === "warning") return "Koppeling onvolledig";
    return "Koppelen mislukt";
  }, [status, success]);

  useEffect(() => {
    const payload = {
      type: "email-oauth-result",
      error: !success,
      provider,
      email,
      message,
    };
    try {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(payload, "*");
      }
    } catch {
      /* ignore */
    }
    const t = setTimeout(() => {
      try {
        window.close();
      } catch {
        /* ignore */
      }
      setTimeout(() => {
        if (!window.closed) window.location.replace(fallback);
      }, 300);
    }, 1500);
    return () => clearTimeout(t);
  }, [success, provider, email, message, fallback]);

  const closeOrRedirect = () => {
    try {
      window.close();
    } catch {
      /* ignore */
    }
    setTimeout(() => window.location.replace(fallback), 200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-primary/5 to-accent/10">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl shadow-xl p-10 text-center">
        <div
          className={`mx-auto mb-5 h-20 w-20 rounded-full flex items-center justify-center ${
            success ? "bg-success-light" : "bg-error-light"
          }`}
        >
          {success ? (
            <CheckCircle2 className="h-11 w-11 text-success" />
          ) : (
            <XCircle className="h-11 w-11 text-error" />
          )}
        </div>
        <h1 className="text-xl font-semibold text-foreground mb-2">{title}</h1>
        <p className="text-sm text-muted-foreground mb-6 whitespace-pre-line">
          {message || (success ? `Je e-mailaccount ${email} is succesvol gekoppeld.` : "Er ging iets mis.")}
        </p>
        <button
          onClick={closeOrRedirect}
          className="inline-flex items-center justify-center bg-primary text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Venster sluiten
        </button>
        <div className="mt-4 text-xs text-muted-foreground">Dit venster sluit automatisch…</div>
      </div>
    </div>
  );
}