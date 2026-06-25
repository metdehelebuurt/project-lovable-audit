// AES-GCM encryptie voor Gmail App Passwords.
// De sleutel staat in env `EMAIL_PASSWORD_ENCRYPTION_KEY` (64 hex = 32 bytes).
// Output-formaat: base64(iv[12] || ciphertext+tag).

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.trim().toLowerCase();
  if (!/^[0-9a-f]+$/.test(clean) || clean.length % 2 !== 0) {
    throw new Error("EMAIL_PASSWORD_ENCRYPTION_KEY moet hex zijn");
  }
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}

async function loadKey(): Promise<CryptoKey> {
  const raw = Deno.env.get("EMAIL_PASSWORD_ENCRYPTION_KEY");
  if (!raw) throw new Error("EMAIL_PASSWORD_ENCRYPTION_KEY ontbreekt");
  let bytes: Uint8Array;
  if (/^[0-9a-fA-F]{64}$/.test(raw.trim())) {
    bytes = hexToBytes(raw);
  } else {
    // Fallback: gebruik raw UTF-8 (afgekapt/gepadded tot 32 bytes via SHA-256)
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
    bytes = new Uint8Array(digest);
  }
  return await crypto.subtle.importKey("raw", bytes, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

function b64encode(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
function b64decode(b64: string): Uint8Array {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

export async function encryptAppPassword(plain: string): Promise<string> {
  const key = await loadKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plain));
  const out = new Uint8Array(iv.byteLength + cipher.byteLength);
  out.set(iv, 0);
  out.set(new Uint8Array(cipher), iv.byteLength);
  return b64encode(out);
}

export async function decryptAppPassword(b64: string): Promise<string> {
  const key = await loadKey();
  const all = b64decode(b64);
  if (all.byteLength < 13) throw new Error("ciphertext te kort");
  const iv = all.slice(0, 12);
  const cipher = all.slice(12);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipher);
  return new TextDecoder().decode(plain);
}