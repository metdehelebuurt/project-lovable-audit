import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Layers, Plus, Save, Search, Trash2, Package } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/types/offerte";
import {
  useAssemblageComponenten,
  useAddComponent,
  useUpdateComponent,
  useRemoveComponent,
} from "@/hooks/producten/useAssemblages";
import AssemblageConfigurator from "@/components/producten/AssemblageConfigurator";
import ConfiguratorPreview from "@/components/producten/AssemblageConfigurator/ConfiguratorPreview";
import { CONFIGURATOR_TEMPLATES, type ConfigureerbaarType } from "@/lib/assemblage/typeTemplates";
import ProductImageUpload from "@/components/producten/ProductImageUpload";
import ProductImage from "@/components/producten/ProductImage";

type ProductRow = {
  id: string;
  naam: string;
  merk: string | null;
  categorie: string;
  artikelnummer: string | null;
  model: string | null;
  prijs_excl_btw: number | null;
  kostprijs: number | null;
  heeft_serienummer: boolean;
  afbeelding_url: string | null;
  status: string;
  is_assemblage: boolean;
  afbeeldingen?: string[] | null;
};

const CATEGORIEEN: { value: string; label: string }[] = [
  { value: "zonnepanelen", label: "Zonnepanelen" },
  { value: "omvormer", label: "Omvormer" },
  { value: "thuisbatterij", label: "Thuisbatterij" },
  { value: "laadpaal", label: "Laadpaal" },
  { value: "warmtepomp", label: "Warmtepomp" },
  { value: "installatiemateriaal", label: "Installatiemateriaal" },
  { value: "accessoires", label: "Accessoires" },
];

