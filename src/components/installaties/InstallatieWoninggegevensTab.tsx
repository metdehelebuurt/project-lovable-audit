import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertTriangle,
  Battery,
  Building2,
  ClipboardCheck,
  ExternalLink,
  Home,
  Link2,
  Loader2,
  MapPin,
  Plug,
  Sun,
  Thermometer,
  Zap,
} from "lucide-react";
import { useInstallatieSchouw } from "@/hooks/installaties/useInstallatieSchouw";
import type { Installatie } from "./api/installatieApi";

interface Props {
  installatie: Installatie;
}

type Categorie = "zonnepanelen" | "batterij" | "laadpaal" | "warmtepomp" | "overig";

function getString(o: unknown, key: string): string | null {
  if (o && typeof o === "object" && key in o) {
    const v = (o as Record<string, unknown>)[key];
    if (typeof v === "string" && v.trim()) return v;
    if (typeof v === "number") return String(v);
  }
  return null;
}

function getObj(o: unknown, key: string): Record<string, unknown> | null {
  if (o && typeof o === "object" && key in o) {
    const v = (o as Record<string, unknown>)[key];
    if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
  }
  return null;
}

function getArr<T = unknown>(o: unknown, key: string): T[] {
  if (o && typeof o === "object" && key in o) {
    const v = (o as Record<string, unknown>)[key];
    if (Array.isArray(v)) return v as T[];
  }
  return [];
}

function detecteerCategorieen(installatie: Installatie): Set<Categorie> {
  const set = new Set<Categorie>();
  const producten = (installatie.producten as Array<Record<string, unknown>> | undefined) ?? [];
  const haystack = producten
    .map((p) => `${p.categorie ?? ""} ${p.omschrijving ?? p.naam ?? ""}`.toLowerCase())
    .join(" ");
  if (/zonnepan|pv|panel|omvormer|optimizer/.test(haystack)) set.add("zonnepanelen");
  if (/batter|accu|powerwall|opslag/.test(haystack)) set.add("batterij");
  if (/laadpaal|wallbox|laadpunt|ev[- ]?charger/.test(haystack)) set.add("laadpaal");
  if (/warmtepomp|hybride|cv-pomp|airco/.test(haystack)) set.add("warmtepomp");
  if (set.size === 0) set.add("overig");
  return set;
}

