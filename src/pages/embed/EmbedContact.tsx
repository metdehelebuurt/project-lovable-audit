import { useEffect, useRef, useState } from "react";
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
  const containerRef = useRef<HTMLDivElement>(null);

  // Maak embed transparant zodat de host-achtergrond doorschijnt en het naadloos oogt.
  useEffect(() => {
    const prevHtml = document.documentElement.style.background;
    const prevBody = document.body.style.background;
    document.documentElement.style.background = "transparent";
    document.body.style.background = "transparent";
    return () => {
      document.documentElement.style.background = prevHtml;
      document.body.style.background = prevBody;
    };
  }, []);

  // Stuur hoogte naar parent zodat een luisterende iframe automatisch kan meeschalen.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const post = () => {
      const height = el.scrollHeight;
      window.parent?.postMessage({ type: "mijnhuis:embed:height", widgetId, height }, "*");
    };
    const ro = new ResizeObserver(post);
    ro.observe(el);
    post();
    return () => ro.disconnect();
  }, [widgetId, loading]);

  useEffect(() => {
    const load = async () => {
      if (!widgetId) { setError("Widget niet gevonden"); setLoading(false); return; }

      const { data: w, error: wErr } = await (supabase.from("web_widgets_public") as any)
        .select("partner_id, config, actief, type")
        .eq("id", widgetId)
        .single();

      if (wErr || !w || !w.actief) {
        setError("Widget niet beschikbaar");
        setLoading(false);
        return;
      }

      const { data: p } = await supabase
        .from("partner_branding" as any)
        .select("naam, logo_url, primaire_kleur")
        .eq("id", w.partner_id)
        .single() as { data: { naam: string; logo_url: string; primaire_kleur: string } | null };

      setWidget({ config: (w.config || {}) as Record<string, unknown> });
      setPartner(p);
      setLoading(false);
    };
    load();
  }, [widgetId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !widget || !partner) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-muted-foreground">{error || "Widget niet beschikbaar"}</p>
      </div>
    );
  }

  const primaryColor = partner.primaire_kleur || "#5B58E1";
  const config = widget.config;

  return (
    <div ref={containerRef} className="w-full px-1 py-2">
      {config.intro_tekst ? (
        <p className="mb-4 text-sm text-muted-foreground">{String(config.intro_tekst)}</p>
      ) : null}

      <ContactForm
        widgetId={widgetId!}
        primaryColor={primaryColor}
        ctaText={config.cta_tekst ? String(config.cta_tekst) : undefined}
      />
    </div>
  );
};

export default EmbedContact;
