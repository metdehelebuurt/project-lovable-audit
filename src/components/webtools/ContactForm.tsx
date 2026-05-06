import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, Loader2 } from "lucide-react";

interface ContactFormProps {
  widgetId: string;
  primaryColor?: string;
  ctaText?: string;
  calculatorResultaat?: Record<string, unknown>;
  productId?: string;
  productNaam?: string;
  onSuccess?: () => void;
}

export const ContactForm = ({
  widgetId,
  primaryColor = "#5B58E1",
  ctaText = "Verstuur aanvraag",
  calculatorResultaat,
  productId,
  productNaam,
  onSuccess,
}: ContactFormProps) => {
  const [form, setForm] = useState({
    voornaam: "",
    achternaam: "",
    email: "",
    telefoon: "",
    bericht: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.voornaam.trim() || !form.achternaam.trim() || !form.email.trim()) {
      setError("Vul alle verplichte velden in.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      setError("Vul een geldig e-mailadres in.");
      return;
    }

    setLoading(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/widget-submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            widget_id: widgetId,
            ...form,
            calculator_resultaat: calculatorResultaat,
            product_id: productId,
            product_naam: productNaam,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verzenden mislukt");

      setSuccess(true);
      onSuccess?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Er ging iets mis. Probeer het opnieuw.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8 space-y-3">
        <CheckCircle className="h-12 w-12 mx-auto" style={{ color: primaryColor }} />
        <h3 className="text-lg font-semibold">Bedankt voor uw aanvraag!</h3>
        <p className="text-sm text-muted-foreground">
          Wij nemen zo snel mogelijk contact met u op.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="voornaam">Voornaam *</Label>
          <Input
            id="voornaam"
            value={form.voornaam}
            onChange={(e) => setForm({ ...form, voornaam: e.target.value })}
            maxLength={100}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="achternaam">Achternaam *</Label>
          <Input
            id="achternaam"
            value={form.achternaam}
            onChange={(e) => setForm({ ...form, achternaam: e.target.value })}
            maxLength={100}
            required
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">E-mailadres *</Label>
        <Input
          id="email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          maxLength={255}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="telefoon">Telefoonnummer</Label>
        <Input
          id="telefoon"
          type="tel"
          value={form.telefoon}
          onChange={(e) => setForm({ ...form, telefoon: e.target.value })}
          maxLength={20}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="bericht">Bericht</Label>
        <Textarea
          id="bericht"
          value={form.bericht}
          onChange={(e) => setForm({ ...form, bericht: e.target.value })}
          maxLength={2000}
          rows={3}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        type="submit"
        disabled={loading}
        className="w-full rounded-[40px]"
        style={{ backgroundColor: primaryColor }}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        {ctaText}
      </Button>
    </form>
  );
};
