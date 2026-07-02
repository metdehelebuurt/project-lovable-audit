import { supabase } from "@/integrations/supabase/client";

const OPLEVER_BUCKET = "oplever-media";

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function fetchAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: "cors", credentials: "omit" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await blobToDataUrl(blob);
  } catch {
    return null;
  }
}

/**
 * Resolve een handtekening-veld (path in oplever-media bucket, absolute URL of
 * al een dataURL) naar een dataURL zodat html2canvas het foutloos kan renderen.
 * Retourneert null bij falen — de aanroeper toont dan een tekst-fallback.
 */
export async function resolveSignatureToDataUrl(pathOrUrl: string | null | undefined): Promise<string | null> {
  if (!pathOrUrl) return null;
  const val = pathOrUrl.trim();
  if (!val) return null;
  if (val.startsWith("data:")) return val;
  if (/^https?:\/\//i.test(val)) return (await fetchAsDataUrl(val)) ?? null;

  // Behandel als storage-pad in oplever-media
  try {
    const { data, error } = await supabase.storage.from(OPLEVER_BUCKET).createSignedUrl(val, 300);
    if (error || !data?.signedUrl) return null;
    return await fetchAsDataUrl(data.signedUrl);
  } catch {
    return null;
  }
}

/**
 * Resolve het partnerlogo (meestal een publieke URL). Faalt stil.
 */
export async function resolvePartnerLogoToDataUrl(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  const val = url.trim();
  if (!val) return null;
  if (val.startsWith("data:")) return val;
  if (/^https?:\/\//i.test(val)) return await fetchAsDataUrl(val);
  return null;
}
