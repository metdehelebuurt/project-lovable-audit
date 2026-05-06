import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { renderTemplate, type TemplateRenderData } from "./renderTemplate";
import type { EmailTemplateKey } from "./emailTemplateKeys";

/** Fallback-defaults — synced met supabase/functions/_shared/render-template.ts */
const FALLBACK: Record<EmailTemplateKey, { onderwerp: string; body_html: string }> = {
  offerte_nieuw: {
    onderwerp: "Uw offerte {{document.nummer}} van {{partner.naam}}",
    body_html: `<p>Beste {{klant.voornaam}},</p>
<p>Hierbij ontvangt u onze offerte met nummer <strong>{{document.nummer}}</strong>. De volledige specificatie vindt u in de bijlage.</p>
<p>U kunt de offerte ook online bekijken en digitaal accepteren via onderstaande link:</p>
<p><a href="{{document.url}}">Bekijk en accepteer offerte</a></p>
<p>Heeft u vragen? Reageer gerust op deze e-mail.</p>
<p>Met vriendelijke groet,<br/>{{partner.afzender}}</p>`,
  },
  offerte_herinnering: {
    onderwerp: "Herinnering: offerte {{document.nummer}}",
    body_html: `<p>Beste {{klant.voornaam}},</p>
<p>Wij willen u graag herinneren aan onze offerte <strong>{{document.nummer}}</strong>.</p>
<p>U kunt de offerte hier bekijken: <a href="{{document.url}}">{{document.url}}</a></p>
<p>Met vriendelijke groet,<br/>{{partner.afzender}}</p>`,
  },
  factuur_nieuw: {
    onderwerp: "Factuur {{document.nummer}} van {{partner.naam}}",
    body_html: `<p>Beste {{klant.voornaam}},</p>
<p>In de bijlage vindt u factuur <strong>{{document.nummer}}</strong> ten bedrage van {{document.totaal}}.</p>
<p>Wij verzoeken u vriendelijk de factuur binnen de gestelde termijn te voldoen.</p>
<p>Met vriendelijke groet,<br/>{{partner.afzender}}</p>`,
  },
  factuur_herinnering: {
    onderwerp: "Herinnering factuur {{document.nummer}}",
    body_html: `<p>Beste {{klant.voornaam}},</p>
<p>Onze administratie geeft aan dat factuur <strong>{{document.nummer}}</strong> nog openstaat. Mocht u de betaling al hebben verricht, dan kunt u deze e-mail als niet verzonden beschouwen.</p>
<p>Met vriendelijke groet,<br/>{{partner.afzender}}</p>`,
  },
  orderbevestiging: {
    onderwerp: "Orderbevestiging — {{partner.naam}}",
    body_html: `<p>Beste {{klant.voornaam}},</p>
<p>Hartelijk dank voor uw opdracht. In de bijlage vindt u onze orderbevestiging met de afgesproken specificatie.</p>
<p>Wij nemen contact met u op voor de inplanning van de werkzaamheden.</p>
<p>Met vriendelijke groet,<br/>{{partner.afzender}}</p>`,
  },
  oplevering_klaar: {
    onderwerp: "Opleverdocument {{document.nummer}}",
    body_html: `<p>Beste {{klant.voornaam}},</p>
<p>De installatie is succesvol opgeleverd. In de bijlage vindt u het opleverdocument met alle relevante gegevens.</p>
<p>Met vriendelijke groet,<br/>{{partner.afzender}}</p>`,
  },
};

export interface ResolvedTemplate {
  onderwerp: string;
  body_html: string;
  bijlage_default: boolean;
  source: "partner" | "default";
}

/**
 * Haal de actieve template op voor de huidige partner + sleutel.
 * Valt terug op ingebouwde defaults als de partner geen eigen template heeft.
 */
export function useEmailTemplate(
  partnerId: string | undefined,
  sleutel: EmailTemplateKey,
) {
  return useQuery<ResolvedTemplate>({
    queryKey: ["email-template", partnerId, sleutel],
    enabled: !!partnerId,
    queryFn: async () => {
      const { data } = await supabase
        .from("email_templates")
        .select("onderwerp, html_body, bijlage_default")
        .eq("partner_id", partnerId!)
        .eq("sleutel", sleutel)
        .maybeSingle();
      if (data) {
        return {
          onderwerp: data.onderwerp,
          body_html: data.html_body,
          bijlage_default: data.bijlage_default ?? true,
          source: "partner",
        };
      }
      return {
        ...FALLBACK[sleutel],
        bijlage_default: true,
        source: "default",
      };
    },
  });
}

/** Render onderwerp + body met template-data. */
export function applyTemplateData(
  tpl: ResolvedTemplate,
  data: TemplateRenderData,
) {
  return {
    onderwerp: renderTemplate(tpl.onderwerp, data),
    body_html: renderTemplate(tpl.body_html, data),
    bijlage_default: tpl.bijlage_default,
  };
}
