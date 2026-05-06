import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Trash2, Copy, Check, Plus, FlaskConical, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface TokenRow {
  id: string;
  label: string;
  token_prefix: string;
  last_used_at: string | null;
  created_at: string;
  revoked_at: string | null;
}

interface TestStep {
  label: string;
  status: "pending" | "ok" | "error";
  detail?: string;
}

const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/partner-api`;

export const ApiTokensManager = () => {
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [revealedToken, setRevealedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [testToken, setTestToken] = useState("");
  const [testRunning, setTestRunning] = useState(false);
  const [testSteps, setTestSteps] = useState<TestStep[]>([]);

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

  const openTest = () => {
    setTestToken(revealedToken ?? "");
    setTestSteps([]);
    setTestOpen(true);
  };

  const updateStep = (idx: number, patch: Partial<TestStep>) => {
    setTestSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const runTest = async () => {
    const token = testToken.trim();
    if (!token) {
      toast.error("Plak het token (begint met pat_)");
      return;
    }
    setTestRunning(true);
    const initial: TestStep[] = [
      { label: "Token-validatie via /products", status: "pending" },
      { label: "Test-lead aanmaken via POST /leads", status: "pending" },
    ];
    setTestSteps(initial);

    // Step 1: GET /products to verify token
    try {
      const res = await fetch(`${API_BASE}/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        const count = Array.isArray(body?.data) ? body.data.length : 0;
        updateStep(0, { status: "ok", detail: `OK — ${count} product(en) zichtbaar` });
      } else {
        const reason =
          body?.error === "invalid_token"
            ? "Token onjuist of ingetrokken"
            : body?.error === "rate_limited"
            ? "Rate-limit bereikt — wacht even"
            : body?.error === "missing_token"
            ? "Authorization header ontbreekt"
            : `HTTP ${res.status}`;
        updateStep(0, { status: "error", detail: reason });
        updateStep(1, { status: "error", detail: "Overgeslagen omdat token ongeldig is" });
        setTestRunning(false);
        return;
      }
    } catch (e) {
      updateStep(0, { status: "error", detail: e instanceof Error ? e.message : "Netwerkfout" });
      updateStep(1, { status: "error", detail: "Overgeslagen" });
      setTestRunning(false);
      return;
    }

    // Step 2: POST /leads with a test payload
    try {
      const payload = {
        voornaam: "API",
        achternaam: "Test",
        email: `apitest+${Date.now()}@mijnhuis.nu`,
        telefoon: "0600000000",
        bericht: "Automatisch aangemaakte testlead via tokenvalidator.",
      };
      const res = await fetch(`${API_BASE}/leads`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        const id = body?.lead_id ?? body?.data?.id ?? body?.id ?? "onbekend";
        updateStep(1, {
          status: "ok",
          detail: `Lead aangemaakt (id: ${String(id).slice(0, 8)}…) — controleer Leads-overzicht`,
        });
      } else {
        const detail =
          typeof body?.error === "string"
            ? body.error
            : JSON.stringify(body?.error ?? body) || `HTTP ${res.status}`;
        updateStep(1, { status: "error", detail });
      }
    } catch (e) {
      updateStep(1, { status: "error", detail: e instanceof Error ? e.message : "Netwerkfout" });
    }
    setTestRunning(false);
    load();
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
        <Button variant="outline" onClick={openTest}>
          <FlaskConical className="h-4 w-4 mr-2" />
          Token testen
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

      <Dialog open={testOpen} onOpenChange={setTestOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>API-token testen</DialogTitle>
            <DialogDescription>
              We voeren twee testrequests uit: een <code>GET /products</code> om het token te
              valideren en een <code>POST /leads</code> met een testlead.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="test-token">Token</Label>
              <Input
                id="test-token"
                placeholder="pat_..."
                value={testToken}
                onChange={(e) => setTestToken(e.target.value)}
                className="font-mono text-xs"
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                Tip: alleen direct na het aanmaken kun je het token opnieuw inzien — bewaar hem veilig.
              </p>
            </div>

            {testSteps.length > 0 && (
              <div className="space-y-2 rounded-xl border bg-muted/30 p-3">
                {testSteps.map((step, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <div className="mt-0.5">
                      {step.status === "pending" && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                      {step.status === "ok" && (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                      {step.status === "error" && (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{step.label}</p>
                      {step.detail && (
                        <p className="text-xs text-muted-foreground break-all">{step.detail}</p>
                      )}
                    </div>
                    {step.status === "ok" && <Badge className="bg-green-100 text-green-800">OK</Badge>}
                    {step.status === "error" && (
                      <Badge variant="destructive">Fout</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-xl border bg-muted/20 p-3 space-y-1">
              <p className="text-xs font-medium">Endpoints</p>
              <p className="text-xs font-mono text-muted-foreground break-all">
                GET {API_BASE}/products
              </p>
              <p className="text-xs font-mono text-muted-foreground break-all">
                POST {API_BASE}/leads
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestOpen(false)}>
              Sluiten
            </Button>
            <Button onClick={runTest} disabled={testRunning}>
              {testRunning ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <FlaskConical className="h-4 w-4 mr-2" />
              )}
              Test uitvoeren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};