import type { APIRoute } from 'astro';
import { extractQueryParams } from '../../modules/verification-scanner/hooks/useQueryParam';
import { verifyCertificate } from '../../utils/verifier';
import { enforceSecurityGuards } from '../../utils/security';
import { generateCertificateOgImage, generateFallbackOgImage } from '../../utils/og-generator';

export const prerender = false;

export const GET: APIRoute = async ({ request, url }) => {
  const { id, sig } = extractQueryParams(url.searchParams);

  if (!id || !sig) {
    const fallbackPng = await generateFallbackOgImage();
    return new Response(new Uint8Array(fallbackPng), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    });
  }

  // Security guard check (rate limiter & honeypot)
  const security = enforceSecurityGuards(request, id, sig);
  if (!security.allowed) {
    const errorPng = await generateFallbackOgImage('Verification Limit Exceeded', 'Too many requests. Please wait a moment.');
    return new Response(new Uint8Array(errorPng), {
      status: security.status,
      headers: {
        'Content-Type': 'image/png',
        'Retry-After': String(security.retryAfter || 60),
      },
    });
  }

  try {
    const result = await verifyCertificate(id, sig);

    if (result.record) {
      const pngBuffer = await generateCertificateOgImage(result.record);

      return new Response(new Uint8Array(pngBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
        },
      });
    }

    // Record not found or invalid
    const notFoundPng = await generateFallbackOgImage('Certificate Not Located', 'Official registry query returned no verified record.');
    return new Response(new Uint8Array(notFoundPng), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=60, s-maxage=300',
      },
    });
  } catch (error) {
    console.error('Failed to generate certificate OG image:', error);
    const fallback = await generateFallbackOgImage();
    return new Response(new Uint8Array(fallback), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=60',
      },
    });
  }
};
