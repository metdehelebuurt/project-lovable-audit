import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ContactForm } from "@/components/webtools/ContactForm";
import { Loader2 } from "lucide-react";

const EmbedContact = () => {
  const { widgetId } = useParams<{ widgetId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [widget, setWidget] = useState<{ config: Record<string, unknown> } | null>(null);
  const [partner, setPartner] = useState<{
    naam: string;
    logo_url: string | null;
    primaire_kleur: string | null;
  } | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!widgetId) { setError("Widget niet gevonden"); setLoading(false); return; }

      const { data: w, error: wErr } = await (supabase.from("web_widgets") as any)
        .select("partner_id, config, actief, type")
        .eq("id", widgetId)
        .single();

      if (wErr || !w || !w.actief) {
        setError("Widget niet beschikbaar");
        setLoading(false);
        return;
      }

      const { data: p } = await supabase
        .from("partners")
        .select("naam, logo_url, primaire_kleur")
        .eq("id", w.partner_id)
        .single();

      setWidget({ config: (w.config || {}) as Record<string, unknown> });
      setPartner(p);
      setLoading(false);
    };
    load();
  }, [widgetId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !widget || !partner) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="text-muted-foreground">{error || "Widget niet beschikbaar"}</p>
      </div>
    );
  }

  const primaryColor = partner.primaire_kleur || "#5B58E1";
  const config = widget.config;

  return (
    <div className="min-h-screen bg-white p-6 max-w-md mx-auto">
      {partner.logo_url && (
        <img src={partner.logo_url} alt={partner.naam} className="h-10 mb-6 object-contain" />
      )}

      {config.intro_tekst && (
        <p className="text-sm text-muted-foreground mb-4">{String(config.intro_tekst)}</p>
      )}

      <h2 className="text-xl font-semibold mb-4" style={{ color: primaryColor }}>
        Neem contact op
      </h2>

      <ContactForm
        widgetId={widgetId!}
        primaryColor={primaryColor}
        ctaText={config.cta_tekst ? String(config.cta_tekst) : undefined}
      />

      <p className="text-xs text-muted-foreground text-center mt-6">
        Aangedreven door {partner.naam}
      </p>
    </div>
  );
};

export default EmbedContact;
