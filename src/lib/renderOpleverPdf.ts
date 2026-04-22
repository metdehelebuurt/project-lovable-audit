import { renderElementToPdfBlob } from "./pdfFromElement";
import { supabase } from "@/integrations/supabase/client";

export async function hashBlobSha256(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

export async function downloadOpleverPdf(
  el: HTMLElement,
  filename: string,
  partnerId?: string,
  rapportId?: string,
): Promise<{ path: string | null; hash: string; blob: Blob }> {
  const blob = await renderElementToPdfBlob(el);
  const hash = await hashBlobSha256(blob);
  triggerBlobDownload(blob, filename);

  let path: string | null = null;
  if (partnerId && rapportId) {
    try {
      const archivePath = `${partnerId}/${rapportId}/rapport-${Date.now()}.pdf`;
      const { error } = await supabase.storage.from("oplever-media").upload(archivePath, blob, {
        contentType: "application/pdf",
        upsert: true,
      });
      if (!error) path = archivePath;
      else console.warn("Archivering opleverrapport mislukt:", error.message);
    } catch (e) {
      console.warn("Archivering opleverrapport faalde:", e);
    }
  }
  return { path, hash, blob };
}

export async function renderAndArchiveOpleverPdf(
  el: HTMLElement,
  partnerId: string,
  rapportId: string,
): Promise<{ path: string; hash: string; blob: Blob }> {
  const blob = await renderElementToPdfBlob(el);
  const hash = await hashBlobSha256(blob);
  const path = `${partnerId}/${rapportId}/rapport-${Date.now()}.pdf`;
  const { error } = await supabase.storage.from("oplever-media").upload(path, blob, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (error) throw new Error(`PDF upload mislukt: ${error.message}`);
  return { path, hash, blob };
}
