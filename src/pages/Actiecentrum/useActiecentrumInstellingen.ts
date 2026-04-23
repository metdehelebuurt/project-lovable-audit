import { useEffect, useState } from "react";

export type KaartKey = "notificaties" | "taken" | "berichten" | "terugbel" | "aandacht";
export type ViewMode = "grid" | "compact" | "focus";

export interface ActiecentrumInstellingen {
  view: ViewMode;
  zichtbaar: Record<KaartKey, boolean>;
  volgorde: KaartKey[];
}

const STORAGE_KEY = "actiecentrum.instellingen.v1";

const STANDAARD: ActiecentrumInstellingen = {
  view: "grid",
  zichtbaar: {
    notificaties: true,
    taken: true,
    berichten: true,
    terugbel: true,
    aandacht: true,
  },
  volgorde: ["taken", "aandacht", "notificaties", "berichten", "terugbel"],
};

export const KAART_LABELS: Record<KaartKey, string> = {
  notificaties: "Notificaties",
  taken: "Mijn taken",
  berichten: "Berichten",
  terugbel: "Terugbellen",
  aandacht: "Aandacht",
};

function lees(): ActiecentrumInstellingen {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return STANDAARD;
    const parsed = JSON.parse(raw) as Partial<ActiecentrumInstellingen>;
    return {
      view: parsed.view ?? STANDAARD.view,
      zichtbaar: { ...STANDAARD.zichtbaar, ...(parsed.zichtbaar ?? {}) },
      volgorde: parsed.volgorde && parsed.volgorde.length === 5 ? parsed.volgorde : STANDAARD.volgorde,
    };
  } catch {
    return STANDAARD;
  }
}

export function useActiecentrumInstellingen() {
  const [instellingen, setInstellingen] = useState<ActiecentrumInstellingen>(STANDAARD);

  useEffect(() => {
    setInstellingen(lees());
  }, []);

  const opslaan = (next: ActiecentrumInstellingen) => {
    setInstellingen(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* noop */ }
  };

  const setView = (view: ViewMode) => opslaan({ ...instellingen, view });
  const toggleKaart = (key: KaartKey) =>
    opslaan({ ...instellingen, zichtbaar: { ...instellingen.zichtbaar, [key]: !instellingen.zichtbaar[key] } });
  const verplaats = (key: KaartKey, richting: -1 | 1) => {
    const idx = instellingen.volgorde.indexOf(key);
    const next = [...instellingen.volgorde];
    const swap = idx + richting;
    if (idx < 0 || swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    opslaan({ ...instellingen, volgorde: next });
  };
  const reset = () => opslaan(STANDAARD);

  return { instellingen, setView, toggleKaart, verplaats, reset };
}