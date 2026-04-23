import { Sun, Battery, Plug, Thermometer, Zap, AlertTriangle } from "lucide-react";

interface Props {
  schouw: Record<string, unknown>;
  fotoLimit?: number;
  onFotoClick?: (idx: number) => void;
  compact?: boolean;
}

interface Cluster {
  aantal_panelen?: number;
  oriëntatie?: string;
  orientatie?: string;
  hellingshoek?: number;
  dakvlak?: string;
  notitie?: string;
}

function getString(o: unknown, key: string): string | undefined {
  if (o && typeof o === "object" && key in o) {
    const v = (o as Record<string, unknown>)[key];
    if (typeof v === "string" && v.trim()) return v;
    if (typeof v === "number") return String(v);
  }
  return undefined;
}

function getObj(o: unknown, key: string): Record<string, unknown> | undefined {
  if (o && typeof o === "object" && key in o) {
    const v = (o as Record<string, unknown>)[key];
    if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
  }
  return undefined;
}

function getArr<T = unknown>(o: unknown, key: string): T[] {
  if (o && typeof o === "object" && key in o) {
    const v = (o as Record<string, unknown>)[key];
    if (Array.isArray(v)) return v as T[];
  }
  return [];
}

const SchouwSamenvatting = ({ schouw, fotoLimit = 4, onFotoClick, compact }: Props) => {
  const gegevens = getObj(schouw, "gegevens") ?? {};
  const aandacht = getString(schouw, "aandachtspunten");
  const fotos = getArr<{ url?: string; type?: string; notitie?: string }>(schouw, "fotos");

  const zonnepanelen = getObj(gegevens, "zonnepanelen");
  const clusters = zonnepanelen ? getArr<Cluster>(zonnepanelen, "clusters") : [];
  const totaalPanelen = clusters.reduce((s, c) => s + (Number(c.aantal_panelen) || 0), 0);

  const batterij = getObj(gegevens, "batterij") ?? getObj(gegevens, "thuisbatterij");
  const laadpaal = getObj(gegevens, "laadpaal");
  const warmtepomp = getObj(gegevens, "warmtepomp");
  const meterkast = getObj(gegevens, "meterkast") ?? getObj(gegevens, "elektra");

  const fotoBeelden = fotos.filter((f) => f.url && (f.type ?? "image").startsWith("image")).slice(0, fotoLimit);

  return (
    <div className={compact ? "space-y-3 text-sm" : "space-y-4 text-sm"}>
      {aandacht && (
        <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2">
          <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-warning">Aandachtspunten</p>
            <p className="whitespace-pre-line text-foreground">{aandacht}</p>
          </div>
        </div>
      )}

      {clusters.length > 0 && (
        <Sectie icon={<Sun className="h-4 w-4 text-primary" />} titel={`Zonnepanelen (${totaalPanelen})`}>
          <ul className="space-y-1">
            {clusters.map((c, idx) => {
              const orient = c.oriëntatie ?? c.orientatie ?? "—";
              const hoek = c.hellingshoek != null ? `${c.hellingshoek}°` : "—";
              const dak = c.dakvlak ? ` · ${c.dakvlak}` : "";
              return (
                <li key={idx} className="text-muted-foreground">
                  <span className="text-foreground font-medium">{c.aantal_panelen ?? "?"}</span> panelen — {orient}, {hoek}{dak}
                  {c.notitie && <span className="block text-xs italic"> {c.notitie}</span>}
                </li>
              );
            })}
          </ul>
        </Sectie>
      )}

      {batterij && Object.keys(batterij).length > 0 && (
        <Sectie icon={<Battery className="h-4 w-4 text-primary" />} titel="Thuisbatterij">
          <KeyVal data={batterij} />
        </Sectie>
      )}

      {laadpaal && Object.keys(laadpaal).length > 0 && (
        <Sectie icon={<Plug className="h-4 w-4 text-primary" />} titel="Laadpaal">
          <KeyVal data={laadpaal} />
        </Sectie>
      )}

      {warmtepomp && Object.keys(warmtepomp).length > 0 && (
        <Sectie icon={<Thermometer className="h-4 w-4 text-primary" />} titel="Warmtepomp">
          <KeyVal data={warmtepomp} />
        </Sectie>
      )}

      {meterkast && Object.keys(meterkast).length > 0 && (
        <Sectie icon={<Zap className="h-4 w-4 text-primary" />} titel="Meterkast / elektra">
          <KeyVal data={meterkast} />
        </Sectie>
      )}

      {fotoBeelden.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Foto's ({fotos.length})</p>
          <div className={compact ? "grid grid-cols-2 gap-2" : "grid grid-cols-4 gap-2"}>
            {fotoBeelden.map((f, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onFotoClick?.(idx)}
                className="aspect-square overflow-hidden rounded-lg border bg-muted hover:opacity-80 transition"
                aria-label={`Foto ${idx + 1} bekijken`}
              >
                <img src={f.url} alt={f.notitie ?? `Schouwfoto ${idx + 1}`} loading="lazy" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Sectie = ({ icon, titel, children }: { icon: React.ReactNode; titel: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{icon} {titel}</p>
    <div className="pl-5">{children}</div>
  </div>
);

const KeyVal = ({ data }: { data: Record<string, unknown> }) => {
  const entries = Object.entries(data).filter(([, v]) => v != null && v !== "" && (typeof v !== "object" || (Array.isArray(v) && v.length > 0)));
  if (entries.length === 0) return <p className="text-muted-foreground italic text-xs">Geen details</p>;
  return (
    <dl className="grid grid-cols-2 gap-x-3 gap-y-1">
      {entries.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-muted-foreground capitalize">{k.replace(/_/g, " ")}</dt>
          <dd className="text-foreground font-medium truncate">{Array.isArray(v) ? v.join(", ") : String(v)}</dd>
        </div>
      ))}
    </dl>
  );
};

export default SchouwSamenvatting;