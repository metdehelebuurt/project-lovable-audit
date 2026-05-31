import type { Dakvlak, LatLng, Paneel } from "../types";

/**
 * Pure geometrie-engine voor het auto-vullen van een dakvlak met panelen.
 * Werkt met een lokale Cartesische projectie (meters) zodat rotaties en
 * raster-berekeningen recht-toe-recht-aan zijn.
 */

const METERS_PER_DEG_LAT = 111_320;

function metersPerDegLng(lat: number): number {
  return METERS_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180);
}

function centroid(points: LatLng[]): LatLng {
  const lat = points.reduce((s, p) => s + p.lat, 0) / points.length;
  const lng = points.reduce((s, p) => s + p.lng, 0) / points.length;
  return { lat, lng };
}

function toLocal(p: LatLng, origin: LatLng): { x: number; y: number } {
  const mLng = metersPerDegLng(origin.lat);
  return {
    x: (p.lng - origin.lng) * mLng,
    y: (p.lat - origin.lat) * METERS_PER_DEG_LAT,
  };
}

function fromLocal(pt: { x: number; y: number }, origin: LatLng): LatLng {
  const mLng = metersPerDegLng(origin.lat);
  return {
    lat: origin.lat + pt.y / METERS_PER_DEG_LAT,
    lng: origin.lng + pt.x / mLng,
  };
}

function rotate(pt: { x: number; y: number }, deg: number): { x: number; y: number } {
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return { x: pt.x * c - pt.y * s, y: pt.x * s + pt.y * c };
}

function pointInPolygon(pt: { x: number; y: number }, poly: { x: number; y: number }[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x;
    const yi = poly[i].y;
    const xj = poly[j].x;
    const yj = poly[j].y;
    const intersect =
      yi > pt.y !== yj > pt.y && pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function rectCornersFit(
  cx: number,
  cy: number,
  w: number,
  h: number,
  polyLocal: { x: number; y: number }[],
  margin: number,
): boolean {
  // Vier hoeken + middelpunten van de zijden, met marge naar dakrand.
  const dx = w / 2 + margin;
  const dy = h / 2 + margin;
  const probes = [
    { x: cx - dx, y: cy - dy },
    { x: cx + dx, y: cy - dy },
    { x: cx - dx, y: cy + dy },
    { x: cx + dx, y: cy + dy },
    { x: cx, y: cy - dy },
    { x: cx, y: cy + dy },
    { x: cx - dx, y: cy },
    { x: cx + dx, y: cy },
  ];
  return probes.every((p) => pointInPolygon(p, polyLocal));
}

export interface PaneelLayoutInput {
  dakvlak: Dakvlak;
  paneelBreedteMm: number;
  paneelLengteMm: number;
}

/**
 * Bereken auto-layout van panelen binnen een dakvlak.
 * Geeft posities (lat/lng) terug van paneel-centers + rotatie (= oriëntatie dakvlak).
 */
export function berekenAutoLayout(input: PaneelLayoutInput): Paneel[] {
  const { dakvlak, paneelBreedteMm, paneelLengteMm } = input;
  if (dakvlak.polygon.length < 3) return [];
  if (!paneelBreedteMm || !paneelLengteMm) return [];

  const origin = centroid(dakvlak.polygon);
  // Compenseer voor hellingshoek: lengte wordt korter in horizontale projectie
  const helling = Math.max(0, Math.min(60, dakvlak.hellingshoekDeg || 0));
  const cosH = Math.cos((helling * Math.PI) / 180);

  // Paneel afmetingen in meters (b × l).
  const bM = paneelBreedteMm / 1000;
  const lM = (paneelLengteMm / 1000) * cosH;

  // Modus bepaalt welke as horizontaal is (na rotatie).
  // portret: lengte loopt langs hellingsrichting (y-as), breedte langs nok (x-as)
  // landschap: breedte langs hellingsrichting, lengte langs nok
  const cellW = dakvlak.modus === "portret" ? bM : lM;
  const cellH = dakvlak.modus === "portret" ? lM : bM;

  const margin = (dakvlak.margeMm || 0) / 1000;

  // Project polygoon naar lokaal en roteer zodat dakvlak-orientatie langs y-as komt.
  const poly = dakvlak.polygon.map((p) => toLocal(p, origin));
  const rotated = poly.map((p) => rotate(p, -dakvlak.orientatieDeg));

  // Bounding box
  const xs = rotated.map((p) => p.x);
  const ys = rotated.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const stepX = cellW;
  const stepY = cellH;
  const result: Paneel[] = [];

  // Centreer raster in bounding box
  const nx = Math.floor((maxX - minX - 2 * margin) / stepX);
  const ny = Math.floor((maxY - minY - 2 * margin) / stepY);
  if (nx <= 0 || ny <= 0) return [];

  const totalW = nx * stepX;
  const totalH = ny * stepY;
  const startX = minX + (maxX - minX - totalW) / 2 + stepX / 2;
  const startY = minY + (maxY - minY - totalH) / 2 + stepY / 2;

  for (let iy = 0; iy < ny; iy++) {
    for (let ix = 0; ix < nx; ix++) {
      const cx = startX + ix * stepX;
      const cy = startY + iy * stepY;
      if (!rectCornersFit(cx, cy, cellW, cellH, rotated, margin)) continue;
      // Roteer terug
      const back = rotate({ x: cx, y: cy }, dakvlak.orientatieDeg);
      const center = fromLocal(back, origin);
      result.push({
        id: `auto-${dakvlak.id}-${ix}-${iy}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        dakvlakId: dakvlak.id,
        center,
        rotatieDeg: dakvlak.orientatieDeg,
        status: "auto",
      });
    }
  }

  return result;
}

/**
 * Bereken de 4 hoeken van één paneel op de kaart (voor visualisatie).
 */
export function paneelCorners(
  paneel: Paneel,
  dakvlak: Dakvlak,
  paneelBreedteMm: number,
  paneelLengteMm: number,
): LatLng[] {
  const helling = Math.max(0, Math.min(60, dakvlak.hellingshoekDeg || 0));
  const cosH = Math.cos((helling * Math.PI) / 180);
  const bM = paneelBreedteMm / 1000;
  const lM = (paneelLengteMm / 1000) * cosH;
  const w = dakvlak.modus === "portret" ? bM : lM;
  const h = dakvlak.modus === "portret" ? lM : bM;

  const dx = w / 2;
  const dy = h / 2;
  const corners = [
    { x: -dx, y: -dy },
    { x: dx, y: -dy },
    { x: dx, y: dy },
    { x: -dx, y: dy },
  ];
  return corners.map((c) => {
    const rot = rotate(c, paneel.rotatieDeg);
    return fromLocal(rot, paneel.center);
  });
}

export function totaalWp(panelen: Paneel[], wpPerPaneel: number): number {
  return panelen.length * (wpPerPaneel || 0);
}