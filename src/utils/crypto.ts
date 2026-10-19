// Web Crypto Ed25519 and SHA-256 helpers
export function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
  const binary = atob(base64 + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function sha256Hex(message: string): Promise<string> {
  const msgBytes = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBytes as unknown as BufferSource);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function signCanonicalPayload(
  canonicalStr: string,
  privateKeyB64Url: string
): Promise<{ signature: string; payloadHash: string }> {
  const pkcs8KeyBytes = base64UrlToUint8Array(privateKeyB64Url);
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    pkcs8KeyBytes as unknown as BufferSource,
    { name: 'Ed25519' },
    false,
    ['sign']
  );

  const payloadBytes = new TextEncoder().encode(canonicalStr);
  const sigBuffer = await crypto.subtle.sign(
    { name: 'Ed25519' },
    privateKey,
    payloadBytes as unknown as BufferSource
  );
  const signature = uint8ArrayToBase64Url(new Uint8Array(sigBuffer));
  const payloadHash = await sha256Hex(canonicalStr);

  return { signature, payloadHash };
}

export async function verifyCanonicalPayload(
  canonicalStr: string,
  signatureB64Url: string,
  publicKeyB64Url: string
): Promise<boolean> {
  try {
    const spkiKeyBytes = base64UrlToUint8Array(publicKeyB64Url);
    const publicKey = await crypto.subtle.importKey(
      'spki',
      spkiKeyBytes as unknown as BufferSource,
      { name: 'Ed25519' },
      false,
      ['verify']
    );

    const sigBytes = base64UrlToUint8Array(signatureB64Url);
    if (sigBytes.length !== 64) {
      return false;
    }

    const payloadBytes = new TextEncoder().encode(canonicalStr);
    return await crypto.subtle.verify(
      { name: 'Ed25519' },
      publicKey,
      sigBytes as unknown as BufferSource,
      payloadBytes as unknown as BufferSource
    );
  } catch {
    return false;
  }
}
