/**
 * Client-side afbeelding optimizer.
 * - Resize naar maximaal opgegeven dimensies (behoud aspect ratio)
 * - Conversie naar WebP voor efficiente opslag
 * - Behoudt goede kwaliteit (default 0.9)
 *
 * SVG en GIF worden niet geconverteerd (animatie/vector zou verloren gaan).
 */

export interface OptimizeOptions {
  /** Maximale breedte in pixels. Default 1920. */
  maxWidth?: number;
  /** Maximale hoogte in pixels. Default 1920. */
  maxHeight?: number;
  /** WebP kwaliteit 0-1. Default 0.9 (hoge kwaliteit). */
  kwaliteit?: number;
}

const DEFAULTS: Required<OptimizeOptions> = {
  maxWidth: 1920,
  maxHeight: 1920,
  kwaliteit: 0.9,
};

function isOptimaliseerbaar(file: File): boolean {
  if (!file.type.startsWith("image/")) return false;
  // SVG = vector, GIF = mogelijk geanimeerd → niet aanraken
  if (file.type === "image/svg+xml") return false;
  if (file.type === "image/gif") return false;
  return true;
}

function laadAfbeelding(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

function bepaalNieuweAfmetingen(
  breedte: number,
  hoogte: number,
  maxBreedte: number,
  maxHoogte: number,
): { breedte: number; hoogte: number } {
  if (breedte <= maxBreedte && hoogte <= maxHoogte) {
    return { breedte, hoogte };
  }
  const ratio = Math.min(maxBreedte / breedte, maxHoogte / hoogte);
  return {
    breedte: Math.round(breedte * ratio),
    hoogte: Math.round(hoogte * ratio),
  };
}

/**
 * Optimaliseer een afbeelding: resize + conversie naar WebP.
 * Bij fout of niet-ondersteund formaat: retourneer het originele bestand.
 */
export async function optimaliseerAfbeelding(
  file: File,
  opties: OptimizeOptions = {},
): Promise<File> {
  const { maxWidth, maxHeight, kwaliteit } = { ...DEFAULTS, ...opties };

  if (!isOptimaliseerbaar(file)) {
    return file;
  }

  try {
    const img = await laadAfbeelding(file);
    const { breedte, hoogte } = bepaalNieuweAfmetingen(
      img.naturalWidth,
      img.naturalHeight,
      maxWidth,
      maxHeight,
    );

    const canvas = document.createElement("canvas");
    canvas.width = breedte;
    canvas.height = hoogte;

    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, breedte, hoogte);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", kwaliteit),
    );

    if (!blob) return file;

    // Als WebP groter is dan origineel: gebruik origineel
    if (blob.size >= file.size && file.type === "image/webp") {
      return file;
    }

    const naam = file.name.replace(/\.[^.]+$/, "") + ".webp";
    return new File([blob], naam, { type: "image/webp", lastModified: Date.now() });
  } catch (err) {
    console.warn("[imageOptimizer] optimalisatie mislukt, gebruik origineel:", err);
    return file;
  }
}