import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  COMPRESSIE_PROFIELEN,
  PDF_GROOTTE_BUDGET_BYTES,
  bepaalCaptureSchaal,
  type CompressieProfiel,
} from "./pdf/compressCanvas";

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

/** Wacht tot alle fonts en <img> binnen `el` klaar zijn (voorkomt gebroken plaatjes in canvas). */
async function waitForAssets(el: HTMLElement): Promise<void> {
  try {
    if (typeof (document as any).fonts?.ready?.then === "function") {
      await (document as any).fonts.ready;
    }
  } catch { /* noop */ }
  const imgs = Array.from(el.querySelectorAll("img"));
  await Promise.all(
    imgs.map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const done = () => resolve();
        img.addEventListener("load", done, { once: true });
        img.addEventListener("error", done, { once: true });
        // Failsafe timeout — nooit langer wachten dan 4s per plaatje
        setTimeout(done, 4000);
      });
    }),
  );
}

async function captureCanvas(el: HTMLElement, profiel: CompressieProfiel): Promise<HTMLCanvasElement> {
  await waitForAssets(el);
  const width = Math.max(el.scrollWidth, el.offsetWidth, 1);
  const height = Math.max(el.scrollHeight, el.offsetHeight, 1);

  return await html2canvas(el, {
    scale: bepaalCaptureSchaal(width, profiel),
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    imageTimeout: 8000,
    width,
    height,
    windowWidth: Math.max(width, window.innerWidth),
    windowHeight: Math.max(height, window.innerHeight),
    scrollX: 0,
    scrollY: 0,
  });
}

/**
 * Detecteert of een canvas effectief leeg/wit is (geen tekst gerenderd).
 * Pakt een raster van pixels en checkt of er iets niet-wit tussen zit.
 */
function isCanvasEffectivelyBlank(canvas: HTMLCanvasElement): boolean {
  try {
    const ctx = canvas.getContext("2d");
    if (!ctx) return false;
    const width = canvas.width;
    const height = canvas.height;
    if (width === 0 || height === 0) return true;

    const pixels = ctx.getImageData(0, 0, width, height).data;
    const stride = Math.max(4, Math.floor(Math.min(width, height) / 250) * 4);
    let nonWhite = 0;

    for (let index = 0; index < pixels.length; index += stride) {
      const alpha = pixels[index + 3];
      const isVisiblePixel = alpha > 0;
      const isNotWhite = pixels[index] < 245 || pixels[index + 1] < 245 || pixels[index + 2] < 245;

      if (isVisiblePixel && isNotWhite) {
        nonWhite++;
        if (nonWhite >= 50) return false;
      }
    }

    return true;
  } catch {
    return false; // bij twijfel: niet blokkeren
  }
}

/**
 * Snijdt de bron-canvas in A4-pagina's en voegt elke pagina afzonderlijk toe als
 * losse JPEG. Dit voorkomt dat dezelfde grote afbeelding meerdere keren in de
 * PDF terechtkomt (was de oorzaak van onnodig zware bestanden bij lange rapporten).
 */
function addCanvasToPdfPaged(pdf: jsPDF, source: HTMLCanvasElement, profiel: CompressieProfiel) {
  const pxPerMm = source.width / A4_WIDTH_MM;
  const pageHeightPx = Math.floor(A4_HEIGHT_MM * pxPerMm);
  const totalHeightPx = source.height;
  const pageCount = Math.max(1, Math.ceil(totalHeightPx / pageHeightPx));

  const schaal = source.width > profiel.maxWidthPx ? profiel.maxWidthPx / source.width : 1;

  for (let i = 0; i < pageCount; i++) {
    const sy = i * pageHeightPx;
    const sliceHeight = Math.min(pageHeightPx, totalHeightPx - sy);
    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = Math.max(1, Math.round(source.width * schaal));
    pageCanvas.height = Math.max(1, Math.round(sliceHeight * schaal));
    const ctx = pageCanvas.getContext("2d");
    if (!ctx) continue;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    ctx.drawImage(source, 0, sy, source.width, sliceHeight, 0, 0, pageCanvas.width, pageCanvas.height);

    const imgData = pageCanvas.toDataURL("image/jpeg", profiel.quality);
    const renderHeightMm = (sliceHeight / source.width) * A4_WIDTH_MM;
    if (i > 0) pdf.addPage();
    pdf.addImage(imgData, "JPEG", 0, 0, A4_WIDTH_MM, renderHeightMm, undefined, "FAST");
  }

  // Paginanummers onderaan elke pagina
  const total = pdf.getNumberOfPages();
  pdf.setFontSize(8);
  pdf.setTextColor(120);
  for (let p = 1; p <= total; p++) {
    pdf.setPage(p);
    pdf.text(`Pagina ${p} van ${total}`, A4_WIDTH_MM - 15, A4_HEIGHT_MM - 6, { align: "right" });
  }
}

export async function renderElementToPdfBlob(el: HTMLElement): Promise<Blob> {
  const canvas = await captureCanvas(el, COMPRESSIE_PROFIELEN[0]);
  if (isCanvasEffectivelyBlank(canvas)) {
    throw new Error(
      "PDF-render is leeg (geen tekst zichtbaar in canvas). Mogelijk is de bron-container niet zichtbaar gerenderd.",
    );
  }

  // Herschaal/comprimeer oplopend tot de PDF binnen het groottebudget valt.
  // De dure html2canvas-capture gebeurt maar één keer; alleen het schalen en
  // JPEG-encoderen wordt herhaald.
  let laatste: Blob | null = null;
  for (const profiel of COMPRESSIE_PROFIELEN) {
    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
    pdf.setProperties({ creator: "mijnhuis.nu" });
    addCanvasToPdfPaged(pdf, canvas, profiel);
    laatste = pdf.output("blob");
    if (laatste.size <= PDF_GROOTTE_BUDGET_BYTES) return laatste;
  }
  return laatste!;
}

export async function uploadPdfToStorage(
  supabase: any,
  partnerId: string,
  type: string,
  id: string,
  blob: Blob,
): Promise<string> {
  const path = `${partnerId}/${type}/${id}-${Date.now()}.pdf`;
  const { error } = await supabase.storage.from("email-bijlagen").upload(path, blob, {
    contentType: "application/pdf",
    upsert: false,
  });
  if (error) throw new Error(`Upload mislukt: ${error.message}`);
  return path;
}

/**
 * Archiveert de verzonden factuur-PDF in de `facturen` bucket onder een
 * voorspelbaar pad ({partnerId}/factuur/{docId}.pdf), zodat latere "opnieuw
 * versturen"-acties altijd de laatst verzonden PDF terug kunnen vinden.
 * Faalt stilzwijgend (return null) — archivering mag het verzendproces niet breken.
 */
export async function uploadPdfToFacturenBucket(
  supabase: any,
  partnerId: string,
  docId: string,
  blob: Blob,
): Promise<string | null> {
  const path = `${partnerId}/factuur/${docId}.pdf`;
  try {
    const { error } = await supabase.storage.from("facturen").upload(path, blob, {
      contentType: "application/pdf",
      upsert: true,
    });
    if (error) {
      console.warn("Archivering naar facturen-bucket mislukt:", error.message);
      return null;
    }
    return path;
  } catch (e) {
    console.warn("Archivering naar facturen-bucket faalde:", e);
    return null;
  }
}