const InstallatieWoninggegevensTab = ({ installatie }: Props) => {
  const { data, isLoading } = useInstallatieSchouw(installatie);
  const schouw = data?.schouw ?? null;
  const bron = data?.bron ?? "geen";
  const categorieen = useMemo(() => detecteerCategorieen(installatie), [installatie]);

  const adres = installatie.adres ?? "";
  const postcode = installatie.postcode ?? "";
  const plaats = installatie.plaats ?? "";

  const gegevens = schouw ? getObj(schouw, "gegevens") : null;
  const woning = gegevens ? getObj(gegevens, "woning") : null;
  const meterkast = gegevens ? getObj(gegevens, "meterkast") ?? getObj(gegevens, "elektra") : null;
  const aandacht = schouw ? getString(schouw, "aandachtspunten") : null;
  const schouwId = schouw ? getString(schouw, "id") : null;
  const schouwNummer = schouw ? getString(schouw, "schouw_nummer") : null;

  const zonnepanelen = gegevens ? getObj(gegevens, "zonnepanelen") : null;
  const clusters = zonnepanelen ? getArr<Record<string, unknown>>(zonnepanelen, "clusters") : [];
  const totaalPanelen = clusters.reduce((s, c) => s + (Number(c.aantal_panelen) || 0), 0);
  const batterij = gegevens ? getObj(gegevens, "batterij") ?? getObj(gegevens, "thuisbatterij") : null;
  const laadpaal = gegevens ? getObj(gegevens, "laadpaal") : null;
  const warmtepomp = gegevens ? getObj(gegevens, "warmtepomp") : null;

  const fotos = schouw
    ? getArr<{ url?: string; type?: string; notitie?: string; categorie?: string }>(schouw, "fotos")
        .filter((f) => f.url && (f.type ?? "image").startsWith("image"))
    : [];

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <Home className="h-4 w-4 text-primary" /> Woning
          </CardTitle>
          <div className="flex flex-wrap gap-1.5">
            {Array.from(categorieen).map((c) => (
              <Badge key={c} variant="secondary" className="capitalize">
                {c}
              </Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent className="text-sm space-y-3">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">{adres || "Geen adres bekend"}</p>
              <p className="text-muted-foreground">{[postcode, plaats].filter(Boolean).join(" ")}</p>
            </div>
          </div>
          {woning && Object.keys(woning).length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> Woningkenmerken
              </p>
              <KeyValGrid data={woning} />
            </div>
          )}
        </CardContent>
      </Card>

      {isLoading && (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="py-6 flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Schouwgegevens laden…
          </CardContent>
        </Card>
      )}

      {!isLoading && !schouw && (
        <Alert>
          <Link2 className="h-4 w-4" />
          <AlertTitle>Geen schouw gekoppeld</AlertTitle>
          <AlertDescription>
            Koppel een schouw op de overzichts-tab om hier alle technische woninggegevens, foto's en aandachtspunten te
            tonen.
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && schouw && (
        <>
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-primary" /> Bron: schouw {schouwNummer ?? ""}
              </CardTitle>
              <div className="flex items-center gap-2">
                {bron === "voorstel" && <Badge variant="secondary">Voorstel via lead</Badge>}
                {bron === "opdracht" && <Badge variant="secondary">Via opdracht</Badge>}
                {bron === "direct" && <Badge variant="outline">Direct gekoppeld</Badge>}
                {schouwId && (
                  <Button variant="outline" size="sm" asChild className="gap-1.5">
                    <Link to={`/schouwen/${schouwId}`}>
                      <ExternalLink className="h-3.5 w-3.5" /> Open schouw
                    </Link>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="text-sm space-y-4">
              {aandacht && (
                <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2">
                  <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-warning">Aandachtspunten</p>
                    <p className="whitespace-pre-line text-foreground">{aandacht}</p>
                  </div>
                </div>
              )}
              {meterkast && Object.keys(meterkast).length > 0 && (
                <CategorieBlok icon={<Zap className="h-4 w-4 text-primary" />} titel="Meterkast & elektra">
                  <KeyValGrid data={meterkast} />
                </CategorieBlok>
              )}
            </CardContent>
          </Card>

          {categorieen.has("zonnepanelen") && (
            <CategorieKaart icon={<Sun className="h-4 w-4 text-primary" />} titel={`Zonnepanelen${totaalPanelen ? ` — ${totaalPanelen} panelen` : ""}`}>
              {clusters.length > 0 ? (
                <div className="space-y-2">
                  {clusters.map((c, idx) => {
                    const orient = (c.oriëntatie as string) ?? (c.orientatie as string) ?? "—";
                    const hoek = c.hellingshoek != null ? `${c.hellingshoek}°` : "—";
                    const dak = c.dakvlak ? ` · ${c.dakvlak}` : "";
                    return (
                      <div key={idx} className="rounded-lg border bg-muted/30 px-3 py-2">
                        <p className="font-medium">
                          Dakvlak {idx + 1}: {String(c.aantal_panelen ?? "?")} panelen — {orient}, {hoek}
                          {dak}
                        </p>
                        {c.notitie ? <p className="text-xs italic text-muted-foreground">{String(c.notitie)}</p> : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <LegeMelding>Geen daksamenstelling vastgelegd in de schouw.</LegeMelding>
              )}
            </CategorieKaart>
          )}

          {categorieen.has("batterij") && (
            <CategorieKaart icon={<Battery className="h-4 w-4 text-primary" />} titel="Thuisbatterij">
              {batterij && Object.keys(batterij).length > 0 ? (
                <KeyValGrid data={batterij} />
              ) : (
                <LegeMelding>Geen batterij-specificaties in de schouw.</LegeMelding>
              )}
            </CategorieKaart>
          )}

          {categorieen.has("laadpaal") && (
            <CategorieKaart icon={<Plug className="h-4 w-4 text-primary" />} titel="Laadpaal">
              {laadpaal && Object.keys(laadpaal).length > 0 ? (
                <KeyValGrid data={laadpaal} />
              ) : (
                <LegeMelding>Geen laadpaal-gegevens in de schouw.</LegeMelding>
              )}
            </CategorieKaart>
          )}

          {categorieen.has("warmtepomp") && (
            <CategorieKaart icon={<Thermometer className="h-4 w-4 text-primary" />} titel="Warmtepomp">
              {warmtepomp && Object.keys(warmtepomp).length > 0 ? (
                <KeyValGrid data={warmtepomp} />
              ) : (
                <LegeMelding>Geen warmtepomp-gegevens in de schouw.</LegeMelding>
              )}
            </CategorieKaart>
          )}

          {fotos.length > 0 && (
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Foto's uit schouw ({fotos.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {fotos.map((f, idx) => (
                    <a
                      key={idx}
                      href={f.url}
                      target="_blank"
                      rel="noreferrer"
                      className="aspect-square overflow-hidden rounded-lg border bg-muted hover:opacity-80 transition"
                      aria-label={`Schouwfoto ${idx + 1} openen`}
                    >
                      <img
                        src={f.url}
                        alt={f.notitie ?? `Schouwfoto ${idx + 1}`}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

const CategorieKaart = ({
  icon,
  titel,
  children,
}: {
  icon: React.ReactNode;
  titel: string;
  children: React.ReactNode;
}) => (
  <Card className="rounded-2xl border-0 shadow-sm">
    <CardHeader>
      <CardTitle className="text-base flex items-center gap-2">
        {icon} {titel}
      </CardTitle>
    </CardHeader>
    <CardContent className="text-sm">{children}</CardContent>
  </Card>
);

const CategorieBlok = ({
  icon,
  titel,
  children,
}: {
  icon: React.ReactNode;
  titel: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {icon} {titel}
    </p>
    <div className="pl-5">{children}</div>
  </div>
);

const LegeMelding = ({ children }: { children: React.ReactNode }) => (
  <p className="text-muted-foreground italic text-sm">{children}</p>
);

const KeyValGrid = ({ data }: { data: Record<string, unknown> }) => {
  const entries = Object.entries(data).filter(
    ([, v]) => v != null && v !== "" && (typeof v !== "object" || (Array.isArray(v) && v.length > 0)),
  );
  if (entries.length === 0) return <LegeMelding>Geen details vastgelegd</LegeMelding>;
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
      {entries.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-3 border-b border-border/50 pb-1">
          <dt className="text-muted-foreground capitalize">{k.replace(/_/g, " ")}</dt>
          <dd className="text-foreground font-medium text-right">
            {Array.isArray(v) ? v.join(", ") : String(v)}
          </dd>
        </div>
      ))}
    </dl>
  );
};

export default InstallatieWoninggegevensTab;