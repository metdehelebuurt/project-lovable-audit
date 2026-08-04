import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { PDFDocument } from "pdf-lib";
import {
  COMPRESSIE_PROFIELEN,
  PDF_GROOTTE_BUDGET_BYTES,
  bepaalCaptureSchaal,
  canvasNaarJpeg,
  type CompressieProfiel,
} from "./pdf/compressCanvas";

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const A4_RATIO = A4_WIDTH_MM / A4_HEIGHT_MM;

/**
 * Rendert een PDF door elke .pdf-page apart te capturen.
 * - Behoudt A4-verhouding: canvas wordt proportioneel geschaald op 210mm breed.
 * - Pagina's die langer zijn dan 297mm worden over meerdere PDF-pagina's verdeeld
 *   (geen vervorming meer door rekken/persen).
 * - Pagina's met `data-external-pdf` worden vervangen door de originele PDF
 *   (fabrikant-datasheet) via pdf-lib merge in plaats van een html2canvas-snapshot.
 * - Snapshots worden als geschaalde JPEG geplaatst (zie compressCanvas) zodat de
 *   PDF klein blijft en de mail-functie hem zonder CPU-piek kan base64-encoderen.
 */
export async function renderPagesToPdfBlob(
  root: HTMLElement,
  profiel: CompressieProfiel = COMPRESSIE_PROFIELEN[0],
): Promise<Blob> {
  const pages = Array.from(root.querySelectorAll<HTMLElement>(".pdf-page"));
  if (pages.length === 0) {
    throw new Error("Geen .pdf-page elementen gevonden in print-root");
  }

  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
  // Verzamel placeholders die later vervangen worden door externe fabrikant-PDFs.
  // We registreren {pdfPageIndex, externalUrl} en stripen de placeholder-pagina
  // achteraf met pdf-lib.
  const externalInjections: { afterPdfPageIndex: number; url: string }[] = [];
  let pdfPageCursor = 0;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const externalPdfUrl = page.getAttribute("data-external-pdf");

    if (externalPdfUrl) {
      // Voeg een lege placeholder-pagina toe (wordt later vervangen).
      if (pdfPageCursor > 0) pdf.addPage();
      externalInjections.push({ afterPdfPageIndex: pdfPageCursor, url: externalPdfUrl });
      pdfPageCursor++;
      continue;
    }

    const canvas = await html2canvas(page, {
      scale: bepaalCaptureSchaal(page.scrollWidth, profiel),
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      windowWidth: page.scrollWidth,
      windowHeight: page.scrollHeight,
    });

    const imgData = canvasNaarJpeg(canvas, profiel);
    // Proportionele hoogte op basis van canvas-ratio.
    const proportionalHeight = (canvas.height * A4_WIDTH_MM) / canvas.width;
    const canvasRatio = canvas.width / canvas.height;

    if (pdfPageCursor > 0) pdf.addPage();

    if (Math.abs(canvasRatio - A4_RATIO) < 0.005 && proportionalHeight <= A4_HEIGHT_MM + 0.5) {
      // Past exact op één A4 → 1-op-1 plaatsen.
      pdf.addImage(imgData, "JPEG", 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM, undefined, "FAST");
      pdfPageCursor++;
    } else {
      // Content is langer/korter dan A4 → over meerdere pagina's slicen
      // met behoud van verhouding (geen vervorming).
      let heightLeft = proportionalHeight;
      let position = 0;
      pdf.addImage(imgData, "JPEG", 0, position, A4_WIDTH_MM, proportionalHeight, undefined, "FAST");
      heightLeft -= A4_HEIGHT_MM;
      pdfPageCursor++;
      while (heightLeft > 0) {
        position -= A4_HEIGHT_MM;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, A4_WIDTH_MM, proportionalHeight, undefined, "FAST");
        heightLeft -= A4_HEIGHT_MM;
        pdfPageCursor++;
      }
    }
  }

  const baseBlob = pdf.output("blob");
  if (externalInjections.length === 0) return baseBlob;

  // Merge fabrikant-PDFs in via pdf-lib.
  try {
    return await mergeExternalPdfs(baseBlob, externalInjections);
  } catch (err) {
    console.warn("Mergen van fabrikant-PDFs mislukt, fallback op basis-PDF:", err);
    return baseBlob;
  }
}

