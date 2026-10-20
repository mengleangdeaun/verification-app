/**
 * Path and URL resolution utilities that respect Astro's `base` configuration
 */

export function getAppBase(): string {
  const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/certification';
  const trimmed = base.replace(/\/+$/, '');
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

export function apiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  return `${getAppBase()}/${cleanEndpoint}`;
}

export function assetUrl(path: string): string {
  const cleanPath = path.replace(/^\/+/, '');
  return `${getAppBase()}/${cleanPath}`;
}

export function appPath(path: string = '/'): string {
  const cleanPath = path.replace(/^\/+/, '');
  if (!cleanPath) {
    return getAppBase();
  }
  return `${getAppBase()}/${cleanPath}`;
}

export function buildVerificationUrl(baseUrlConfig: string | undefined, id: string, signature: string): string {
  const origin = (baseUrlConfig || '').replace(/\/+$/, '');
  const base = getAppBase();
  
  let root = origin;
  if (root) {
    if (base && base !== '/' && !root.endsWith(base)) {
      root = `${root}${base}`;
    }
  } else {
    root = base || '';
  }
  
  return `${root}/check?id=${encodeURIComponent(id)}&sig=${encodeURIComponent(signature)}`;
}

/**
 * Normalizes any verification URL (even if stored with an old or different origin like localhost:4321)
 * into a relative path starting with the app base (e.g. `/certification/check?id=...&sig=...`),
 * ensuring browser links always stay on the current domain and port (port 3000 in dev, production domain on Vercel).
 */
export function getRelativeVerificationUrl(rawUrl: string, id?: string, signature?: string): string {
  const base = getAppBase();
  if (rawUrl) {
    try {
      const parsed = new URL(rawUrl, 'http://localhost');
      let path = parsed.pathname;
      if (!path.startsWith(base)) {
        path = `${base}${path.startsWith('/') ? path : `/${path}`}`;
      }
      return `${path}${parsed.search}${parsed.hash}`;
    } catch {}
  }
  if (id && signature) {
    return `${base}/check?id=${encodeURIComponent(id)}&sig=${encodeURIComponent(signature)}`;
  }
  return rawUrl || `${base}/check`;
}

