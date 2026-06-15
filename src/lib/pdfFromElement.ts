import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

async function captureCanvas(el: HTMLElement): Promise<HTMLCanvasElement> {
  return await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    windowWidth: el.scrollWidth,
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
    const w = canvas.width;
    const h = canvas.height;
    if (w === 0 || h === 0) return true;
    // Sample 20x20 grid van pixels.
    const stepX = Math.max(1, Math.floor(w / 20));
    const stepY = Math.max(1, Math.floor(h / 20));
    let nonWhite = 0;
    for (let y = 0; y < h; y += stepY) {
      for (let x = 0; x < w; x += stepX) {
        const d = ctx.getImageData(x, y, 1, 1).data;
        // Tel iets als "inhoud" als R/G/B < 245 (dus duidelijk niet-wit) en alpha > 0.
        if (d[3] > 0 && (d[0] < 245 || d[1] < 245 || d[2] < 245)) {
          nonWhite++;
          if (nonWhite >= 5) return false; // genoeg inhoud
        }
      }
    }
    return true;
  } catch {
    return false; // bij twijfel: niet blokkeren
  }
}

function addCanvasToPdf(pdf: jsPDF, canvas: HTMLCanvasElement) {
  const imgData = canvas.toDataURL("image/jpeg", 0.92);
  const imgWidth = A4_WIDTH_MM;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;
  pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
  heightLeft -= A4_HEIGHT_MM;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= A4_HEIGHT_MM;
  }
}

export async function renderElementToPdfBlob(el: HTMLElement): Promise<Blob> {
  const canvas = await captureCanvas(el);
  if (isCanvasEffectivelyBlank(canvas)) {
    throw new Error(
      "PDF-render is leeg (geen tekst zichtbaar in canvas). Mogelijk is de bron-container niet zichtbaar gerenderd.",
    );
  }
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  addCanvasToPdf(pdf, canvas);
  return pdf.output("blob");
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