export default function AssemblageEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const qc = useQueryClient();
  const partnerId = profile?.partner_id;
  const isNew = !id || id === "nieuw";

  const [naam, setNaam] = useState("");
  const [merk, setMerk] = useState("");
  const [categorie, setCategorie] = useState<string>("installatiemateriaal");
  const [prijsStrategie, setPrijsStrategie] = useState<"vast" | "som_componenten">("som_componenten");
  const [prijsExclBtw, setPrijsExclBtw] = useState<string>("0");
  const [btwPercentage, setBtwPercentage] = useState<string>("21");
  const [margeOpslag, setMargeOpslag] = useState<string>("20");
  const [status, setStatus] = useState<string>("actief");
  const [omschrijving, setOmschrijving] = useState("");
  const [toonOpWebsite, setToonOpWebsite] = useState<boolean>(false);
  const [websitePitch, setWebsitePitch] = useState<string>("");
  const [websiteOmschrijving, setWebsiteOmschrijving] = useState<string>("");
  const [configureerbaarType, setConfigureerbaarType] = useState<ConfigureerbaarType>("custom");
  const [templateAttributen, setTemplateAttributen] = useState<Record<string, unknown>>({});
  const [afbeeldingUrl, setAfbeeldingUrl] = useState<string | null>(null);
  const [afbeeldingen, setAfbeeldingen] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);

  const { data: assemblage } = useQuery({
    queryKey: ["assemblage-detail", id],
    enabled: !isNew,
    queryFn: async () => {
      const { data, error } = await supabase.from("producten").select("*").eq("id", id!).single();
      if (error) throw error;
      return data as any;
    },
  });

  useEffect(() => {
    if (!assemblage) return;
    setNaam(assemblage.naam ?? "");
    setMerk(assemblage.merk ?? "");
    setCategorie(assemblage.categorie ?? "installatiemateriaal");
    setPrijsStrategie((assemblage.prijs_strategie as any) ?? "som_componenten");
    setPrijsExclBtw(String(assemblage.prijs_excl_btw ?? 0));
    setBtwPercentage(String(assemblage.btw_percentage ?? 21));
    setMargeOpslag(String(assemblage.marge_opslag_percentage ?? 20));
    setStatus(assemblage.status ?? "actief");
    setOmschrijving(assemblage.omschrijving ?? "");
    setToonOpWebsite(Boolean(assemblage.toon_op_website));
    setWebsitePitch(assemblage.website_pitch ?? "");
    setWebsiteOmschrijving(assemblage.website_omschrijving ?? "");
    setAfbeeldingUrl(assemblage.afbeelding_url ?? null);
    setAfbeeldingen(
      Array.isArray(assemblage.afbeeldingen)
        ? (assemblage.afbeeldingen as string[])
        : [],
    );
    const type = (assemblage.configureerbaar_type as ConfigureerbaarType) ?? "custom";
    setConfigureerbaarType(CONFIGURATOR_TEMPLATES[type] ? type : "custom");
    setTemplateAttributen(
      (assemblage.template_attributen as Record<string, unknown> | null) ?? {},
    );
    setDirty(false);
  }, [assemblage]);

  const markDirty = () => setDirty(true);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        naam: naam.trim(),
        merk: merk.trim() || null,
        categorie,
        prijs_strategie: prijsStrategie,
        prijs_excl_btw: Number(prijsExclBtw) || 0,
        btw_percentage: Number(btwPercentage) || 21,
        marge_opslag_percentage: Number(margeOpslag) || 0,
        status,
        omschrijving: omschrijving || null,
        toon_op_website: toonOpWebsite,
        website_pitch: websitePitch || null,
        website_omschrijving: websiteOmschrijving || null,
        afbeelding_url: afbeeldingUrl,
        afbeeldingen: afbeeldingen,
        is_assemblage: true,
        configureerbaar_type: configureerbaarType,
        template_attributen: templateAttributen,
      };
      if (isNew) {
        payload.partner_id = partnerId;
        const { data, error } = await supabase.from("producten").insert(payload).select("id").single();
        if (error) throw error;
        return data!.id as string;
      } else {
        const { error } = await supabase.from("producten").update(payload).eq("id", id!);
        if (error) throw error;
        return id!;
      }
    },
    onSuccess: (newId) => {
      toast.success(isNew ? "Assemblage aangemaakt" : "Wijzigingen opgeslagen");
      qc.invalidateQueries({ queryKey: ["assemblages"] });
      qc.invalidateQueries({ queryKey: ["assemblage-detail"] });
      setDirty(false);
      if (isNew) navigate(`/producten/assemblages/${newId}`, { replace: true });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const assemblageId = isNew ? null : id!;
  const { data: comps = [] } = useAssemblageComponenten(assemblageId);
  const add = useAddComponent(partnerId);
  const update = useUpdateComponent();
  const remove = useRemoveComponent();

  const somKostprijs = comps.reduce(
    (s, c) => s + Number(c.aantal || 0) * Number(c.component?.kostprijs || 0),
    0,
  );
  const verkoop =
    prijsStrategie === "som_componenten"
      ? somKostprijs * (1 + (Number(margeOpslag) || 0) / 100)
      : Number(prijsExclBtw) || 0;
  const marge = verkoop > 0 ? ((verkoop - somKostprijs) / verkoop) * 100 : 0;
  const margeKleur = marge >= 20 ? "text-success" : marge >= 10 ? "text-warning-foreground" : "text-error";

  const excludeIds = useMemo(
    () => [assemblageId, ...comps.map((c) => c.component_id)].filter(Boolean) as string[],
    [assemblageId, comps],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/producten/assemblages")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Layers className="h-6 w-6 text-primary" />
              {isNew ? "Nieuwe samengestelde product" : naam || "Samengesteld product"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Bundel meerdere producten tot één artikel dat je in offertes en facturen als één regel gebruikt.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && dirty && <Badge variant="outline">Niet-opgeslagen wijzigingen</Badge>}
          <Button
            className="rounded-pill"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !naam.trim()}
          >
            <Save className="h-4 w-4 mr-2" />
            {isNew ? "Aanmaken" : "Opslaan"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Basisgegevens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label>Naam bundel *</Label>
                <Input
                  value={naam}
                  onChange={(e) => {
                    setNaam(e.target.value);
                    markDirty();
                  }}
                  placeholder="Bijv. Standaardpakket 8 panelen + omvormer"
                />
              </div>
              <div>
                <Label>Merk / label</Label>
                <Input value={merk} onChange={(e) => { setMerk(e.target.value); markDirty(); }} />
              </div>
              <div>
                <Label>Categorie</Label>
                <Select value={categorie} onValueChange={(v) => { setCategorie(v); markDirty(); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIEEN.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => { setStatus(v); markDirty(); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="actief">Actief</SelectItem>
                    <SelectItem value="concept">Concept</SelectItem>
                    <SelectItem value="gearchiveerd">Gearchiveerd</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prijsstrategie</Label>
                <Select value={prijsStrategie} onValueChange={(v: any) => { setPrijsStrategie(v); markDirty(); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="som_componenten">Som van componenten + marge %</SelectItem>
                    <SelectItem value="vast">Vaste verkoopprijs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {prijsStrategie === "vast" ? (
                <div>
                  <Label>Verkoopprijs (excl. btw)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={prijsExclBtw}
                    onChange={(e) => { setPrijsExclBtw(e.target.value); markDirty(); }}
                  />
                </div>
              ) : (
                <div>
                  <Label>Marge-opslag (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={margeOpslag}
                    onChange={(e) => { setMargeOpslag(e.target.value); markDirty(); }}
                  />
                </div>
              )}
              <div>
                <Label>Btw %</Label>
                <Input
                  type="number"
                  step="1"
                  value={btwPercentage}
                  onChange={(e) => { setBtwPercentage(e.target.value); markDirty(); }}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Omschrijving (voor offerte)</Label>
                <Textarea
                  value={omschrijving}
                  onChange={(e) => { setOmschrijving(e.target.value); markDirty(); }}
                  rows={3}
                />
              </div>
              <div className="md:col-span-2 flex items-center justify-between gap-4 rounded-lg border p-3">
                <div>
                  <Label>Toon op website / publieke API</Label>
                  <p className="text-xs text-muted-foreground">
                    Zet aan om deze configurator publiek beschikbaar te maken via de assemblage-config API. Vereist status "Actief".
                  </p>
                </div>
                <Switch
                  checked={toonOpWebsite}
                  onCheckedChange={(v) => { setToonOpWebsite(v); markDirty(); }}
                />
              </div>
              {toonOpWebsite && (
                <>
                  <div className="md:col-span-2">
                    <Label>Website pitch (korte tagline)</Label>
                    <Input
                      value={websitePitch}
                      onChange={(e) => { setWebsitePitch(e.target.value); markDirty(); }}
                      placeholder="Bijv. Complete thuisbatterij-set, plug & play geïnstalleerd"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Website omschrijving (uitgebreid)</Label>
                    <Textarea
                      value={websiteOmschrijving}
                      onChange={(e) => { setWebsiteOmschrijving(e.target.value); markDirty(); }}
                      rows={4}
                      placeholder="Verkoopverhaal voor de klantwebsite / configurator."
                    />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Prijsopbouw</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Aantal componenten</span>
              <strong>{comps.length}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kostprijs (som)</span>
              <strong>{formatCurrency(somKostprijs)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Verkoopprijs</span>
              <strong>{formatCurrency(verkoop)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Marge</span>
              <strong className={margeKleur}>{marge.toFixed(1)}%</strong>
            </div>
          </CardContent>
        </Card>
      </div>

      <AssemblageConfigurator
        assemblageId={assemblageId}
        partnerId={partnerId}
        configureerbaarType={configureerbaarType}
        templateAttributen={templateAttributen}
        onTypeChange={(t) => { setConfigureerbaarType(t); markDirty(); }}
        onAttributenChange={(a) => { setTemplateAttributen(a); markDirty(); }}
      />

      <ConfiguratorPreview assemblageId={assemblageId} dirty={dirty} />

      {!isNew && (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Productafbeeldingen</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductImageUpload
              productId={assemblageId!}
              mainImage={afbeeldingUrl}
              galleryImages={afbeeldingen}
              merk={merk || null}
              naam={naam}
              onMainImageChange={(url) => { setAfbeeldingUrl(url); markDirty(); }}
              onGalleryChange={(urls) => { setAfbeeldingen(urls); markDirty(); }}
            />
            <p className="text-xs text-muted-foreground mt-3">
              Tip: bij het toevoegen van componenten uit de catalogus vragen we of hun afbeeldingen
              hier ook automatisch bij mogen komen.
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-lg">Componenten</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isNew ? (
            <div className="text-center py-8 border border-dashed rounded-xl">
              <Package className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Sla eerst de bundel op om componenten toe te voegen.
              </p>
            </div>
          ) : (
            <>
              {comps.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Nog geen componenten. Zoek hieronder producten en klik ze aan om ze toe te voegen.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="w-24">Aantal</TableHead>
                      <TableHead>Kostprijs</TableHead>
                      <TableHead>Regel-kostprijs</TableHead>
                      <TableHead>SN?</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comps.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <div className="font-medium">{c.component?.naam}</div>
                          {c.component?.merk && (
                            <div className="text-xs text-muted-foreground">{c.component.merk}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="1"
                            min="1"
                            value={c.aantal}
                            onChange={(e) =>
                              update.mutate({
                                id: c.id,
                                aantal: parseFloat(e.target.value) || 1,
                                assemblage_id: assemblageId!,
                              })
                            }
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>{formatCurrency(Number(c.component?.kostprijs ?? 0))}</TableCell>
                        <TableCell>
                          {formatCurrency(Number(c.aantal) * Number(c.component?.kostprijs ?? 0))}
                        </TableCell>
                        <TableCell>
                          {c.component?.heeft_serienummer ? <Badge variant="outline">SN</Badge> : "—"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => remove.mutate({ id: c.id, assemblage_id: assemblageId! })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              <InlineProductPicker
                partnerId={partnerId}
                excludeIds={excludeIds}
                onPick={(product) => {
                  add.mutate({ assemblage_id: assemblageId!, component_id: product.id, aantal: 1 });
                  const gallery = Array.isArray(product.afbeeldingen) ? product.afbeeldingen : [];
                  const beschikbaar = [product.afbeelding_url, ...gallery].filter(
                    (u): u is string => !!u,
                  );
                  if (beschikbaar.length === 0) return;
                  const alBekend = new Set([afbeeldingUrl, ...afbeeldingen].filter(Boolean));
                  const nieuw = beschikbaar.filter((u) => !alBekend.has(u));
                  if (nieuw.length === 0) return;
                  const vraag = `"${product.naam}" heeft ${nieuw.length} afbeelding${nieuw.length === 1 ? "" : "en"}. Ook meenemen als productafbeelding van dit samengestelde product?`;
                  if (!window.confirm(vraag)) return;
                  const nieuweMain = afbeeldingUrl ?? nieuw[0];
                  const nieuweGallery = Array.from(
                    new Set([...afbeeldingen, ...nieuw.filter((u) => u !== nieuweMain)]),
                  );
                  setAfbeeldingUrl(nieuweMain);
                  setAfbeeldingen(nieuweGallery);
                  supabase
                    .from("producten")
                    .update({ afbeelding_url: nieuweMain, afbeeldingen: nieuweGallery })
                    .eq("id", assemblageId!)
                    .then(({ error }) => {
                      if (error) toast.error(error.message);
                      else {
                        toast.success("Afbeeldingen overgenomen");
                        qc.invalidateQueries({ queryKey: ["assemblage-detail"] });
                      }
                    });
                }}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InlineProductPicker({
  partnerId,
  excludeIds,
  onPick,
}: {
  partnerId?: string | null;
  excludeIds: string[];
  onPick: (id: string) => void;
}) {
  const [zoek, setZoek] = useState("");
  const [cat, setCat] = useState<string>("alle");

  const { data: producten = [], isLoading } = useQuery({
    queryKey: ["producten-picker-all", partnerId],
    enabled: !!partnerId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("producten")
        .select("id, naam, merk, categorie, artikelnummer, model, prijs_excl_btw, kostprijs, heeft_serienummer, afbeelding_url, status, is_assemblage")
        .eq("partner_id", partnerId!)
        .order("naam")
        .limit(2000);
      if (error) throw error;
      return (data || []) as ProductRow[];
    },
  });

  const filtered = useMemo(() => {
    const q = zoek.trim().toLowerCase();
    return producten
      .filter((p) => !p.is_assemblage)
      .filter((p) => !excludeIds.includes(p.id))
      .filter((p) => cat === "alle" || p.categorie === cat)
      .filter((p) => {
        if (!q) return true;
        return (
          p.naam?.toLowerCase().includes(q) ||
          (p.merk ?? "").toLowerCase().includes(q) ||
          (p.model ?? "").toLowerCase().includes(q) ||
          (p.artikelnummer ?? "").toLowerCase().includes(q) ||
          (p.categorie ?? "").toLowerCase().includes(q)
        );
      })
      .slice(0, 100);
  }, [producten, zoek, cat, excludeIds]);

  return (
    <div className="border rounded-xl p-4 space-y-3 bg-muted/20">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4 text-primary" />
          <span className="font-medium">Component toevoegen uit catalogus</span>
        </div>
        <div className="text-xs text-muted-foreground">
          {isLoading ? "Producten laden..." : `${producten.length} producten in catalogus`}
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Zoek op naam, merk, artikelnummer, model…"
            value={zoek}
            onChange={(e) => setZoek(e.target.value)}
          />
        </div>
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle categorieën</SelectItem>
            {CATEGORIEEN.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="max-h-96 overflow-y-auto divide-y rounded-lg border bg-background">
        {filtered.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground text-center">
            {producten.length === 0
              ? "Geen producten in de catalogus. Voeg eerst producten toe onder Producten."
              : "Geen producten gevonden voor deze zoekopdracht."}
          </p>
        ) : (
          filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-muted/60 flex justify-between items-center gap-3"
              onClick={() => onPick(p.id)}
            >
              <div className="flex items-center gap-3 min-w-0">
                {p.afbeelding_url ? (
                  <img src={p.afbeelding_url} alt="" className="w-10 h-10 rounded object-cover border" loading="lazy" />
                ) : (
                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-medium truncate">{p.naam}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {[p.merk, p.model, p.artikelnummer, p.categorie].filter(Boolean).join(" · ")}
                  </div>
                </div>
              </div>
              <div className="text-sm text-right shrink-0">
                <div>{p.prijs_excl_btw != null ? formatCurrency(Number(p.prijs_excl_btw)) : "—"}</div>
                <div className="text-xs text-muted-foreground">
                  kostprijs {p.kostprijs != null ? formatCurrency(Number(p.kostprijs)) : "—"}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}