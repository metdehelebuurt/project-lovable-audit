import { useState, useMemo } from "react";
import { AffiliateSubnav } from "@/components/affiliate/AffiliateSubnav";
import { useAffiliateEmailTemplates } from "@/hooks/affiliate/useAffiliateEmailTemplates";
import { AFFILIATE_TEMPLATES, CATEGORIE_LABELS, type AffiliateTemplateCategorie, type AffiliateTemplate } from "@/lib/affiliateTemplates/registry";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TemplateKaart } from "./TemplateKaart";
import { TemplateEditor } from "./TemplateEditor";
import { useDocumentSeo } from "@/lib/seo/useDocumentSeo";

const CATS: AffiliateTemplateCategorie[] = ["leads", "afspraken", "demo-trial", "offerte", "opvolging", "klant"];

export default function MailtemplatesPage() {
  useDocumentSeo({ title: "E-mailtemplates — Instellingen" });
  const { data: aangepast } = useAffiliateEmailTemplates();
  const [openKey, setOpenKey] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const out: Record<AffiliateTemplateCategorie, AffiliateTemplate[]> = {
      leads: [], afspraken: [], "demo-trial": [], offerte: [], opvolging: [], klant: [],
    };
    for (const t of AFFILIATE_TEMPLATES) out[t.categorie].push(t);
    return out;
  }, []);

  const huidigeTemplate = openKey ? AFFILIATE_TEMPLATES.find((t) => t.key === openKey) ?? null : null;

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <AffiliateSubnav />
      <header className="mb-6">
        <h1 className="text-2xl font-bold">E-mailtemplates</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Pas de e-mails aan die je verstuurt naar leads en klanten. Templates die je niet wijzigt, gebruiken de standaardtekst in mijnhuis.nu huisstijl.
        </p>
      </header>

      <Tabs defaultValue="leads">
        <TabsList className="flex flex-wrap h-auto">
          {CATS.map((c) => (
            <TabsTrigger key={c} value={c}>
              {CATEGORIE_LABELS[c]} <span className="ml-1.5 text-xs text-muted-foreground">({grouped[c].length})</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {CATS.map((c) => (
          <TabsContent key={c} value={c} className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {grouped[c].map((t) => (
                <TemplateKaart
                  key={t.key}
                  template={t}
                  aangepast={!!aangepast?.[t.key]}
                  onOpen={() => setOpenKey(t.key)}
                />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {huidigeTemplate && (
        <TemplateEditor
          template={huidigeTemplate}
          row={aangepast?.[huidigeTemplate.key] ?? null}
          open={!!openKey}
          onClose={() => setOpenKey(null)}
        />
      )}
    </div>
  );
}
