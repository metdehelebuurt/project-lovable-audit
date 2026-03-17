import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ContactForm } from "@/components/webtools/ContactForm";
import { ZonnepanelenCalc } from "@/components/webtools/calculators/ZonnepanelenCalc";
import { WarmtepompCalc } from "@/components/webtools/calculators/WarmtepompCalc";
import { IsolatieCalc } from "@/components/webtools/calculators/IsolatieCalc";
import { LaadpaalCalc } from "@/components/webtools/calculators/LaadpaalCalc";
import { ThuisbatterijCalc } from "@/components/webtools/calculators/ThuisbatterijCalc";
import { Loader2 } from "lucide-react";

const calcMap: Record<string, React.ComponentType<{ primaryColor: string; onComplete: (r: Record<string, unknown>) => void }>> = {
  calculator_zonnepanelen: ZonnepanelenCalc,
  calculator_warmtepomp: WarmtepompCalc,
  calculator_isolatie: IsolatieCalc,
  calculator_laadpaal: LaadpaalCalc,
  calculator_thuisbatterij: ThuisbatterijCalc,
};

const EmbedCalculator = () => {
  const { widgetId } = useParams<{ widgetId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [widgetType, setWidgetType] = useState("");
  const [config, setConfig] = useState<Record<string, unknown>>({});
  const [partner, setPartner] = useState<{
    naam: string;
    logo_url: string | null;
    primaire_kleur: string | null;
  } | null>(null);
  const [calcResult, setCalcResult] = useState<Record<string, unknown> | null>(null);

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
        .from("partner_branding" as any)
        .select("naam, logo_url, primaire_kleur")
        .eq("id", w.partner_id)
        .single() as { data: { naam: string; logo_url: string; primaire_kleur: string } | null };

      setWidgetType(w.type);
      setConfig((w.config || {}) as Record<string, unknown>);
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

  if (error || !partner) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="text-muted-foreground">{error || "Widget niet beschikbaar"}</p>
      </div>
    );
  }

  const primaryColor = partner.primaire_kleur || "#5B58E1";
  const CalcComponent = calcMap[widgetType];

  if (!CalcComponent) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="text-muted-foreground">Onbekend calculator type</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6 max-w-md mx-auto">
      {partner.logo_url && (
        <img src={partner.logo_url} alt={partner.naam} className="h-10 mb-6 object-contain" />
      )}

      {config.intro_tekst && (
        <p className="text-sm text-muted-foreground mb-4">{String(config.intro_tekst)}</p>
      )}

      {!calcResult ? (
        <CalcComponent primaryColor={primaryColor} onComplete={setCalcResult} />
      ) : (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold" style={{ color: primaryColor }}>
              Vraag een vrijblijvende offerte aan
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Op basis van uw berekening nemen wij graag contact met u op.
            </p>
          </div>
          <ContactForm
            widgetId={widgetId!}
            primaryColor={primaryColor}
            ctaText={config.cta_tekst ? String(config.cta_tekst) : "Offerte aanvragen"}
            calculatorResultaat={calcResult}
          />
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center mt-6">
        Aangedreven door {partner.naam}
      </p>
    </div>
  );
};

export default EmbedCalculator;
