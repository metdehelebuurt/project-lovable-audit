import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Trash2, Copy, Check, Plus } from "lucide-react";
import { toast } from "sonner";

interface TokenRow {
  id: string;
  label: string;
  token_prefix: string;
  last_used_at: string | null;
  created_at: string;
  revoked_at: string | null;
}

export const ApiTokensManager = () => {
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [revealedToken, setRevealedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("partner-api-tokens", {
      method: "GET",
    });
    if (error) {
      toast.error("Kon API-tokens niet laden");
    } else {
      setTokens(((data as { data?: TokenRow[] })?.data) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!newLabel.trim()) {
      toast.error("Geef het token een herkenbaar label");
      return;
    }
    setCreating(true);
    const { data, error } = await supabase.functions.invoke("partner-api-tokens", {
      method: "POST",
      body: { label: newLabel.trim() },
    });
    setCreating(false);
    if (error || !data) {
      toast.error("Aanmaken mislukt");
      return;
    }
    const token = (data as { token?: string }).token;
    if (token) setRevealedToken(token);
    setNewLabel("");
    load();
  };

  const revoke = async (id: string) => {
    if (!confirm("Token intrekken? Bestaande integraties stoppen direct met werken.")) return;
    const { error } = await supabase.functions.invoke("partner-api-tokens", {
      method: "DELETE",
      body: { id },
    });
    if (error) {
      toast.error("Intrekken mislukt");
      return;
    }
    toast.success("Token ingetrokken");
    load();
  };

  const copy = async () => {
    if (!revealedToken) return;
    await navigator.clipboard.writeText(revealedToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-base font-semibold">REST API-tokens</h3>
        <p className="text-sm text-muted-foreground">
          Gebruik tokens om je productcatalogus headless te integreren via{" "}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">/functions/v1/partner-api</code>.
          Een token wordt eenmalig getoond bij aanmaken — bewaar hem veilig.
        </p>
      </div>

      {revealedToken && (
        <Card className="p-4 border-primary bg-primary/5 space-y-2">
          <p className="text-sm font-medium">Nieuw token aangemaakt — kopieer nu:</p>
          <div className="flex gap-2">
            <Input readOnly value={revealedToken} className="font-mono text-xs" />
            <Button size="icon" variant="outline" onClick={copy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setRevealedToken(null)}>
            Sluiten
          </Button>
        </Card>
      )}

      <div className="flex gap-2">
        <Input
          placeholder="Naam van token (bv. Productie website)"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          maxLength={80}
        />
        <Button onClick={create} disabled={creating}>
          {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
          Token aanmaken
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : tokens.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          Nog geen tokens aangemaakt.
        </p>
      ) : (
        <div className="space-y-2">
          {tokens.map((t) => (
            <Card key={t.id} className="p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{t.label}</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {t.token_prefix}…
                </p>
                <p className="text-xs text-muted-foreground">
                  Laatst gebruikt:{" "}
                  {t.last_used_at ? new Date(t.last_used_at).toLocaleString("nl-NL") : "nooit"}
                  {t.revoked_at && " — ingetrokken"}
                </p>
              </div>
              {!t.revoked_at && (
                <Button variant="ghost" size="icon" onClick={() => revoke(t.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};