async function mergeExternalPdfs(
  baseBlob: Blob,
  injections: { afterPdfPageIndex: number; url: string }[],
): Promise<Blob> {
  const baseBytes = await baseBlob.arrayBuffer();
  const baseDoc = await PDFDocument.load(baseBytes);
  const outDoc = await PDFDocument.create();

  // Index van placeholder-pagina's binnen baseDoc (0-based).
  const placeholderSet = new Set(injections.map((x) => x.afterPdfPageIndex));
  const injectionMap = new Map(injections.map((x) => [x.afterPdfPageIndex, x.url]));

  const totalBasePages = baseDoc.getPageCount();

  for (let i = 0; i < totalBasePages; i++) {
    if (placeholderSet.has(i)) {
      const url = injectionMap.get(i)!;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const extBytes = await res.arrayBuffer();
        const extDoc = await PDFDocument.load(extBytes);
        const copied = await outDoc.copyPages(extDoc, extDoc.getPageIndices());
        copied.forEach((p) => outDoc.addPage(p));
      } catch (err) {
        console.warn(`Externe PDF ophalen mislukt (${url}):`, err);
        // Val terug op de placeholder uit base-doc zodat de PDF niet stuk gaat.
        const [fallback] = await outDoc.copyPages(baseDoc, [i]);
        outDoc.addPage(fallback);
      }
    } else {
      const [pg] = await outDoc.copyPages(baseDoc, [i]);
      outDoc.addPage(pg);
    }
  }

  const merged = await outDoc.save();
  return new Blob([new Uint8Array(merged)], { type: "application/pdf" });
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
 * Wacht tot een iframe geladen is, fonts klaar zijn en de print-root rendert.
 * Genereert dan een echte multi-page PDF en uploadt naar storage.
 */
export async function generateOffertePdfViaIframe(
  supabase: any,
  offerteId: string,
  partnerId: string,
): Promise<{ path: string; sizeBytes: number }> {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement("iframe");
    iframe.style.cssText =
      "position:fixed;left:-99999px;top:0;width:900px;height:1400px;border:0;visibility:hidden;";
    iframe.src = `/offertes/${offerteId}/pdf/print`;
    document.body.appendChild(iframe);

    const cleanup = () => {
      try {
        document.body.removeChild(iframe);
      } catch {
        /* noop */
      }
    };

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Timeout bij PDF-generatie"));
    }, 30000);

    iframe.onload = async () => {
      try {
        const doc = iframe.contentDocument;
        const win = iframe.contentWindow;
        if (!doc || !win) throw new Error("Iframe niet beschikbaar");

        // Wacht tot fonts geladen zijn
        if ((doc as any).fonts?.ready) {
          await (doc as any).fonts.ready;
        }

        // Poll tot de print-root er staat met minstens 1 pdf-page
        const root = await waitForPrintRoot(doc, 15000);
        if (!root) throw new Error("Print-root niet gevonden binnen timeout");

        // Extra render-tijd voor afbeeldingen
        await waitForImages(root);
        await new Promise((r) => setTimeout(r, 600));

        const blob = await renderPagesToPdfBlob(root);
        const path = await uploadPdfToStorage(supabase, partnerId, "offerte", offerteId, blob);

        clearTimeout(timeout);
        cleanup();
        resolve({ path, sizeBytes: blob.size });
      } catch (err) {
        clearTimeout(timeout);
        cleanup();
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    };
  });
}

async function waitForPrintRoot(doc: Document, timeoutMs: number): Promise<HTMLElement | null> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const root = doc.querySelector(".pdf-print-root") as HTMLElement | null;
    if (root && root.querySelectorAll(".pdf-page").length > 0) return root;
    await new Promise((r) => setTimeout(r, 200));
  }
  return null;
}

async function waitForImages(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) return resolve();
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
        }),
    ),
  );
}
