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
