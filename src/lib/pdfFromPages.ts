import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

/**
 * Rendert een PDF door elke .pdf-page apart te capturen op scale 3 (PNG).
 * Resultaat: scherpe multi-page A4 PDF, één DOM-pagina per PDF-pagina.
 */
export async function renderPagesToPdfBlob(root: HTMLElement): Promise<Blob> {
  const pages = Array.from(root.querySelectorAll<HTMLElement>(".pdf-page"));
  if (pages.length === 0) {
    throw new Error("Geen .pdf-page elementen gevonden in print-root");
  }

  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const canvas = await html2canvas(page, {
      scale: 3,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      windowWidth: page.scrollWidth,
      windowHeight: page.scrollHeight,
    });

    const imgData = canvas.toDataURL("image/png");
    if (i > 0) pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM, undefined, "FAST");
  }

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
