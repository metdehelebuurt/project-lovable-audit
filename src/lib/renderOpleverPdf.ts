import { renderElementToPdfBlob } from "./pdfFromElement";
import { supabase } from "@/integrations/supabase/client";

export async function hashBlobSha256(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
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
