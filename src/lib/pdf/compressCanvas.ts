/**
 * Compressie- en herschaal-helpers voor PDF-generatie.
 *
 * Achtergrond: html2canvas-snapshots werden als PNG op scale 3 in de PDF gezet.
 * Dat levert bestanden van tientallen MB's op. De mail-Edge-Function moet die
 * bytes daarna base64-encoderen, wat bij grote PDF's tegen de CPU-limiet van de
 * edge-runtime aanloopt ("CPU Time exceeded"). Comprimeren gebeurt daarom hier,
 * vóór upload en dus vóór base64-encoding.
 */

/** A4-breedte in pixels bij 300 dpi — ruim voldoende voor printkwaliteit. */
export const A4_WIDTH_PX_300DPI = 2480;

export interface CompressieProfiel {
  /** Maximale canvasbreedte in pixels; breder wordt proportioneel verkleind. */
  maxWidthPx: number;
  /** JPEG-kwaliteit tussen 0 en 1. */
  quality: number;
}

/**
 * Oplopend agressievere profielen. De renderer begint bij het eerste profiel en
 * zakt af zolang de PDF boven het groottebudget blijft.
 */
export const COMPRESSIE_PROFIELEN: CompressieProfiel[] = [
  { maxWidthPx: A4_WIDTH_PX_300DPI, quality: 0.82 },
  { maxWidthPx: 1754, quality: 0.75 }, // ~210 dpi
  { maxWidthPx: 1240, quality: 0.68 }, // ~150 dpi
];

/** Streefgrootte voor de eindPDF; hierboven wordt opnieuw gerenderd. */
export const PDF_GROOTTE_BUDGET_BYTES = 8 * 1024 * 1024;

/**
 * Schaalt een canvas proportioneel terug tot `maxWidthPx` en geeft het als
 * JPEG-dataURL terug. Kleinere canvassen worden niet opgeschaald.
 */
export function canvasNaarJpeg(source: HTMLCanvasElement, profiel: CompressieProfiel): string {
  const factor = source.width > profiel.maxWidthPx ? profiel.maxWidthPx / source.width : 1;
  if (factor === 1) return source.toDataURL("image/jpeg", profiel.quality);

  const target = document.createElement("canvas");
  target.width = Math.max(1, Math.round(source.width * factor));
  target.height = Math.max(1, Math.round(source.height * factor));

  const ctx = target.getContext("2d");
  if (!ctx) return source.toDataURL("image/jpeg", profiel.quality);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  // Witte ondergrond: JPEG kent geen transparantie.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, target.width, target.height);
  ctx.drawImage(source, 0, 0, target.width, target.height);

  return target.toDataURL("image/jpeg", profiel.quality);
}

/** Render-schaal voor html2canvas, afgeleid van het profiel en de bronbreedte. */
export function bepaalCaptureSchaal(elementWidthPx: number, profiel: CompressieProfiel): number {
  if (elementWidthPx <= 0) return 2;
  const gewenst = profiel.maxWidthPx / elementWidthPx;
  return Math.min(3, Math.max(1, Number(gewenst.toFixed(2))));
}
